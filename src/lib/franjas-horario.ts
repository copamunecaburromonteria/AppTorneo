/**
 * Franjas horarias fijas del torneo — jueves y viernes 7:00-10:00 p. m.,
 * sábado 5:00-9:00 p. m., un partido por hora por cancha (ver
 * `especificacion-funcional-ecosistema.md` §19.5, que es la misma grilla
 * ya usada en el calendario de `/lider-arbitros`). Colombia no tiene
 * horario de verano: la hora de Bogotá es siempre UTC-5 todo el año, así
 * que se puede fijar ese offset sin necesidad de una tabla de husos.
 *
 * Estas utilidades leen/escriben fecha y hora ya ancladas a
 * `America/Bogota` (con `Intl.DateTimeFormat`, no con `Date.getHours()`
 * del servidor) para evitar que un partido de las 9-10 p. m. se "corra"
 * al día calendario siguiente si el servidor corre en UTC — mismo cuidado
 * que ya se tomó en `src/lib/jornada.ts`.
 */

export const DIA_LABEL: Record<number, string> = { 4: "Jueves", 5: "Viernes", 6: "Sábado" };

export const SLOTS_POR_DIA: Record<number, number[]> = {
  4: [19, 20, 21], // jueves: kickoffs 7, 8, 9pm
  5: [19, 20, 21], // viernes: kickoffs 7, 8, 9pm
  6: [18, 19, 20, 21], // sábado: kickoffs 6, 7, 8, 9pm
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
