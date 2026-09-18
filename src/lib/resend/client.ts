type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

// Dominio verificado en Resend (2026-09-18). Resend lo registra en su forma
// punycode/ASCII — se usa esa forma literal en las direcciones "from"/
// "reply_to" porque los encabezados de correo son ASCII-only; los clientes
// de correo (Gmail, Outlook, etc.) lo decodifican solos y lo muestran como
// "copamuñecaburro.com" al destinatario.
const RESEND_VERIFIED_DOMAIN = "xn--copamuecaburro-vnb.com";
const DEFAULT_FROM = `Copa Muñeca e'Burro <noreply@${RESEND_VERIFIED_DOMAIN}>`;

// info@ reenvía a copamunecaburromonteria@gmail.com vía ImprovMX (ver
// plan-fases-tareas.md). Se usa como reply-to por defecto en todos los
// correos salientes: quien responda a una notificación de noreply@ termina
// en la bandeja real, sin que cada punto de llamada tenga que configurarlo.
const DEFAULT_REPLY_TO = `info@${RESEND_VERIFIED_DOMAIN}`;

/**
 * Envía un correo con la API de Resend usando fetch directo (sin el SDK, para
 * no depender de un paquete npm adicional). Si falta RESEND_API_KEY no lanza
 * error — solo lo registra, para no tumbar el flujo principal (registro de
 * equipo, etc.) por un problema de correo.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  if (!apiKey) {
    console.warn("[resend] RESEND_API_KEY no está configurada — correo no enviado:", input.subject);
    return { ok: false, error: "RESEND_API_KEY no configurada" };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo || DEFAULT_REPLY_TO,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[resend] Error al enviar correo:", res.status, body);
      return { ok: false, error: `Resend respondió ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("[resend] Excepción al enviar correo:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
