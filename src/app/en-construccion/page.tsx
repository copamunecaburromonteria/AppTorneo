import type { Metadata } from "next";
import Image from "next/image";

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

export default function EnConstruccionPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muneca-black">
      <span className="relative hidden md:inline-block">
        <Image
          src="/brand/en-construccion-desktop.jpg"
          alt="Copa Muñeca e'Burro — Estamos en construcción. Algo bien bacano se está cocinando para el fútbol de nuestra tierra. ¡Espéralo, vale!"
          width={1672}
          height={941}
          className="h-auto max-h-dvh w-auto max-w-full"
        />
        <IconOverlay icons={DESKTOP_ICONS} />
      </span>

      <span className="relative inline-block md:hidden">
        <Image
          src="/brand/en-construccion-mobile.jpg"
          alt="Copa Muñeca e'Burro — Estamos en construcción. Algo bien bacano se está cocinando para el fútbol de nuestra tierra. ¡Espéralo, vale!"
          width={941}
          height={1672}
          className="h-auto max-h-dvh w-auto max-w-full"
        />
        <IconOverlay icons={MOBILE_ICONS} />
      </span>
    </main>
  );
}
