"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  InstagramLogo,
  FacebookLogo,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { NavDropdown } from "@/components/nav-dropdown";

// TODO: reemplazar por los handles/URLs reales de cada red social.
const SOCIAL_LINKS = [
  { href: "#", label: "Instagram", Icon: InstagramLogo },
  { href: "#", label: "Facebook", Icon: FacebookLogo },
  { href: "#", label: "TikTok", Icon: TiktokLogo },
  { href: "#", label: "YouTube", Icon: YoutubeLogo },
];

// TODO: "Cómo funciona", "Reglamento" y "Premios" aún no tienen página/sección propia.
const TORNEO_LINKS = [
  { href: "#", label: "Cómo funciona" },
  { href: "#", label: "Reglamento" },
  { href: "#", label: "Premios" },
];

const PARTIDOS_LINKS = [
  { href: "#partidos", label: "Resultados" },
  { href: "#posiciones", label: "Posiciones" },
  { href: "#estadisticas", label: "Estadísticas" },
];

// TODO: "Noticias" aún no tiene sección propia; Fotos/Videos apuntan a Galería por ahora.
const CONTENIDO_LINKS = [
  { href: "#", label: "Noticias" },
  { href: "#galeria", label: "Fotos" },
  { href: "#galeria", label: "Videos" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tone = scrolled ? "dark" : "light";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-black/10 bg-muneca-white/95 backdrop-blur"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link href="#inicio" className="flex shrink-0 items-center">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Copa Muñeca e'Burro Montería"
            width={1841}
            height={707}
            priority
            className="h-14 w-auto object-contain sm:h-20 lg:h-[100px]"
          />
        </Link>

        <nav
          className={`hidden items-center gap-6 text-sm font-semibold uppercase tracking-wide lg:flex ${
            tone === "light" ? "text-white/90" : "text-muneca-black/70"
          }`}
        >
          <a
            href="#inicio"
            aria-current="page"
            className={`relative pb-1 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-muneca-yellow ${
              tone === "light" ? "text-white" : "text-muneca-black"
            }`}
          >
            Inicio
          </a>
          <NavDropdown label="Torneo" items={TORNEO_LINKS} tone={tone} />
          <a href="#equipos" className="pb-1 transition-colors hover:text-muneca-yellow">
            Equipos
          </a>
          <NavDropdown label="Partidos" items={PARTIDOS_LINKS} tone={tone} />
          <NavDropdown label="Contenido" items={CONTENIDO_LINKS} tone={tone} />
          <a
            href="#patrocinadores"
            className="pb-1 transition-colors hover:text-muneca-yellow"
          >
            Patrocinadores
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muneca-yellow hover:text-muneca-black ${
                tone === "light"
                  ? "bg-white/10 text-white/85"
                  : "bg-muneca-black/5 text-muneca-black/60"
              }`}
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
