"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { correoPagoConfirmado } from "@/lib/resend/templates";

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

type ResultadoAccion = { success: true } | { success: false; error: string };

/**
 * Marca una partida (cuota) como pagada manualmente desde el panel admin.
 * Se usa mientras no está conectado el checkout de Wompi: permite validar
 * pagos a mano (transferencia, Nequi, efectivo, etc.) para poder empezar a
 * probar el flujo completo.
 *
 * Usa el cliente con la sesión del admin (no el de service role): las
 * políticas de RLS ya le dan acceso total a un usuario con rol "admin", así
 * que si alguien sin ese rol llegara a invocar esto, la actualización
 * simplemente fallará por RLS.
 */
export async function marcarCuotaPagada(
  cuotaId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const referencia = (formData.get("referencia") as string | null)?.trim() || "VALIDACION_MANUAL";

  const { data: cuota, error: cuotaError } = await supabase
    .from("payment_installments")
    .select(
      "id, numero_cuota, monto, estado, payment_id, team_id, payments(monto_total, monto_pagado), teams(nombre_equipo, orden_inscripcion, team_delegado(nombre, correo))"
    )
    .eq("id", cuotaId)
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
      referencia_wompi: referencia,
    })
    .eq("id", cuotaId);

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

  // Correo de confirmación — no bloquea el resultado si falla el envío.
  if (delegado?.correo) {
    const { count } = await supabase
      .from("payment_installments")
      .select("id", { count: "exact", head: true })
      .eq("payment_id", cuota.payment_id)
      .eq("estado", "pendiente");

    const correo = correoPagoConfirmado({
      nombreEquipo: equipo?.nombre_equipo ?? "",
      delegadoNombre: delegado.nombre ?? "",
      numeroCuota: cuota.numero_cuota,
      monto: Number(cuota.monto),
      cuotasRestantes: count ?? 0,
    });

    await sendEmail({
      to: delegado.correo,
      subject: correo.subject,
      html: correo.html,
      text: correo.text,
    }).catch(() => {});
  }

  revalidatePath("/admin");
  return { success: true };
}
