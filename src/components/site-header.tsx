import Image from "next/image";
import Link from "next/link";
import {
  InstagramLogo,
  FacebookLogo,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio", active: true },
  { href: "#torneo", label: "Torneo" },
  { href: "#equipos", label: "Equipos" },
  { href: "#partidos", label: "Resultados" },
  { href: "#posiciones", label: "Posiciones" },
  { href: "#estadisticas", label: "Estadísticas" },
  { href: "#galeria", label: "Galería" },
  { href: "#patrocinadores", label: "Patrocinadores" },
];

// TODO: reemplazar por los handles/URLs reales de cada red social.
const SOCIAL_LINKS = [
  { href: "#", label: "Instagram", Icon: InstagramLogo },
  { href: "#", label: "Facebook", Icon: FacebookLogo },
  { href: "#", label: "TikTok", Icon: TiktokLogo },
  { href: "#", label: "YouTube", Icon: YoutubeLogo },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-muneca-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="#inicio" className="flex items-center gap-2 shrink-0">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Copa Muñeca e'Burro"
            width={180}
            height={48}
            priority
            className="h-10 w-auto object-contain sm:h-11"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={`relative pb-1 transition-colors hover:text-muneca-purple ${
                link.active
                  ? "text-muneca-black after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-muneca-purple"
                  : "text-muneca-black/70"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muneca-black/5 text-muneca-black/60 transition-colors hover:bg-muneca-purple hover:text-white"
            >
              <Icon size={16} weight="regular" aria-hidden="true" />
            </a>
          ))}
        </div>

        <a
          href="#inscripcion"
          className="shrink-0 rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black shadow-sm transition-transform hover:scale-[1.03]"
        >
          Inscribe tu equipo →
        </a>
      </div>
    </header>
  );
}
