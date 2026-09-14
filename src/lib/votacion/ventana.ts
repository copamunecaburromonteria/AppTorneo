export type MatchVentana = {
  estado: "programado" | "en_curso" | "entretiempo" | "finalizado" | "suspendido";
  hora_inicio_real: string | null;
  hora_fin_real: string | null;
  arbitros_confirmados_at: string | null;
};

export type ConfigVentana = {
  duracion_tiempo_minutos: number;
  duracion_descanso_minutos: number;
  minutos_previos_fin_para_votacion: number;
  horas_ventana_votacion_post_partido: number;
};

/**
 * Espejo en TypeScript de la regla que aplica — del lado del servidor, y de
 * forma que no se puede saltar — la función `registrar_voto_partido` en
 * Supabase (ver migración `22_votacion_qr_mvp_y_calificacion_arbitraje`).
 * Esta copia es solo para decidir QUÉ MOSTRAR en la página pública (qué
 * partidos aparecen como "en votación"); la validación real, la que de
 * verdad protege contra fraude, vive en la base de datos — se repite ahí a
 * propósito para que no se pueda saltar modificando el cliente.
 *
 * Regla (definida por Fernando, 2026-09-14):
 *  - El partido debe tener árbitro(s) confirmado(s) por el Líder de
 *    Árbitros (`matches.arbitros_confirmados_at`) — "cuando se asigna
 *    árbitro, empieza a funcionar el QR".
 *  - Durante el partido (`en_curso`/`entretiempo`): solo en sus últimos
 *    minutos estimados, contados desde `hora_inicio_real` más la duración
 *    de los dos tiempos y el descanso (`torneo_config`).
 *  - Después de `finalizado`: sigue abierta hasta N horas después de
 *    `hora_fin_real`, luego cierra sola.
 *
 * Los dos parámetros de la ventana (`minutos_previos_fin_para_votacion`,
 * `horas_ventana_votacion_post_partido`) son valores iniciales razonables,
 * no una cifra que Fernando haya confirmado — quedan en `torneo_config`
 * para poder ajustarlos sin tocar código.
 */
export function votacionAbierta(
  match: MatchVentana,
  config: ConfigVentana,
  ahora: Date = new Date()
): boolean {
  if (!match.arbitros_confirmados_at) return false;

  if (match.estado === "finalizado") {
    if (!match.hora_fin_real) return false;
    const cierre =
      new Date(match.hora_fin_real).getTime() +
      config.horas_ventana_votacion_post_partido * 60 * 60 * 1000;
    return ahora.getTime() <= cierre;
  }

  if (match.estado === "en_curso" || match.estado === "entretiempo") {
    if (!match.hora_inicio_real) return false;
    const duracionEstimadaMin =
      config.duracion_tiempo_minutos * 2 + config.duracion_descanso_minutos;
    const minutosTranscurridos =
      (ahora.getTime() - new Date(match.hora_inicio_real).getTime()) / 60000;
    return minutosTranscurridos >= duracionEstimadaMin - config.minutos_previos_fin_para_votacion;
  }

  return false;
}
