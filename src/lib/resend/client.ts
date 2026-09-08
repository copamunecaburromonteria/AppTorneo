type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Copa Muñeca e'Burro <onboarding@resend.dev>";

/**
 * Envía un correo con la API de Resend usando fetch directo (sin el SDK, para
 * no depender de un paquete npm adicional). Si falta RESEND_API_KEY no lanza
 * error — solo lo registra, para no tumbar el flujo principal (registro de
 * equipo, etc.) por un problema de correo.
 *
 * NOTA: mientras no haya un dominio propio verificado en Resend, el remitente
 * por defecto (onboarding@resend.dev) solo puede entregar correos a la
 * dirección con la que se creó la cuenta de Resend — cualquier otro
 * destinatario se rechaza. Configurar RESEND_FROM_EMAIL con un dominio
 * verificado quita esa limitación.
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
        reply_to: input.replyTo,
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
