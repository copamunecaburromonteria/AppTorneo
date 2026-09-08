type EmailContent = { subject: string; html: string; text: string };

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
 * Envoltorio HTML compartido por todos los correos de la Copa — simple y
 * basado en tablas (los clientes de correo no soportan bien flexbox/grid),
 * con estilos en línea porque muchos clientes ignoran <style> en el <head>.
 */
function layout(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#151515;padding:24px 32px;text-align:center;">
                <span style="color:#FFD900;font-size:20px;font-weight:bold;letter-spacing:0.02em;">COPA MUÑECA E'BURRO</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#151515;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f4f4f5;color:#71717a;font-size:12px;text-align:center;">
                Montería, Córdoba · Más que un torneo, es el parche.
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
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">Partida ${c.numeroCuota} · vence ${formatFecha(c.fechaLimite)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;text-align:right;font-weight:bold;">${formatCOP(c.monto)}</td>
      </tr>`
    )
    .join("");

  const textoCuotas = params.cuotas
    .map((c) => `- Partida ${c.numeroCuota}: ${formatCOP(c.monto)} (vence ${formatFecha(c.fechaLimite)})`)
    .join("\n");

  const html = layout(
    `${params.nombreEquipo} quedó registrado en la Copa Muñeca e'Burro`,
    `
    <p>Hola ${params.delegadoNombre},</p>
    <p><strong>${params.nombreEquipo}</strong> quedó registrado en la Copa Muñeca e&apos;Burro. Tu correo de acceso al portal es <strong>${params.correo}</strong> — usa la contraseña que creaste al inscribirte.</p>
    <p style="margin-top:24px;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Total a pagar</p>
    <p style="font-size:28px;font-weight:bold;margin:4px 0 16px;">${formatCOP(params.montoTotal)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      ${filasCuotas}
    </table>
    <p style="margin-top:24px;">El pago en línea se habilita muy pronto — te avisamos por correo y WhatsApp apenas esté listo para pagar la primera partida y activar tu equipo.</p>
    <p style="margin-top:24px;">¡Nos vemos en la cancha!</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

${params.nombreEquipo} quedó registrado en la Copa Muñeca e'Burro. Tu correo de acceso al portal es ${params.correo} — usa la contraseña que creaste al inscribirte.

Total a pagar: ${formatCOP(params.montoTotal)}
${textoCuotas}

El pago en línea se habilita muy pronto — te avisamos por correo y WhatsApp apenas esté listo para pagar la primera partida y activar tu equipo.

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
    <p>Hola ${params.delegadoNombre},</p>
    <p>Te recordamos que la <strong>partida ${params.numeroCuota}</strong> de <strong>${params.nombreEquipo}</strong> vence el <strong>${formatFecha(params.fechaLimite)}</strong>.</p>
    <p style="margin-top:24px;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Monto de esta partida</p>
    <p style="font-size:28px;font-weight:bold;margin:4px 0 16px;">${formatCOP(params.monto)}</p>
    <p>Si ya la pagaste, ignora este correo — puede tardar un poco en reflejarse.</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

Te recordamos que la partida ${params.numeroCuota} de ${params.nombreEquipo} vence el ${formatFecha(params.fechaLimite)}.

Monto de esta partida: ${formatCOP(params.monto)}

Si ya la pagaste, ignora este correo — puede tardar un poco en reflejarse.

Copa Muñeca e'Burro — Montería, Córdoba`;

  return {
    subject: `Recordatorio: la partida ${params.numeroCuota} de ${params.nombreEquipo} vence pronto`,
    html,
    text,
  };
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
    <p>Hola ${params.delegadoNombre},</p>
    <p>Recibimos el pago de la <strong>partida ${params.numeroCuota}</strong> de <strong>${params.nombreEquipo}</strong> por <strong>${formatCOP(params.monto)}</strong>.</p>
    <p style="margin-top:16px;">${siguientePaso}</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

Recibimos el pago de la partida ${params.numeroCuota} de ${params.nombreEquipo} por ${formatCOP(params.monto)}.

${siguientePaso}

Copa Muñeca e'Burro — Montería, Córdoba`;

  return { subject: `Pago confirmado — ${params.nombreEquipo}`, html, text };
}
