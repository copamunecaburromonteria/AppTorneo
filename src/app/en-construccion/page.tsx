import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Countdown } from "@/components/en-construccion/countdown";

export const metadata: Metadata = {
  title: "Copa Muñeca e'Burro — Estamos en construcción",
  description: "Estamos construyendo la Copa Muñeca e'Burro. Vuelve pronto.",
  robots: { index: false, follow: false },
};

const FACEBOOK_URL = "https://www.facebook.com/copamunecaburromonteria";
const INSTAGRAM_URL = "https://www.instagram.com/copamunecaburromonteria";
const TIKTOK_URL = "https://www.tiktok.com/@copamunecaburromonteria";
const YOUTUBE_URL = "https://www.youtube.com/@copamunecaburromonteria";

type IconHotspot = {
  label: string;
  href: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

// Coordenadas medidas sobre el diseño original (en % del tamaño de la
// imagen), para que los enlaces inviertan exactamente sobre cada ícono sin
// importar a qué tamaño se termine mostrando la imagen en pantalla.
const DESKTOP_ICONS: IconHotspot[] = [
  { label: "Facebook", href: FACEBOOK_URL, left: 39.92, top: 74.81, width: 4.43, height: 7.44 },
  { label: "Instagram", href: INSTAGRAM_URL, left: 45.22, top: 74.81, width: 4.43, height: 7.44 },
  { label: "TikTok", href: TIKTOK_URL, left: 50.42, top: 74.81, width: 4.43, height: 7.44 },
  { label: "YouTube", href: YOUTUBE_URL, left: 55.53, top: 74.81, width: 4.43, height: 7.44 },
];

const MOBILE_ICONS: IconHotspot[] = [
  { label: "Facebook", href: FACEBOOK_URL, left: 28.37, top: 72.19, width: 8.5, height: 4.78 },
  { label: "Instagram", href: INSTAGRAM_URL, left: 40.01, top: 72.19, width: 8.5, height: 4.78 },
  { label: "TikTok", href: TIKTOK_URL, left: 51.81, top: 72.19, width: 8.5, height: 4.78 },
  { label: "YouTube", href: YOUTUBE_URL, left: 63.44, top: 72.19, width: 8.5, height: 4.78 },
];

function IconOverlay({ icons }: { icons: IconHotspot[] }) {
  return (
    <>
      {icons.map((icon) => (
        <a
          key={icon.label}
          href={icon.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={icon.label}
          className="absolute rounded-full outline-none focus-visible:ring-2 focus-visible:ring-muneca-yellow"
          style={{
            left: `${icon.left}%`,
            top: `${icon.top}%`,
            width: `${icon.width}%`,
            height: `${icon.height}%`,
          }}
        />
      ))}
    </>
  );
}

/**
 * Página pública "en construcción" (ver `src/middleware.ts`). El arte
 * (desktop/mobile, `public/brand/en-construccion-*.jpg`) queda intacto tal
 * cual se diseñó — el contador se agregó como un bloque aparte debajo de la
 * imagen en vez de superponerlo sobre los píxeles, porque el diseño
 * original no tiene un espacio reservado para esto y superponerlo a ciegas
 * quedaba frágil/apretado. El layout pasó de "una sola pantalla, sin
 * scroll" a una tarjeta centrada + bloque de contador debajo, con scroll si
 * hace falta (2026-10-17, a pedido de Fernando: agregar un contador a la
 * página de construcción).
 */
function FondoAnimado() {
  // Tres "blobs" borrosos en los colores de marca, en deriva lenta
  // (`globals.css`) — decorativo puro, por eso `aria-hidden` +
  // `pointer-events-none`.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-muneca-purple/30 blur-[100px] animate-blob-drift sm:h-[32rem] sm:w-[32rem]" />
      <div className="absolute -bottom-28 -right-16 h-[24rem] w-[24rem] rounded-full bg-muneca-yellow/15 blur-[110px] animate-blob-drift-reverse sm:h-[30rem] sm:w-[30rem]" />
      <div
        className="absolute left-1/2 top-1/3 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-muneca-purple-dark/30 blur-[90px] animate-blob-drift sm:h-[22rem] sm:w-[22rem]"
        style={{ animationDelay: "-9s" }}
      />
    </div>
  );
}

export default async function EnConstruccionPage() {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("torneo_config")
    .select("modo_construccion_fecha_meta")
    .eq("id", 1)
    .single();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-muneca-black px-4 py-10 sm:py-14">
      <FondoAnimado />

      <div className="relative z-10 flex w-full flex-col items-center gap-8">
        <span className="relative inline-block w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl md:hidden">
          <Image
            src="/brand/en-construccion-mobile.jpg"
            alt="Copa Muñeca e'Burro — Estamos en construcción. Algo bien bacano se está cocinando para el fútbol de nuestra tierra. ¡Espéralo, vale!"
            width={941}
            height={1672}
            priority
            className="h-auto w-full"
          />
          <IconOverlay icons={MOBILE_ICONS} />
        </span>

        <span className="relative hidden w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl md:inline-block">
          <Image
            src="/brand/en-construccion-desktop.jpg"
            alt="Copa Muñeca e'Burro — Estamos en construcción. Algo bien bacano se está cocinando para el fútbol de nuestra tierra. ¡Espéralo, vale!"
            width={1672}
            height={941}
            priority
            className="h-auto w-full"
          />
          <IconOverlay icons={DESKTOP_ICONS} />
        </span>

        <Countdown fechaMetaIso={config?.modo_construccion_fecha_meta ?? null} />
      </div>
    </main>
  );
}
