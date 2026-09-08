import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InscripcionForm } from "./inscripcion-form";
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
  porcentajeAbonoMinimo: 50,
};

async function getPricing() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("torneo_config")
      .select(
        "monto_inscripcion, precio_uniforme, max_jugadores_por_equipo, porcentaje_abono_minimo"
      )
      .eq("id", 1)
      .single();

    if (!data) return PRICING_FALLBACK;

    return {
      montoInscripcion: Number(data.monto_inscripcion),
      precioUniforme: Number(data.precio_uniforme),
      maxJugadoresPorEquipo: data.max_jugadores_por_equipo as number,
      porcentajeAbonoMinimo: Number(data.porcentaje_abono_minimo),
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

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-white">
        <section className="relative overflow-hidden bg-muneca-black pb-14 pt-32 text-muneca-white sm:pt-28 lg:pt-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Image
              src="/brand/isotipo.png"
              alt=""
              aria-hidden="true"
              width={400}
              height={400}
              className="mx-auto mb-6 h-20 w-20 object-contain"
            />
            <h1 className="font-display text-5xl sm:text-6xl">INSCRIBE TU EQUIPO</h1>
            <p className="mt-3 text-lg text-white/80">
              Copa Muñeca e&apos;Burro · Categoría Libre · Montería, Córdoba
            </p>

            <div className="mt-8 flex flex-wrap items-stretch justify-center gap-4">
              <div className="min-w-[220px] rounded-xl border border-white/10 bg-white/5 px-6 py-4">
                <p className="text-xs uppercase tracking-wide text-donkey-gray">Inscripción</p>
                <p className="font-display mt-1 text-3xl text-muneca-yellow">
                  ${pricing.montoInscripcion.toLocaleString("es-CO")}
                </p>
                <p className="mt-1 text-xs text-white/60">Por equipo</p>
              </div>
              <div className="min-w-[220px] rounded-xl border border-white/10 bg-white/5 px-6 py-4">
                <p className="text-xs uppercase tracking-wide text-donkey-gray">
                  Uniforme oficial (opcional)
                </p>
                <p className="font-display mt-1 text-3xl text-muneca-yellow">
                  ${pricing.precioUniforme.toLocaleString("es-CO")}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Por jugador · kit completo de {pricing.maxJugadoresPorEquipo}
                </p>
              </div>
            </div>
          </div>
        </section>

        <InscripcionForm pricing={pricing} montoUniformeKit={montoUniformeKit} />
      </main>
      <SiteFooter />
    </div>
  );
}
