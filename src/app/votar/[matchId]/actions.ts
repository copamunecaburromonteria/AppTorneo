"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerOCrearDeviceToken, hashIpActual } from "@/lib/votacion/antifraude";

export type ResultadoVoto = { success: true } | { success: false; error: string };

const MENSAJES_ERROR: Record<string, string> = {
  ya_voto: "Ya registramos un voto desde este dispositivo para este partido — ¡gracias por participar!",
  votacion_cerrada: "La votación para este partido ya cerró.",
  sin_arbitro_confirmado: "La votación para este partido todavía no está habilitada.",
  jugador_invalido: "Selecciona un jugador válido.",
  estrellas_invalidas: "Selecciona una calificación de 1 a 5 estrellas.",
  device_token_invalido: "No se pudo identificar tu dispositivo — intenta de nuevo.",
  partido_no_existe: "Este partido ya no existe.",
};

/**
 * Registra el voto de MVP + la calificación de 1-5 estrellas al equipo
 * arbitral en una sola operación, vía la función segura
 * `registrar_voto_partido` en Supabase (ver migración
 * `22_votacion_qr_mvp_y_calificacion_arbitraje`). Esa función es la que de
 * verdad valida la ventana de votación y el gate de árbitro confirmado —
 * esta Server Action solo arma los parámetros (token de dispositivo + hash
 * de IP) y traduce el resultado a un mensaje legible.
 */
export async function registrarVoto(
  matchId: string,
  playerId: string,
  estrellas: number
): Promise<ResultadoVoto> {
  if (!playerId) return { success: false, error: "Selecciona un jugador." };
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return { success: false, error: "Selecciona una calificación de 1 a 5 estrellas." };
  }

  const deviceToken = await obtenerOCrearDeviceToken();
  const ipHash = await hashIpActual();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("registrar_voto_partido", {
    p_match_id: matchId,
    p_player_id: playerId,
    p_estrellas: estrellas,
    p_device_token: deviceToken,
    p_ip_hash: ipHash,
  });

  if (error) {
    return { success: false, error: "No se pudo registrar el voto — intenta de nuevo." };
  }

  const resultado = data as { success: boolean; error?: string };
  if (!resultado.success) {
    return {
      success: false,
      error: MENSAJES_ERROR[resultado.error ?? ""] ?? "No se pudo registrar el voto.",
    };
  }

  revalidatePath(`/votar/${matchId}`);
  return { success: true };
}
