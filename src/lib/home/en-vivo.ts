import { createClient } from "@/lib/supabase/server";
import { calcularJornada } from "@/lib/jornada";

/**
 * Datos para la sección "Partidos en vivo" + "Tablas de posiciones" del
 * Home. Un solo lugar que hace las mismas consultas que ya usan
 * `/posiciones`, `/partidos` y la consola de operador (`matches`,
 * `match_events`, `v_standings`, `groups`, `team_group`) — no es una
 * segunda fuente de información, es la misma reempaquetada para esta
 * sección. Lo usan tanto el primer render por servidor del Home
 * (`partidos-en-vivo.tsx`) como el endpoint de sondeo
 * (`/api/home/en-vivo`) que el cliente consulta cada 15s — así la lógica
 * vive en un solo sitio.
 */

export type EquipoResumen = { id: string; nombre: string; escudoUrl: string | null };

export type UltimoGol = { eventoId: string; equipoNombre: string; minuto: number };

export type PartidoEnVivo = {
  matchId: string;
  groupId: string | null;
  groupLetra: string | null;
  fase: string;
  cancha: number;
  jornada: number;
  estado: "en_curso" | "entretiempo";
  horaInicioReal: string | null;
  equipoLocal: EquipoResumen;
  equipoVisitante: EquipoResumen;
  marcadorLocal: number;
  marcadorVisitante: number;
  ultimoGol: UltimoGol | null;
};

export type ProximoPartidoResumen = {
  matchId: string;
  groupId: string | null;
  groupLetra: string | null;
  fase: string;
  cancha: number;
  jornada: number;
  fechaHoraProgramada: string;
  equipoLocal: EquipoResumen;
  equipoVisitante: EquipoResumen;
};

export type FilaTablaHome = {
  teamId: string;
  nombreEquipo: string;
  escudoUrl: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

export type TablaGrupoHome = { groupId: string; letra: string; filas: FilaTablaHome[] };

export type EstadoEnVivoHome = {
  enVivo: PartidoEnVivo[];
  proximoPartido: ProximoPartidoResumen | null;
  tablas: TablaGrupoHome[];
};

type TeamRow = { id: string; nombre_equipo: string; escudo_url: string | null };
type TeamRel = TeamRow | TeamRow[] | null;
type GroupRel = { letra: string } | { letra: string }[] | null;

function unwrapTeam(rel: TeamRel): EquipoResumen {
  const t = Array.isArray(rel) ? rel[0] ?? null : rel;
  return { id: t?.id ?? "", nombre: t?.nombre_equipo ?? "Por definir", escudoUrl: t?.escudo_url ?? null };
}

function unwrapGroupLetra(rel: GroupRel): string | null {
  const g = Array.isArray(rel) ? rel[0] ?? null : rel;
  return g?.letra ?? null;
}

const SELECT_PARTIDO =
  "id, fase, group_id, cancha, fecha_hora_programada, estado, hora_inicio_real, marcador_local, marcador_visitante, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url), groups:group_id(letra)";

export async function obtenerEstadoEnVivoHome(): Promise<EstadoEnVivoHome> {
  const supabase = await createClient();

  const [{ data: enVivoRaw }, { data: todasFechasRaw }] = await Promise.all([
    supabase
      .from("matches")
      .select(SELECT_PARTIDO)
      .in("estado", ["en_curso", "entretiempo"])
      .order("cancha", { ascending: true }),
    supabase.from("matches").select("fecha_hora_programada"),
  ]);

  const todasLasFechas = (todasFechasRaw ?? []).map((r) => r.fecha_hora_programada as string);

  let proximoRaw: Record<string, unknown> | null = null;
  if (!enVivoRaw || enVivoRaw.length === 0) {
    const { data } = await supabase
      .from("matches")
      .select(SELECT_PARTIDO)
      .eq("estado", "programado")
      .order("fecha_hora_programada", { ascending: true })
      .limit(1)
      .maybeSingle();
    proximoRaw = data;
  }

  const matchIds = (enVivoRaw ?? []).map((m) => m.id as string);
  const ultimosGoles = new Map<string, { eventoId: string; equipoId: string; minuto: number }>();
  if (matchIds.length > 0) {
    const { data: eventosRaw } = await supabase
      .from("match_events")
      .select("id, match_id, equipo_id, minuto, creado_at")
      .in("match_id", matchIds)
      .eq("anulado", false)
      .in("tipo", ["gol", "autogol"])
      .order("creado_at", { ascending: false });

    for (const ev of eventosRaw ?? []) {
      const mid = ev.match_id as string;
      if (!ultimosGoles.has(mid)) {
        ultimosGoles.set(mid, {
          eventoId: ev.id as string,
          equipoId: ev.equipo_id as string,
          minuto: ev.minuto as number,
        });
      }
    }
  }

  const enVivo: PartidoEnVivo[] = (enVivoRaw ?? []).map((m) => {
    const local = unwrapTeam(m.equipo_local as TeamRel);
    const visitante = unwrapTeam(m.equipo_visitante as TeamRel);
    const gol = ultimosGoles.get(m.id as string) ?? null;
    // El autogol se acredita al equipo contrario del que anotó en su propia
    // portería — mismo criterio que `recalcularMarcador()` en la consola de
    // operador (src/app/operador/actions.ts).
    const equipoAcreditado =
      gol && gol.equipoId === local.id ? visitante : gol && gol.equipoId === visitante.id ? local : null;

    return {
      matchId: m.id as string,
      groupId: (m.group_id as string) ?? null,
      groupLetra: unwrapGroupLetra(m.groups as GroupRel),
      fase: m.fase as string,
      cancha: m.cancha as number,
      jornada: calcularJornada(m.fecha_hora_programada as string, todasLasFechas),
      estado: m.estado as "en_curso" | "entretiempo",
      horaInicioReal: (m.hora_inicio_real as string) ?? null,
      equipoLocal: local,
      equipoVisitante: visitante,
      marcadorLocal: (m.marcador_local as number) ?? 0,
      marcadorVisitante: (m.marcador_visitante as number) ?? 0,
      ultimoGol:
        gol && equipoAcreditado
          ? { eventoId: gol.eventoId, equipoNombre: equipoAcreditado.nombre, minuto: gol.minuto }
          : null,
    };
  });

  const proximoPartido: ProximoPartidoResumen | null = proximoRaw
    ? {
        matchId: proximoRaw.id as string,
        groupId: (proximoRaw.group_id as string) ?? null,
        groupLetra: unwrapGroupLetra(proximoRaw.groups as GroupRel),
        fase: proximoRaw.fase as string,
        cancha: proximoRaw.cancha as number,
        jornada: calcularJornada(proximoRaw.fecha_hora_programada as string, todasLasFechas),
        fechaHoraProgramada: proximoRaw.fecha_hora_programada as string,
        equipoLocal: unwrapTeam(proximoRaw.equipo_local as TeamRel),
        equipoVisitante: unwrapTeam(proximoRaw.equipo_visitante as TeamRel),
      }
    : null;

  // Qué grupo(s) mostrar: los de los partidos en vivo (sin duplicar si los
  // 2 partidos son del mismo grupo), o si no hay ninguno en vivo, el del
  // próximo partido programado. Se ordenan por cancha para que la tabla del
  // partido de Cancha 1 quede primero, igual que los widgets de arriba.
  const groupIdsOrdenados: string[] = [];
  for (const p of enVivo) {
    if (p.groupId && !groupIdsOrdenados.includes(p.groupId)) groupIdsOrdenados.push(p.groupId);
  }
  if (groupIdsOrdenados.length === 0 && proximoPartido?.groupId) {
    groupIdsOrdenados.push(proximoPartido.groupId);
  }

  let tablas: TablaGrupoHome[] = [];
  if (groupIdsOrdenados.length > 0) {
    const [{ data: groupsRaw }, { data: teamGroupRaw }, { data: standingsRaw }] = await Promise.all([
      supabase.from("groups").select("id, letra").in("id", groupIdsOrdenados),
      supabase
        .from("team_group")
        .select("group_id, team_id, teams:team_id(id, nombre_equipo, escudo_url)")
        .in("group_id", groupIdsOrdenados),
      supabase
        .from("v_standings")
        .select("group_id, team_id, pj, pg, pe, pp, gf, gc, dg, pts")
        .in("group_id", groupIdsOrdenados),
    ]);

    const letraPorGrupo = new Map((groupsRaw ?? []).map((g) => [g.id as string, g.letra as string]));
    const standingsPorEquipo = new Map(
      (standingsRaw ?? []).map((s) => [s.team_id as string, s])
    );

    tablas = groupIdsOrdenados.map((groupId) => {
      const equiposDelGrupo = (teamGroupRaw ?? []).filter((tg) => tg.group_id === groupId);
      const filas: FilaTablaHome[] = equiposDelGrupo.map((tg) => {
        const team = unwrapTeam(tg.teams as TeamRel);
        const s = standingsPorEquipo.get(tg.team_id as string);
        return {
          teamId: tg.team_id as string,
          nombreEquipo: team.nombre,
          escudoUrl: team.escudoUrl,
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
      return { groupId, letra: letraPorGrupo.get(groupId) ?? "?", filas };
    });
  }

  return { enVivo, proximoPartido, tablas };
}
