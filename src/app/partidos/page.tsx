import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";
import { createClient } from "@/lib/supabase/server";
import { calcularJornada } from "@/lib/jornada";
import { DIA_LABEL, fechaYmdBogota } from "@/lib/franjas-horario";
import {
  CalendarioTabs,
  type JornadaData,
  type DiaData,
  type PartidoCalendario,
} from "@/components/calendario/calendario-tabs";

type TeamInfo = { nombre_equipo: string; escudo_url: string | null };
type TeamRel = TeamInfo | TeamInfo[] | null;

function unwrapTeam(rel: TeamRel): TeamInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/** Las 9 jornadas del torneo completo: 1-5 fase de grupos, 6-9 fase
 * final. El título de cada una se usa tanto en las pestañas como en el
 * panel — ver `claude/formato-torneo.md`. */
const TITULO_JORNADA: Record<number, string> = {
  1: "Jornada 1",
  2: "Jornada 2",
  3: "Jornada 3",
  4: "Jornada 4",
  5: "Jornada 5",
  6: "Octavos de Final",
  7: "Cuartos de Final",
  8: "Semifinal",
  9: "Gran Final",
};

const TEXTO_PENDIENTE: Record<number, string> = {
  6: "Se define al cerrar la fase de grupos, con los 4 primeros de cada grupo.",
  7: "Se define al cerrar los octavos de final.",
  8: "Se define al cerrar los cuartos de final.",
  9: "Un solo partido, un solo campeón — se define al cerrar la semifinal.",
};

/**
 * Calendario completo del torneo — todos los partidos agrupados por
 * jornada real (`matches.jornada`, ver `src/lib/torneo/generador-calendario.ts`)
 * y, dentro de cada jornada, por día (jueves/viernes/sábado). Muestra las
 * 9 jornadas del torneo (1-5 fase de grupos, 6-9 fase final) aunque los
 * partidos de la fase final todavía no existan — esas se generan aparte,
 * cada una con su propio botón, cuando se cierra la fase anterior. Página
 * enlazada desde "Ver calendario completo" en la sección "Próximos
 * partidos" del home.
 */
export default async function PartidosPage() {
  const supabase = await createClient();

  const { data: matchesRaw } = await supabase
    .from("matches")
    .select(
      "id, cancha, fecha_hora_programada, estado, jornada, equipo_local:equipo_local_id(nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(nombre_equipo, escudo_url)"
    )
    .order("fecha_hora_programada", { ascending: true });

  const matches = matchesRaw ?? [];
  const todasLasFechas = matches.map((m) => m.fecha_hora_programada as string);

  const porJornada = new Map<number, PartidoCalendario[]>();
  for (const m of matches) {
    const fecha = m.fecha_hora_programada as string;
    // Jornada real guardada en el partido; si faltara en algún dato viejo,
    // se cae de vuelta al cálculo por semana de calendario.
    const jornadaNumero = (m.jornada as number | null) ?? calcularJornada(fecha, todasLasFechas);
    const partido: PartidoCalendario = {
      id: m.id as string,
      cancha: m.cancha as number,
      fecha,
      estado: m.estado as string,
      local: unwrapTeam(m.equipo_local as TeamRel),
      visitante: unwrapTeam(m.equipo_visitante as TeamRel),
    };
    const lista = porJornada.get(jornadaNumero) ?? [];
    lista.push(partido);
    porJornada.set(jornadaNumero, lista);
  }

  const jornadasGeneradas: JornadaData[] = Array.from(porJornada.entries())
    .sort(([a], [b]) => a - b)
    .map(([numero, partidos]) => {
      const porDia = new Map<string, PartidoCalendario[]>();
      for (const p of partidos) {
        const key = fechaYmdBogota(p.fecha);
        const lista = porDia.get(key) ?? [];
        lista.push(p);
        porDia.set(key, lista);
      }

      const dias: DiaData[] = Array.from(porDia.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, partidosDelDia]) => {
          const fechaRef = new Date(`${key}T12:00:00-05:00`);
          const dow = fechaRef.getDay();
          const diaNombre = DIA_LABEL[dow] ?? fechaRef.toLocaleDateString("es-CO", { weekday: "long" });
          const fechaCorta = fechaRef.toLocaleDateString("es-CO", { day: "2-digit", month: "long" });
          return {
            key,
            label: `${diaNombre} ${fechaCorta}`,
            partidos: [...partidosDelDia].sort(
              (a, b) => a.fecha.localeCompare(b.fecha) || a.cancha - b.cancha
            ),
          };
        });

      const fechasMs = partidos.map((p) => new Date(p.fecha).getTime());
      const min = new Date(Math.min(...fechasMs));
      const max = new Date(Math.max(...fechasMs));
      const rangoLabel =
        min.toDateString() === max.toDateString()
          ? min.toLocaleDateString("es-CO", { day: "2-digit", month: "short", timeZone: "America/Bogota" })
          : `${min.toLocaleDateString("es-CO", { day: "2-digit", timeZone: "America/Bogota" })} - ${max.toLocaleDateString(
              "es-CO",
              { day: "2-digit", month: "short", timeZone: "America/Bogota" }
            )}`;

      return {
        numero,
        titulo: TITULO_JORNADA[numero] ?? `Jornada ${numero}`,
        rangoLabel,
        dias,
        totalPartidos: partidos.length,
        diasDeFutbol: dias.length,
      };
    });

  // Las 9 jornadas del torneo siempre aparecen, aunque la fase final
  // todavía no se haya generado — se completan con una tarjeta "por
  // definir" las que no tienen partidos todavía.
  const numerosGenerados = new Set(jornadasGeneradas.map((j) => j.numero));
  const placeholders: JornadaData[] = [];
  for (let numero = 1; numero <= 9; numero++) {
    if (numerosGenerados.has(numero)) continue;
    placeholders.push({
      numero,
      titulo: TITULO_JORNADA[numero] ?? `Jornada ${numero}`,
      rangoLabel: "",
      dias: [],
      totalPartidos: 0,
      diasDeFutbol: 0,
      pendiente: true,
      pendienteTexto: TEXTO_PENDIENTE[numero],
    });
  }
  const jornadas: JornadaData[] = [...jornadasGeneradas, ...placeholders].sort(
    (a, b) => a.numero - b.numero
  );

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-black text-white">
        <section className="relative isolate overflow-hidden pb-10 pt-36">
          <ParallaxSectionBackground src="/brand/hero-stadium.jpg" priority />
          <div aria-hidden className="absolute inset-0 bg-muneca-black/75" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/25 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-muneca-yellow/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Breadcrumbs tone="light" items={[{ label: "Inicio", href: "/" }, { label: "Calendario" }]} />

            <h1 className="font-display mt-3 text-4xl sm:text-5xl">Calendario</h1>
            <p className="mt-2 max-w-xl text-white/70">
              Consulta aquí toda la programación de la Copa Muñeca e&apos;Burro.
            </p>

            {jornadas.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
                <p className="font-display text-2xl">Todavía no hay partidos programados</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
                  El calendario se publicará aquí en cuanto se confirme el sorteo y arranque el torneo.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <CalendarioTabs jornadas={jornadas} />
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
