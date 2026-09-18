"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { aplicarPagoCuota } from "@/lib/pagos/confirmar-cuota";
import {
  correoPagoConfirmado,
  correoInvitacionInscripcionOficial,
  correoRegistroEquipo,
  correoRecordatorioCuota,
  correoPreinscripcion,
} from "@/lib/resend/templates";

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

  // Validación manual: nunca se le avisa al admin por correo de su propio
  // registro — la notificación es solo para pagos automáticos (Wompi).
  const resultado = await aplicarPagoCuota(supabase, { cuotaId, referencia });

  if (!resultado.success) {
    return resultado;
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Reenvía el correo de bienvenida/registro (el que sale automáticamente al
 * completar `/inscripcion`) — para cuando el delegado dice que no le llegó.
 * Recalcula el total y las cuotas desde el pago actual del equipo en vez de
 * guardar una copia del correo original, así siempre refleja el estado real
 * (por ejemplo si una cuota ya cambió de monto).
 */
export async function reenviarCorreoRegistro(teamId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("teams")
    .select(
      `nombre_equipo, team_delegado(nombre, correo),
       payments(monto_total, payment_installments(numero_cuota, monto, fecha_limite))`
    )
    .eq("id", teamId)
    .single();

  if (equipoError || !equipo) {
    return { success: false, error: "No se encontró el equipo." };
  }

  const delegadoRaw = equipo.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;
  const pagoRaw = equipo.payments;
  const pago = Array.isArray(pagoRaw) ? pagoRaw[0] : pagoRaw;

  if (!delegado?.correo) {
    return { success: false, error: "Este equipo no tiene un correo de delegado registrado." };
  }
  if (!pago) {
    return { success: false, error: "Este equipo todavía no tiene un plan de pagos generado." };
  }

  const cuotas = (pago.payment_installments ?? [])
    .slice()
    .sort((a: { numero_cuota: number }, b: { numero_cuota: number }) => a.numero_cuota - b.numero_cuota)
    .map((c: { numero_cuota: number; monto: number; fecha_limite: string }) => ({
      numeroCuota: c.numero_cuota,
      monto: Number(c.monto),
      fechaLimite: c.fecha_limite,
    }));

  const correo = correoRegistroEquipo({
    nombreEquipo: equipo.nombre_equipo,
    delegadoNombre: delegado.nombre ?? "",
    correo: delegado.correo,
    montoTotal: Number(pago.monto_total),
    cuotas,
  });

  const resultado = await sendEmail({
    to: delegado.correo,
    subject: correo.subject,
    html: correo.html,
    text: correo.text,
  });

  if (!resultado.ok) {
    return { success: false, error: resultado.error ?? "No se pudo reenviar el correo." };
  }

  return { success: true };
}

/**
 * Reenvía el recordatorio de una partida puntual (la misma plantilla que
 * usa el recordatorio automático diario) — para cuando el delegado pide que
 * se lo reenvíen, sin esperar al próximo ciclo del cron. No se puede usar en
 * una partida ya pagada.
 */
export async function reenviarRecordatorioCuota(cuotaId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { data: cuota, error: cuotaError } = await supabase
    .from("payment_installments")
    .select("numero_cuota, monto, fecha_limite, estado, teams(nombre_equipo, team_delegado(nombre, correo))")
    .eq("id", cuotaId)
    .single();

  if (cuotaError || !cuota) {
    return { success: false, error: "No se encontró la cuota." };
  }

  if (cuota.estado === "pagada") {
    return { success: false, error: "Esta cuota ya está pagada — no tiene sentido recordarla." };
  }

  const equipo = Array.isArray(cuota.teams) ? cuota.teams[0] : cuota.teams;
  const delegadoRaw = equipo?.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;

  if (!delegado?.correo) {
    return { success: false, error: "Este equipo no tiene un correo de delegado registrado." };
  }

  const correo = correoRecordatorioCuota({
    nombreEquipo: equipo?.nombre_equipo ?? "",
    delegadoNombre: delegado.nombre ?? "",
    numeroCuota: cuota.numero_cuota,
    monto: Number(cuota.monto),
    fechaLimite: cuota.fecha_limite,
  });

  const resultado = await sendEmail({
    to: delegado.correo,
    subject: correo.subject,
    html: correo.html,
    text: correo.text,
  });

  if (!resultado.ok) {
    return { success: false, error: resultado.error ?? "No se pudo reenviar el recordatorio." };
  }

  return { success: true };
}

/**
 * Reenvía la confirmación de pago de una partida ya pagada — el envío
 * automático en `marcarCuotaPagada` traga el error si Resend falla
 * (`.catch(() => {})`, para no tumbar la validación del pago por un problema
 * de correo), así que esto es la manera de recuperarlo si nunca llegó.
 */
export async function reenviarConfirmacionPago(cuotaId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { data: cuota, error: cuotaError } = await supabase
    .from("payment_installments")
    .select(
      "numero_cuota, monto, estado, payment_id, teams(nombre_equipo, team_delegado(nombre, correo))"
    )
    .eq("id", cuotaId)
    .single();

  if (cuotaError || !cuota) {
    return { success: false, error: "No se encontró la cuota." };
  }

  if (cuota.estado !== "pagada") {
    return { success: false, error: "Esta cuota todavía no está marcada como pagada." };
  }

  const equipo = Array.isArray(cuota.teams) ? cuota.teams[0] : cuota.teams;
  const delegadoRaw = equipo?.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;

  if (!delegado?.correo) {
    return { success: false, error: "Este equipo no tiene un correo de delegado registrado." };
  }

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

  const resultado = await sendEmail({
    to: delegado.correo,
    subject: correo.subject,
    html: correo.html,
    text: correo.text,
  });

  if (!resultado.ok) {
    return { success: false, error: resultado.error ?? "No se pudo reenviar la confirmación." };
  }

  return { success: true };
}

/**
 * Reenvía la confirmación de preinscripción (la que sale automáticamente al
 * completar `/preinscripcion`) — para cuando el delegado dice que no le
 * llegó o no encuentra su número de orden en la fila.
 */
export async function reenviarCorreoPreinscripcion(teamId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("teams")
    .select("nombre_equipo, estado_inscripcion, orden_preinscripcion, team_delegado(nombre, correo)")
    .eq("id", teamId)
    .single();

  if (equipoError || !equipo) {
    return { success: false, error: "No se encontró el equipo." };
  }

  if (equipo.estado_inscripcion !== "preinscrito") {
    return { success: false, error: "Este equipo ya no está en estado de preinscrito." };
  }

  const delegadoRaw = equipo.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;

  if (!delegado?.correo) {
    return { success: false, error: "Este equipo no tiene un correo de delegado registrado." };
  }

  const correo = correoPreinscripcion({
    nombreEquipo: equipo.nombre_equipo,
    delegadoNombre: delegado.nombre ?? "",
    ordenPreinscripcion: equipo.orden_preinscripcion ?? 0,
  });

  const resultado = await sendEmail({
    to: delegado.correo,
    subject: correo.subject,
    html: correo.html,
    text: correo.text,
  });

  if (!resultado.ok) {
    return { success: false, error: resultado.error ?? "No se pudo reenviar el correo." };
  }

  return { success: true };
}

/**
 * Invita a un equipo preinscrito a completar la inscripción oficial (decisión
 * manual del admin, no automática — ver `claude/plan-fases-tareas.md`). Pasa
 * `estado_inscripcion` de `preinscrito` a `invitado` y le manda el correo con
 * instrucciones; el equipo se reconoce en `/inscripcion` por el correo que ya
 * dejó al preinscribirse (`verificarInvitacion` en `inscripcion/actions.ts`).
 */
export async function invitarAInscripcionOficial(teamId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("teams")
    .select("id, nombre_equipo, estado_inscripcion, team_delegado(nombre, correo)")
    .eq("id", teamId)
    .single();

  if (equipoError || !equipo) {
    return { success: false, error: "No se encontró el equipo." };
  }

  if (equipo.estado_inscripcion !== "preinscrito") {
    return { success: false, error: "Este equipo ya no está en estado de preinscrito." };
  }

  const delegadoRaw = equipo.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;

  const { error: updateError } = await supabase
    .from("teams")
    .update({ estado_inscripcion: "invitado", fecha_invitado: new Date().toISOString() })
    .eq("id", teamId);

  if (updateError) {
    return { success: false, error: `No se pudo invitar al equipo: ${updateError.message}` };
  }

  if (delegado?.correo) {
    const correo = correoInvitacionInscripcionOficial({
      nombreEquipo: equipo.nombre_equipo,
      delegadoNombre: delegado.nombre ?? "",
      correo: delegado.correo,
    });
    await sendEmail({
      to: delegado.correo,
      subject: correo.subject,
      html: correo.html,
      text: correo.text,
    }).catch(() => {});
  }

  revalidatePath("/admin/preinscripciones");
  return { success: true };
}

/**
 * Reenvía el correo de invitación a un equipo que ya está en estado
 * `invitado` — sin tocar su estado ni `fecha_invitado`. Antes la única forma
 * de reenviar era Revertir (→ preinscrito) + Invitar de nuevo, lo cual movía
 * al equipo en la fila sin necesidad; esto es solo "manda el correo otra
 * vez" para cuando el delegado dice que no le llegó o lo perdió.
 */
export async function reenviarInvitacionInscripcionOficial(teamId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("teams")
    .select("id, nombre_equipo, estado_inscripcion, team_delegado(nombre, correo)")
    .eq("id", teamId)
    .single();

  if (equipoError || !equipo) {
    return { success: false, error: "No se encontró el equipo." };
  }

  if (equipo.estado_inscripcion !== "invitado") {
    return { success: false, error: "Este equipo ya no está en estado de invitado." };
  }

  const delegadoRaw = equipo.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;

  if (!delegado?.correo) {
    return { success: false, error: "Este equipo no tiene un correo de delegado registrado." };
  }

  const correo = correoInvitacionInscripcionOficial({
    nombreEquipo: equipo.nombre_equipo,
    delegadoNombre: delegado.nombre ?? "",
    correo: delegado.correo,
  });
  const resultado = await sendEmail({
    to: delegado.correo,
    subject: correo.subject,
    html: correo.html,
    text: correo.text,
  });

  if (!resultado.ok) {
    return { success: false, error: resultado.error ?? "No se pudo reenviar el correo." };
  }

  return { success: true };
}

/**
 * Revierte una invitación (por ejemplo, si el equipo no completó el pago en
 * el plazo esperado y el admin decide pasar al siguiente de la fila — la
 * decisión de a quién invitar después sigue siendo manual). Vuelve el equipo
 * a `preinscrito`, conservando su `orden_preinscripcion` original.
 */
export async function revertirInvitacion(teamId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("teams")
    .select("id, estado_inscripcion")
    .eq("id", teamId)
    .single();

  if (equipoError || !equipo) {
    return { success: false, error: "No se encontró el equipo." };
  }

  if (equipo.estado_inscripcion !== "invitado") {
    return { success: false, error: "Este equipo ya no está en estado de invitado." };
  }

  const { error: updateError } = await supabase
    .from("teams")
    .update({ estado_inscripcion: "preinscrito", fecha_invitado: null })
    .eq("id", teamId);

  if (updateError) {
    return { success: false, error: `No se pudo revertir la invitación: ${updateError.message}` };
  }

  revalidatePath("/admin/preinscripciones");
  return { success: true };
}
