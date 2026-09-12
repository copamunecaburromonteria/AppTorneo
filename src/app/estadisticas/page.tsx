import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { TeamCrest } from "@/components/team-crest";

const TOP_JUGADORES = 20;
const TOP_EQUIPOS = 12;

type TeamMini = { id: string; nombre_equipo: string; escudo_url: string | null };
type PlayerMini = { id: string; nombre: string; numero_camiseta: number | null; team_id: string };

/** Fila genérica de un ranking de jugador (goleadores/tarjetas/MVP comparten la misma forma visual). */
function FilaJugador({
  pos,
  jugador,
  equipo,
  valor,
}: {
  pos: number;
  jugador: PlayerMini | undefined;
  equipo: TeamMini | undefined;
  valor: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 py-2.5 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muneca-purple/10 text-xs font-bold text-muneca-purple">
          {pos}
        </span>
        <div className="min-w-0">
          {jugador ? (
            <Link
              href={`/jugadores/${jugador.id}`}
              className="truncate text-sm font-semibold text-muneca-black hover:text-muneca-purple"
            >
              {jugador.nombre}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-muneca-black/40">—</span>
          )}
          {equipo && (
            <Link
              href={`/equipos/${equipo.id}`}
              className="flex items-center gap-1.5 text-xs text-muneca-black/50 hover:text-muneca-purple"
            >
              <TeamCrest url={equipo.escudo_url} size="xs" />
              {equipo.nombre_equipo}
            </Link>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">{valor}</div>
    </div>
  );
}

export default async function EstadisticasPage() {
  const supabase = await createClient();

  const [
    { data: golesRaw },
    { data: tarjetasRaw },
    { data: mvpRaw },
    { data: fairPlayRaw },
    { data: standingsRaw },
    { data: teamGroupRaw },
  ] = await Promise.all([
    supabase.from("v_goleadores").select("player_id, team_id, goles"),
    supabase.from("v_tarjetas").select("player_id, team_id, amarillas, rojas"),
    supabase.from("v_ranking_mvp").select("player_id, mvp_count"),
    supabase.from("v_fair_play").select("team_id, amarillas, rojas, puntos_fair_play"),
    supabase.from("v_standings").select("team_id, pj, gc"),
    supabase.from("team_group").select("team_id, teams:team_id(id, nombre_equipo, escudo_url)"),
  ]);

  type TeamRel = TeamMini | TeamMini[] | null;
  function unwrapTeam(rel: TeamRel): TeamMini | null {
    if (!rel) return null;
    return Array.isArray(rel) ? rel[0] ?? null : rel;
  }

  const equiposParticipantes: TeamMini[] = (teamGroupRaw ?? [])
    .map((tg) => unwrapTeam(tg.teams as TeamRel))
    .filter((t): t is TeamMini => Boolean(t));
  const equipoPorId = new Map(equiposParticipantes.map((t) => [t.id, t]));

  const goleadores = (golesRaw ?? [])
    .slice()
    .sort((a, b) => b.goles - a.goles)
    .slice(0, TOP_JUGADORES);

  const tarjetas = (tarjetasRaw ?? [])
    .slice()
    .sort(
      (a, b) => b.rojas - a.rojas || b.amarillas + b.rojas - (a.amarillas + a.rojas)
    )
    .slice(0, TOP_JUGADORES);

  const mvpRanking = (mvpRaw ?? [])
    .slice()
    .sort((a, b) => b.mvp_count - a.mvp_count)
    .slice(0, TOP_JUGADORES);

  const playerIds = Array.from(
    new Set([
      ...goleadores.map((g) => g.player_id),
      ...tarjetas.map((t) => t.player_id),
      ...mvpRanking.map((m) => m.player_id),
    ])
  );

  const { data: jugadoresRaw } =
    playerIds.length > 0
      ? await supabase
          .from("v_players_public")
          .select("id, nombre, numero_camiseta, team_id")
          .in("id", playerIds)
      : { data: [] as PlayerMini[] };

  const jugadorPorId = new Map((jugadoresRaw ?? []).map((j) => [j.id, j]));

  // Fair Play: todo equipo participante entra al ranking, aunque no tenga
  // tarjetas todavía (0 puntos = el mejor caso posible, no "sin datos").
  const fairPlayPorEquipo = new Map((fairPlayRaw ?? []).map((f) => [f.team_id, f]));
  const fairPlay = equiposParticipantes
    .map((t) => {
      const f = fairPlayPorEquipo.get(t.id);
      return {
        equipo: t,
        amarillas: f?.amarillas ?? 0,
        rojas: f?.rojas ?? 0,
        puntos: f?.puntos_fair_play ?? 0,
      };
    })
    .sort((a, b) => a.puntos - b.puntos || a.equipo.nombre_equipo.localeCompare(b.equipo.nombre_equipo))
    .slice(0, TOP_EQUIPOS);

  // Valla menos vencida: goles en contra por equipo (v_standings), a nivel
  // de equipo — no hay alineaciones todavía para atribuir un arquero
  // individual (ver plan-fases-tareas.md).
  const standingsPorEquipo = new Map((standingsRaw ?? []).map((s) => [s.team_id, s]));
  const vallaMenosVencida = equiposParticipantes
    .map((t) => {
      const s = standingsPorEquipo.get(t.id);
      return { equipo: t, gc: s?.gc ?? 0, pj: s?.pj ?? 0 };
    })
    .filter((r) => r.pj > 0)
    .sort((a, b) => a.gc - b.gc || b.pj - a.pj)
    .slice(0, TOP_EQUIPOS);

  const breadcrumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Estadísticas" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-white">
        <section className="relative overflow-hidden bg-muneca-black pb-10 pt-36 text-muneca-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />
            <h1 className="font-display mt-3 text-4xl sm:text-5xl">Estadísticas</h1>
            <p className="mt-2 max-w-xl text-white/70">
              El talento también cuenta — rankings del torneo, actualizados con cada partido.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                ⚽ Goleadores
              </p>
              <div className="mt-2">
                {goleadores.length === 0 && (
                  <p className="py-4 text-center text-xs text-muneca-black/40">
                    Todavía no hay goles registrados.
                  </p>
                )}
                {goleadores.map((g, i) => (
                  <FilaJugador
                    key={g.player_id}
                    pos={i + 1}
                    jugador={jugadorPorId.get(g.player_id)}
                    equipo={equipoPorId.get(g.team_id)}
                    valor={
                      <span className="font-display text-lg text-muneca-black">{g.goles}</span>
                    }
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                🟨🟥 Tarjetas
              </p>
              <div className="mt-2">
                {tarjetas.length === 0 && (
                  <p className="py-4 text-center text-xs text-muneca-black/40">
                    Todavía no hay tarjetas registradas.
                  </p>
                )}
                {tarjetas.map((t, i) => (
                  <FilaJugador
                    key={t.player_id}
                    pos={i + 1}
                    jugador={jugadorPorId.get(t.player_id)}
                    equipo={equipoPorId.get(t.team_id)}
                    valor={
                      <span className="font-display text-lg text-muneca-black">
                        {t.amarillas}
                        <span className="mx-1 text-sm text-muneca-black/30">/</span>
                        {t.rojas}
                      </span>
                    }
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                ⭐ Ranking MVP
              </p>
              <div className="mt-2">
                {mvpRanking.length === 0 && (
                  <p className="py-4 text-center text-xs text-muneca-black/40">
                    Todavía no hay MVP votados.
                  </p>
                )}
                {mvpRanking.map((m, i) => {
                  const jugador = jugadorPorId.get(m.player_id);
                  return (
                    <FilaJugador
                      key={m.player_id}
                      pos={i + 1}
                      jugador={jugador}
                      equipo={jugador ? equipoPorId.get(jugador.team_id) : undefined}
                      valor={
                        <span className="font-display text-lg text-muneca-black">
                          {m.mvp_count}
                        </span>
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                🛡️ Fair Play
              </p>
              <p className="mt-0.5 text-[11px] text-muneca-black/40">
                Amarilla = 1 pt · Roja = 3 pts. Gana el equipo con menor puntaje.
              </p>
              <div className="mt-2">
                {fairPlay.map((f, i) => (
                  <div
                    key={f.equipo.id}
                    className="flex items-center justify-between gap-3 border-b border-black/5 py-2.5 last:border-0"
                  >
                    <Link
                      href={`/equipos/${f.equipo.id}`}
                      className="flex min-w-0 items-center gap-3 hover:text-muneca-purple"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muneca-purple/10 text-xs font-bold text-muneca-purple">
                        {i + 1}
                      </span>
                      <TeamCrest url={f.equipo.escudo_url} size="sm" />
                      <span className="truncate text-sm font-semibold text-muneca-black">
                        {f.equipo.nombre_equipo}
                      </span>
                    </Link>
                    <span className="font-display shrink-0 text-lg text-muneca-black">
                      {f.puntos}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                🧤 Valla menos vencida
              </p>
              <p className="mt-0.5 text-[11px] text-muneca-black/40">
                Ranking por equipo (menos goles en contra) — todavía no se registran alineaciones
                para atribuir este dato a un arquero individual.
              </p>
              <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
                {vallaMenosVencida.map((v, i) => (
                  <div
                    key={v.equipo.id}
                    className="flex items-center justify-between gap-3 border-b border-black/5 py-2.5 last:border-0"
                  >
                    <Link
                      href={`/equipos/${v.equipo.id}`}
                      className="flex min-w-0 items-center gap-3 hover:text-muneca-purple"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muneca-purple/10 text-xs font-bold text-muneca-purple">
                        {i + 1}
                      </span>
                      <TeamCrest url={v.equipo.escudo_url} size="sm" />
                      <span className="truncate text-sm font-semibold text-muneca-black">
                        {v.equipo.nombre_equipo}
                      </span>
                    </Link>
                    <span className="shrink-0 text-sm text-muneca-black/60">
                      <span className="font-display text-lg text-muneca-black">{v.gc}</span> en{" "}
                      {v.pj} PJ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
