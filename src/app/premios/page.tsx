import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";

const PREMIOS_PRINCIPALES = [
  {
    icon: "🥇",
    categoria: "Campeón",
    monto: "$5.000.000 COP",
    extra: "+ trofeo y medallas",
    destacado: true,
  },
  {
    icon: "🥈",
    categoria: "Subcampeón",
    monto: "$3.000.000 COP",
    extra: "+ trofeo y medallas",
    destacado: false,
  },
  {
    icon: "🧤",
    categoria: "Mejor arquero",
    monto: "$1.000.000 COP",
    extra: "+ trofeo",
    destacado: false,
  },
  {
    icon: "⚽",
    categoria: "Goleador",
    monto: "$1.000.000 COP",
    extra: "+ trofeo",
    destacado: false,
  },
];

const PREMIOS_SORPRESA = [
  { categoria: "Equipo más “malo”", texto: "El que más nos hizo reír en la cancha." },
  { categoria: "Jugador más “malo”", texto: "Una categoría 100% jocosa, no una sanción." },
  { categoria: "Barra más bulliciosa", texto: "La hinchada que más se hizo sentir." },
];

/**
 * "Premios" — contenido estático (no depende de Supabase). Premiación
 * confirmada por Fernando (2026-09-14), reemplaza por completo la del brief
 * original — ver `claude/contenido-premios.md` en el proyecto. Montos y
 * categorías marcados como provisionales ("pueden modificarse más
 * adelante"): quedan como constantes en este archivo por ahora, no en
 * `torneo_config` — si se ajustan seguido, vale la pena moverlos a un
 * editor en el panel admin más adelante.
 */
export default function PremiosPage() {
  const breadcrumbs: Crumb[] = [{ label: "Inicio", href: "/" }, { label: "Premios" }];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-black">
        <section className="relative isolate overflow-hidden pb-10 pt-36 text-white">
          <ParallaxSectionBackground src="/brand/hero-stadium.jpg" priority />
          <div aria-hidden className="absolute inset-0 bg-muneca-black/75" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muneca-yellow">
              Más que un torneo, es el parche
            </p>
            <h1 className="font-display mt-1 text-4xl sm:text-5xl">Premiación</h1>
            <p className="mt-2 max-w-xl text-white/70">
              Una premiación que genera ruido — no solo vienes a competir, vienes a ganar.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Bolsa total */}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-muneca-yellow/30 bg-muneca-yellow/10 px-6 py-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muneca-yellow">
              Bolsa total en premios
            </p>
            <p className="font-display text-4xl text-white sm:text-5xl">$10.000.000 COP</p>
            <p className="mt-1 text-xs text-white/50">
              No incluye los premios sorpresa — ver más abajo.
            </p>
          </div>

          {/* Premios principales */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PREMIOS_PRINCIPALES.map((p) => (
              <div
                key={p.categoria}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-6 text-center ${
                  p.destacado
                    ? "border-muneca-yellow/40 bg-muneca-yellow/10 sm:col-span-2 lg:col-span-1 lg:row-span-1"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className="text-4xl" aria-hidden="true">
                  {p.icon}
                </span>
                <p className="font-display text-lg uppercase tracking-wide text-white">
                  {p.categoria}
                </p>
                <p
                  className={`font-display text-2xl ${
                    p.destacado ? "text-muneca-yellow" : "text-white"
                  }`}
                >
                  {p.monto}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {p.extra}
                </p>
              </div>
            ))}
          </div>

          {/* Premios sorpresa */}
          <div className="mt-14">
            <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
              Premios sorpresa 🎁
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {PREMIOS_SORPRESA.map((p) => (
                <div
                  key={p.categoria}
                  className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center"
                >
                  <span className="text-3xl" aria-hidden="true">
                    🎁
                  </span>
                  <p className="font-display mt-2 text-base text-white">{p.categoria}</p>
                  <p className="mt-1 text-xs text-white/50">{p.texto}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                    ¡el premio es sorpresa!
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cierre */}
          <div className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <p className="font-display text-2xl text-white sm:text-3xl">Aquí se juega grande.</p>
            <Link
              href="/inscripcion"
              className="rounded-md bg-muneca-yellow px-6 py-3 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
            >
              Inscribe tu equipo →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
