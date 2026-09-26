"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportarTransferencia, subirComprobante } from "@/lib/pagos/reportar-transferencia";
import { correoTransferenciaReportadaCargosAdmin } from "@/lib/resend/templates";
import { getAdminNotificationEmails, sendEmail } from "@/lib/resend/client";
import { LABEL_TIPO_TARJETA } from "@/lib/pagos/confirmar-cargos";

export type ReportarResult = { success: true } | { success: false; error: string };

type TeamInfo = { nombre_equipo: string; team_delegado: DelegadoInfo | DelegadoInfo[] | null };
type DelegadoInfo = { nombre: string; correo: string };
type JugadorInfo = { nombre: string };

/**
 * Reporte de pago por transferencia para TODAS las tarjetas pendientes del
 * equipo con sesión activa (batch, mismo criterio que
 * `iniciarPagoCargosEquipo`) — ver `lib/pagos/reportar-transferencia.ts`.
 */
export async function reportarTransferenciaCargosEquipo(formData: FormData): Promise<ReportarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No hay sesión activa." };

  const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single();
  const teamId = profile?.team_id as string | undefined;
  if (!teamId) return { success: false, error: "No hay sesión activa." };

  const admin = createAdminClient();

  const { data: cargos } = await admin
    .from("cargos_tarjetas")
    .select(
      "id, tipo_tarjeta, monto, created_at, jugador:jugador_id(nombre), teams:team_id(nombre_equipo, team_delegado(nombre, correo))"
    )
    .eq("team_id", teamId)
    .eq("estado", "pendiente");

  const pendientes = cargos ?? [];
  if (pendientes.length === 0) return { success: false, error: "No hay tarjetas pendientes por pagar." };

  const { data: config } = await admin
    .from("torneo_config")
    .select("horas_plazo_notificacion_transferencia")
    .eq("id", 1)
    .single();
  const horasPlazo = config?.horas_plazo_notificacion_transferencia ?? 24;

  let comprobanteUrl: string | null = null;
  const file = formData.get("comprobante") as File | null;
  if (file && file.size > 0) {
    const subida = await subirComprobante(admin, file);
    if ("error" in subida) return { success: false, error: subida.error };
    comprobanteUrl = subida.url;
  }

  const masAntiguo = pendientes.reduce(
    (min, c) => ((c.created_at as string) < min ? (c.created_at as string) : min),
    pendientes[0].created_at as string
  );

  const resultado = await reportarTransferencia(admin, {
    tabla: "cargos_tarjetas",
    ids: pendientes.map((c) => c.id as string),
    comprobanteUrl,
    desde: new Date(masAntiguo),
    horasPlazo,
  });

  if (!resultado.success) return resultado;

  const equipo = Array.isArray(pendientes[0].teams) ? pendientes[0].teams[0] : (pendientes[0].teams as TeamInfo | null);

  const total = pendientes.reduce((sum, c) => sum + Number(c.monto), 0);
  const items = pendientes.map((c) => {
    const jugador = Array.isArray(c.jugador) ? c.jugador[0] : (c.jugador as JugadorInfo | null);
    return {
      jugadorNombre: jugador?.nombre ?? "—",
      tipo: LABEL_TIPO_TARJETA[c.tipo_tarjeta as string] ?? (c.tipo_tarjeta as string),
      monto: Number(c.monto),
    };
  });

  const adminEmails = getAdminNotificationEmails();
  if (adminEmails) {
    const correo = correoTransferenciaReportadaCargosAdmin({
      nombreEquipo: equipo?.nombre_equipo ?? "",
      items,
      total,
      comprobanteUrl,
      aTiempo: resultado.aTiempo,
      plazoTexto: `${horasPlazo} horas`,
    });
    await sendEmail({ to: adminEmails, subject: correo.subject, html: correo.html, text: correo.text }).catch(() => {});
  }

  revalidatePath("/portal");
  return { success: true };
}
