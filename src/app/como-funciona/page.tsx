import Link from "next/link";
import { Trophy, UsersThree, SoccerBall, Flag } from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";

const NUMEROS = [
  { valor: "24", label: "Equipos" },
  { valor: "4", label: "Grupos" },
  { valor: "60", label: "Partidos de grupos" },
  { valor: "16", label: "Clasifican" },
  { valor: "75", label: "Partidos en total" },
];

const PASOS = [
  {
    icon: UsersThree,
    titulo: "Fase de grupos",
    texto: "Todos contra todos dentro de tu grupo. 5 partidos garantizados — no vienes a jugar 3 y empacar.",
  },
  {
    icon: Trophy,
    titulo: "Clasificación",
    texto: "Los 4 primeros de cada grupo avanzan. El 5° y 6° puesto quedan eliminados.",
  },
  {
    icon: Flag,
    titulo: "Octavos de final",
    texto: "Empieza la eliminación directa — un error y quedas afuera.",
  },
  {
    icon: Flag,
    titulo: "Cuartos de final",
    texto: "Los 8 mejores equipos del torneo.",
  },
  {
    icon: Flag,
    titulo: "Semifinal",
    texto: "A un paso de la gran final.",
  },
  {
    icon: Trophy,
    titulo: "Gran final",
    texto: "Un solo partido. Un solo campeón.",
  },
];

const DESEMPATE = [
  "Puntos",
  "Diferencia de gol",
  "Goles a favor",
  "Resultado entre los equipos empatados (enfrentamiento directo)",
  "Sorteo",
];

const LLAVE_AB = [
  { local: "A1", visitante: "B4" },
  { local: "B1", visitante: "A4" },
  { local: "A2", visitante: "B3" },
  { local: "B2", visitante: "A3" },
];

const LLAVE_CD = [
  { local: "C1", visitante: "D4" },
  { local: "D1", visitante: "C4" },
  { local: "C2", visitante: "D3" },
  { local: "D2", visitante: "C3" },
];

function TablaLlave({ titulo, cruces }: { titulo: string; cruces: { local: string; visitante: string }[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="font-display text-sm uppercase tracking-wide text-muneca-yellow">{titulo}</p>
      <ul className="mt-3 space-y-2">
        {cruces.map((c) => (
          <li
            key={`${c.local}-${c.visitante}`}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-white"
          >
            <span>{c.local}</span>
            <span className="text-xs uppercase tracking-wide text-white/40">vs</span>
            <span>{c.visitante}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Cómo funciona" — contenido estático (no depende de Supabase), a partir de
 * `formato-torneo.md`: 24 equipos, 4 grupos de 6, clasifican 4 por grupo,
 * cruce fijo de octavos A/B y C/D, formato del partido, sistema de puntos,
 * desempates, sanciones y ventana de refuerzos. Ver
 * `claude/contenido-como-funciona.md` en el proyecto para el detalle de
 * las decisiones de alcance (2026-09-14).
 */
export default function ComoFuncionaPage() {
  const breadcrumbs: Crumb[] = [{ label: "Inicio", href: "/" }, { label: "Cómo funciona" }];

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
            <h1 className="font-display mt-1 text-4xl sm:text-5xl">Cómo funciona la Copa</h1>
            <p className="mt-2 max-w-xl text-white/70">
              24 equipos. 4 grupos. Un camino exigente hasta la Gran Final.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Números rápidos */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {NUMEROS.map((n) => (
              <div
                key={n.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center"
              >
                <p className="font-display text-3xl text-muneca-yellow sm:text-4xl">{n.valor}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                  {n.label}
                </p>
              </div>
            ))}
          </div>

          {/* Línea de tiempo */}
          <div className="mt-14">
            <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
              El camino del torneo
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PASOS.map((paso, i) => (
                <div
                  key={paso.titulo}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muneca-purple/20 text-muneca-yellow">
                      <paso.icon size={18} weight="regular" aria-hidden="true" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                      Paso {i + 1}
                    </p>
                  </div>
                  <p className="font-display mt-3 text-lg text-white">{paso.titulo}</p>
                  <p className="mt-1 text-sm text-white/65">{paso.texto}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fase de grupos */}
          <div className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
                Fase de grupos
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/75">
                <li>4 grupos de 6 equipos: A, B, C y D.</li>
                <li>Todos contra todos dentro del grupo — cada equipo juega 5 partidos.</li>
                <li>15 partidos por grupo × 4 grupos = 60 partidos de fase de grupos.</li>
                <li>Sistema de puntos: victoria = 3 puntos, empate = 1, derrota = 0.</li>
                <li>Clasifican los 4 primeros de cada grupo (16 equipos). El 5° y 6° quedan eliminados.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
                Criterios de desempate
              </p>
              <ol className="mt-4 space-y-2 text-sm text-white/75">
                {DESEMPATE.map((criterio, i) => (
                  <li key={criterio} className="flex gap-2.5">
                    <span className="font-display text-muneca-yellow">{i + 1}.</span>
                    <span>{criterio}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Sorteo */}
          <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
              Sorteo de grupos
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>Cabezas de grupo: los primeros 4 equipos en orden de inscripción, uno por grupo.</li>
              <li>Los 20 equipos restantes se sortean en vivo en un solo bombo.</li>
              <li>El sorteo se activa apenas se valida el cupo 24, con un aviso de confirmación antes de arrancar.</li>
            </ul>
          </div>

          {/* Cruce de octavos */}
          <div className="mt-14">
            <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
              El cruce de octavos de final
            </p>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              Los 4 grupos se emparejan en dos llaves fijas para que ningún equipo se enfrente a otro
              de su propio grupo en octavos.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TablaLlave titulo="Llave A / B" cruces={LLAVE_AB} />
              <TablaLlave titulo="Llave C / D" cruces={LLAVE_CD} />
            </div>
            <p className="mt-4 max-w-2xl text-sm text-white/65">
              Los equipos que salen de la llave A/B solo pueden volver a cruzarse entre sí hasta la
              semifinal — nunca antes. Lo mismo para la llave C/D. Eso significa que{" "}
              <span className="font-semibold text-white">
                la gran final queda garantizada entre un equipo del lado A/B y uno del lado C/D
              </span>
              . De cuartos en adelante, el bracket sigue su curso normal.
            </p>
          </div>

          {/* Formato del partido + puntos */}
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-2.5">
                <SoccerBall size={20} weight="regular" className="text-muneca-yellow" aria-hidden="true" />
                <p className="font-display text-lg text-white">Formato del partido</p>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                <li>Fútbol 7 — 7 jugadores por equipo en cancha.</li>
                <li>2 tiempos de 25 minutos cada uno.</li>
                <li>5 minutos de descanso entre tiempos.</li>
                <li>10 minutos de colchón entre partidos en la misma cancha.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="font-display text-lg text-white">🟨🟥 Sanciones por tarjetas</p>
              <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                <li>2 amarillas acumuladas en todo el torneo = 1 partido de sanción.</li>
                <li>Roja directa = 1 partido de sanción aparte.</li>
                <li>Ambas reglas conviven — un jugador puede acumular por cualquiera de las dos vías.</li>
              </ul>
            </div>
          </div>

          {/* Ventana de refuerzos */}
          <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="font-display text-lg text-white">🔁 Ventana de refuerzos</p>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Se abre en octavos de final. Cada equipo puede hacer hasta 2 cambios de jugador. El que
              entra no debe haber jugado con otro equipo en el torneo, o su equipo original debe estar
              ya eliminado.
            </p>
          </div>

          {/* Cierre */}
          <div className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <p className="font-display text-2xl text-white sm:text-3xl">
              Aquí no vienes a jugar tres partidos y empacar.
              <br />
              Vienes a competir.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/inscripcion"
                className="rounded-md bg-muneca-yellow px-6 py-3 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
              >
                Inscribe tu equipo →
              </Link>
              <Link
                href="/reglamento"
                className="rounded-md border border-muneca-yellow px-6 py-3 text-sm font-bold uppercase text-muneca-yellow transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
              >
                Ver reglamento completo
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
