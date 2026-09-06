import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#torneo", label: "Torneo" },
  { href: "#equipos", label: "Equipos" },
  { href: "#partidos", label: "Resultados" },
  { href: "#posiciones", label: "Posiciones" },
  { href: "#estadisticas", label: "Estadísticas" },
  { href: "#galeria", label: "Galería" },
  { href: "#patrocinadores", label: "Patrocinadores" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-muneca-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="#inicio" className="flex items-center gap-2 shrink-0">
          <Image
            src="/brand/logo-principal.png"
            alt="Copa Muñeca e'Burro"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muneca-black/70 transition-colors hover:text-muneca-purple"
            >
              {link.label}
            </a>
          ))}
        </nav>

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
