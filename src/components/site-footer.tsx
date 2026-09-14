import Image from "next/image";
import Link from "next/link";
import {
  InstagramLogo,
  FacebookLogo,
  TiktokLogo,
  YoutubeLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/copamunecaburromonteria", label: "Instagram", Icon: InstagramLogo },
  { href: "https://www.facebook.com/copamunecaburromonteria", label: "Facebook", Icon: FacebookLogo },
  { href: "https://www.tiktok.com/@copamunecaburromonteria", label: "TikTok", Icon: TiktokLogo },
  { href: "https://www.youtube.com/@copamunecaburromonteria", label: "YouTube", Icon: YoutubeLogo },
];

// TODO: reemplazar por el número/enlace real de WhatsApp.
const WHATSAPP_HREF = "#";

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

// Mismo criterio que el menú del header (src/components/site-header.tsx):
// los links a páginas/secciones que ya existen apuntan directo; los que
// todavía no tienen página propia quedan en "#" hasta que se construyan.
const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Torneo",
    links: [
      { label: "Inicio", href: "/#inicio" },
      { label: "Sobre la Copa", href: "/#torneo" },
      { label: "Cómo funciona", href: "#" },
      { label: "Reglamento", href: "#" },
      { label: "Premios", href: "#" },
    ],
  },
  {
    title: "Equipos y partidos",
    links: [
      { label: "Equipos participantes", href: "/equipos" },
      { label: "Calendario y resultados", href: "/partidos" },
      { label: "Tabla de posiciones", href: "/posiciones" },
      { label: "Estadísticas", href: "/estadisticas" },
    ],
  },
  {
    title: "Contenido",
    links: [
      { label: "Vota el MVP", href: "/votar" },
      { label: "Galería", href: "/#galeria" },
      { label: "Patrocinadores", href: "/#patrocinadores" },
      { label: "Noticias", href: "#" },
    ],
  },
  {
    title: "Más",
    links: [
      { label: "Inscribe tu equipo", href: "/inscripcion" },
      { label: "Preguntas frecuentes", href: "#" },
      { label: "Contacto", href: "#" },
    ],
  },
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
        {/* Logo + redes/WhatsApp */}
        <div className="flex flex-col items-center gap-5 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <Link href="/#inicio" className="shrink-0">
            <Image
              src="/brand/logo-footer.png"
              alt="Copa Muñeca e'Burro Montería"
              width={1170}
              height={1186}
              className="h-24 w-auto object-contain sm:h-28"
            />
          </Link>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/85 transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
                >
                  <Icon size={16} weight="regular" aria-hidden="true" />
                </a>
              ))}
            </div>
            <a
              href={WHATSAPP_HREF}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
            >
              <WhatsappLogo size={18} weight="fill" aria-hidden="true" />
              Contáctanos
            </a>
          </div>
        </div>

        {/* Menú del sitio, por columnas */}
        <nav
          aria-label="Mapa del sitio"
          className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-white/10 py-8 sm:grid-cols-4 sm:gap-x-8"
        >
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="font-display text-sm uppercase tracking-wider text-muneca-yellow">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/65 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

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
