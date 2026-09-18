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

const WHATSAPP_NUMBER_DISPLAY = "+57 312 607 0588";
const WHATSAPP_HREF = "https://wa.me/573126070588";

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
      { label: "Cómo funciona", href: "/como-funciona" },
      { label: "Reglamento", href: "/reglamento" },
      { label: "Premios", href: "/premios" },
    ],
  },
  {
    title: "Equipos",
    links: [
      { label: "Equipos participantes", href: "/equipos" },
      { label: "Jugadores", href: "#" },
      { label: "Cuerpos técnicos", href: "#" },
      { label: "Galería de equipos", href: "#" },
    ],
  },
  {
    title: "Partidos",
    links: [
      { label: "Calendario y resultados", href: "/partidos" },
      { label: "Tabla de posiciones", href: "/posiciones" },
      { label: "Estadísticas", href: "/estadisticas" },
      { label: "Vota el MVP", href: "/votar" },
    ],
  },
  {
    title: "Más",
    links: [
      { label: "Preinscribe tu equipo", href: "/preinscripcion" },
      { label: "Galería", href: "/#galeria" },
      { label: "Patrocinadores", href: "/#patrocinadores" },
      { label: "Noticias", href: "#" },
      { label: "Preguntas frecuentes", href: "#" },
    ],
  },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Términos y condiciones", href: "#" },
  { label: "Política de privacidad", href: "#" },
  { label: "Contacto", href: "#" },
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

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* 6 columnas: logo, 3 menús, más, redes + WhatsApp */}
        <nav
          aria-label="Mapa del sitio"
          className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-8"
        >
          <div>
            <Link href="/#inicio" className="inline-block">
              <Image
                src="/brand/logo-footer.png"
                alt="Copa Muñeca e'Burro Montería"
                width={1170}
                height={1186}
                className="h-28 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 text-xs text-white/50">Montería, Córdoba</p>
          </div>

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

          <div>
            <p className="font-display text-sm uppercase tracking-wider text-muneca-yellow">
              Redes sociales
            </p>
            <div className="mt-3 flex items-center gap-2.5">
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
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
            >
              <WhatsappLogo size={16} weight="fill" aria-hidden="true" />
              {WHATSAPP_NUMBER_DISPLAY}
            </a>
          </div>
        </nav>

        {/* "Aquí también se juega bonito" */}
        <div className="mt-10 flex justify-center border-t border-white/10 pt-10">
          <Image
            src="/brand/aqui-tambien-se-juega-bonito.png"
            alt="Aquí también se juega bonito"
            width={900}
            height={365}
            className="h-16 w-auto object-contain sm:h-20"
          />
        </div>

        {/* Copyright + legales */}
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/10 pt-6 text-center text-xs text-white/50 sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Copa Muñeca e&apos;Burro. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-end">
            {LEGAL_LINKS.map((link, i) => (
              <span key={link.label} className="flex items-center gap-2">
                {i > 0 && <span className="text-white/25">·</span>}
                <a href={link.href} className="hover:text-white/80">
                  {link.label}
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
