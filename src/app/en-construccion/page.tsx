import type { Metadata } from "next";
import Image from "next/image";
import { InstagramLogo, FacebookLogo, TiktokLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { Countdown } from "@/components/en-construccion/countdown";

export const metadata: Metadata = {
  title: "Copa Muñeca e'Burro — Estamos en construcción",
  description: "Estamos construyendo la Copa Muñeca e'Burro. Vuelve pronto.",
  robots: { index: false, follow: false },
};

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/copamunecaburromonteria", label: "Instagram", Icon: InstagramLogo },
  { href: "https://www.facebook.com/copamunecaburromonteria", label: "Facebook", Icon: FacebookLogo },
  { href: "https://www.tiktok.com/@copamunecaburromonteria", label: "TikTok", Icon: TiktokLogo },
  { href: "https://www.youtube.com/@copamunecaburromonteria", label: "YouTube", Icon: YoutubeLogo },
];

function FondoAnimado() {
  // Fondo con la foto del estadio (mismo asset — `hero-stadium.jpg` — que
  // ya usan los encabezados de Equipos, Partidos, Posiciones, etc., para
  // que /en-construccion se sienta parte de la misma plataforma) con un
  // "Ken Burns" lentísimo de zoom, más la grilla de puntos y los blobs
  // morado/amarillo encima para que el color de marca siga siendo
  // protagonista.
  //
  // v3 (2026-10-17, feedback de Fernando: "no me gusta ese fondo, quiero
  // algo más animado o definitivamente montemos el fondo del estadio") —
  // la v2 (solo color, sin foto) no le gustó; esta versión junta las dos
  // cosas que pidió: la foto del estadio + más movimiento (zoom lento de
  // la foto + blobs grandes en deriva), en vez de elegir entre una u
  // otra.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/brand/hero-stadium.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="animate-photo-kenburns object-cover object-center"
      />
      <div className="absolute inset-0 bg-muneca-black/70" />
      <div className="bg-dot-grid absolute inset-0 opacity-50" />
      <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-muneca-purple/50 blur-[90px] animate-blob-drift sm:h-[46rem] sm:w-[46rem]" />
      <div className="absolute -bottom-40 -right-20 h-[30rem] w-[30rem] rounded-full bg-muneca-yellow/20 blur-[100px] animate-blob-drift-reverse sm:h-[40rem] sm:w-[40rem]" />
      <div
        className="absolute right-1/4 top-0 h-[24rem] w-[24rem] rounded-full bg-muneca-purple-dark/40 blur-[80px] animate-blob-drift sm:h-[30rem] sm:w-[30rem]"
        style={{ animationDelay: "-9s" }}
      />
      {/* Foco oscuro solo detrás del bloque de texto — centrado en mobile
          (donde todo va apilado), recostado a la izquierda en desktop. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_38%,rgba(21,21,21,0.7),rgba(21,21,21,0.25)_55%,transparent_80%)] lg:hidden" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_48%_85%_at_20%_48%,rgba(21,21,21,0.75),rgba(21,21,21,0.3)_55%,transparent_80%)] lg:block" />
    </div>
  );
}

/**
 * Página pública "en construcción" (ver `src/middleware.ts`). Rediseñada
 * 2026-10-17 a pedido de Fernando, inspirada en el "coming soon" de
 * hakunnadigital.com pero con el branding de la Copa: layout dinámico
 * (logo + titular + contador + redes a la izquierda, mascota flotando
 * sobre un fondo animado a la derecha) en vez del arte estático anterior
 * (`en-construccion-desktop.jpg` / `-mobile.jpg`, que quedan en
 * `public/brand/` sin usarse, por si hicieran falta más adelante).
 *
 * El titular y el dato "24 equipos · Categoría Libre · Montería" reusan
 * exactamente el mismo texto ya establecido en el hero del home
 * (`src/components/home/hero.tsx`) — nada de eslóganes nuevos inventados
 * para esta pantalla.
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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-12 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:py-20">
        <div className="flex w-full max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Copa Muñeca e'Burro — Montería"
            width={1983}
            height={793}
            priority
            className="h-auto w-56 object-contain sm:w-64"
          />

          <p className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-muneca-yellow">
            <span className="h-px w-6 bg-muneca-yellow" aria-hidden="true" />
            Torneo en construcción
          </p>

          <h1 className="font-display mt-3 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Estamos armando
            <br />
            <span className="text-muneca-yellow">el parche más grande</span>
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

          <div className="mt-6 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-muneca-yellow hover:text-muneca-yellow"
              >
                <Icon size={18} weight="regular" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div className="relative hidden w-full flex-1 items-end justify-center lg:flex lg:h-[34rem]">
          <Image
            src="/brand/mascota-cutout.png"
            alt=""
            aria-hidden="true"
            width={1024}
            height={1536}
            priority
            className="relative z-10 h-full w-auto max-w-none object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>
    </main>
  );
}
