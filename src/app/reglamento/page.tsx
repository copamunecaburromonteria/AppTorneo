import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";

type Seccion = {
  numero: number;
  titulo: string;
  items: string[];
};

// Contenido fuente: `claude/reglamento.md` en el proyecto. Los 18 puntos
// ya decididos con Fernando (formato deportivo + comportamiento operativo,
// entrevista 2026-09-14) — ver el historial de decisiones al final de ese
// documento. `**texto**` se resalta en negrita al render.
const SECCIONES: Seccion[] = [
  {
    numero: 1,
    titulo: "El torneo",
    items: [
      "Copa Muñeca e'Burro — categoría libre, fútbol 7.",
      "Sede: Montería, Córdoba — dos canchas en el mismo complejo deportivo.",
      "24 equipos, máximo 15 jugadores por equipo.",
      "Todos los jugadores deben ser **mayores de 18 años**, con **cédula de ciudadanía** — no se aceptan menores de edad en ninguna categoría de esta edición.",
      "Fecha tentativa de inicio: **30 de octubre**. Partidos jueves y viernes 7:00-10:00 p. m., sábado 5:00-9:00 p. m.",
      "Un jugador solo puede estar inscrito en la plantilla de **un equipo** durante el torneo.",
    ],
  },
  {
    numero: 2,
    titulo: "Formato deportivo",
    items: [
      "4 grupos de 6 equipos (A, B, C, D), todos contra todos dentro del grupo — 5 partidos garantizados por equipo.",
      "Clasifican los 4 primeros de cada grupo (16 equipos); 5° y 6° quedan eliminados.",
      "Cruce fijo de octavos: llave A↔B y llave C↔D — ningún equipo se cruza con otro de su propio grupo en octavos.",
      "De cuartos en adelante, bracket estándar sin restricciones.",
      "Total: 75 partidos (60 de grupos + 15 de eliminación directa). El campeón juega máximo 9 partidos.",
    ],
  },
  {
    numero: 3,
    titulo: "Sistema de puntos y desempates",
    items: [
      "Victoria = 3 puntos, empate = 1, derrota = 0.",
      "Desempate, en este orden: puntos → diferencia de gol → goles a favor → enfrentamiento directo → sorteo.",
    ],
  },
  {
    numero: 4,
    titulo: "Duración del partido",
    items: [
      "2 tiempos de 25 minutos + 5 minutos de descanso + 10 minutos de colchón entre partidos en la misma cancha.",
      "Cambios de jugador **ilimitados** durante el partido — cualquier jugador de la plantilla puede entrar y salir las veces que se necesite (distinto de la ventana de refuerzos del punto 7, que es entre partidos, no durante uno).",
    ],
  },
  {
    numero: 5,
    titulo: "Suspensión de partido por fuerza mayor",
    items: [
      "Si un partido se suspende a mitad de juego (lluvia u otra causa de fuerza mayor), se reprograma y se **reanuda desde donde quedó** — el resultado y los eventos ya registrados (goles, tarjetas) se mantienen; solo se juega el tiempo restante en la fecha reprogramada.",
    ],
  },
  {
    numero: 6,
    titulo: "Inasistencia a un partido (walkover / W.O.)",
    items: ["Si un equipo no se presenta a su partido programado, pierde automáticamente **3-0**."],
  },
  {
    numero: 7,
    titulo: "Ventana de refuerzos",
    items: [
      "Se abre en octavos de final (arranque de la fase eliminatoria, 16 equipos).",
      "Hasta 2 cambios de jugador por equipo.",
      "El jugador que entra no debe haber jugado con otro equipo en el torneo, o su equipo original debe estar ya eliminado.",
    ],
  },
  {
    numero: 8,
    titulo: "Uniformes",
    items: [
      "Cada equipo juega con su propio uniforme (comprado aparte o el oficial de la Copa, ver punto 13).",
      "Si dos equipos coinciden en colores el día del partido, la organización presta petos/camisillas disponibles en la cancha — no se exige que ningún equipo traiga un uniforme alterno propio.",
    ],
  },
  {
    numero: 9,
    titulo: "Identificación del jugador",
    items: [
      "Cada jugador debe portar su **cédula física original, o una copia empastada (laminada)**, el día del partido — el operador o el equipo rival puede pedirla para verificar identidad contra la plantilla registrada.",
    ],
  },
  {
    numero: 10,
    titulo: "Cuerpo técnico",
    items: [
      "Máximo **2 personas** de cuerpo técnico por equipo (director técnico + preparador físico), aparte de los 15 jugadores.",
    ],
  },
  {
    numero: 11,
    titulo: "Sanciones deportivas por tarjetas",
    items: [
      "2 tarjetas amarillas acumuladas **en todo el torneo** (no solo en un partido) = 1 partido de sanción.",
      "Tarjeta azul = expulsión del jugador **solo por lo que resta del partido en curso** — no genera sanción para partidos futuros ni se acumula con otras tarjetas azules.",
      "Tarjeta roja directa = 1 partido de sanción aparte (no depende de la acumulación de amarillas).",
      "Las 3 reglas conviven: un jugador puede acumular sanción por cualquiera de las vías que aplican (amarilla acumulada o roja) — la azul solo saca al jugador del partido actual.",
    ],
  },
  {
    numero: 12,
    titulo: "Cargo económico por tarjeta (al equipo)",
    items: [
      "Tarjeta amarilla: **$5.000 COP**, cargado al equipo (no al jugador), desglosado por jugador y tarjeta.",
      "Tarjeta azul: **$7.000 COP**, mismo mecanismo.",
      "Tarjeta roja: **$10.000 COP**, mismo mecanismo.",
      "Es un cargo aparte de la cuota de inscripción — se genera automáticamente en el portal del equipo y se notifica al delegado.",
    ],
  },
  {
    numero: 13,
    titulo: "Inscripción y pagos",
    items: [
      "Valor de inscripción: **$800.000 COP** por equipo.",
      "Uniforme oficial de la Copa (opcional): **$50.000 COP** por jugador.",
      "Plan de cuotas: 2 partidas si el equipo no compra uniforme, 3 partidas si sí lo compra.",
      "La inscripción debe quedar **100% paga (paz y salvo) antes del inicio del torneo** (30 de octubre tentativo).",
      "Un equipo queda validado (con cupo asegurado) al pagar la primera cuota. Si los 24 cupos ya están llenos, el siguiente equipo que se inscriba entra a lista de espera.",
      "Plazo para completar la plantilla de jugadores: fecha de pago de la 1ª cuota + 5 días de gracia (con tope de 3 días antes del inicio del torneo).",
    ],
  },
  {
    numero: 14,
    titulo: "Cuerpo arbitral",
    items: [
      "Los partidos son dirigidos por árbitros de campo (1 a 3 por partido, según decida el Líder de Árbitros), asignados con anticipación.",
      "El operador de cancha puede ajustar el árbitro asignado el día del partido si hay un imprevisto (respaldo, no el mecanismo principal).",
    ],
  },
  {
    numero: 15,
    titulo: "Votación MVP y calificación del arbitraje",
    items: [
      "Un solo código QR para todo el torneo, disponible en ambas canchas.",
      "La votación de MVP (y la calificación de 1-5 estrellas al equipo arbitral del partido) se abre automáticamente en los últimos minutos del partido y se mantiene abierta un tiempo después de terminado — nunca antes de que el partido tenga árbitro confirmado.",
      "Un voto por dispositivo por partido.",
    ],
  },
  {
    numero: 16,
    titulo: "Reclamos y comité disciplinario",
    items: [
      "Un equipo tiene **24 horas después del partido** para presentar un reclamo formal (resultado, decisión arbitral, etc.) — a través del delegado, único punto de contacto oficial del equipo.",
      "El comité disciplinario lo conforman: el organizador principal, el Líder de Árbitros y un miembro del equipo de logística. Es quien resuelve reclamos, sanciones y cualquier caso no previsto explícitamente en este reglamento.",
    ],
  },
  {
    numero: 17,
    titulo: "Responsabilidad por lesiones",
    items: [
      "Cada jugador participa **bajo su propio riesgo** — la organización no se hace responsable por lesiones ocurridas durante el torneo. Esta condición se acepta al inscribirse.",
    ],
  },
  {
    numero: 18,
    titulo: "Uso de imagen",
    items: [
      "Al inscribirse, el delegado acepta el uso de fotos/videos del equipo y sus jugadores en la galería del torneo, redes sociales y demás contenido oficial de la Copa — es un consentimiento a nivel de equipo, no individual por jugador.",
    ],
  },
];

/** Resalta fragmentos `**texto**` como negrita, sin traer un parser de Markdown. */
function ConNegritas({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((parte, i) =>
        parte.startsWith("**") && parte.endsWith("**") ? (
          <strong key={i} className="font-semibold text-white">
            {parte.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{parte}</span>
        )
      )}
    </>
  );
}

/**
 * Reglamento oficial — contenido estático (no depende de Supabase), a
 * partir de `claude/reglamento.md`: 18 puntos que combinan el formato
 * deportivo ya definido (`formato-torneo.md`) con el comportamiento
 * operativo del torneo, resuelto con Fernando por entrevista (2026-09-14).
 */
export default function ReglamentoPage() {
  const breadcrumbs: Crumb[] = [{ label: "Inicio", href: "/" }, { label: "Reglamento" }];

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
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muneca-yellow">
              Más que un torneo, es el parche
            </p>
            <h1 className="font-display mt-1 text-4xl sm:text-5xl">Reglamento oficial</h1>
            <p className="mt-2 max-w-xl text-white/70">
              Todo lo que hay que saber para competir en la Copa — formato, sanciones, pagos y
              comportamiento en cancha.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Índice rápido */}
          <nav aria-label="Índice del reglamento" className="flex flex-wrap gap-2">
            {SECCIONES.map((s) => (
              <a
                key={s.numero}
                href={`#punto-${s.numero}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-muneca-yellow/40 hover:text-muneca-yellow"
              >
                {s.numero}. {s.titulo}
              </a>
            ))}
          </nav>

          {/* Secciones */}
          <div className="mt-8 space-y-5">
            {SECCIONES.map((s) => (
              <section
                key={s.numero}
                id={`punto-${s.numero}`}
                className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-2xl text-muneca-yellow">{s.numero}.</span>
                  <p className="font-display text-lg text-white sm:text-xl">{s.titulo}</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-white/70 sm:text-base">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                      <span>
                        <ConNegritas texto={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Nota */}
          <p className="mt-8 text-center text-xs text-white/40">
            Este reglamento puede ajustarse antes del inicio del torneo. Cualquier cambio se
            comunicará a los equipos ya inscritos a través de su delegado.
          </p>

          {/* Cierre */}
          <div className="mt-10 flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <p className="font-display text-2xl text-white sm:text-3xl">
              Aquí no vienes a jugar tres partidos y empacar.
              <br />
              Vienes a competir.
            </p>
            <Link
              href="/preinscripcion"
              className="rounded-md bg-muneca-yellow px-6 py-3 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
            >
              Preinscribe tu equipo →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
