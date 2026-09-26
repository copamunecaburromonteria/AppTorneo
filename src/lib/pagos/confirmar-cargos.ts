import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminNotificationEmails, sendEmail } from "@/lib/resend/client";
import { correoCargoTarjetaPagado, correoNotificacionCargoTarjetaAdmin } from "@/lib/resend/templates";

export const LABEL_TIPO_TARJETA: Record<string, string> = {
  tarjeta_amarilla: "Tarjeta amarilla",
  tarjeta_azul: "Tarjeta azul",
  tarjeta_roja: "Tarjeta roja",
};

type TeamInfo = {
  nombre_equipo: string;
  team_delegado: { nombre: string; correo: string } | { nombre: string; correo: string }[] | null;
};
type TeamRel = TeamInfo | TeamInfo[] | null;
type JugadorInfo = { nombre: string };
type JugadorRel = JugadorInfo | JugadorInfo[] | null;

function unwrap<T>(rel: T | T[] | null): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/**
 * Agrupa un conjunto de cargos ya autorizados (por sesión del equipo, o por
 * cédula + nombre verificados — ver `pagos-tarjetas/actions.ts` y
 * `portal/actions.ts`) bajo un mismo `lote_pago_id`, para poder cobrarlos
 * juntos en una sola transacción de Wompi. Solo agrupa los que siguen
 * `pendiente` — un cargo ya pagado o anulado se ignora en silencio, para que
 * quien llama no tenga que filtrar antes.
 */
export async function crearLotePagoCargos(
  admin: SupabaseClient,
  cargoIds: string[]
): Promise<{ loteId: string; total: number } | null> {
  if (cargoIds.length === 0) return null;

  const { data: pendientes } = await admin
    .from("cargos_tarjetas")
    .select("id, monto")
    .in("id", cargoIds)
    .eq("estado", "pendiente");

  if (!pendientes || pendientes.length === 0) return null;

  const loteId = crypto.randomUUID();
  const idsAAgrupar = pendientes.map((c) => c.id as string);

  const { error } = await admin.from("cargos_tarjetas").update({ lote_pago_id: loteId }).in("id", idsAAgrupar);
  if (error) return null;

  const total = pendientes.reduce((sum, c) => sum + Number(c.monto), 0);
  return { loteId, total };
}

export type ConfirmarCargosResult = { success: true } | { success: false; error: string };

/**
 * Marca como pagado un lote completo de cargos de tarjetas (mismo patrón que
 * `aplicarPagoCuota` en `confirmar-cuota.ts`, adaptado a "varias filas, una
 * sola transacción" en vez de "una cuota, una transacción"). Recibe el
 * cliente ya construido por quien llama — la verificación de quién puede
 * pagar cuáles cargos ya se resolvió antes, al crear el lote.
 */
export async function aplicarPagoCargos(
  supabase: SupabaseClient,
  params: {
    loteId: string;
    referencia: string;
    notificarAdmin?: { metodoPago: string };
  }
): Promise<ConfirmarCargosResult> {
  const { data: cargos, error } = await supabase
    .from("cargos_tarjetas")
    .select(
      "id, tipo_tarjeta, monto, estado, jugador:jugador_id(nombre), teams:team_id(nombre_equipo, team_delegado(nombre, correo))"
    )
    .eq("lote_pago_id", params.loteId);

  if (error || !cargos || cargos.length === 0) {
    return { success: false, error: "No se encontraron cargos para este pago." };
  }

  const pendientes = cargos.filter((c) => c.estado === "pendiente");
  if (pendientes.length === 0) {
    return { success: false, error: "Estos cargos ya estaban pagados." };
  }

  const { error: updateError } = await supabase
    .from("cargos_tarjetas")
    .update({
      estado: "pagado",
      fecha_pago: new Date().toISOString(),
      referencia_wompi: params.referencia,
      // Igual que en `aplicarPagoCuota`: solo se toca si fue Wompi quien
      // confirmó — si el admin lo marcó a mano, se respeta lo que ya
      // hubiera quedado de un reporte de transferencia previo.
      ...(params.notificarAdmin ? { metodo_pago_declarado: "wompi" as const } : {}),
    })
    .eq("lote_pago_id", params.loteId)
    .eq("estado", "pendiente");

  if (updateError) {
    return { success: false, error: `No se pudo actualizar el pago: ${updateError.message}` };
  }

  const equipo = unwrap<TeamInfo>(pendientes[0].teams as TeamRel);
  const delegado = equipo ? unwrap(equipo.team_delegado) : null;
  const total = pendientes.reduce((sum, c) => sum + Number(c.monto), 0);
  const items = pendientes.map((c) => ({
    jugadorNombre: unwrap<JugadorInfo>(c.jugador as JugadorRel)?.nombre ?? "—",
    tipo: LABEL_TIPO_TARJETA[c.tipo_tarjeta as string] ?? (c.tipo_tarjeta as string),
    monto: Number(c.monto),
  }));

  if (delegado?.correo) {
    const correo = correoCargoTarjetaPagado({
      nombreEquipo: equipo?.nombre_equipo ?? "",
      delegadoNombre: delegado.nombre ?? "",
      items,
      total,
    });
    await sendEmail({ to: delegado.correo, subject: correo.subject, html: correo.html, text: correo.text }).catch(
      () => {}
    );
  }

  if (params.notificarAdmin) {
    const adminEmails = getAdminNotificationEmails();
    if (adminEmails) {
      const correoAdmin = correoNotificacionCargoTarjetaAdmin({
        nombreEquipo: equipo?.nombre_equipo ?? "",
        items,
        total,
        metodoPago: params.notificarAdmin.metodoPago,
        referencia: params.referencia,
      });
      await sendEmail({
        to: adminEmails,
        subject: correoAdmin.subject,
        html: correoAdmin.html,
        text: correoAdmin.text,
      }).catch(() => {});
    }
  }

  return { success: true };
}
