import Image from "next/image";

const FOOTER_LINKS = [
  "Inicio",
  "Torneo",
  "Equipos",
  "Resultados",
  "Posiciones",
  "Estadísticas",
  "Galería",
  "Patrocinadores",
];

export function SiteFooter() {
  return (
    <footer className="bg-muneca-black text-muneca-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-6 border-b border-white/10 pb-8 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/isotipo.png"
              alt="Copa Muñeca e'Burro"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="font-display text-xl tracking-wide">
              COPA MUÑECA E&apos;BURRO
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/70">
            {FOOTER_LINKS.map((label) => (
              <a key={label} href="#inicio" className="hover:text-muneca-yellow">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col items-center gap-2 pt-6 text-center text-xs text-white/50 lg:flex-row lg:justify-between lg:text-left">
          <p>Montería, Córdoba · Fútbol con sabor costeño</p>
          <p>© {new Date().getFullYear()} Copa Muñeca e&apos;Burro. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
