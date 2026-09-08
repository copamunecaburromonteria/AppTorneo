import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { correoRecordatorioCuota } from "@/lib/resend/templates";

export const dynamic = "force-dynamic";

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

/**
 * Revisa las partidas pendientes que vencen pronto (torneo_config.dias_aviso_previo_cuota)
 * y envía un recordatorio por correo — una sola vez por partida
 * (payment_installments.recordatorio_enviado_at).
 *
 * Pensado para correr una vez al día vía Vercel Cron (ver vercel.json) u otro
 * programador externo. Protegido con CRON_SECRET: solo responde a peticiones
 * que traigan "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: config, error: configError } = await admin
    .from("torneo_config")
    .select("dias_aviso_previo_cuota")
    .eq("id", 1)
    .single();

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  return NextResponse.json({ revisadas: cuotas?.length ?? 0, enviados });
}
