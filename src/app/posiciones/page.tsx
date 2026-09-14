import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";
import { createClient } from "@/lib/supabase/server";
import { PosicionesTabs, type FilaTabla, type GrupoData, type PartidoResumen } from "@/components/posiciones/posiciones-tabs";

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

/**
 * Tabla de posiciones completa, por grupo, con pestañas (una pestaña por
 * grupo en vez de tablas apiladas), tarjetas de estadísticas del grupo
 * (más goles, mejor defensa, mejor diferencia, líder) y la próxima jornada
 * de ese grupo — ver `PosicionesTabs`. Desempate automático: puntos →
 * diferencia de gol → goles a favor (los primeros 3 criterios de
 * `formato-torneo.md`). El 4° (enfrentamiento directo) y 5° (sorteo) — que
 * solo aplican en empates exactos entre 2+ equipos en los 3 primeros
 * criterios — todavía no se calculan automáticamente; se nota al pie de la
 * tabla para no dar una posición por definitiva cuando aplicaría un
 * desempate manual.
 *
 * Fondo oscuro (2026-09-14), igual que /partidos y /equipos/[equipo],
 * parte del rediseño completo de la plataforma a un solo tema oscuro.
 */
export default async function PosicionesPage() {
  const supabase = await createClient();

  const [{ data: groups }, { data: teamGroupRaw }, { data: standingsRaw }, { data: partidosRaw }] =
    await Promise.all([
      supabase.from("groups").select("id, letra").order("letra", { ascending: true }),
      supabase
        .from("team_group")
        .select("group_id, team_id, teams:team_id(id, nombre_equipo, escudo_url)"),
      supabase
        .from("v_standings")
        .select("group_id, team_id, pj, pg, pe, pp, gf, gc, dg, pts"),
      supabase
        .from("matches")
        .select(
          "id, cancha, fecha_hora_programada, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url)"
        )
        .eq("estado", "programado")
        .order("fecha_hora_programada", { ascending: true }),
    ]);

  const standingsPorEquipo = new Map<string, StandingRow>(
    (standingsRaw ?? []).map((s) => [s.team_id, s])
  );

  // team_id -> group_id, para poder ubicar cada partido programado en su grupo.
  const grupoPorEquipo = new Map<string, string>(
    (teamGroupRaw ?? []).map((tg) => [tg.team_id, tg.group_id])
  );

  const PARTIDOS_POR_GRUPO = 4;
  const proximaJornadaPorGrupo = new Map<string, PartidoResumen[]>();
  for (const p of partidosRaw ?? []) {
    const local = unwrapTeam(p.equipo_local as TeamRel);
    const visitante = unwrapTeam(p.equipo_visitante as TeamRel);
    const groupId = (local && grupoPorEquipo.get(local.id)) ?? null;
    if (!groupId) continue;

    const lista = proximaJornadaPorGrupo.get(groupId) ?? [];
    if (lista.length >= PARTIDOS_POR_GRUPO) continue;

    lista.push({
      id: p.id as string,
      cancha: p.cancha as number,
      fecha: p.fecha_hora_programada as string,
      local: local ? { nombre_equipo: local.nombre_equipo, escudo_url: local.escudo_url } : null,
      visitante: visitante
        ? { nombre_equipo: visitante.nombre_equipo, escudo_url: visitante.escudo_url }
        : null,
    });
    proximaJornadaPorGrupo.set(groupId, lista);
  }

  const grupos: GrupoData[] = (groups ?? []).map((g) => {
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

    return {
      id: g.id,
      letra: g.letra,
      filas,
      proximaJornada: proximaJornadaPorGrupo.get(g.id) ?? [],
    };
  });

  const breadcrumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Posiciones" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-black text-white">
        <section className="relative isolate overflow-hidden pb-10 pt-36">
          <ParallaxSectionBackground src="/brand/hero-stadium.jpg" priority />
          <div aria-hidden className="absolute inset-0 bg-muneca-black/75" />
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
          <PosicionesTabs grupos={grupos} />

          <p className="text-center text-xs text-white/40">
            Desempate automático: puntos → diferencia de gol → goles a favor. El enfrentamiento
            directo y el sorteo (para empates exactos que persistan) todavía no se calculan
            automáticamente.
          </p>

          <div>
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
