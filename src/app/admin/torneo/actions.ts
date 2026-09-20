"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { diaSemanaBogota, construirFechaHoraBogota } from "@/lib/franjas-horario";
import { LETRAS_GRUPO, generarFaseDeGrupos, type LetraGrupo } from "@/lib/torneo/generador-calendario";
import {
  calcularStandings,
  clasificarGrupo,
  generarOctavos,
  generarCuartos,
  generarSemifinal,
  generarFinal,
  generarTercerPuesto,
  ubicarFaseEliminacion,
  validarBracketEliminacion,
  type ResultadoPartido,
  type ResultadoEliminacion,
  type ResultadoSemifinal,
  type PartidoEliminacionGenerado,
  type PartidoEliminacionUbicado,
} from "@/lib/torneo/generador-eliminacion";

type ResultadoAccion = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No hay sesión activa." } as const;
  }
  return { error: null } as const;
}

/** Revalida todas las rutas públicas/admin que muestran calendario,
 * posiciones o equipos — mismo listado que ya usaba `iniciarTorneo`,
 * reutilizado por los generadores de fase eliminatoria. */
function revalidarRutasTorneo() {
  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath("/posiciones");
  revalidatePath("/estadisticas");
  revalidatePath("/lider-arbitros");
  revalidatePath("/equipos");
  revalidatePath("/");
}

type ConfigFaseFinal = {
  numero_canchas: number;
  horarios_permitidos: number[];
  fecha_inicio_octavos: string | null;
  fecha_inicio_cuartos: string | null;
  fecha_semifinal: string | null;
  fecha_final: string | null;
  incluye_tercer_puesto: boolean;
  fecha_tercer_puesto: string | null;
};

/** Lee de `torneo_config` los parámetros que gobiernan la generación de
 * octavos en adelante (canchas, horarios, fechas de cada fase) — ver
 * migración `add_fase_final_config_a_torneo_config`. */
async function leerConfigFaseFinal(
  admin: ReturnType<typeof createAdminClient>
): Promise<ConfigFaseFinal | null> {
  const { data, error } = await admin
    .from("torneo_config")
    .select(
      "numero_canchas, horarios_permitidos, fecha_inicio_octavos, fecha_inicio_cuartos, fecha_semifinal, fecha_final, incluye_tercer_puesto, fecha_tercer_puesto"
    )
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data as ConfigFaseFinal;
}

/**
 * "Iniciar torneo" — genera de una sola vez el sorteo automático de los 4
 * grupos y las 60 fechas de la fase de grupos. Ver diseño completo en
 * `claude/generador-calendario.md` del proyecto. No genera octavos,
 * cuartos ni semifinal — esas fases se generan aparte, cada una con su
 * propio botón, cuando exista el cruce (depende de quién clasificó).
 *
 * Usa la service role (`createAdminClient`) para las escrituras porque
 * son operaciones masivas (24 filas de `team_group` + 60 de `matches` en
 * una sola operación lógica) que no tiene sentido exponer a las políticas
 * RLS fila por fila — el admin ya está autenticado y autorizado arriba.
 */
export async function iniciarTorneo(fechaInicioYmd: string): Promise<ResultadoAccion> {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  if (!fechaInicioYmd || !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicioYmd)) {
    return { success: false, error: "Fecha inválida." };
  }
  if (diaSemanaBogota(fechaInicioYmd) !== 4) {
    return { success: false, error: "El torneo debe iniciar un jueves." };
  }

  const admin = createAdminClient();

  const { data: config, error: configError } = await admin
    .from("torneo_config")
    .select("numero_equipos_torneo, fecha_inicio_torneo")
    .eq("id", 1)
    .maybeSingle();
  if (configError || !config) {
    return { success: false, error: "No se pudo leer la configuración del torneo." };
  }
  if (config.fecha_inicio_torneo) {
    return { success: false, error: "El torneo ya fue iniciado — no se puede repetir este paso." };
  }

  const { count: partidosExistentes } = await admin
    .from("matches")
    .select("id", { count: "exact", head: true });
  if ((partidosExistentes ?? 0) > 0) {
    return { success: false, error: "Ya existen partidos en el calendario — no se puede repetir este paso." };
  }

  const { data: equipos, error: equiposError } = await admin
    .from("teams")
    .select("id, orden_inscripcion, estado_inscripcion")
    .eq("estado_inscripcion", "validado")
    .order("orden_inscripcion", { ascending: true });
  if (equiposError) {
    return { success: false, error: "No se pudo leer la lista de equipos." };
  }
  const equiposValidados = (equipos ?? []).filter(
    (e): e is { id: string; orden_inscripcion: number; estado_inscripcion: string } =>
      e.orden_inscripcion !== null
  );
  if (equiposValidados.length !== config.numero_equipos_torneo) {
    return {
      success: false,
      error: `Se necesitan ${config.numero_equipos_torneo} equipos listos (validados y pagados) — hay ${equiposValidados.length}.`,
    };
  }

  const teamIds = equiposValidados.map((e) => e.id);
  const { count: cuotasPendientes } = await admin
    .from("payment_installments")
    .select("id", { count: "exact", head: true })
    .in("team_id", teamIds)
    .neq("estado", "pagada");
  if ((cuotasPendientes ?? 0) > 0) {
    return {
      success: false,
      error: "Todavía hay cuotas pendientes de pago entre los equipos validados.",
    };
  }

  const { data: gruposDb, error: gruposDbError } = await admin.from("groups").select("id, letra");
  if (gruposDbError || !gruposDb || gruposDb.length !== 4) {
    return { success: false, error: "No se pudo leer la tabla de grupos (A-D)." };
  }
  const idPorLetra = new Map<string, string>(gruposDb.map((g) => [g.letra.trim().toUpperCase(), g.id]));

  let generado;
  try {
    generado = generarFaseDeGrupos(
      equiposValidados.map((e) => ({ id: e.id, orden_inscripcion: e.orden_inscripcion })),
      fechaInicioYmd
    );
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo generar el calendario.",
    };
  }

  const teamGroupRows = LETRAS_GRUPO.flatMap((letra: LetraGrupo) => {
    const groupId = idPorLetra.get(letra);
    if (!groupId) return [];
    return generado.grupos[letra].map((teamId) => ({ team_id: teamId, group_id: groupId }));
  });
  if (teamGroupRows.length !== 24) {
    return { success: false, error: "El sorteo no produjo 24 asignaciones de grupo — no se guardó nada." };
  }

  const { error: teamGroupError } = await admin.from("team_group").insert(teamGroupRows);
  if (teamGroupError) {
    return { success: false, error: `No se pudo guardar el sorteo: ${teamGroupError.message}` };
  }

  const matchRows = generado.partidos.map((p) => ({
    fase: "Fase de grupos",
    group_id: idPorLetra.get(p.grupo) ?? null,
    llave: null,
    equipo_local_id: p.local,
    equipo_visitante_id: p.visitante,
    cancha: p.cancha,
    fecha_hora_programada: construirFechaHoraBogota(p.fechaYmd, p.hora),
    estado: "programado",
    jornada: p.jornada,
  }));

  const { error: matchesError } = await admin.from("matches").insert(matchRows);
  if (matchesError) {
    // Revertir el sorteo si los partidos no se pudieron guardar, para no
    // dejar team_group a medias sin ningún partido.
    await admin.from("team_group").delete().in(
      "team_id",
      teamGroupRows.map((r) => r.team_id)
    );
    return { success: false, error: `No se pudieron guardar los partidos: ${matchesError.message}` };
  }

  const { error: configUpdateError } = await admin
    .from("torneo_config")
    .update({ fecha_inicio_torneo: fechaInicioYmd })
    .eq("id", 1);
  if (configUpdateError) {
    return {
      success: false,
      error: `El calendario se generó, pero no se pudo guardar la fecha de inicio: ${configUpdateError.message}`,
    };
  }

  revalidarRutasTorneo();

  return { success: true };
}

/**
 * "Iniciar octavos de final" — clasifica automáticamente a los 4 primeros
 * de cada grupo (desempate: puntos → diferencia de gol → goles a favor →
 * enfrentamiento directo — ver `clasificarGrupo`), arma los cruces fijos
 * A-B y C-D y genera los 8 partidos de octavos. Requiere que los 60
 * partidos de la fase de grupos estén `finalizado`. Si algún grupo queda
 * con un empate que el enfrentamiento directo no logra resolver, no se
 * inventa un ganador: se bloquea con un error que nombra a los equipos
 * empatados para que un admin lo resuelva manualmente.
 */
export async function iniciarOctavos(): Promise<ResultadoAccion> {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const admin = createAdminClient();

  const { count: yaExisten } = await admin
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("jornada", 6);
  if ((yaExisten ?? 0) > 0) {
    return { success: false, error: "Los octavos de final ya fueron generados — no se puede repetir este paso." };
  }

  const { data: partidosGrupos, error: partidosError } = await admin
    .from("matches")
    .select("estado, equipo_local_id, equipo_visitante_id, marcador_local, marcador_visitante")
    .gte("jornada", 1)
    .lte("jornada", 5);
  if (partidosError) {
    return { success: false, error: "No se pudo leer los partidos de la fase de grupos." };
  }
  if ((partidosGrupos ?? []).length !== 60) {
    return {
      success: false,
      error: `La fase de grupos no está completa — hay ${partidosGrupos?.length ?? 0} partidos, se esperaban 60. Corre "Iniciar torneo" primero.`,
    };
  }
  const sinFinalizarGrupos = partidosGrupos!.filter((p) => p.estado !== "finalizado");
  if (sinFinalizarGrupos.length > 0) {
    return {
      success: false,
      error: `Todavía hay ${sinFinalizarGrupos.length} partidos de la fase de grupos sin finalizar.`,
    };
  }

  const { data: gruposDb, error: gruposDbError } = await admin.from("groups").select("id, letra");
  if (gruposDbError || !gruposDb || gruposDb.length !== 4) {
    return { success: false, error: "No se pudo leer la tabla de grupos (A-D)." };
  }
  const letraPorGroupId = new Map<string, LetraGrupo>(
    gruposDb.map((g) => [g.id, g.letra.trim().toUpperCase() as LetraGrupo])
  );

  const { data: teamGroupRows, error: teamGroupError } = await admin
    .from("team_group")
    .select("team_id, group_id");
  if (teamGroupError || !teamGroupRows || teamGroupRows.length !== 24) {
    return { success: false, error: "No se pudo leer la asignación de equipos a grupos." };
  }

  const equiposPorGrupo: Record<LetraGrupo, string[]> = { A: [], B: [], C: [], D: [] };
  const grupoPorEquipo = new Map<string, LetraGrupo>();
  for (const tg of teamGroupRows) {
    const letra = letraPorGroupId.get(tg.group_id);
    if (!letra) continue;
    equiposPorGrupo[letra].push(tg.team_id);
    grupoPorEquipo.set(tg.team_id, letra);
  }

  const config = await leerConfigFaseFinal(admin);
  if (!config) return { success: false, error: "No se pudo leer la configuración de la fase final." };
  if (!config.fecha_inicio_octavos) {
    return { success: false, error: "Falta configurar la fecha de inicio de octavos en torneo_config." };
  }

  const todosLosEquipos = teamGroupRows.map((tg) => tg.team_id);
  const resultados: ResultadoPartido[] = partidosGrupos!.map((p) => ({
    local: p.equipo_local_id as string,
    visitante: p.equipo_visitante_id as string,
    marcadorLocal: p.marcador_local as number,
    marcadorVisitante: p.marcador_visitante as number,
  }));
  const standings = calcularStandings(todosLosEquipos, resultados);

  const clasificados: Record<LetraGrupo, string[]> = { A: [], B: [], C: [], D: [] };
  for (const letra of LETRAS_GRUPO) {
    const resultadosDelGrupo = resultados.filter(
      (r) => grupoPorEquipo.get(r.local) === letra && grupoPorEquipo.get(r.visitante) === letra
    );
    const clasificacion = clasificarGrupo(equiposPorGrupo[letra], standings, resultadosDelGrupo);
    if (clasificacion.ambiguo) {
      return {
        success: false,
        error: `Empate sin resolver en el grupo ${letra} entre los equipos ${clasificacion.equiposEmpatados.join(
          ", "
        )} — no se puede clasificar automáticamente. Resuélvelo manualmente antes de generar octavos.`,
      };
    }
    clasificados[letra] = clasificacion.orden.slice(0, 4);
  }

  let octavos: PartidoEliminacionUbicado[];
  try {
    const generados = generarOctavos(clasificados);
    octavos = ubicarFaseEliminacion(
      generados,
      config.fecha_inicio_octavos,
      3,
      config.numero_canchas,
      config.horarios_permitidos
    );
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudieron generar los octavos." };
  }

  const problemas = validarBracketEliminacion(octavos, {
    totalEsperado: 8,
    faseEsperada: "Octavos de Final",
    grupoPorEquipo,
  });
  if (problemas.length > 0) {
    return { success: false, error: `El bracket de octavos no pasó la validación: ${problemas.join(" | ")}` };
  }

  const matchRows = octavos.map((p) => ({
    fase: p.fase,
    group_id: null,
    llave: p.llave,
    equipo_local_id: p.local,
    equipo_visitante_id: p.visitante,
    cancha: p.cancha,
    fecha_hora_programada: construirFechaHoraBogota(p.fechaYmd, p.hora),
    estado: "programado",
    jornada: 6,
  }));

  const { error: insertError } = await admin.from("matches").insert(matchRows);
  if (insertError) {
    return { success: false, error: `No se pudieron guardar los octavos: ${insertError.message}` };
  }

  revalidarRutasTorneo();
  return { success: true };
}

/**
 * "Iniciar cuartos de final" — arma los 4 partidos de cuartos a partir de
 * los ganadores de los 8 octavos (agrupados por lado de llave "AB"/"CD",
 * ver `generarCuartos`). Requiere que los 8 octavos estén `finalizado` y
 * con `winner_team_id` registrado.
 */
export async function iniciarCuartos(): Promise<ResultadoAccion> {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const admin = createAdminClient();

  const { count: yaExisten } = await admin
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("jornada", 7);
  if ((yaExisten ?? 0) > 0) {
    return { success: false, error: "Los cuartos de final ya fueron generados — no se puede repetir este paso." };
  }

  const { data: octavos, error: octavosError } = await admin
    .from("matches")
    .select("estado, llave, winner_team_id")
    .eq("jornada", 6);
  if (octavosError) return { success: false, error: "No se pudo leer los octavos de final." };
  if ((octavos ?? []).length !== 8) {
    return {
      success: false,
      error: `Los octavos de final no están generados — hay ${octavos?.length ?? 0}, se esperaban 8.`,
    };
  }
  const sinFinalizarOctavos = octavos!.filter((p) => p.estado !== "finalizado" || !p.winner_team_id);
  if (sinFinalizarOctavos.length > 0) {
    return {
      success: false,
      error: `Todavía hay ${sinFinalizarOctavos.length} octavos sin finalizar o sin ganador registrado.`,
    };
  }

  const config = await leerConfigFaseFinal(admin);
  if (!config) return { success: false, error: "No se pudo leer la configuración de la fase final." };
  if (!config.fecha_inicio_cuartos) {
    return { success: false, error: "Falta configurar la fecha de inicio de cuartos en torneo_config." };
  }

  const resultadosOctavos: ResultadoEliminacion[] = octavos!.map((p) => ({
    llave: p.llave as string,
    ganador: p.winner_team_id as string,
  }));

  let cuartos: PartidoEliminacionUbicado[];
  try {
    const generados = generarCuartos(resultadosOctavos);
    cuartos = ubicarFaseEliminacion(
      generados,
      config.fecha_inicio_cuartos,
      2,
      config.numero_canchas,
      config.horarios_permitidos
    );
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudieron generar los cuartos." };
  }

  const problemas = validarBracketEliminacion(cuartos, { totalEsperado: 4, faseEsperada: "Cuartos de Final" });
  if (problemas.length > 0) {
    return { success: false, error: `El bracket de cuartos no pasó la validación: ${problemas.join(" | ")}` };
  }

  const matchRows = cuartos.map((p) => ({
    fase: p.fase,
    group_id: null,
    llave: p.llave,
    equipo_local_id: p.local,
    equipo_visitante_id: p.visitante,
    cancha: p.cancha,
    fecha_hora_programada: construirFechaHoraBogota(p.fechaYmd, p.hora),
    estado: "programado",
    jornada: 7,
  }));

  const { error: insertError } = await admin.from("matches").insert(matchRows);
  if (insertError) {
    return { success: false, error: `No se pudieron guardar los cuartos: ${insertError.message}` };
  }

  revalidarRutasTorneo();
  return { success: true };
}

/**
 * "Iniciar semifinal" — arma los 2 partidos de semifinal a partir de los
 * ganadores de cuartos (SF-1 = lado AB-1 vs lado CD-1, SF-2 = lado AB-2 vs
 * lado CD-2 — ver `generarSemifinal`). Secuencial, no simultánea: SF-1 a
 * las 7pm, SF-2 a las 8pm (confirmado con Fernando, no ambas a la misma
 * hora). Requiere que los 4 cuartos estén `finalizado` y con
 * `winner_team_id` registrado.
 */
export async function iniciarSemifinal(): Promise<ResultadoAccion> {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const admin = createAdminClient();

  const { count: yaExisten } = await admin
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("jornada", 8);
  if ((yaExisten ?? 0) > 0) {
    return { success: false, error: "La semifinal ya fue generada — no se puede repetir este paso." };
  }

  const { data: cuartos, error: cuartosError } = await admin
    .from("matches")
    .select("estado, llave, winner_team_id")
    .eq("jornada", 7);
  if (cuartosError) return { success: false, error: "No se pudo leer los cuartos de final." };
  if ((cuartos ?? []).length !== 4) {
    return {
      success: false,
      error: `Los cuartos de final no están generados — hay ${cuartos?.length ?? 0}, se esperaban 4.`,
    };
  }
  const sinFinalizarCuartos = cuartos!.filter((p) => p.estado !== "finalizado" || !p.winner_team_id);
  if (sinFinalizarCuartos.length > 0) {
    return {
      success: false,
      error: `Todavía hay ${sinFinalizarCuartos.length} cuartos sin finalizar o sin ganador registrado.`,
    };
  }

  const config = await leerConfigFaseFinal(admin);
  if (!config) return { success: false, error: "No se pudo leer la configuración de la fase final." };
  if (!config.fecha_semifinal) {
    return { success: false, error: "Falta configurar la fecha de la semifinal en torneo_config." };
  }

  const resultadosCuartos: ResultadoEliminacion[] = cuartos!.map((p) => ({
    llave: p.llave as string,
    ganador: p.winner_team_id as string,
  }));

  let semifinal: PartidoEliminacionUbicado[];
  try {
    const generados = generarSemifinal(resultadosCuartos);
    semifinal = ubicarFaseEliminacion(
      generados,
      config.fecha_semifinal,
      1,
      config.numero_canchas,
      config.horarios_permitidos
    );
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo generar la semifinal." };
  }

  const problemas = validarBracketEliminacion(semifinal, { totalEsperado: 2, faseEsperada: "Semifinal" });
  if (problemas.length > 0) {
    return { success: false, error: `La semifinal no pasó la validación: ${problemas.join(" | ")}` };
  }

  const matchRows = semifinal.map((p) => ({
    fase: p.fase,
    group_id: null,
    llave: p.llave,
    equipo_local_id: p.local,
    equipo_visitante_id: p.visitante,
    cancha: p.cancha,
    fecha_hora_programada: construirFechaHoraBogota(p.fechaYmd, p.hora),
    estado: "programado",
    jornada: 8,
  }));

  const { error: insertError } = await admin.from("matches").insert(matchRows);
  if (insertError) {
    return { success: false, error: `No se pudo guardar la semifinal: ${insertError.message}` };
  }

  revalidarRutasTorneo();
  return { success: true };
}

/**
 * "Iniciar final" — arma la gran final (y, si `torneo_config.incluye_tercer_puesto`,
 * el partido por el tercer puesto) a partir de ganadores/perdedores de la
 * semifinal. Mismo día (`fecha_final`/`fecha_tercer_puesto`, normalmente
 * el mismo): tercer puesto a las 7pm, final a las 8pm — si no se juega
 * tercer puesto, la final queda sola a las 7pm. Requiere que las 2
 * semifinales estén `finalizado` y con `winner_team_id` registrado.
 */
export async function iniciarFinalYTercerPuesto(): Promise<ResultadoAccion> {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const admin = createAdminClient();

  const { count: yaExisten } = await admin
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("jornada", 9);
  if ((yaExisten ?? 0) > 0) {
    return { success: false, error: "La final ya fue generada — no se puede repetir este paso." };
  }

  const { data: semifinal, error: semifinalError } = await admin
    .from("matches")
    .select("estado, llave, equipo_local_id, equipo_visitante_id, winner_team_id")
    .eq("jornada", 8);
  if (semifinalError) return { success: false, error: "No se pudo leer la semifinal." };
  if ((semifinal ?? []).length !== 2) {
    return {
      success: false,
      error: `La semifinal no está generada — hay ${semifinal?.length ?? 0}, se esperaban 2.`,
    };
  }
  const sinFinalizarSemis = semifinal!.filter((p) => p.estado !== "finalizado" || !p.winner_team_id);
  if (sinFinalizarSemis.length > 0) {
    return {
      success: false,
      error: `Todavía hay ${sinFinalizarSemis.length} semifinales sin finalizar o sin ganador registrado.`,
    };
  }

  const config = await leerConfigFaseFinal(admin);
  if (!config) return { success: false, error: "No se pudo leer la configuración de la fase final." };
  if (!config.fecha_final) {
    return { success: false, error: "Falta configurar la fecha de la final en torneo_config." };
  }

  const resultadosSemifinal: ResultadoSemifinal[] = semifinal!.map((p) => {
    const ganador = p.winner_team_id as string;
    const perdedor =
      ganador === p.equipo_local_id ? (p.equipo_visitante_id as string) : (p.equipo_local_id as string);
    return { llave: p.llave as "SF-1" | "SF-2", ganador, perdedor };
  });

  let partidos: PartidoEliminacionGenerado[];
  try {
    partidos = config.incluye_tercer_puesto
      ? [generarTercerPuesto(resultadosSemifinal), generarFinal(resultadosSemifinal)]
      : [generarFinal(resultadosSemifinal)];
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo generar la final." };
  }

  // Tercer puesto a la primera franja disponible, final a la última — con
  // los horarios de la edición 2026 (7pm/8pm) eso es tercer puesto 7pm,
  // final 8pm; si no se juega tercer puesto, la final queda sola en la
  // primera franja.
  const horarios = config.horarios_permitidos;
  const ubicados: PartidoEliminacionUbicado[] = partidos.map((p) => ({
    ...p,
    fechaYmd:
      p.fase === "Tercer puesto" && config.fecha_tercer_puesto ? config.fecha_tercer_puesto : (config.fecha_final as string),
    hora: p.fase === "Tercer puesto" ? horarios[0] : horarios[horarios.length - 1],
    cancha: 1,
  }));

  const problemasFinal = validarBracketEliminacion(
    ubicados.filter((p) => p.fase === "Final"),
    { totalEsperado: 1, faseEsperada: "Final" }
  );
  const problemasTercerPuesto = config.incluye_tercer_puesto
    ? validarBracketEliminacion(
        ubicados.filter((p) => p.fase === "Tercer puesto"),
        { totalEsperado: 1, faseEsperada: "Tercer puesto" }
      )
    : [];
  const problemas = [...problemasFinal, ...problemasTercerPuesto];
  if (problemas.length > 0) {
    return { success: false, error: `La final no pasó la validación: ${problemas.join(" | ")}` };
  }

  const matchRows = ubicados.map((p) => ({
    fase: p.fase,
    group_id: null,
    llave: p.llave,
    equipo_local_id: p.local,
    equipo_visitante_id: p.visitante,
    cancha: p.cancha,
    fecha_hora_programada: construirFechaHoraBogota(p.fechaYmd, p.hora),
    estado: "programado",
    jornada: 9,
  }));

  const { error: insertError } = await admin.from("matches").insert(matchRows);
  if (insertError) {
    return { success: false, error: `No se pudo guardar la final: ${insertError.message}` };
  }

  revalidarRutasTorneo();
  return { success: true };
}
