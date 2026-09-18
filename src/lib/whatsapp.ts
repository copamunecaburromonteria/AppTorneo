/**
 * Arma un link de WhatsApp (wa.me) a partir de un número de contacto en
 * texto libre — como se captura hoy en `team_delegado` (sin formato fijo:
 * puede o no traer el +57, espacios, guiones, etc.). Devuelve `null` si no
 * hay nada usable, para que quien llame pueda ocultar el botón en ese caso.
 *
 * Si se pasa `texto`, queda precargado como mensaje en la ventana de
 * WhatsApp que se abre. No hay envío automático (no tenemos WhatsApp
 * Business API conectada) — el admin revisa y le da enviar, como el
 * equivalente de "reenviar correo" pero para WhatsApp.
 */
export function armarLinkWhatsApp(numero: string | null | undefined, texto?: string): string | null {
  if (!numero) return null;

  const digitos = numero.replace(/\D/g, "");
  if (!digitos) return null;

  let numeroFinal: string;
  // Celular colombiano típico: 10 dígitos sin indicativo de país.
  if (digitos.length === 10) numeroFinal = `57${digitos}`;
  // Ya viene con el 57 delante (12 dígitos: 57 + 10).
  else if (digitos.length === 12 && digitos.startsWith("57")) numeroFinal = digitos;
  // Cualquier otro largo (número fijo, otro país, etc.): se manda tal cual,
  // mejor un link imperfecto que no ofrecer ninguno.
  else numeroFinal = digitos;

  const base = `https://wa.me/${numeroFinal}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

// Mismo dominio verificado que usa `src/lib/resend/templates.ts` para los
// links de los correos — se reutiliza aquí para que el mensaje de WhatsApp
// apunte al mismo sitio.
const SITE_URL = "https://xn--copamuecaburro-vnb.com";

/**
 * Mensajes de WhatsApp equivalentes a los correos de
 * `src/lib/resend/templates.ts` (mismo contenido, en texto plano) — se usan
 * como texto precargado en los botones de WhatsApp del panel admin
 * (`armarLinkWhatsApp`), para que el delegado reciba el mismo aviso por los
 * dos canales.
 */
export function mensajeWhatsAppPreinscripcion(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  ordenPreinscripcion: number;
}): string {
  return `Hola ${params.delegadoNombre}, te escribimos de la Copa Muñeca e'Burro ⚽

${params.nombreEquipo} quedó preinscrito — eres el equipo #${params.ordenPreinscripcion} en la fila.

Esto todavía no es la inscripción oficial: no hay cuenta ni cobro por ahora. Te contactaremos por aquí o por correo cuando te toque completar la inscripción oficial y activar tu cupo.

¡Nos vemos en la cancha!`;
}

export function mensajeWhatsAppInvitacionOficial(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  correo: string;
}): string {
  return `Hola ${params.delegadoNombre} 🎉

¡Buenas noticias! Le llegó el turno a ${params.nombreEquipo} para completar la inscripción oficial y activar su cupo en la Copa Muñeca e'Burro.

Entra con el mismo correo que usaste para preinscribirte (${params.correo}). Ahí creas tu cuenta, defines si necesitas uniforme y ves el plan de pagos.

Completa tu inscripción aquí: ${SITE_URL}/inscripcion

Cualquier duda, contesta este mensaje.`;
}
