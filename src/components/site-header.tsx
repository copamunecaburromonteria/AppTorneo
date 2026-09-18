"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  InstagramLogo,
  FacebookLogo,
  TiktokLogo,
  YoutubeLogo,
  CaretDown,
  List,
  X,
} from "@phosphor-icons/react";
import { NavDropdown } from "@/components/nav-dropdown";
import { cerrarSesionEquipo } from "@/app/portal/actions";

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/copamunecaburromonteria", label: "Instagram", Icon: InstagramLogo },
  { href: "https://www.facebook.com/copamunecaburromonteria", label: "Facebook", Icon: FacebookLogo },
  { href: "https://www.tiktok.com/@copamunecaburromonteria", label: "TikTok", Icon: TiktokLogo },
  { href: "https://www.youtube.com/@copamunecaburromonteria", label: "YouTube", Icon: YoutubeLogo },
];

const TORNEO_LINKS = [
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/reglamento", label: "Reglamento" },
  { href: "/premios", label: "Premios" },
];

const PARTIDOS_LINKS = [
  { href: "/partidos", label: "Calendario completo" },
  { href: "/#posiciones", label: "Posiciones" },
  { href: "/#estadisticas", label: "Estadísticas" },
];

// TODO: "Noticias" aún no tiene sección propia; Fotos/Videos apuntan a Galería por ahora.
const CONTENIDO_LINKS = [
  { href: "#", label: "Noticias" },
  { href: "/#galeria", label: "Fotos" },
  { href: "/#galeria", label: "Videos" },
];

export type SiteHeaderUserChip = {
  /** Nombre para mostrar (ej. delegado). */
  nombre: string;
  /** Ej. "Delegado". */
  rol: string;
  /** Nombre del equipo, si aplica. */
  equipo?: string;
};

function UserChip({ chip }: { chip: SiteHeaderUserChip; tone: "light" | "dark" }) {
  const inicial = chip.nombre.trim().charAt(0).toUpperCase() || "?";

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="font-display flex h-8 w-8 items-center justify-center rounded-full bg-muneca-purple text-sm text-white">
          {inicial}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{chip.nombre}</span>
          <span className="block text-xs leading-tight text-current opacity-60">
            {chip.rol}
            {chip.equipo ? ` · ${chip.equipo}` : ""}
          </span>
        </span>
        <CaretDown size={12} weight="bold" className="opacity-50" aria-hidden="true" />
      </summary>

      <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-xl border border-black/10 bg-white py-1.5 text-muneca-black shadow-lg">
        <Link
          href="/portal"
          className="block px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5"
        >
          Mi equipo
        </Link>
        <form action={cerrarSesionEquipo}>
          <button
            type="submit"
            className="block w-full px-4 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </details>
  );
}

export function SiteHeader({
  userChip,
  forceSolid = false,
}: {
  userChip?: SiteHeaderUserChip;
  /**
   * Para páginas que no tienen un hero oscuro debajo del header (paneles
   * internos: admin, portal, líder de árbitros) — sin esto, el header
   * arranca transparente con texto blanco pensado para verse sobre un fondo
   * oscuro, y sobre un fondo claro el menú queda invisible hasta que el
   * usuario hace scroll. Fuerza el estilo "sólido" (fondo blanco, texto
   * oscuro) desde el primer render.
   */
  forceSolid?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menú móvil: el <nav> principal solo se ve desde el punto de quiebre `lg`
  // (ver más abajo, `hidden lg:flex`) — antes de este cambio no existía
  // ningún equivalente en celular/tablet, así que el menú era imposible de
  // abrir por debajo de esa resolución. Bloquea el scroll del fondo mientras
  // está abierto y se cierra con Escape o al elegir un link.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const solid = forceSolid || scrolled;
  const tone = solid ? "dark" : "light";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "border-b border-black/10 bg-muneca-white/95 backdrop-blur"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link href="/#inicio" className="flex shrink-0 items-center">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Copa Muñeca e'Burro Montería"
            width={1983}
            height={793}
            priority
            className="h-14 w-auto object-contain sm:h-20 lg:h-[100px]"
          />
        </Link>

        <nav
          className={`font-display hidden items-center gap-6 text-lg uppercase tracking-wider lg:flex ${
            tone === "light" ? "text-white/90" : "text-muneca-black/70"
          }`}
        >
          <a
            href="/#inicio"
            aria-current="page"
            className={`relative pb-1 uppercase after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-muneca-yellow ${
              tone === "light" ? "text-white" : "text-muneca-black"
            }`}
          >
            Inicio
          </a>
          <NavDropdown label="Torneo" items={TORNEO_LINKS} tone={tone} />
          <a href="/#equipos" className="pb-1 uppercase transition-colors hover:text-muneca-yellow">
            Equipos
          </a>
          <NavDropdown label="Partidos" items={PARTIDOS_LINKS} tone={tone} />
          <NavDropdown label="Contenido" items={CONTENIDO_LINKS} tone={tone} />
          <a
            href="/#patrocinadores"
            className="pb-1 uppercase transition-colors hover:text-muneca-yellow"
          >
            Patrocinadores
          </a>
        </nav>

        {userChip ? (
          <div className={tone === "light" ? "text-white" : "text-muneca-black"}>
            <UserChip chip={userChip} tone={tone} />
          </div>
        ) : (
          <>
            <div className="hidden items-center gap-3 md:flex">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
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
              href="/preinscripcion"
              className="shrink-0 rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black shadow-sm transition-transform hover:scale-[1.03]"
            >
              Preinscribe tu equipo →
            </a>
          </>
        )}

        <button
          type="button"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors lg:hidden ${
            tone === "light" ? "text-white" : "text-muneca-black"
          }`}
        >
          {mobileOpen ? (
            <X size={22} weight="bold" aria-hidden="true" />
          ) : (
            <List size={22} weight="bold" aria-hidden="true" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[80vh] overflow-y-auto border-b border-white/10 bg-muneca-black/98 backdrop-blur lg:hidden">
          <nav className="font-display flex flex-col gap-0.5 px-4 py-5 uppercase tracking-wide text-white/90">
            <a
              href="/#inicio"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-base transition-colors hover:bg-white/5 hover:text-muneca-yellow"
            >
              Inicio
            </a>

            <p className="mt-2 px-3 text-xs font-semibold tracking-widest text-white/40">Torneo</p>
            {TORNEO_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm normal-case tracking-normal text-white/75 transition-colors hover:bg-white/5 hover:text-muneca-yellow"
              >
                {item.label}
              </a>
            ))}

            <a
              href="/#equipos"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg px-3 py-3 text-base transition-colors hover:bg-white/5 hover:text-muneca-yellow"
            >
              Equipos
            </a>

            <p className="mt-2 px-3 text-xs font-semibold tracking-widest text-white/40">Partidos</p>
            {PARTIDOS_LINKS.map((item) => (
              <a
                key={item.href + item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm normal-case tracking-normal text-white/75 transition-colors hover:bg-white/5 hover:text-muneca-yellow"
              >
                {item.label}
              </a>
            ))}

            <p className="mt-2 px-3 text-xs font-semibold tracking-widest text-white/40">Contenido</p>
            {CONTENIDO_LINKS.map((item) => (
              <a
                key={item.href + item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm normal-case tracking-normal text-white/75 transition-colors hover:bg-white/5 hover:text-muneca-yellow"
              >
                {item.label}
              </a>
            ))}

            <a
              href="/#patrocinadores"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg px-3 py-3 text-base transition-colors hover:bg-white/5 hover:text-muneca-yellow"
            >
              Patrocinadores
            </a>
          </nav>

          <div className="border-t border-white/10 px-4 py-5">
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/85 transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
                >
                  <Icon size={17} weight="regular" aria-hidden="true" />
                </a>
              ))}
            </div>

            {!userChip && (
              <a
                href="/preinscripcion"
                onClick={() => setMobileOpen(false)}
                className="mt-4 block rounded-md bg-muneca-yellow px-4 py-3 text-center text-sm font-bold uppercase text-muneca-black shadow-sm"
              >
                Preinscribe tu equipo →
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
