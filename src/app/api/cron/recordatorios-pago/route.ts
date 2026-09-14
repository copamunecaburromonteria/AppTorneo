import { NextRequest, NextResponse } from "next/server";
import { enviarRecordatoriosCuotasPendientes } from "@/lib/recordatorios";

export const dynamic = "force-dynamic";

/**
 * Pensado para correr una vez al día vía Vercel Cron (ver vercel.json) u otro
 * programador externo. Protegido con CRON_SECRET: solo responde a peticiones
 * que traigan "Authorization: Bearer <CRON_SECRET>".
 *
 * La lógica de revisión + envío vive en `@/lib/recordatorios` — también la
 * usa el botón manual "Enviar recordatorios" del panel admin
 * (`src/app/admin/config/actions.ts`), para no duplicarla.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const resultado = await enviarRecordatoriosCuotasPendientes();
    return NextResponse.json(resultado);
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
