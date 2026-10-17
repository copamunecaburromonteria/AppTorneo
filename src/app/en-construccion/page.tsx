import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Countdown } from "@/components/en-construccion/countdown";

export const metadata: Metadata = {
  title: "Copa Muñeca e'Burro — Estamos en construcción",
  description: "Estamos construyendo la Copa Muñeca e'Burro. Vuelve pronto.",
  robots: { index: false, follow: false },
};

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/copamunecaburromonteria", label: "Instagram", icon: "/brand/icono-instagram.png" },
  { href: "https://www.facebook.com/copamunecaburromonteria", label: "Facebook", icon: "/brand/icono-facebook.png" },
  { href: "https://www.tiktok.com/@copamunecaburromonteria", label: "TikTok", icon: "/brand/icono-tiktok.png" },
  { href: "https://www.youtube.com/@copamunecaburromonteria", label: "YouTube", icon: "/brand/icono-youtube.png" },
];

function FondoAnimado() {
  // v4 (2026-10-17, Fernando trajo sus propias 4 piezas ya recortadas:
  // foto de estadio con humo/conos, letrero "ESTAMOS EN CONSTRUCCIÓN",
  // mascota y el set de íconos de redes — montamos todo eso acá en vez
  // de las versiones anteriores hechas solo con CSS).
  //
  // Fondo: la foto trae el humo y las luces moradas ya "horneadas" en la
  // imagen; el zoom lento ("Ken Burns") y las dos nubes de humo extra en
  // CSS (`.animate-smoke-drift`) le dan el movimiento real que pidió
  // ("quiero algo más animado"), sin tapar la foto con un velo plano.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/brand/fondo-construccion.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="animate-photo-kenburns object-cover object-center"
      />
      {/* Nubes de humo extra, en deriva, encima de la foto — la foto ya
          trae humo estático; esto le suma movimiento real. */}
      <div className="absolute -left-20 bottom-0 h-[26rem] w-[36rem] rounded-full bg-white/10 blur-[80px] animate-smoke-drift sm:h-[32rem] sm:w-[46rem]" />
      <div
        className="absolute -right-10 bottom-0 h-[22rem] w-[32rem] rounded-full bg-muneca-purple/25 blur-[90px] animate-smoke-drift-reverse sm:h-[28rem] sm:w-[40rem]"
        style={{ animationDelay: "-8s" }}
      />
      <div className="absolute inset-0 bg-muneca-black/35" />
      {/* Foco oscuro solo detrás del bloque de texto — centrado en mobile
          (donde todo va apilado), recostado a la izquierda en desktop. La
          foto ya es bastante oscura de por sí, así que el foco es más
          liviano que en las versiones anteriores. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_38%,rgba(21,21,21,0.55),rgba(21,21,21,0.2)_55%,transparent_80%)] lg:hidden" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_48%_85%_at_20%_48%,rgba(21,21,21,0.6),rgba(21,21,21,0.2)_55%,transparent_80%)] lg:block" />
    </div>
  );
}

/**
 * Página pública "en construcción" (ver `src/middleware.ts`).
 *
 * v4 (2026-10-17) — Fernando trajo su propio set de piezas gráficas
 * (generadas por él) para esta pantalla: foto de estadio con humo y
 * conos de obra, el letrero "ESTAMOS EN CONSTRUCCIÓN", la mascota y el
 * set de íconos de redes con su propio estilo (círculo + splash morado/
 * amarillo). Los íconos de redes se recortaron en 4 piezas individuales
 * (`public/brand/icono-*.png`) para que cada uno siga siendo un link real
 * y clickeable, en vez de pegar la composición completa como una sola
 * imagen no interactiva.
 *
 * El `<h1>` sigue siendo texto real (lo visual es el letrero de Fernando,
 * puesto como su `alt`) para no perder accesibilidad/SEO del título de la
 * página por depender solo de una imagen.
 */
export default async function EnConstruccionPage() {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("torneo_config")
    .select("modo_construccion_fecha_meta")
    .eq("id", 1)
    .single();

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-muneca-black text-muneca-white">
      <FondoAnimado />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:py-20">
        <div className="flex w-full max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Copa Muñeca e'Burro — Montería"
            width={1983}
            height={793}
            priority
            className="h-auto w-56 object-contain sm:w-64"
          />

          <h1 className="mt-6 w-full max-w-md sm:max-w-lg lg:max-w-none">
            <Image
              src="/brand/letrero-construccion.png"
              alt="Estamos en construcción"
              width={1760}
              height={886}
              priority
              className="h-auto w-full object-contain"
            />
          </h1>

          <p className="mt-5 max-w-md text-lg text-white/80">
            El torneo donde vienes a competir, no a jugar tres partidos y empacar.
          </p>

          <div className="mt-9">
            <Countdown fechaMetaIso={config?.modo_construccion_fecha_meta ?? null} />
          </div>

          <p className="mt-8 text-sm uppercase tracking-[0.2em] text-donkey-gray">
            24 equipos · Categoría Libre · Montería
          </p>

          <div className="mt-6 flex items-center gap-2">
            {SOCIAL_LINKS.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-14 w-14 items-center justify-center transition-transform hover:scale-105 sm:h-16 sm:w-16"
              >
                <Image src={icon} alt="" aria-hidden="true" width={420} height={366} className="h-full w-full object-contain" />
              </a>
            ))}
          </div>

          <Image
            src="/brand/banner-mas-que-futbol.png"
            alt="Más que fútbol, somos pasión"
            width={1667}
            height={111}
            className="mt-5 h-auto w-full max-w-xs object-contain sm:max-w-sm"
          />
        </div>

        <div className="relative hidden w-full flex-1 items-end justify-center lg:flex lg:h-[34rem]">
          <Image
            src="/brand/mascota-construccion.png"
            alt=""
            aria-hidden="true"
            width={691}
            height={941}
            priority
            className="relative z-10 h-full w-auto max-w-none object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>
    </main>
  );
}
