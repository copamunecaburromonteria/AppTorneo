/**
 * Franjas horarias fijas del torneo — jueves, viernes y sábado, siempre
 * 7:00 p. m. y 8:00 p. m. (dos franjas, dos canchas = 4 partidos por día),
 * NUNCA 6:00 p. m. ni 9:00 p. m. (pedido explícito de Fernando, 2026-09-18,
 * ver "logica de los partidos y programacion" en `plan-fases-tareas.md`;
 * reemplaza la grilla anterior de 3/5 franjas por día). Colombia no tiene
 * horario de verano: la hora de Bogotá es siempre UTC-5 todo el año, así
 * que se puede fijar ese offset sin necesidad de una tabla de husos.
 *
 * Estas utilidades leen/escriben fecha y hora ya ancladas a
 * `America/Bogota` (con `Intl.DateTimeFormat`, no con `Date.getHours()`
 * del servidor) para evitar que un partido de las 8 p. m. se "corra" al
 * día calendario siguiente si el servidor corre en UTC — mismo cuidado
 * que ya se tomó en `src/lib/jornada.ts`.
 *
 * Estas constantes son el default compilado de la edición 2026 (coinciden
 * con `torneo_config.horarios_permitidos` / `numero_canchas`, que son la
 * fuente de verdad para la generación server-side de octavos en adelante —
 * ver `src/lib/torneo/generador-eliminacion.ts`). Los formularios cliente
 * (reprogramar partido, iniciar torneo) siguen leyendo estas constantes
 * directamente por simplicidad; si una futura edición cambia los horarios,
 * hay que mantener ambos en sincronía.
 */

export const DIA_LABEL: Record<number, string> = { 4: "Jueves", 5: "Viernes", 6: "Sábado" };

export const SLOTS_POR_DIA: Record<number, number[]> = {
  4: [19, 20], // jueves: kickoffs 7, 8pm
  5: [19, 20], // viernes: kickoffs 7, 8pm
  6: [19, 20], // sábado: kickoffs 7, 8pm (antes 5-9pm; unificado 2026-09-18)
};

/** getDay(): 0=domingo ... 4=jueves, 5=viernes, 6=sábado. */
export const DIAS_VALIDOS = [4, 5, 6];

/** Día de la semana (getDay()) de "YYYY-MM-DD", interpretado en hora de Bogotá. */
export function diaSemanaBogota(fechaYmd: string): number {
  return new Date(`${fechaYmd}T12:00:00-05:00`).getDay();
}

/** "YYYY-MM-DD" en hora de Bogotá a partir de un ISO UTC (`fecha_hora_programada`). */
export function fechaYmdBogota(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(iso));
}

/** Hora (0-23) en Bogotá a partir de un ISO UTC (`fecha_hora_programada`). */
export function horaBogota(iso: string): number {
  const texto = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return Number(texto);
}

/** Construye el ISO (UTC) de una fecha "YYYY-MM-DD" + hora (0-23) en Bogotá. */
export function construirFechaHoraBogota(fechaYmd: string, hora: number): string {
  return new Date(`${fechaYmd}T${String(hora).padStart(2, "0")}:00:00-05:00`).toISOString();
}
