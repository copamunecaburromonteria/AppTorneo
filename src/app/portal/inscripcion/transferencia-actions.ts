"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportarTransferencia, subirComprobante } from "@/lib/pagos/reportar-transferencia";
import { correoTransferenciaReportadaCuotaAdmin } from "@/lib/resend/templates";
import { getAdminNotificationEmails, sendEmail } from "@/lib/resend/client";

export type ReportarResult = { success: true } | { success: false; error: string };

type TeamInfo = { nombre_equipo: string; team_delegado: DelegadoInfo | DelegadoInfo[] | null };
type DelegadoInfo = { nombre: string; correo: string };

/**
 * Reporte de pago por transferencia (QR Nu / Llave) para una partida del
 * plan de pagos de inscripción — ver `lib/pagos/reportar-transferencia.ts`.
 * NO marca la partida como pagada: eso lo sigue haciendo el admin a mano
 * desde el panel, tras revisar su cuenta Nu (mismo flujo de siempre para
 * transferencias, solo que ahora queda un aviso + comprobante opcional).
 */
export async function reportarTransferenciaCuota(
  cuotaId: string,
  formData: FormData
): Promise<ReportarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No hay sesión activa." };

  const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single();
  const teamId = profile?.team_id as string | undefined;
  if (!teamId) return { success: false, error: "No hay sesión activa." };

  const admin = createAdminClient();

  const { data: cuota } = await admin
    .from("payment_installments")
    .select(
      "id, numero_cuota, monto, estado, fecha_limite, team_id, teams:team_id(nombre_equipo, team_delegado(nombre, correo))"
    )
    .eq("id", cuotaId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!cuota) return { success: false, error: "No se encontró la partida." };
  if (cuota.estado === "pagada") return { success: false, error: "Esta partida ya está pagada." };

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

  const resultado = await reportarTransferencia(admin, {
    tabla: "payment_installments",
    ids: [cuotaId],
    comprobanteUrl,
    desde: new Date(`${cuota.fecha_limite}T00:00:00`),
    horasPlazo,
  });

  if (!resultado.success) return resultado;

  const equipo = Array.isArray(cuota.teams) ? cuota.teams[0] : (cuota.teams as TeamInfo | null);
  const delegadoRaw = equipo?.team_delegado;
  const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;

  const adminEmails = getAdminNotificationEmails();
  if (adminEmails) {
    const correo = correoTransferenciaReportadaCuotaAdmin({
      nombreEquipo: equipo?.nombre_equipo ?? "",
      delegadoNombre: delegado?.nombre ?? "",
      delegadoCorreo: delegado?.correo ?? "",
      numeroCuota: cuota.numero_cuota,
      monto: Number(cuota.monto),
      comprobanteUrl,
      aTiempo: resultado.aTiempo,
      plazoTexto: `${horasPlazo} horas`,
    });
    await sendEmail({ to: adminEmails, subject: correo.subject, html: correo.html, text: correo.text }).catch(() => {});
  }

  revalidatePath("/portal");
  revalidatePath("/portal/inscripcion");
  return { success: true };
}
