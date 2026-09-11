import type { Metadata } from "next";
import { InscripcionWizard } from "./inscripcion-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inscribe tu equipo | Copa Muñeca e'Burro",
  description:
    "Inscribe a tu equipo en la Copa Muñeca e'Burro — 24 equipos, categoría libre, Montería, Córdoba.",
};

const PRICING_FALLBACK = {
  montoInscripcion: 800000,
  precioUniforme: 50000,
  maxJugadoresPorEquipo: 15,
  numeroCuotasSinUniforme: 2,
  numeroCuotasConUniforme: 3,
  diasPlazoSaldo: 7,
};

async function getPricing() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("torneo_config")
      .select(
        "monto_inscripcion, precio_uniforme, max_jugadores_por_equipo, numero_cuotas_sin_uniforme, numero_cuotas_con_uniforme, dias_plazo_saldo"
      )
      .eq("id", 1)
      .single();

    if (!data) return PRICING_FALLBACK;

    return {
      montoInscripcion: Number(data.monto_inscripcion),
      precioUniforme: Number(data.precio_uniforme),
      maxJugadoresPorEquipo: data.max_jugadores_por_equipo as number,
      numeroCuotasSinUniforme: data.numero_cuotas_sin_uniforme as number,
      numeroCuotasConUniforme: data.numero_cuotas_con_uniforme as number,
      diasPlazoSaldo: data.dias_plazo_saldo as number,
    };
  } catch {
    // Si Supabase todavía no está conectado (faltan variables de entorno),
    // la página igual se puede ver con los valores vigentes conocidos.
    return PRICING_FALLBACK;
  }
}

export default async function InscripcionPage() {
  const pricing = await getPricing();
  const montoUniformeKit = pricing.precioUniforme * pricing.maxJugadoresPorEquipo;

  return <InscripcionWizard pricing={pricing} montoUniformeKit={montoUniformeKit} />;
}
