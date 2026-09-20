import { NextRequest, NextResponse } from "next/server";
import {
  enviarAvisosCargosTarjetasGenerados,
  enviarRecordatoriosCargosTarjetasPrevioPartido,
} from "@/lib/recordatorios-tarjetas";

export const dynamic = "force-dynamic";

/**
 * Corre una vez al día vía Vercel Cron (ver vercel.json), protegido con
 * CRON_SECRET igual que `/api/cron/recordatorios-pago`. Dispara los dos
 * avisos de cargos por tarjeta en la misma corrida: el aviso "día después"
 * de que se generó el cargo, y el recordatorio urgente 24 horas antes del
 * próximo partido del equipo — la lógica de cada uno vive en
 * `@/lib/recordatorios-tarjetas` para poder reusarla desde un botón manual
 * del panel admin si hace falta más adelante.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [avisosGenerados, recordatoriosPrevios] = await Promise.all([
      enviarAvisosCargosTarjetasGenerados(),
      enviarRecordatoriosCargosTarjetasPrevioPartido(),
    ]);
    return NextResponse.json({ avisosGenerados, recordatoriosPrevios });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
