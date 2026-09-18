type EmailContent = { subject: string; html: string; text: string };

// Mismo dominio verificado que usa client.ts para el remitente — se reutiliza
// aquí como base de las imágenes de marca y los botones de acción, en su
// forma punycode/ASCII por la misma razón (máxima compatibilidad con
// clientes de correo viejos que no manejan bien dominios IDN en <img>/<a>).
const SITE_URL = "https://xn--copamuecaburro-vnb.com";

const COLOR = {
  purple: "#7B1FA2",
  purpleDark: "#4A0B6B",
  yellow: "#FFD900",
  black: "#151515",
  white: "#FFFFFF",
  gray: "#AAA69F",
  grayText: "#71717A",
  border: "#E4E4E7",
};

function formatCOP(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

function formatFecha(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Botón de acción "bulletproof" (tabla + celda, no <button>/flex) para que
 * se vea bien tanto en clientes modernos como en Outlook de escritorio.
 * Amarillo + negro: el color de acción de la marca sobre el color de mayor
 * contraste, nunca morado (el morado es identidad, no CTA).
 */
function boton(url: string, texto: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 4px;">
      <tr>
        <td bgcolor="${COLOR.yellow}" style="border-radius:999px;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:${COLOR.black};text-decoration:none;border-radius:999px;">${texto}</a>
        </td>
      </tr>
    </table>`;
}

/**
 * Tarjeta destacada para un monto en pesos (total a pagar, partida, pago
 * confirmado) — mismo patrón visual en todos los correos que muestran plata,
 * con acento morado claro en vez de texto plano.
 */
function montoDestacado(label: string, valor: number): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#F6ECFB;border-radius:12px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">${label}</p>
          <p style="margin:4px 0 0;font-size:30px;font-weight:bold;color:${COLOR.black};">${formatCOP(valor)}</p>
        </td>
      </tr>
    </table>`;
}

/**
 * Envoltorio HTML compartido por todos los correos de la Copa — basado en
 * tablas con estilos en línea (los clientes de correo no soportan bien
 * flexbox/grid ni <style> en <head>). Fondo oscuro por fuera + tarjeta
 * blanca al centro, igual que la identidad visual del sitio ("fondos
 * oscuros estratégicamente, blanco para aire y lectura"). El logo y el
 * mascote se cargan desde el dominio en producción — no van embebidos,
 * así el correo pesa poco y siempre usa la versión más reciente del logo.
 */
function layout(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${COLOR.black};font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none;font-size:1px;color:${COLOR.black};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.black};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLOR.white};border-radius:16px;overflow:hidden;">

            <!-- acento superior -->
            <tr>
              <td height="6" style="background-color:${COLOR.yellow};font-size:0;line-height:0;">&nbsp;</td>
            </tr>

            <!-- header -->
            <tr>
              <td style="background-color:${COLOR.purpleDark};background:linear-gradient(135deg,${COLOR.purpleDark},${COLOR.purple});padding:28px 32px;text-align:center;">
                <img
                  src="${SITE_URL}/brand/logo-horizontal.png"
                  width="200"
                  alt="Copa Muñeca e'Burro"
                  style="display:block;width:200px;max-width:60%;height:auto;margin:0 auto;border:0;"
                />
              </td>
            </tr>

            <!-- body -->
            <tr>
              <td style="padding:36px 32px 8px;color:${COLOR.black};font-size:15px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- separador -->
            <tr>
              <td style="padding:8px 32px 0;">
                <div style="border-top:1px solid ${COLOR.border};"></div>
              </td>
            </tr>

            <!-- footer -->
            <tr>
              <td style="background-color:${COLOR.black};padding:28px 32px;text-align:center;">
                <img
                  src="${SITE_URL}/brand/mascota-badge.png"
                  width="48"
                  alt=""
                  style="display:block;width:48px;height:48px;margin:0 auto 12px;border:0;border-radius:50%;"
                />
                <p style="margin:0;color:${COLOR.yellow};font-size:14px;font-weight:bold;">Más que un torneo, es el parche.</p>
                <p style="margin:6px 0 0;color:${COLOR.gray};font-size:12px;">Montería, Córdoba · Copa Muñeca e&apos;Burro</p>
                <p style="margin:14px 0 0;color:${COLOR.gray};font-size:11px;">
                  ¿Dudas? Escríbenos a
                  <a href="mailto:info@copamuñecaburro.com" style="color:${COLOR.yellow};text-decoration:underline;">info@copamuñecaburro.com</a>
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function correoRegistroEquipo(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  correo: string;
  montoTotal: number;
  cuotas: { numeroCuota: number; monto: number; fechaLimite: string }[];
}): EmailContent {
  const filasCuotas = params.cuotas
    .map(
      (c) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${COLOR.border};color:${COLOR.grayText};">Partida ${c.numeroCuota} · vence ${formatFecha(c.fechaLimite)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${COLOR.border};text-align:right;font-weight:bold;">${formatCOP(c.monto)}</td>
      </tr>`
    )
    .join("");

  const textoCuotas = params.cuotas
    .map((c) => `- Partida ${c.numeroCuota}: ${formatCOP(c.monto)} (vence ${formatFecha(c.fechaLimite)})`)
    .join("\n");

  const html = layout(
    `${params.nombreEquipo} quedó registrado en la Copa Muñeca e'Burro`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">¡Ya eres parte de la Copa!</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p><strong>${params.nombreEquipo}</strong> quedó registrado en la Copa Muñeca e&apos;Burro. Tu correo de acceso al portal es <strong>${params.correo}</strong> — usa la contraseña que creaste al inscribirte.</p>
    ${montoDestacado("Total a pagar", params.montoTotal)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      ${filasCuotas}
    </table>
    <p style="margin-top:24px;">El pago en línea se habilita muy pronto — te avisamos por correo y WhatsApp apenas esté listo para pagar la primera partida y activar tu equipo.</p>
    ${boton(`${SITE_URL}/portal`, "Ir a mi portal")}
    <p style="margin-top:20px;">¡Nos vemos en la cancha!</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

${params.nombreEquipo} quedó registrado en la Copa Muñeca e'Burro. Tu correo de acceso al portal es ${params.correo} — usa la contraseña que creaste al inscribirte.

Total a pagar: ${formatCOP(params.montoTotal)}
${textoCuotas}

El pago en línea se habilita muy pronto — te avisamos por correo y WhatsApp apenas esté listo para pagar la primera partida y activar tu equipo.

Ir a mi portal: ${SITE_URL}/portal

¡Nos vemos en la cancha!
Copa Muñeca e'Burro — Montería, Córdoba`;

  return { subject: `${params.nombreEquipo} quedó registrado en la Copa Muñeca e'Burro`, html, text };
}

export function correoRecordatorioCuota(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  numeroCuota: number;
  monto: number;
  fechaLimite: string;
}): EmailContent {
  const html = layout(
    `Partida ${params.numeroCuota} de ${params.nombreEquipo} vence pronto`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">Recordatorio de pago</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p>Te recordamos que la <strong>partida ${params.numeroCuota}</strong> de <strong>${params.nombreEquipo}</strong> vence el <strong>${formatFecha(params.fechaLimite)}</strong>.</p>
    ${montoDestacado("Monto de esta partida", params.monto)}
    ${boton(`${SITE_URL}/portal`, "Ir a mi portal")}
    <p style="margin-top:20px;">Si ya la pagaste, ignora este correo — puede tardar un poco en reflejarse.</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

Te recordamos que la partida ${params.numeroCuota} de ${params.nombreEquipo} vence el ${formatFecha(params.fechaLimite)}.

Monto de esta partida: ${formatCOP(params.monto)}

Ir a mi portal: ${SITE_URL}/portal

Si ya la pagaste, ignora este correo — puede tardar un poco en reflejarse.

Copa Muñeca e'Burro — Montería, Córdoba`;

  return {
    subject: `Recordatorio: la partida ${params.numeroCuota} de ${params.nombreEquipo} vence pronto`,
    html,
    text,
  };
}

/**
 * Aviso al super admin cuando un equipo nuevo entra a la lista de espera
 * porque los cupos del torneo ya están llenos (ver `numero_equipos_torneo`
 * en `torneo_config`). Es una notificación interna (no va a un delegado),
 * por eso el CTA apunta al panel admin y no al portal de equipos.
 */
export function correoEquipoListaEspera(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  contacto: string;
  correo: string;
}): EmailContent {
  const html = layout(
    `${params.nombreEquipo} quedó en lista de espera`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">Aviso interno</p>
    <p>Un equipo nuevo quedó en <strong>lista de espera</strong> — los cupos del torneo ya están llenos.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;background-color:#FAFAFA;border-radius:12px;">
      <tr><td style="padding:10px 16px 4px;color:${COLOR.grayText};">Equipo</td><td style="padding:10px 16px 4px;font-weight:bold;text-align:right;">${params.nombreEquipo}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Delegado</td><td style="padding:4px 16px;text-align:right;">${params.delegadoNombre}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Contacto</td><td style="padding:4px 16px;text-align:right;">${params.contacto}</td></tr>
      <tr><td style="padding:4px 16px 10px;color:${COLOR.grayText};">Correo</td><td style="padding:4px 16px 10px;text-align:right;">${params.correo}</td></tr>
    </table>
    ${boton(`${SITE_URL}/admin/preinscripciones`, "Ver en el panel admin")}
    `
  );

  const text = `Un equipo nuevo quedó en lista de espera — los cupos del torneo ya están llenos.

Equipo: ${params.nombreEquipo}
Delegado: ${params.delegadoNombre}
Contacto: ${params.contacto}
Correo: ${params.correo}

Ver en el panel admin: ${SITE_URL}/admin/preinscripciones`;

  return { subject: `Lista de espera: ${params.nombreEquipo}`, html, text };
}

/**
 * Confirmación de preinscripción (nueva modalidad, 2026-09-17): el equipo
 * solo dejó sus datos para hacer fila — todavía no tiene cuenta ni plan de
 * pagos. Se le avisa su número de orden de llegada y que se le contactará
 * cuando le toque completar la inscripción oficial (ver
 * `claude/plan-fases-tareas.md`).
 */
export function correoPreinscripcion(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  ordenPreinscripcion: number;
}): EmailContent {
  const html = layout(
    `${params.nombreEquipo} quedó preinscrito en la Copa Muñeca e'Burro`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">Preinscripción recibida</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p><strong>${params.nombreEquipo}</strong> quedó preinscrito en la Copa Muñeca e&apos;Burro — eres el equipo <strong>#${params.ordenPreinscripcion}</strong> en la fila.</p>
    <p style="margin-top:16px;">Esto todavía no es la inscripción oficial: no hay cuenta ni cobro por ahora. Te contactaremos por WhatsApp o correo cuando te toque completar la inscripción oficial y activar tu cupo.</p>
    <p style="margin-top:24px;">¡Nos vemos en la cancha!</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

${params.nombreEquipo} quedó preinscrito en la Copa Muñeca e'Burro — eres el equipo #${params.ordenPreinscripcion} en la fila.

Esto todavía no es la inscripción oficial: no hay cuenta ni cobro por ahora. Te contactaremos por WhatsApp o correo cuando te toque completar la inscripción oficial y activar tu cupo.

¡Nos vemos en la cancha!
Copa Muñeca e'Burro — Montería, Córdoba`;

  return { subject: `${params.nombreEquipo} quedó preinscrito — eres el #${params.ordenPreinscripcion}`, html, text };
}

/**
 * Invitación a completar la inscripción oficial: se envía cuando el admin
 * decide (manualmente, desde `/admin/preinscripciones`) que le toca a este
 * equipo preinscrito pasar a pagar y activar su cupo. El link es genérico
 * (el mismo /inscripcion para todos) — el sistema reconoce al equipo por el
 * correo que ya usó al preinscribirse, no por un token en la URL.
 */
export function correoInvitacionInscripcionOficial(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  correo: string;
}): EmailContent {
  const html = layout(
    `¡Le llegó el turno a ${params.nombreEquipo}!`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">¡Te llegó el turno!</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p>¡Buenas noticias! Le llegó el turno a <strong>${params.nombreEquipo}</strong> para completar la inscripción oficial y activar su cupo en la Copa Muñeca e&apos;Burro.</p>
    <p style="margin-top:16px;">Entra con el mismo correo que usaste para preinscribirte (<strong>${params.correo}</strong>). Ahí vas a crear tu cuenta, definir si necesitas uniforme y ver el plan de pagos.</p>
    ${boton(`${SITE_URL}/inscripcion`, "Completar inscripción")}
    <p style="margin-top:20px;">Cualquier duda, escríbenos por WhatsApp.</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

¡Buenas noticias! Le llegó el turno a ${params.nombreEquipo} para completar la inscripción oficial y activar su cupo en la Copa Muñeca e'Burro.

Entra con el mismo correo que usaste para preinscribirte (${params.correo}). Ahí vas a crear tu cuenta, definir si necesitas uniforme y ver el plan de pagos.

Completar inscripción: ${SITE_URL}/inscripcion

Cualquier duda, escríbenos por WhatsApp.
Copa Muñeca e'Burro — Montería, Córdoba`;

  return { subject: `¡Le llegó el turno a ${params.nombreEquipo}! Completa tu inscripción`, html, text };
}

export function correoPagoConfirmado(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  numeroCuota: number;
  monto: number;
  cuotasRestantes: number;
}): EmailContent {
  const siguientePaso =
    params.cuotasRestantes > 0
      ? `Te quedan ${params.cuotasRestantes} partida${params.cuotasRestantes === 1 ? "" : "s"} por pagar.`
      : "¡Con esta partida completaste el pago total! No queda nada pendiente.";

  const html = layout(
    `Pago confirmado — ${params.nombreEquipo}`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">✅ Pago confirmado</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p>Recibimos el pago de la <strong>partida ${params.numeroCuota}</strong> de <strong>${params.nombreEquipo}</strong>.</p>
    ${montoDestacado(`Partida ${params.numeroCuota} pagada`, params.monto)}
    <p>${siguientePaso}</p>
    ${boton(`${SITE_URL}/portal`, "Ver mi equipo")}
    `
  );

  const text = `Hola ${params.delegadoNombre},

Recibimos el pago de la partida ${params.numeroCuota} de ${params.nombreEquipo} por ${formatCOP(params.monto)}.

${siguientePaso}

Ver mi equipo: ${SITE_URL}/portal

Copa Muñeca e'Burro — Montería, Córdoba`;

  return { subject: `Pago confirmado — ${params.nombreEquipo}`, html, text };
}
