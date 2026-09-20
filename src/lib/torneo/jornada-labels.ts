/**
 * Título de cada una de las 9 jornadas del torneo (1-5 fase de grupos,
 * 6-9 fase final) — compartido entre la página pública de calendario
 * (`src/app/partidos/page.tsx`) y el panel admin de partidos
 * (`src/app/admin/(claro)/partidos/page.tsx`), para no mantener dos copias
 * del mismo mapa. Ver `claude/formato-torneo.md`.
 */
export const TITULO_JORNADA: Record<number, string> = {
  1: "Jornada 1",
  2: "Jornada 2",
  3: "Jornada 3",
  4: "Jornada 4",
  5: "Jornada 5",
  6: "Octavos de Final",
  7: "Cuartos de Final",
  8: "Semifinal",
  9: "Gran Final",
};

/** Texto de "esta fase todavía no se generó" para cada jornada de la fase
 * final — usado en la página pública mientras esa fase no exista todavía
 * en `matches`. */
export const TEXTO_PENDIENTE: Record<number, string> = {
  6: "Se define al cerrar la fase de grupos, con los 4 primeros de cada grupo.",
  7: "Se define al cerrar los octavos de final.",
  8: "Se define al cerrar los cuartos de final.",
  9: "Un solo partido, un solo campeón — se define al cerrar la semifinal.",
};
