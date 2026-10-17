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
  // Grilla de puntos + tres "blobs" borrosos en los colores de marca, en
  // deriva lenta (ver `globals.css`) — decorativo puro, por eso
  // `aria-hidden` + `pointer-events-none`.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-dot-grid absolute inset-0 opacity-40" />
      <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-muneca-purple/35 blur-[100px] animate-blob-drift sm:h-[34rem] sm:w-[34rem]" />
      <div className="absolute -bottom-32 -right-16 h-[24rem] w-[24rem] rounded-full bg-muneca-yellow/15 blur-[110px] animate-blob-drift-reverse sm:h-[32rem] sm:w-[32rem]" />
      <div
        className="absolute left-1/2 top-1/3 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-muneca-purple-dark/30 blur-[90px] animate-blob-drift sm:h-[24rem] sm:w-[24rem]"
        style={{ animationDelay: "-9s" }}
      />
      {/* Velo para que el texto de la izquierda siempre tenga contraste,
          sin importar qué tan cerca ande un blob. */}
      <div className="absolute inset-0 bg-gradient-to-t from-muneca-black via-muneca-black/40 to-muneca-black/10" />
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
