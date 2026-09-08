import Image from "next/image";
import {
  InstagramLogo,
  FacebookLogo,
  TiktokLogo,
  YoutubeLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";

// TODO: reemplazar por los handles/URLs reales de cada red social.
const SOCIAL_LINKS = [
  { href: "#", label: "Instagram", Icon: InstagramLogo },
  { href: "#", label: "Facebook", Icon: FacebookLogo },
  { href: "#", label: "TikTok", Icon: TiktokLogo },
  { href: "#", label: "YouTube", Icon: YoutubeLogo },
];

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
    <footer className="relative overflow-hidden bg-muneca-black text-muneca-white">
      {/* Fondo decorativo: resplandores de marca + acentos diagonales, sin imagen. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(123,31,162,0.25),transparent)]" />
        <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-muneca-yellow/10 blur-3xl" />
        <div className="absolute right-12 top-0 h-40 w-1 rotate-[16deg] bg-muneca-yellow/25" />
        <div className="absolute right-24 top-0 h-28 w-1 rotate-[16deg] bg-muneca-purple/40" />
        <div className="absolute left-1/3 bottom-0 h-32 w-1 rotate-[16deg] bg-muneca-purple/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-end">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/85 transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
              >
                <Icon size={16} weight="regular" aria-hidden="true" />
              </a>
            ))}
          </div>
          {/* TODO: reemplazar por el número/enlace real de WhatsApp. */}
          <a
            href="#"
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
          >
            <WhatsappLogo size={18} weight="fill" aria-hidden="true" />
            Contáctanos
          </a>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 border-b border-white/10 pb-8 text-center lg:flex-row lg:justify-between lg:text-left">
          <Image
            src="/brand/logo-footer.png"
            alt="Copa Muñeca e'Burro Montería"
            width={1170}
            height={1186}
            className="h-36 w-auto object-contain sm:h-40"
          />
          <nav className="font-display flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base uppercase tracking-wide text-white/70 sm:text-lg">
            {FOOTER_LINKS.map((label) => (
              <a key={label} href="/#inicio" className="hover:text-muneca-yellow">
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-1 pt-6 text-center text-xs text-white/50 lg:flex-row lg:justify-between lg:text-left">
          <p>
            Montería, Córdoba
            <br />
            Más que un torneo, una comunidad.
          </p>
          <p>© {new Date().getFullYear()} Copa Muñeca e&apos;Burro. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
