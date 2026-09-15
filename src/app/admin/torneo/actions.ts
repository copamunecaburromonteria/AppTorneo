"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { diaSemanaBogota, construirFechaHoraBogota } from "@/lib/franjas-horario";
import { LETRAS_GRUPO, generarFaseDeGrupos, type LetraGrupo } from "@/lib/torneo/generador-calendario";

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

  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath("/posiciones");
  revalidatePath("/estadisticas");
  revalidatePath("/lider-arbitros");
  revalidatePath("/equipos");
  revalidatePath("/");

  return { success: true };
}
