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
// paga en 2 cuotas: la 1a el día de la inscripción, la 2a unos días antes
// del inicio del torneo (ver `calcularFechasCuotas` en `actions.ts`).
const PRICING_FALLBACK = {
  montoInscripcion: 1500000,
  numeroCuotas: 2,
  diasPlazoSaldo: 7,
  diasPrevioTorneoUltimaCuota: 5,
  fechaInicioTorneo: null as string | null,
};

async function getPricing() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("torneo_config")
      .select(
        "monto_inscripcion, numero_cuotas_sin_uniforme, dias_plazo_saldo, fecha_inicio_torneo, dias_previo_torneo_ultima_cuota"
      )
      .eq("id", 1)
      .single();

    if (!data) return PRICING_FALLBACK;

    return {
      montoInscripcion: Number(data.monto_inscripcion),
      numeroCuotas: data.numero_cuotas_sin_uniforme as number,
      diasPlazoSaldo: data.dias_plazo_saldo as number,
      diasPrevioTorneoUltimaCuota: data.dias_previo_torneo_ultima_cuota as number,
      fechaInicioTorneo: (data.fecha_inicio_torneo as string | null) ?? null,
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
