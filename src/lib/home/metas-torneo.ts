/**
 * Metas/valores previstos del torneo, usados como respaldo en el home
 * mientras todavía no hay equipos validados en Supabase — con el flujo de
 * preinscripción (ver plan-fases-tareas.md, punto 9z) eso puede tardar
 * semanas, y mostrar puros ceros en el home no vende bien el torneo.
 *
 * Uso: `numeros.tsx` y `stats-bar.tsx` muestran estos valores mientras
 * `totalEquipos` (equipos con estado_inscripcion = 'validado') sea 0. En
 * cuanto exista al menos 1 equipo validado, ambos componentes cambian solo
 * a mostrar el conteo real en vivo de Supabase — esta meta deja de usarse
 * automáticamente, sin que haya que tocar código.
 *
 * Fuente: `claude/formato-torneo.md` (formato confirmado por Fernando) y
 * `torneo_config.max_jugadores_por_equipo` — 24 equipos, 15 jugadores máx.
 * por equipo, 75 partidos totales del torneo (60 de fase de grupos + 15 de
 * eliminación). Confirmado con Fernando el 2026-09-18.
 */
export const META_EQUIPOS = 24;
export const META_JUGADORES = 360;
export const META_PARTIDOS = 75;
