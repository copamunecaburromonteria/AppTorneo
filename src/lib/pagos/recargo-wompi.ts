/**
 * Recargo de procesamiento cuando se paga por Wompi en vez de transferencia
 * (decisión de Fernando, 2026-09-26): la inscripción oficial de la Copa sigue
 * costando lo que diga `torneo_config.monto_inscripcion` — el recargo NUNCA
 * se presenta como si ese fuera el precio real, solo se suma al momento de
 * cobrar por Wompi para cubrir el costo de ese medio de pago. Mismo criterio
 * para los cargos de tarjetas.
 *
 * `torneo_config.recargo_wompi_pct` guarda la fracción (ej. 0.033333 ≈
 * 3.33%, el valor que Fernando pidió: $750.000 transferencia → $775.000 por
 * Wompi).
 */
export function calcularMontoConRecargoWompi(monto: number, recargoPct: number): number {
  return Math.round(monto * (1 + recargoPct));
}
