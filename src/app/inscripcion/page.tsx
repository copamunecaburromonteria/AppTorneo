import type { Metadata } from "next";
import { InscripcionGate } from "./inscripcion-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inscribe tu equipo | Copa Muñeca e'Burro",
  description:
    "Inscribe a tu equipo en la Copa Muñeca e'Burro — 24 equipos, categoría libre, Montería, Córdoba.",
};

// Inscripción "todo incluido" desde el 2026-09-26 (decisión de Fernando):
// $1.500.000 COP incluyen uniforme oficial, cancha, hidratación, arbitraje y
// la plataforma web — el uniforme ya no es una compra aparte/opcional. Se
// paga en 2 cuotas: la 1a vence 24h después de terminar la inscripción, la
// 2a 8 días después de esa (política confirmada por Fernando el 2026-09-28
// — ver `calcularFechasCuotas` en `actions.ts`).
const PRICING_FALLBACK = {
  montoInscripcion: 1500000,
  numeroCuotas: 2,
  diasPlazoPrimeraCuota: 1,
  diasPlazoSaldo: 8,
  diasPrevioTorneoUltimaCuota: 5,
  fechaInicioTorneo: null as string | null,
  recargoWompiPct: 0.033333,
  llavePago: "@FGC368",
};

async function getPricing() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("torneo_config")
      .select(
        "monto_inscripcion, numero_cuotas_sin_uniforme, dias_plazo_primera_cuota, dias_plazo_saldo, fecha_inicio_torneo, dias_previo_torneo_ultima_cuota, recargo_wompi_pct, llave_pago_transferencia"
      )
      .eq("id", 1)
      .single();

    if (!data) return PRICING_FALLBACK;

    return {
      montoInscripcion: Number(data.monto_inscripcion),
      numeroCuotas: data.numero_cuotas_sin_uniforme as number,
      diasPlazoPrimeraCuota: data.dias_plazo_primera_cuota as number,
      diasPlazoSaldo: data.dias_plazo_saldo as number,
      diasPrevioTorneoUltimaCuota: data.dias_previo_torneo_ultima_cuota as number,
      fechaInicioTorneo: (data.fecha_inicio_torneo as string | null) ?? null,
      recargoWompiPct: Number(data.recargo_wompi_pct ?? PRICING_FALLBACK.recargoWompiPct),
      llavePago: (data.llave_pago_transferencia as string | null) ?? PRICING_FALLBACK.llavePago,
    };
  } catch {
    // Si Supabase todavía no está conectado (faltan variables de entorno),
    // la página igual se puede ver con los valores vigentes conocidos.
    return PRICING_FALLBACK;
  }
}

/**
 * Ya no verifica cupo acá (`verificarCupoDisponible` se eliminó junto con la
 * modalidad de inscripción inmediata): ahora el acceso se controla por
 * invitación, dentro de `InscripcionGate` (ver `claude/plan-fases-tareas.md`).
 */
export default async function InscripcionPage() {
  const pricing = await getPricing();

  return <InscripcionGate pricing={pricing} />;
}
