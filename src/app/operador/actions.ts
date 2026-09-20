"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerSesionOperador, borrarCookieSesion } from "@/lib/operador/sesion";

type ResultadoAccion = { success: true } | { success: false; error: string };

const TIPOS_EVENTO = new Set([
  "gol",
  "autogol",
  "tarjeta_amarilla",
  "tarjeta_azul",
  "tarjeta_roja",
  "cambio",
]);

async function requireOperador() {
  const sesion = await obtenerSesionOperador();
  if (!sesion) redirect("/operador/login");
  return { admin: createAdminClient(), sesion };
}

export async function cerrarSesionOperador() {
  await borrarCookieSesion();
  redirect("/operador/login");
}

/**
 * Recalcula el marcador de un partido a partir de los eventos NO anulados.
 * Un autogol de un jugador del equipo X suma para el equipo contrario.
 */
async function recalcularMarcador(
  admin: ReturnType<typeof createAdminClient>,
  matchId: string,
  equipoLocalId: string,
  equipoVisitanteId: string
) {
  const { data: eventos } = await admin
    .from("match_events")
    .select("tipo, equipo_id")
    .eq("match_id", matchId)
    .eq("anulado", false)
    .in("tipo", ["gol", "autogol"]);

  let local = 0;
  let visitante = 0;

  for (const ev of eventos ?? []) {
    const esLocal = ev.equipo_id === equipoLocalId;
    const esVisitante = ev.equipo_id === equipoVisitanteId;
    if (ev.tipo === "gol") {
      if (esLocal) local += 1;
      else if (esVisitante) visitante += 1;
    } else if (ev.tipo === "autogol") {
      // El autogol de un jugador beneficia al equipo contrario.
      if (esLocal) visitante += 1;
      else if (esVisitante) local += 1;
    }
  }

  await admin
    .from("matches")
    .update({ marcador_local: local, marcador_visitante: visitante })
    .eq("id", matchId);
}

async function obtenerEquipos(admin: ReturnType<typeof createAdminClient>, matchId: string) {
  const { data } = await admin
    .from("matches")
    .select("equipo_local_id, equipo_visitante_id")
    .eq("id", matchId)
    .single();
  return { local: data?.equipo_local_id as string | null, visitante: data?.equipo_visitante_id as string | null };
}

export async function iniciarPrimerTiempo(matchId: string): Promise<ResultadoAccion> {
  const { admin } = await requireOperador();

  const { error } = await admin
    .from("matches")
    .update({ estado: "en_curso", hora_inicio_real: new Date().toISOString() })
    .eq("id", matchId)
    .eq("estado", "programado");

  if (error) return { success: false, error: `No se pudo iniciar el partido: ${error.message}` };

  revalidatePath(`/operador/partido/${matchId}`);
  return { success: true };
}

export async function marcarDescanso(matchId: string): Promise<ResultadoAccion> {
  const { admin } = await requireOperador();

  const { error } = await admin
    .from("matches")
    .update({ estado: "entretiempo" })
    .eq("id", matchId)
    .eq("estado", "en_curso");

  if (error) return { success: false, error: `No se pudo marcar el descanso: ${error.message}` };

  revalidatePath(`/operador/partido/${matchId}`);
  return { success: true };
}

export async function iniciarSegundoTiempo(matchId: string): Promise<ResultadoAccion> {
  const { admin } = await requireOperador();

  const { error } = await admin
    .from("matches")
    .update({ estado: "en_curso" })
    .eq("id", matchId)
    .eq("estado", "entretiempo");

  if (error) return { success: false, error: `No se pudo reanudar el partido: ${error.message}` };

  revalidatePath(`/operador/partido/${matchId}`);
  return { success: true };
}

/**
 * Cierra y oficializa un partido. Calcula `winner_team_id` a partir del
 * marcador reglamentario cuando no hay empate. Un empate en fase de grupos
 * (jornada 1-5) es válido y queda con `winner_team_id = null`, sin
 * penales. Un empate en fase eliminatoria (jornada >= 6) exige
 * `penalesLocal`/`penalesVisitante` (distintos entre sí) para poder
 * definir el ganador — sin eso, se bloquea el cierre — porque la
 * siguiente ronda del bracket (`iniciarCuartos`/`iniciarSemifinal`/
 * `iniciarFinalYTercerPuesto`, ver `src/app/admin/torneo/actions.ts`)
 * necesita un ganador para poder generarse.
 */
export async function cerrarPartido(
  matchId: string,
  penalesLocal?: number,
  penalesVisitante?: number
): Promise<ResultadoAccion> {
  const { admin } = await requireOperador();

  const { data: partido, error: partidoError } = await admin
    .from("matches")
    .select("marcador_local, marcador_visitante, jornada, equipo_local_id, equipo_visitante_id")
    .eq("id", matchId)
    .maybeSingle();

  if (partidoError || !partido) {
    return { success: false, error: "No se encontró el partido." };
  }

  const marcadorLocal = partido.marcador_local as number;
  const marcadorVisitante = partido.marcador_visitante as number;
  const jornada = partido.jornada as number | null;
  const esFaseEliminatoria = jornada !== null && jornada >= 6;

  let winnerTeamId: string | null = null;
  let penalesParaGuardar: { penales_local: number | null; penales_visitante: number | null } = {
    penales_local: null,
    penales_visitante: null,
  };

  if (marcadorLocal !== marcadorVisitante) {
    winnerTeamId =
      marcadorLocal > marcadorVisitante
        ? (partido.equipo_local_id as string)
        : (partido.equipo_visitante_id as string);
  } else if (esFaseEliminatoria) {
    const penalesValidos =
      penalesLocal !== undefined &&
      penalesVisitante !== undefined &&
      Number.isInteger(penalesLocal) &&
      Number.isInteger(penalesVisitante) &&
      penalesLocal >= 0 &&
      penalesVisitante >= 0;
    if (!penalesValidos) {
      return {
        success: false,
        error: "Empate en fase eliminatoria: registra el marcador de penales para definir el ganador.",
      };
    }
    if (penalesLocal === penalesVisitante) {
      return { success: false, error: "El marcador de penales no puede quedar empatado." };
    }
    winnerTeamId =
      (penalesLocal as number) > (penalesVisitante as number)
        ? (partido.equipo_local_id as string)
        : (partido.equipo_visitante_id as string);
    penalesParaGuardar = { penales_local: penalesLocal as number, penales_visitante: penalesVisitante as number };
  }
  // Empate en fase de grupos: winnerTeamId queda null, empate válido, sin penales.

  const { error } = await admin
    .from("matches")
    .update({
      estado: "finalizado",
      hora_fin_real: new Date().toISOString(),
      winner_team_id: winnerTeamId,
      ...penalesParaGuardar,
    })
    .eq("id", matchId);

  if (error) return { success: false, error: `No se pudo cerrar el partido: ${error.message}` };

  revalidatePath(`/operador/partido/${matchId}`);
  revalidatePath("/operador");
  return { success: true };
}

export async function registrarEvento(
  matchId: string,
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { admin, sesion } = await requireOperador();

  const tipo = formData.get("tipo") as string;
  const equipoId = formData.get("equipo_id") as string;
  const jugadorId = (formData.get("jugador_id") as string | null) || null;
  const minutoRaw = (formData.get("minuto") as string | null)?.trim();

  if (!TIPOS_EVENTO.has(tipo)) return { success: false, error: "Tipo de evento inválido." };
  if (!equipoId) return { success: false, error: "Falta el equipo." };
  if (!jugadorId) return { success: false, error: "Falta el jugador." };

  const minuto = Number(minutoRaw);
  if (!minutoRaw || !Number.isInteger(minuto) || minuto < 0 || minuto > 120) {
    return { success: false, error: "El minuto debe ser un número entre 0 y 120." };
  }

  const { error } = await admin.from("match_events").insert({
    match_id: matchId,
    tipo,
    equipo_id: equipoId,
    jugador_id: jugadorId,
    minuto,
    creado_por: sesion.operadorId,
  });

  if (error) return { success: false, error: `No se pudo registrar el evento: ${error.message}` };

  if (tipo === "gol" || tipo === "autogol") {
    const { local, visitante } = await obtenerEquipos(admin, matchId);
    if (local && visitante) await recalcularMarcador(admin, matchId, local, visitante);
  }

  revalidatePath(`/operador/partido/${matchId}`);
  return { success: true };
}

export async function deshacerUltimoEvento(matchId: string): Promise<ResultadoAccion> {
  const { admin } = await requireOperador();

  const { data: ultimo, error: buscarError } = await admin
    .from("match_events")
    .select("id, tipo")
    .eq("match_id", matchId)
    .eq("anulado", false)
    .order("creado_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (buscarError) return { success: false, error: "No se pudo buscar el último evento." };
  if (!ultimo) return { success: false, error: "No hay eventos para deshacer." };

  const { error } = await admin.from("match_events").update({ anulado: true }).eq("id", ultimo.id);
  if (error) return { success: false, error: `No se pudo deshacer el evento: ${error.message}` };

  if (ultimo.tipo === "gol" || ultimo.tipo === "autogol") {
    const { local, visitante } = await obtenerEquipos(admin, matchId);
    if (local && visitante) await recalcularMarcador(admin, matchId, local, visitante);
  }

  revalidatePath(`/operador/partido/${matchId}`);
  return { success: true };
}

export async function asignarArbitro(
  matchId: string,
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { admin } = await requireOperador();

  const arbitroId = formData.get("arbitro_id") as string;
  const rol = (formData.get("rol") as string) || "principal";

  if (!arbitroId) return { success: false, error: "Selecciona un árbitro." };

  const { error } = await admin
    .from("partido_arbitros")
    .upsert(
      { match_id: matchId, arbitro_id: arbitroId, rol },
      { onConflict: "match_id,arbitro_id" }
    );

  if (error) return { success: false, error: `No se pudo asignar el árbitro: ${error.message}` };

  revalidatePath(`/operador/partido/${matchId}`);
  return { success: true };
}

export async function quitarArbitro(matchId: string, arbitroId: string): Promise<ResultadoAccion> {
  const { admin } = await requireOperador();

  const { error } = await admin
    .from("partido_arbitros")
    .delete()
    .eq("match_id", matchId)
    .eq("arbitro_id", arbitroId);

  if (error) return { success: false, error: `No se pudo quitar el árbitro: ${error.message}` };

  revalidatePath(`/operador/partido/${matchId}`);
  return { success: true };
}
