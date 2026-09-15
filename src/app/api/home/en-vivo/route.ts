import { NextResponse } from "next/server";
import { obtenerEstadoEnVivoHome } from "@/lib/home/en-vivo";

/**
 * Endpoint interno que consulta el componente cliente de "Partidos en
 * vivo" del Home cada 15s (sondeo, no websocket — ver
 * `partidos-en-vivo-client.tsx`). Siempre datos frescos, nunca cacheados.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const estado = await obtenerEstadoEnVivoHome();
  return NextResponse.json(estado, { headers: { "Cache-Control": "no-store" } });
}
