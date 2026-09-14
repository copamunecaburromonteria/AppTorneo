"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DIAS_VALIDOS,
  SLOTS_POR_DIA,
  diaSemanaBogota,
  construirFechaHoraBogota,
} from "@/lib/franjas-horario";

type ResultadoAccion = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, error: "No hay sesión activa." } as const;
  }
  return { supabase, error: null } as const;
}

/** Solo tiene sentido reprogramar un partido que todavía no se jugó (o
 * que quedó suspendido) — uno finalizado o en curso no se debe mover. */
const ESTADOS_REPROGRAMABLES = ["programado", "suspendido"];

/**
 * Reprograma un partido: cambia su fecha/hora y/o cancha, validando que
 * caiga dentro de la grilla fija de franjas del torneo (jueves y viernes
 * 7-10pm, sábado 5-9pm — ver `franjas-horario.ts`) y que no choque con
 * otro partido ya puesto en esa misma cancha+hora, ni con otro partido de
 * alguno de los dos equipos a esa misma hora (en la otra cancha).
 *
 * No hace falta ningún paso extra para que la tabla de posiciones quede
 * bien: `v_standings.pj` (partidos jugados) se calcula contando partidos
 * con `estado = 'finalizado'` — mover la fecha/cancha de un partido
 * `programado` no toca ese conteo hasta que el operador lo cierre de
 * verdad desde la consola de cancha.
 */
export async function reprogramarPartido(
  matchId: string,
  fechaYmd: string,
  hora: number,
  cancha: number
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  if (!matchId) return { success: false, error: "Falta el partido a reprogramar." };
  if (!fechaYmd || !/^\d{4}-\d{2}-\d{2}$/.test(fechaYmd)) {
    return { success: false, error: "Fecha inválida." };
  }
  if (cancha !== 1 && cancha !== 2) {
    return { success: false, error: "La cancha debe ser 1 o 2." };
  }

  const dow = diaSemanaBogota(fechaYmd);
  if (!DIAS_VALIDOS.includes(dow)) {
    return { success: false, error: "Solo se puede programar jueves, viernes o sábado." };
  }
  const slotsDelDia = SLOTS_POR_DIA[dow] ?? [];
  if (!slotsDelDia.includes(hora)) {
    return {
      success: false,
      error: `Esa hora no es una franja válida para ese día (franjas: ${slotsDelDia
        .map((h) => `${h}:00`)
        .join(", ")}).`,
    };
  }

  const { data: partido, error: partidoError } = await supabase
    .from("matches")
    .select("id, estado, equipo_local_id, equipo_visitante_id")
    .eq("id", matchId)
    .maybeSingle();

  if (partidoError || !partido) {
    return { success: false, error: "No se encontró el partido." };
  }
  if (!ESTADOS_REPROGRAMABLES.includes(partido.estado)) {
    return {
      success: false,
      error: "Solo se pueden reprogramar partidos en estado 'programado' o 'suspendido'.",
    };
  }

  const fechaHoraIso = construirFechaHoraBogota(fechaYmd, hora);

  // Choque de cancha: ¿ya hay otro partido en esa cancha, a esa misma hora?
  const { data: choqueCancha } = await supabase
    .from("matches")
    .select("id")
    .eq("fecha_hora_programada", fechaHoraIso)
    .eq("cancha", cancha)
    .neq("id", matchId)
    .maybeSingle();

  if (choqueCancha) {
    return { success: false, error: "Ya hay otro partido programado en esa cancha, a esa misma hora." };
  }

  // Choque de equipo: ¿alguno de los dos equipos ya juega a esa hora (en la otra cancha)?
  const equipoIds = [partido.equipo_local_id, partido.equipo_visitante_id].filter(
    (id): id is string => Boolean(id)
  );
  if (equipoIds.length > 0) {
    const { data: partidosMismaHora } = await supabase
      .from("matches")
      .select("id, equipo_local_id, equipo_visitante_id")
      .eq("fecha_hora_programada", fechaHoraIso)
      .neq("id", matchId);

    const enConflicto = (partidosMismaHora ?? []).some(
      (m) =>
        equipoIds.includes(m.equipo_local_id as string) ||
        equipoIds.includes(m.equipo_visitante_id as string)
    );
    if (enConflicto) {
      return {
        success: false,
        error: "Uno de los dos equipos ya tiene otro partido programado a esa misma hora.",
      };
    }
  }

  const { error } = await supabase
    .from("matches")
    .update({ fecha_hora_programada: fechaHoraIso, cancha })
    .eq("id", matchId);

  if (error) {
    return { success: false, error: `No se pudo reprogramar el partido: ${error.message}` };
  }

  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath(`/partidos/${matchId}`);
  revalidatePath("/");
  revalidatePath("/posiciones");
  revalidatePath("/lider-arbitros");

  return { success: true };
}
