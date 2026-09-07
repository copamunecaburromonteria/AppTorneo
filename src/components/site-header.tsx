import Image from "next/image";
import Link from "next/link";
import {
  InstagramLogo,
  FacebookLogo,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import { NavDropdown } from "@/components/nav-dropdown";

// TODO: reemplazar por los handles/URLs reales de cada red social.
const SOCIAL_LINKS = [
  { href: "#", label: "Instagram", Icon: InstagramLogo },
  { href: "#", label: "Facebook", Icon: FacebookLogo },
  { href: "#", label: "TikTok", Icon: TiktokLogo },
  { href: "#", label: "YouTube", Icon: YoutubeLogo },
];

const TORNEO_LINKS = [
  { href: "#torneo", label: "Formato del torneo" },
  { href: "#partidos", label: "Calendario completo" },
  { href: "#", label: "Reglamento" },
];

const ESTADISTICAS_LINKS = [
  { href: "#estadisticas", label: "Goleadores" },
  { href: "#estadisticas", label: "Mejores arqueros" },
  { href: "#estadisticas", label: "Ranking MVP" },
  { href: "#", label: "Ranking de árbitros" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-muneca-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="#inicio" className="flex items-center shrink-0">
          <Image
            src="/brand/logo-full.png"
            alt="Copa Muñeca e'Burro"
            width={1983}
            height={793}
            priority
            className="h-12 w-auto object-contain sm:h-14"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
          <a
            href="#inicio"
            aria-current="page"
            className="relative pb-1 text-muneca-black after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-muneca-purple"
          >
            Inicio
          </a>
          <NavDropdown label="Torneo" items={TORNEO_LINKS} />
          <a href="#equipos" className="pb-1 text-muneca-black/70 transition-colors hover:text-muneca-purple">
            Equipos
          </a>
          <a href="#partidos" className="pb-1 text-muneca-black/70 transition-colors hover:text-muneca-purple">
            Resultados
          </a>
          <a href="#posiciones" className="pb-1 text-muneca-black/70 transition-colors hover:text-muneca-purple">
            Posiciones
          </a>
          <NavDropdown label="Estadísticas" items={ESTADISTICAS_LINKS} />
          <a href="#galeria" className="pb-1 text-muneca-black/70 transition-colors hover:text-muneca-purple">
            Galería
          </a>
          <a href="#patrocinadores" className="pb-1 text-muneca-black/70 transition-colors hover:text-muneca-purple">
            Patrocinadores
          </a>
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
