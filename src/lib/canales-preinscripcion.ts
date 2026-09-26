/**
 * Opciones fijas para "¿Dónde te enteraste de la Copa?" en `/preinscripcion`
 * (2026-09-26, pedido de Fernando: quiere poder medir qué canales de
 * difusión funcionan mejor). Lista cerrada a propósito — así el dato queda
 * limpio y se puede contar directamente ("60% llegó por Instagram") sin
 * procesar texto libre después.
 *
 * Compartido entre el formulario público (`preinscripcion-form.tsx`), la
 * validación en el servidor (`preinscripcion/actions.ts`) y la migración de
 * Supabase (el CHECK de `teams.como_se_entero` debe tener exactamente estos
 * mismos valores — si agregas una opción aquí, agrégala también ahí).
 */
export const CANALES_PREINSCRIPCION = [
  "Instagram",
  "Facebook",
  "TikTok",
  "WhatsApp",
  "Un amigo o un equipo me contó",
  "Vallas o publicidad en la calle",
  "Otro",
] as const;

export type CanalPreinscripcion = (typeof CANALES_PREINSCRIPCION)[number];

export function esCanalValido(valor: string): valor is CanalPreinscripcion {
  return (CANALES_PREINSCRIPCION as readonly string[]).includes(valor);
}
