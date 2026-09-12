import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { TeamCrest } from "@/components/team-crest";

const COLS = ["Pos", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"];

/** Cuántos equipos por grupo clasifican a la fase eliminatoria (formato-torneo.md). */
const CLASIFICAN_POR_GRUPO = 4;

type TeamInfo = { id: string; nombre_equipo: string; escudo_url: string | null };
type TeamRel = TeamInfo | TeamInfo[] | null;

function unwrapTeam(rel: TeamRel): TeamInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

type StandingRow = {
  group_id: string;
  team_id: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

type FilaTabla = {
  team_id: string;
  nombre_equipo: string;
  escudo_url: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

/**
 * Tabla de posiciones completa, por grupo. Desempate automático: puntos →
 * diferencia de gol → goles a favor (los primeros 3 criterios de
 * `formato-torneo.md`). El 4° (enfrentamiento directo) y 5° (sorteo) — que
 * solo aplican en empates exactos entre 2+ equipos en los 3 primeros
 * criterios — todavía no se calculan automáticamente; se nota al pie de la
 * tabla para no dar una posición por definitiva cuando aplicaría un
 * desempate manual.
 */
export default async function PosicionesPage() {
  const supabase = await createClient();

  const [{ data: groups }, { data: teamGroupRaw }, { data: standingsRaw }] = await Promise.all([
    supabase.from("groups").select("id, letra").order("letra", { ascending: true }),
    supabase
      .from("team_group")
      .select("group_id, team_id, teams:team_id(id, nombre_equipo, escudo_url)"),
    supabase
      .from("v_standings")
      .select("group_id, team_id, pj, pg, pe, pp, gf, gc, dg, pts"),
  ]);

  const standingsPorEquipo = new Map<string, StandingRow>(
    (standingsRaw ?? []).map((s) => [s.team_id, s])
  );

  const gruposConTablas = (groups ?? []).map((g) => {
    const equiposDelGrupo = (teamGroupRaw ?? []).filter((tg) => tg.group_id === g.id);

    const filas: FilaTabla[] = equiposDelGrupo.map((tg) => {
      const team = unwrapTeam(tg.teams as TeamRel);
      const s = standingsPorEquipo.get(tg.team_id);
      return {
        team_id: tg.team_id,
        nombre_equipo: team?.nombre_equipo ?? "Por definir",
        escudo_url: team?.escudo_url ?? null,
        pj: s?.pj ?? 0,
        pg: s?.pg ?? 0,
        pe: s?.pe ?? 0,
        pp: s?.pp ?? 0,
        gf: s?.gf ?? 0,
        gc: s?.gc ?? 0,
        dg: s?.dg ?? 0,
        pts: s?.pts ?? 0,
      };
    });

    filas.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);

    return { grupo: g, filas };
  });

  const breadcrumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Posiciones" },
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
            <h1 className="font-display mt-3 text-4xl sm:text-5xl">Tabla de posiciones</h1>
            <p className="mt-2 max-w-xl text-white/70">
              Los 4 primeros de cada grupo clasifican a la fase eliminatoria.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
          {gruposConTablas.length === 0 && (
            <p className="text-center text-sm text-muneca-black/40">
              Todavía no hay grupos configurados.
            </p>
          )}

          {gruposConTablas.map(({ grupo, filas }) => (
            <div key={grupo.id}>
              <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
                Grupo {grupo.letra}
              </p>

              <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-muneca-white shadow-sm">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-muneca-purple-dark to-muneca-black text-muneca-white">
                      {COLS.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide first:pl-4"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, i) => {
                      const clasifica = i < CLASIFICAN_POR_GRUPO;
                      return (
                        <tr
                          key={fila.team_id}
                          className={`border-b border-black/5 transition-colors last:border-0 hover:bg-muneca-purple/5 ${
                            clasifica
                              ? "bg-muneca-yellow/10"
                              : i % 2 === 0
                                ? "bg-muneca-white"
                                : "bg-muneca-purple/[0.03]"
                          }`}
                        >
                          <td className="px-3 py-3 pl-4">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                clasifica
                                  ? "bg-muneca-yellow text-muneca-black"
                                  : "bg-muneca-purple text-white"
                              }`}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={`/equipos/${fila.team_id}`}
                              className="flex items-center gap-2 hover:text-muneca-purple"
                            >
                              <TeamCrest url={fila.escudo_url} size="sm" />
                              <span className="font-semibold text-muneca-black">
                                {fila.nombre_equipo}
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-muneca-black/70">{fila.pj}</td>
                          <td className="px-3 py-3 font-semibold text-emerald-600">{fila.pg}</td>
                          <td className="px-3 py-3 text-muneca-black/50">{fila.pe}</td>
                          <td className="px-3 py-3 font-semibold text-rose-600">{fila.pp}</td>
                          <td className="px-3 py-3 text-muneca-black/70">{fila.gf}</td>
                          <td className="px-3 py-3 text-muneca-black/70">{fila.gc}</td>
                          <td
                            className={`px-3 py-3 font-semibold ${
                              fila.dg > 0
                                ? "text-emerald-600"
                                : fila.dg < 0
                                  ? "text-rose-600"
                                  : "text-muneca-black/50"
                            }`}
                          >
                            {fila.dg > 0 ? `+${fila.dg}` : fila.dg}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-muneca-purple px-2 py-1 text-xs font-bold text-white">
                              {fila.pts}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-muneca-black/40">
            Desempate automático: puntos → diferencia de gol → goles a favor. El enfrentamiento
            directo y el sorteo (para empates exactos que persistan) todavía no se calculan
            automáticamente.
          </p>

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
