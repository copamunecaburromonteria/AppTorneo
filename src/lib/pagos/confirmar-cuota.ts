import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminNotificationEmails, sendEmail } from "@/lib/resend/client";
import { correoPagoConfirmado, correoNotificacionPagoAdmin } from "@/lib/resend/templates";

export type ConfirmarCuotaResult = { success: true } | { success: false; error: string };

/**
 * Lógica compartida para marcar una partida (cuota) como pagada — ya sea
 * porque el admin la validó manualmente desde el panel, o porque el checkout
 * de Wompi confirmó el pago (ver `confirmarPagoWompi` en
 * `src/app/portal/inscripcion/wompi-actions.ts`). Extraída de lo que antes
 * era el cuerpo de `marcarCuotaPagada` en `admin/actions.ts`, para no
 * duplicar la actualización de `payment_installments`/`payments`/`teams` ni
 * el correo de confirmación entre los dos flujos.
 *
 * Recibe el cliente de Supabase ya construido por quien llama — el admin
 * usa el cliente con su propia sesión (las políticas RLS de admin le dan
 * acceso total); el flujo de Wompi usa el cliente de service role, porque
 * ahí quien confirma el pago es el propio servidor tras verificarlo contra
 * la API de Wompi, no el equipo autenticado (que por RLS solo puede LEER su
 * plan de pagos, no editarlo).
 */
export async function aplicarPagoCuota(
  supabase: SupabaseClient,
  params: {
    cuotaId: string;
    referencia: string;
    /** Cuando el pago llegó por un medio automático (Wompi), se le avisa al
     * admin por correo con el detalle de quién pagó — para validación manual
     * no hace falta, porque el admin es quien acaba de registrarlo. */
    notificarAdmin?: { metodoPago: string };
  }
): Promise<ConfirmarCuotaResult> {
  const { data: cuota, error: cuotaError } = await supabase
    .from("payment_installments")
    .select(
      "id, numero_cuota, monto, estado, payment_id, team_id, payments(monto_total, monto_pagado), teams(nombre_equipo, orden_inscripcion, team_delegado(nombre, correo))"
    )
    .eq("id", params.cuotaId)
    .single();

  if (cuotaError || !cuota) {
    return { success: false, error: "No se encontró la cuota." };
  }

  if (cuota.estado === "pagada") {
    return { success: false, error: "Esta cuota ya estaba marcada como pagada." };
  }

  const pago = Array.isArray(cuota.payments) ? cuota.payments[0] : cuota.payments;
  const equipo = Array.isArray(cuota.teams) ? cuota.teams[0] : cuota.teams;
  const delegadoRaw = equipo?.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;

  if (!pago) {
    return { success: false, error: "No se encontró el pago asociado a esta cuota." };
  }

  const { error: updateCuotaError } = await supabase
    .from("payment_installments")
    .update({
      estado: "pagada",
      fecha_pago: new Date().toISOString(),
      referencia_wompi: params.referencia,
    })
    .eq("id", params.cuotaId);

  if (updateCuotaError) {
    return { success: false, error: `No se pudo actualizar la cuota: ${updateCuotaError.message}` };
  }

  const montoPagadoPrevio = Number(pago.monto_pagado ?? 0);
  const montoTotal = Number(pago.monto_total ?? 0);
  const nuevoMontoPagado = montoPagadoPrevio + Number(cuota.monto);
  const nuevoTipoPago = nuevoMontoPagado >= montoTotal ? "completo" : "abono";

  const { error: updatePagoError } = await supabase
    .from("payments")
    .update({ monto_pagado: nuevoMontoPagado, tipo_pago: nuevoTipoPago })
    .eq("id", cuota.payment_id);

  if (updatePagoError) {
    return { success: false, error: `No se pudo actualizar el pago: ${updatePagoError.message}` };
  }

  // Primera cuota pagada y el equipo todavía no tiene orden de inscripción:
  // se valida el cupo y se le asigna el siguiente número disponible.
  if (cuota.numero_cuota === 1 && equipo && equipo.orden_inscripcion == null) {
    const { data: maxOrdenRow } = await supabase
      .from("teams")
      .select("orden_inscripcion")
      .not("orden_inscripcion", "is", null)
      .order("orden_inscripcion", { ascending: false })
      .limit(1)
      .maybeSingle();

    const siguienteOrden = (maxOrdenRow?.orden_inscripcion ?? 0) + 1;

    const { error: updateEquipoError } = await supabase
      .from("teams")
      .update({ estado_inscripcion: "validado", orden_inscripcion: siguienteOrden })
      .eq("id", cuota.team_id);

    if (updateEquipoError) {
      return {
        success: false,
        error: `El pago se registró, pero no se pudo validar el cupo del equipo: ${updateEquipoError.message}`,
      };
    }
  }

  // Cuántas cuotas quedan pendientes, para el correo de confirmación y la
  // notificación al admin (se calcula una sola vez y se reusa en ambos).
  const { count: cuotasRestantes } = await supabase
    .from("payment_installments")
    .select("id", { count: "exact", head: true })
    .eq("payment_id", cuota.payment_id)
    .eq("estado", "pendiente");

  // Correo de confirmación al delegado — no bloquea el resultado si falla.
  if (delegado?.correo) {
    const correo = correoPagoConfirmado({
      nombreEquipo: equipo?.nombre_equipo ?? "",
      delegadoNombre: delegado.nombre ?? "",
      numeroCuota: cuota.numero_cuota,
      monto: Number(cuota.monto),
      cuotasRestantes: cuotasRestantes ?? 0,
    });

    await sendEmail({
      to: delegado.correo,
      subject: correo.subject,
      html: correo.html,
      text: correo.text,
    }).catch(() => {});
  }

  // Notificación interna al admin (solo para pagos automáticos) — quién
  // pagó, cuánto y por cuál medio, para saber de inmediato sin tener que
  // revisar el panel.
  if (params.notificarAdmin) {
    const adminEmails = getAdminNotificationEmails();
    if (adminEmails) {
      const correoAdmin = correoNotificacionPagoAdmin({
        nombreEquipo: equipo?.nombre_equipo ?? "",
        delegadoNombre: delegado?.nombre ?? "",
        delegadoCorreo: delegado?.correo ?? "",
        numeroCuota: cuota.numero_cuota,
        monto: Number(cuota.monto),
        metodoPago: params.notificarAdmin.metodoPago,
        referencia: params.referencia,
      });

      await sendEmail({
        to: adminEmails,
        subject: correoAdmin.subject,
        html: correoAdmin.html,
        text: correoAdmin.text,
      }).catch(() => {});
    } else {
      console.warn("[pagos] WOMPI_ADMIN_NOTIFICATION_EMAIL no configurada — no se avisó del pago.");
    }
  }

  return { success: true };
}
