/**
 * Arma un link de WhatsApp (wa.me) a partir de un número de contacto en
 * texto libre — como se captura hoy en `team_delegado` (sin formato fijo:
 * puede o no traer el +57, espacios, guiones, etc.). Devuelve `null` si no
 * hay nada usable, para que quien llame pueda ocultar el botón en ese caso.
 */
export function armarLinkWhatsApp(numero: string | null | undefined): string | null {
  if (!numero) return null;

  const digitos = numero.replace(/\D/g, "");
  if (!digitos) return null;

  // Celular colombiano típico: 10 dígitos sin indicativo de país.
  if (digitos.length === 10) return `https://wa.me/57${digitos}`;

  // Ya viene con el 57 delante (12 dígitos: 57 + 10).
  if (digitos.length === 12 && digitos.startsWith("57")) return `https://wa.me/${digitos}`;

  // Cualquier otro largo (número fijo, otro país, etc.): se manda tal cual,
  // mejor un link imperfecto que no ofrecer ninguno.
  return `https://wa.me/${digitos}`;
}
