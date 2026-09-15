import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { TeamCrest } from "@/components/team-crest";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";
import { AgregarCalendarioBoton } from "@/components/partido/agregar-calendario-boton";
import { calcularJornada } from "@/lib/jornada";

const NOMBRE_TORNEO = "Copa Muñeca e'Burro";

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  entretiempo: "Entretiempo",
  finalizado: "Finalizado",
  suspendido: "Suspendido",
};

const TIPO_ICONO: Record<string, string> = {
  gol: "⚽",
  autogol: "⚽ (autogol)",
  tarjeta_amarilla: "🟨",
  tarjeta_roja: "🟥",
  cambio: "🔁",
};

type EquipoInfo = { id: string; nombre_equipo: string; escudo_url: string | null };
type EquipoRel = EquipoInfo | EquipoInfo[] | null;

function unwrapEquipo(rel: EquipoRel): EquipoInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

type EventoRow = {
  id: string;
  tipo: string;
  minuto: number;
  equipo_id: string | null;
  jugador_id: string | null;
};

/**
 * Página pública de un partido. El nivel de detalle depende del estado:
 * - "programado": solo hora, cancha, nombres y escudos (nada más — sin
 *   alineaciones ni árbitros asignados, por decisión del cliente).
 * - "en_curso" / "entretiempo" / "finalizado" / "suspendido": marcador,
 *   goles, tarjetas y, si el partido ya finalizó y hay votos, el MVP
 *   elegido por los aficionados.
 */
export default async function PartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;
  const supabase = await createClient();

  const { data: partido } = await supabase
    .from("matches")
    .select(
      "id, fase, cancha, fecha_hora_programada, estado, marcador_local, marcador_visitante, equipo_local_id, equipo_visitante_id, arbitros_confirmados_at, jornada, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url)"
    )
    .eq("id", matchId)
    .maybeSingle();

  if (!partido) notFound();

  const local = unwrapEquipo(partido.equipo_local as EquipoRel);
  const visitante = unwrapEquipo(partido.equipo_visitante as EquipoRel);

  const esProgramado = partido.estado === "programado";
  const esFinalizado = partido.estado === "finalizado";

  const [{ data: eventosRaw }, mvpResult, { data: todasLasFechasRaw }, { data: config }] =
    await Promise.all([
      esProgramado
        ? Promise.resolve({ data: [] as EventoRow[] })
        : supabase
            .from("match_events")
            .select("id, tipo, minuto, equipo_id, jugador_id")
            .eq("match_id", matchId)
            .eq("anulado", false)
            .order("minuto", { ascending: true }),
      esFinalizado
        ? supabase
            .from("v_mvp_resultado_partido")
            .select("player_id, votos, total_votos, porcentaje")
            .eq("match_id", matchId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // Fechas de todos los partidos del torneo, para poder ubicar este
      // partido dentro de su "jornada" (semana de calendario) — ver
      // `calcularJornada`.
      supabase.from("matches").select("fecha_hora_programada"),
      supabase
        .from("torneo_config")
        .select("duracion_tiempo_minutos, duracion_descanso_minutos")
        .eq("id", 1)
        .maybeSingle(),
    ]);

  const eventos = eventosRaw ?? [];
  const jugadorIds = Array.from(
    new Set(
      [
        ...eventos.map((e) => e.jugador_id),
        mvpResult.data?.player_id ?? null,
      ].filter((x): x is string => Boolean(x))
    )
  );

  const { data: jugadoresRaw } =
    jugadorIds.length > 0
      ? await supabase
          .from("v_players_public")
          .select("id, nombre")
          .in("id", jugadorIds)
      : { data: [] as { id: string; nombre: string }[] };

  const nombrePorJugador = new Map((jugadoresRaw ?? []).map((j) => [j.id, j.nombre]));

  const eventosConNombre = eventos.map((e) => ({
    ...e,
    jugadorNombre: e.jugador_id ? nombrePorJugador.get(e.jugador_id) ?? "—" : "—",
    equipoNombre:
      e.equipo_id === partido.equipo_local_id
        ? local?.nombre_equipo ?? "Local"
        : visitante?.nombre_equipo ?? "Visitante",
  }));

  const goles = eventosConNombre.filter((e) => e.tipo === "gol" || e.tipo === "autogol");
  const tarjetas = eventosConNombre.filter(
    (e) => e.tipo === "tarjeta_amarilla" || e.tipo === "tarjeta_roja"
  );

  const mvp = mvpResult.data
    ? {
        ...mvpResult.data,
        nombre: nombrePorJugador.get(mvpResult.data.player_id) ?? "—",
      }
    : null;

  const fecha = new Date(partido.fecha_hora_programada);
  const fechaLabel = fecha.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const horaLabel = fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

  const nombreLocal = local?.nombre_equipo ?? "Por definir";
  const nombreVisitante = visitante?.nombre_equipo ?? "Por definir";

  const todasLasFechas = (todasLasFechasRaw ?? []).map((m) => m.fecha_hora_programada as string);
  // Jornada real (`matches.jornada`, generada junto con el partido); si
  // faltara en algún dato viejo, se cae de vuelta al cálculo por semana.
  const jornada = (partido.jornada as number | null) ?? calcularJornada(partido.fecha_hora_programada, todasLasFechas);

  const duracionMinutos =
    (config?.duracion_tiempo_minutos ?? 25) * 2 + (config?.duracion_descanso_minutos ?? 5);

  const equipoArbitralLabel = partido.arbitros_confirmados_at ? "Asignado" : "Por confirmar";

  const breadcrumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Partidos", href: "/#partidos" },
    { label: `${nombreLocal} vs ${nombreVisitante}` },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-white">
        <section className="relative isolate overflow-hidden bg-muneca-black pb-10 pt-36 text-muneca-white">
          <ParallaxSectionBackground src="/brand/hero-stadium.jpg" priority />

          {/* Toque opaco: oscurece la foto para que el marcador y los nombres se lean bien */}
          <div aria-hidden className="absolute inset-0 bg-muneca-black/70" />

          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />

            <h1 className="font-display mt-3 text-2xl uppercase leading-tight sm:text-4xl">
              {nombreLocal} <span className="text-muneca-yellow">vs</span> {nombreVisitante}
            </h1>

            {!esProgramado && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muneca-yellow">
                {partido.fase} · {ESTADO_LABEL[partido.estado] ?? partido.estado}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 capitalize backdrop-blur">
                📅 {fechaLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                🕐 {horaLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                🏟️ Cancha {partido.cancha}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muneca-purple px-3 py-1.5">
                Jornada {jornada}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 sm:gap-6">
              <div className="flex flex-1 flex-col items-center gap-2 text-center">
                <TeamCrest url={local?.escudo_url} size="lg" />
                <p className="font-display text-lg sm:text-2xl">{nombreLocal}</p>
              </div>

              {esProgramado ? (
                <p className="font-display text-2xl text-muneca-yellow sm:text-3xl">VS</p>
              ) : (
                <p className="font-display text-4xl text-muneca-yellow sm:text-5xl">
                  {partido.marcador_local ?? 0}-{partido.marcador_visitante ?? 0}
                </p>
              )}

              <div className="flex flex-1 flex-col items-center gap-2 text-center">
                <TeamCrest url={visitante?.escudo_url} size="lg" />
                <p className="font-display text-lg sm:text-2xl">{nombreVisitante}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-8 border-t border-white/10">
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-4 py-4 text-center sm:grid-cols-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  Equipo arbitral
                </p>
                <p className="mt-0.5 text-sm font-semibold">{equipoArbitralLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  Cancha
                </p>
                <p className="mt-0.5 text-sm font-semibold">Cancha {partido.cancha}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  Jornada
                </p>
                <p className="mt-0.5 text-sm font-semibold">Jornada {jornada}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  Torneo
                </p>
                <p className="mt-0.5 text-sm font-semibold">{NOMBRE_TORNEO}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          {esProgramado ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-muneca-black/60">
                Este partido todavía no se ha jugado. Vuelve por aquí el día del encuentro para ver
                el resultado, los goles y el MVP elegido por los aficionados.
              </p>
              <AgregarCalendarioBoton
                titulo={`${nombreLocal} vs ${nombreVisitante} — ${NOMBRE_TORNEO}`}
                inicioIso={partido.fecha_hora_programada}
                duracionMinutos={duracionMinutos}
                ubicacion={`Cancha ${partido.cancha} · ${NOMBRE_TORNEO}`}
              />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                    ⚽ Goles
                  </p>
                  <div className="mt-3 space-y-2">
                    {goles.length === 0 && (
                      <p className="text-xs text-muneca-black/40">Sin goles registrados.</p>
                    )}
                    {goles.map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-sm">
                        <span>
                          {TIPO_ICONO[g.tipo] ?? g.tipo} {g.jugadorNombre}{" "}
                          <span className="text-muneca-black/40">· {g.equipoNombre}</span>
                        </span>
                        <span className="text-muneca-black/50">{g.minuto}&apos;</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                    🟨 Tarjetas
                  </p>
                  <div className="mt-3 space-y-2">
                    {tarjetas.length === 0 && (
                      <p className="text-xs text-muneca-black/40">Sin tarjetas registradas.</p>
                    )}
                    {tarjetas.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span>
                          {TIPO_ICONO[t.tipo] ?? t.tipo} {t.jugadorNombre}{" "}
                          <span className="text-muneca-black/40">· {t.equipoNombre}</span>
                        </span>
                        <span className="text-muneca-black/50">{t.minuto}&apos;</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {mvp && (
                <div className="relative overflow-hidden rounded-2xl bg-muneca-black p-6 text-center text-white shadow-sm">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(123,31,162,0.4),transparent)]"
                  />
                  <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-muneca-yellow">
                    ⭐ MVP del partido · presentado por [Patrocinador]
                  </p>
                  <p className="font-display relative mt-2 text-2xl sm:text-3xl">{mvp.nombre}</p>
                  <p className="relative mt-1 text-sm text-white/70">
                    {mvp.porcentaje}% de los votos · {mvp.total_votos} aficionados participaron
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-muneca-black/40">
                    📸 Fotos
                  </p>
                  <p className="mt-2 text-sm text-muneca-black/40">Próximamente</p>
                </div>
                <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-muneca-black/40">
                    🎥 Videos
                  </p>
                  <p className="mt-2 text-sm text-muneca-black/40">Próximamente</p>
                </div>
              </div>
            </>
          )}

          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-black/50 transition-colors hover:text-muneca-purple"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
