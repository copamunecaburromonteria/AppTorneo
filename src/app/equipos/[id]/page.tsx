import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { TeamCrest } from "@/components/team-crest";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";

const ROL_LABEL: Record<string, string> = {
  dt: "Director técnico",
  preparador_fisico: "Preparador físico",
};

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  validado: {
    label: "ACTIVO",
    className: "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
  },
  lista_espera: {
    label: "LISTA DE ESPERA",
    className: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  },
  pendiente: {
    label: "PENDIENTE",
    className: "bg-white/10 text-white/60 ring-1 ring-inset ring-white/20",
  },
};

/** Fechas/horas siempre formateadas en hora de Bogotá (ver src/lib/franjas-horario.ts). */
function formatFechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}
function formatFechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}
function formatHora(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

type EquipoInfo = { id: string; nombre_equipo: string; escudo_url: string | null };
type EquipoRel = EquipoInfo | EquipoInfo[] | null;

function unwrapEquipo(rel: EquipoRel): EquipoInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

type GroupRel = { letra: string } | { letra: string }[] | null;

function unwrapGroup(rel: GroupRel): { letra: string } | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/**
 * Página pública de un equipo, versión oscura (2026-09-14) — a petición de
 * Fernando, a partir de una referencia visual que compartió (mismo estilo
 * que /partidos y /partidos/[id], las páginas "de evento" del sitio). Solo
 * se muestran datos que ya existen en la base: no se inventaron barrio,
 * fundación, tagline, redes propias del equipo, capitán ni asistencias
 * donde el equipo/jugador no los tiene cargados — esos campos simplemente
 * no aparecen en vez de mostrar un placeholder inventado.
 */
export default async function EquipoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teamId } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select(
      "id, nombre_equipo, escudo_url, ciudad_barrio, anio_fundacion, descripcion, estado_inscripcion"
    )
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

  const [
    { data: playersRaw },
    { data: staffRaw },
    { data: teamGroupRaw },
    { data: matchesRaw },
    { data: fairPlayRaw },
    { data: deudaTarjetasRaw },
  ] = await Promise.all([
    supabase
      .from("v_players_public")
      .select("id, nombre, numero_camiseta, posicion, foto_url, es_jugador")
      .eq("team_id", teamId)
      .order("numero_camiseta", { ascending: true, nullsFirst: false }),
    supabase.from("v_team_staff_public").select("nombre, rol").eq("team_id", teamId),
    supabase
      .from("team_group")
      .select("group_id, groups:group_id(letra)")
      .eq("team_id", teamId)
      .maybeSingle(),
    supabase
      .from("matches")
      .select(
        "id, fase, cancha, fecha_hora_programada, estado, marcador_local, marcador_visitante, equipo_local_id, equipo_visitante_id, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url)"
      )
      .or(`equipo_local_id.eq.${teamId},equipo_visitante_id.eq.${teamId}`)
      .order("fecha_hora_programada", { ascending: true }),
    supabase
      .from("v_fair_play")
      .select("amarillas, azules, rojas, puntos_fair_play")
      .eq("team_id", teamId)
      .maybeSingle(),
    supabase
      .from("v_equipos_con_deuda_tarjetas")
      .select("jugadores_con_deuda")
      .eq("team_id", teamId)
      .maybeSingle(),
  ]);

  const jugadores = playersRaw ?? [];
  const staff = staffRaw ?? [];
  const grupoLetra = unwrapGroup(teamGroupRaw?.groups as GroupRel)?.letra ?? null;
  const groupId = teamGroupRaw?.group_id ?? null;

  const [{ data: standingsRaw }, { data: mvpRaw }] = await Promise.all([
    groupId
      ? supabase
          .from("v_standings")
          .select("team_id, pj, pg, pe, pp, gf, gc, dg, pts")
          .eq("group_id", groupId)
      : Promise.resolve({ data: [] as never[] }),
    jugadores.length > 0
      ? supabase
          .from("v_ranking_mvp")
          .select("player_id, mvp_count")
          .in(
            "player_id",
            jugadores.map((j) => j.id)
          )
      : Promise.resolve({ data: [] as { player_id: string; mvp_count: number }[] }),
  ]);

  const standings = (standingsRaw ?? [])
    .slice()
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
  const posicionGrupo = standings.findIndex((r) => r.team_id === teamId) + 1;
  const miFila = standings.find((r) => r.team_id === teamId) ?? null;
  const mvpTotal = (mvpRaw ?? []).reduce((sum, r) => sum + (r.mvp_count ?? 0), 0);

  const partidos = (matchesRaw ?? []).map((m) => {
    const local = unwrapEquipo(m.equipo_local as EquipoRel);
    const visitante = unwrapEquipo(m.equipo_visitante as EquipoRel);
    const esLocal = m.equipo_local_id === teamId;
    const rival = esLocal ? visitante : local;
    const golesPropios = esLocal ? m.marcador_local : m.marcador_visitante;
    const golesRival = esLocal ? m.marcador_visitante : m.marcador_local;
    let resultado: "G" | "E" | "P" | null = null;
    if (m.estado === "finalizado" && golesPropios !== null && golesRival !== null) {
      resultado = golesPropios > golesRival ? "G" : golesPropios < golesRival ? "P" : "E";
    }
    return { ...m, rival, esLocal, golesPropios, golesRival, resultado };
  });

  const proximosPartidos = partidos.filter((p) => p.estado === "programado");
  const partidosJugados = partidos
    .filter((p) => p.estado === "finalizado")
    .sort(
      (a, b) =>
        new Date(b.fecha_hora_programada).getTime() - new Date(a.fecha_hora_programada).getTime()
    );

  // Vallas invictas: partidos finalizados en los que el rival no anotó.
  // Se calcula sobre los mismos partidos jugados (no se inventa un dato
  // nuevo) — mismo criterio "menos goles en contra" ya acordado con
  // Fernando para reemplazar "mejores arqueros" en /estadisticas.
  const vallasInvictas = partidosJugados.filter((p) => (p.golesRival ?? 0) === 0).length;

  const goleadosPorEquipo = miFila?.gf ?? 0;
  const amarillas = fairPlayRaw?.amarillas ?? 0;
  const azules = fairPlayRaw?.azules ?? 0;
  const rojas = fairPlayRaw?.rojas ?? 0;
  const jugadoresConDeuda = deudaTarjetasRaw?.jugadores_con_deuda ?? 0;

  const estadoBadge = ESTADO_BADGE[team.estado_inscripcion] ?? ESTADO_BADGE.pendiente;

  const breadcrumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Equipos", href: "/equipos" },
    { label: team.nombre_equipo },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-black text-white">
        <section className="relative isolate overflow-hidden pb-8 pt-36">
          <ParallaxSectionBackground src="/brand/hero-stadium.jpg" priority />
          <div aria-hidden className="absolute inset-0 bg-muneca-black/75" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>

          {/* Wordmark decorativo, mismo elemento que ya se agregó al footer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-24 hidden w-40 -rotate-6 opacity-90 sm:block sm:w-52 lg:right-8"
          >
            <Image
              src="/brand/aqui-tambien-se-juega-bonito.png"
              alt=""
              width={900}
              height={365}
              className="h-auto w-full object-contain"
            />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />

            <div className="mt-5 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
              <div className="shrink-0 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
                <TeamCrest url={team.escudo_url} size="xl" />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <h1 className="font-display text-3xl uppercase sm:text-4xl">
                    {team.nombre_equipo}
                  </h1>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${estadoBadge.className}`}
                  >
                    {estadoBadge.label}
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-white/60 sm:justify-start">
                  {grupoLetra && <span>Grupo {grupoLetra}</span>}
                  {team.ciudad_barrio && (
                    <>
                      <span className="text-white/25">·</span>
                      <span>{team.ciudad_barrio}</span>
                    </>
                  )}
                  {team.anio_fundacion && (
                    <>
                      <span className="text-white/25">·</span>
                      <span>Fundado en {team.anio_fundacion}</span>
                    </>
                  )}
                </p>
                {team.descripcion && (
                  <p className="mt-2 max-w-xl text-sm text-white/50">{team.descripcion}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna principal */}
            <div className="space-y-6 lg:col-span-2">
              {/* Resumen del equipo */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                    📊 Resumen del equipo
                  </p>
                  {grupoLetra && (
                    <span className="text-xs font-semibold text-white/40">Grupo {grupoLetra}</span>
                  )}
                </div>
                {miFila ? (
                  <>
                    <div className="mt-3 inline-flex items-baseline gap-2 rounded-xl bg-muneca-purple/15 px-4 py-2">
                      <span className="text-xs font-semibold uppercase text-white/50">Posición</span>
                      <span className="font-display text-3xl text-white">{posicionGrupo}.º</span>
                    </div>
                    <dl className="mt-4 grid grid-cols-4 gap-2 text-center sm:grid-cols-8">
                      {[
                        ["PJ", miFila.pj],
                        ["PG", miFila.pg],
                        ["PE", miFila.pe],
                        ["PP", miFila.pp],
                        ["GF", miFila.gf],
                        ["GC", miFila.gc],
                        ["DG", miFila.dg],
                        ["PTS", miFila.pts],
                      ].map(([label, valor]) => (
                        <div key={label as string} className="rounded-lg bg-white/5 py-2">
                          <p className="font-bold text-white">{valor}</p>
                          <p className="text-[10px] uppercase text-white/40">{label}</p>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-white/40">
                    Aún no hay partidos finalizados para calcular la tabla.
                  </p>
                )}
              </div>

              {/* Plantilla */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                  👥 Plantilla · {jugadores.length} jugadores
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {jugadores.length === 0 && (
                    <p className="text-xs text-white/40">Sin jugadores registrados.</p>
                  )}
                  {jugadores.map((j) => (
                    <Link
                      key={j.id}
                      href={`/jugadores/${j.id}`}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muneca-purple text-sm text-white">
                        {j.numero_camiseta ?? "—"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{j.nombre}</p>
                        <p className="text-xs text-white/40">{j.posicion ?? "—"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Próximos partidos: todos los partidos programados de este equipo, no solo el siguiente */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                  🗓️ Próximos partidos · {proximosPartidos.length}
                </p>
                <div className="mt-3 space-y-2">
                  {proximosPartidos.length === 0 && (
                    <p className="text-xs text-white/40">Este equipo no tiene partidos programados por ahora.</p>
                  )}
                  {proximosPartidos.map((p) => (
                    <Link
                      key={p.id}
                      href={`/partidos/${p.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center gap-2">
                        <TeamCrest url={p.rival?.escudo_url} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {p.esLocal ? "vs" : "@"} {p.rival?.nombre_equipo ?? "Por definir"}
                          </p>
                          <p className="text-xs text-white/40">
                            Cancha {p.cancha} · {formatFechaLarga(p.fecha_hora_programada)} ·{" "}
                            {formatHora(p.fecha_hora_programada)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-muneca-yellow">Ver partido →</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Partidos jugados */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                    📅 Partidos · {partidosJugados.length} jugados
                  </p>
                  <Link href="/partidos" className="text-xs font-semibold text-white/40 hover:text-white">
                    Ver todos los partidos →
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {partidosJugados.length === 0 && (
                    <p className="text-xs text-white/40">Aún no hay partidos finalizados.</p>
                  )}
                  {partidosJugados.slice(0, 5).map((p) => (
                    <Link
                      key={p.id}
                      href={`/partidos/${p.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.07]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="hidden h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/60 sm:flex">
                          {p.esLocal ? "L" : "V"}
                        </span>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                            p.resultado === "G"
                              ? "bg-emerald-600"
                              : p.resultado === "P"
                                ? "bg-rose-600"
                                : "bg-white/20"
                          }`}
                        >
                          {p.resultado ?? "—"}
                        </span>
                        <TeamCrest url={p.rival?.escudo_url} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            vs {p.rival?.nombre_equipo ?? "Por definir"}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {formatFechaCorta(p.fecha_hora_programada)}
                          </p>
                        </div>
                      </div>
                      <p className="font-display shrink-0 text-lg text-white">
                        {p.golesPropios ?? 0}-{p.golesRival ?? 0}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna lateral */}
            <div className="space-y-6">
              {/* Reconocimientos */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                  ⭐ Reconocimientos
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muneca-yellow/15 text-xl text-muneca-yellow">
                    ⭐
                  </span>
                  <div>
                    <p className="font-display text-2xl text-white">{mvpTotal}</p>
                    <p className="text-xs text-white/40">MVP obtenidos por jugadores del equipo.</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas del equipo */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                  📈 Estadísticas del equipo
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-white/40">⚽ Goles anotados</p>
                    <p className="font-display mt-1 text-2xl text-white">{goleadosPorEquipo}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-white/40">🧤 Vallas invictas</p>
                    <p className="font-display mt-1 text-2xl text-white">{vallasInvictas}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-white/40">🟨 Tarjetas amarillas</p>
                    <p className="font-display mt-1 text-2xl text-white">{amarillas}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-white/40">🟦 Tarjetas azules</p>
                    <p className="font-display mt-1 text-2xl text-white">{azules}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-white/40">🟥 Tarjetas rojas</p>
                    <p className="font-display mt-1 text-2xl text-white">{rojas}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-base">
                      🤝
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Fair Play</p>
                      <p className="text-xs text-white/40">Juego limpio dentro y fuera de la cancha.</p>
                    </div>
                  </div>
                </div>

                {jugadoresConDeuda > 0 && (
                  <Link
                    href="/pagos-tarjetas"
                    className="mt-2 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 transition-colors hover:bg-amber-500/15"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-base">
                      ⚠️
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">
                        {jugadoresConDeuda === 1
                          ? "1 jugador con tarjeta pendiente"
                          : `${jugadoresConDeuda} jugadores con tarjeta pendiente`}
                      </p>
                      <p className="text-xs text-amber-200/60">
                        Recuerda: no puede jugar quien tenga tarjetas sin pagar. Toca para pagar.
                      </p>
                    </div>
                  </Link>
                )}
              </div>

              {/* Cuerpo técnico */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
                  🧑‍💼 Cuerpo técnico
                </p>
                <div className="mt-3 space-y-2">
                  {staff.length === 0 && (
                    <p className="text-xs text-white/40">Sin información pública.</p>
                  )}
                  {staff.map((s, i) => (
                    <div key={`${s.nombre}-${i}`} className="rounded-xl bg-white/5 p-2.5">
                      <p className="text-sm font-semibold text-white">{s.nombre}</p>
                      <p className="text-xs text-white/40">{ROL_LABEL[s.rol] ?? s.rol}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foto del equipo — placeholder */}
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                  📸 Foto del equipo
                </p>
                <p className="mt-2 text-sm text-white/30">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="text-sm font-semibold text-white/40 transition-colors hover:text-muneca-yellow"
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
