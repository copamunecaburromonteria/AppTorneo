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
    <footer className="bg-muneca-black text-muneca-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
            src="/brand/mascota-footer.png"
            alt="Copa Muñeca e'Burro"
            width={932}
            height={1472}
            className="h-[150px] w-auto object-contain"
          />
          <nav className="font-display flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm uppercase tracking-wide text-white/70">
            {FOOTER_LINKS.map((label) => (
              <a key={label} href="#inicio" className="hover:text-muneca-yellow">
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
