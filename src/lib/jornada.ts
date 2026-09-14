/**
 * "Jornada" = semana de calendario (lunes a domingo, hora de Bogotá) entre
 * todas las fechas de partidos del torneo, contadas en orden ascendente —
 * Jornada 1 es la primera semana con partidos programados, Jornada 2 la
 * siguiente, etc. No existe una columna "jornada" en `matches`: se deriva
 * así por decisión explícita de Fernando (coincide con cómo ya se describe
 * el calendario del torneo — "varias semanas" — en los documentos del
 * proyecto), en vez de inventar un número que no sale de datos reales.
 */
function inicioSemanaBogota(fechaIso: string): number {
  // Se ancla al día calendario en Bogotá (no al del servidor) para que un
  // partido de las 10pm no se corra al día siguiente por diferencia de zona
  // horaria si el servidor corre en UTC.
  const enBogota = new Date(fechaIso).toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });
  const [y, m, d] = enBogota.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dia = dt.getUTCDay(); // 0 = domingo
  const offset = dia === 0 ? -6 : 1 - dia; // retrocede hasta el lunes de esa semana
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dt.getTime();
}

export function calcularJornada(fechaIso: string, todasLasFechasIso: string[]): number {
  const semanas = Array.from(new Set(todasLasFechasIso.map(inicioSemanaBogota))).sort(
    (a, b) => a - b
  );
  const semanaPartido = inicioSemanaBogota(fechaIso);
  const idx = semanas.indexOf(semanaPartido);
  return idx === -1 ? semanas.length + 1 : idx + 1;
}
