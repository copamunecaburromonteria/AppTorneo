import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { correoRecordatorioCuota } from "@/lib/resend/templates";

type CuotaConEquipo = {
  id: string;
  numero_cuota: number;
  monto: number;
  fecha_limite: string;
  teams:
    | {
        nombre_equipo: string;
        team_delegado: { correo: string; nombre: string } | { correo: string; nombre: string }[] | null;
      }
    | {
        nombre_equipo: string;
        team_delegado: { correo: string; nombre: string } | { correo: string; nombre: string }[] | null;
      }[]
    | null;
};

export type ResultadoRecordatorios = { revisadas: number; enviados: number };

/**
 * Revisa las partidas (cuotas) pendientes que vencen dentro de la ventana
 * configurada en `torneo_config.dias_aviso_previo_cuota` y envía un
 * recordatorio por correo — una sola vez por partida
 * (`payment_installments.recordatorio_enviado_at`).
 *
 * Extraído a un helper compartido para que la misma lógica la pueda disparar
 * tanto el cron diario (`/api/cron/recordatorios-pago`) como el botón manual
 * "Enviar recordatorios" del panel admin — sin duplicar la consulta ni el
 * envío. Usa siempre el cliente de service role: la decisión de quién puede
 * *disparar* el envío (cron con secreto, o admin autenticado) la controla
 * quien llama a esta función, no esta función.
 */
export async function enviarRecordatoriosCuotasPendientes(): Promise<ResultadoRecordatorios> {
  const admin = createAdminClient();

  const { data: config, error: configError } = await admin
    .from("torneo_config")
    .select("dias_aviso_previo_cuota")
    .eq("id", 1)
    .single();

  if (configError) {
    throw new Error(configError.message);
  }

  const diasAviso = (config?.dias_aviso_previo_cuota as number) ?? 2;
  const limite = new Date();
  limite.setDate(limite.getDate() + diasAviso);
  const fechaLimiteISO = limite.toISOString().slice(0, 10);

  const { data: cuotas, error } = await admin
    .from("payment_installments")
    .select("id, numero_cuota, monto, fecha_limite, teams(nombre_equipo, team_delegado(correo, nombre))")
    .eq("estado", "pendiente")
    .is("recordatorio_enviado_at", null)
    .lte("fecha_limite", fechaLimiteISO)
    .returns<CuotaConEquipo[]>();

  if (error) {
    throw new Error(error.message);
  }

  let enviados = 0;

  for (const cuota of cuotas ?? []) {
    const equipo = Array.isArray(cuota.teams) ? cuota.teams[0] : cuota.teams;
    if (!equipo) continue;

    const delegado = Array.isArray(equipo.team_delegado) ? equipo.team_delegado[0] : equipo.team_delegado;
    if (!delegado?.correo) continue;

    const { subject, html, text } = correoRecordatorioCuota({
      nombreEquipo: equipo.nombre_equipo,
      delegadoNombre: delegado.nombre,
      numeroCuota: cuota.numero_cuota,
      monto: Number(cuota.monto),
      fechaLimite: cuota.fecha_limite,
    });

    const resultado = await sendEmail({ to: delegado.correo, subject, html, text });
    if (resultado.ok) {
      await admin
        .from("payment_installments")
        .update({ recordatorio_enviado_at: new Date().toISOString() })
        .eq("id", cuota.id);
      enviados++;
    }
  }

  return { revisadas: cuotas?.length ?? 0, enviados };
}
