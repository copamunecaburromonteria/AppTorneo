// Contenido de referencia que todavía no viene de Supabase.
//
// Ya NO viven aquí datos que simulan resultados/estadísticas del torneo
// (equipos, calendario, tabla de posiciones, goleadores/MVP de ejemplo):
// esa información se retiró el 2026-09-17 porque el torneo aún no arranca
// y esas secciones ahora muestran un mensaje de "todavía no hay
// información" en vez de datos inventados — ver `claude/plan-fases-tareas.md`.
//
// Lo que queda acá es contenido editorial real (qué incluye la inscripción),
// no resultados simulados del torneo.
//
// `patrocinadoresPlaceholder` (fila de cajas punteadas "Espacios
// disponibles") se retiró el 2026-09-21 al construir la Fase 1 del sistema
// de espacios de patrocinio: el Home ahora consulta patrocinadores reales
// desde Supabase (`v_patrocinadores_publicos`, ver `patrocinadores.tsx`) y
// el espacio libre se promociona con un banner real en vez de cajas con
// nombres inventados.

export const inclusiones = [
  "Canchas",
  "Arbitraje",
  "Uniformes",
  "Hidratación",
  "Plataforma digital",
  "Estadísticas",
  "Cobertura",
  "Premiación",
];
