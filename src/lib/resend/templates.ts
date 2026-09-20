type EmailContent = { subject: string; html: string; text: string };

// Mismo dominio verificado que usa client.ts para el remitente — se reutiliza
// aquí como base de las imágenes de marca y los botones de acción, en su
// forma punycode/ASCII por la misma razón (máxima compatibilidad con
// clientes de correo viejos que no manejan bien dominios IDN en <img>/<a>).
const SITE_URL = "https://xn--copamuecaburro-vnb.com";

// Paleta acordada con Fernando el 2026-09-18 junto con el nuevo diseño de
// `layout()` (ver más abajo) — reemplaza la paleta anterior en todos los
// correos, ya que `boton()`/`montoDestacado()`/cada plantilla toman el color
// de aquí en vez de tenerlo hardcodeado.
const COLOR = {
  purple: "#56127D", // header, títulos, CTA de cierre
  purpleLight: "#6B168F", // eyebrow / etiquetas pequeñas sobre fondo blanco
  yellow: "#F4C400", // acento de marca y botones de acción
  black: "#171717", // títulos sobre fondo blanco
  bodyText: "#202020",
  white: "#FFFFFF",
  bgOuter: "#F3F3F5", // fondo gris claro alrededor de la tarjeta
  footerBg: "#17131B",
  gray: "#999999",
  grayText: "#666666",
  border: "#EEEEEE",
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
 * Caja de aviso destacado (fondo amarillo pálido, borde izquierdo amarillo)
 * — para lo que el delegado no se puede saltar de largo, como "esto todavía
 * no es la inscripción oficial, no pagues nada". Mismo patrón visual en
 * cualquier correo que necesite este tipo de advertencia.
 */
function cajaImportante(titulo: string, bodyHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF9D9;border-left:5px solid ${COLOR.yellow};border-radius:8px;margin:25px 0;">
      <tr>
        <td style="padding:18px;">
          <div style="font-size:14px;font-weight:bold;color:#4B3C00;margin-bottom:7px;">🟡 ${titulo}</div>
          <div style="font-size:14px;line-height:1.6;color:#4A4A4A;">${bodyHtml}</div>
        </td>
      </tr>
    </table>`;
}

/**
 * Una fila de una lista de pasos numerados ("¿Qué sigue?") — círculo con el
 * número + título en negrita + descripción gris. `activo: true` resalta el
 * paso en amarillo (para el que todavía falta / es el próximo), los demás
 * quedan en morado.
 */
function pasoNumerado(numero: string, titulo: string, descripcion: string, activo = false): string {
  const fondo = activo ? COLOR.yellow : COLOR.purple;
  const texto = activo ? COLOR.black : COLOR.white;
  return `
    <tr>
      <td width="42" valign="top">
        <div style="width:32px;height:32px;line-height:32px;text-align:center;background-color:${fondo};color:${texto};border-radius:50%;font-weight:bold;font-size:13px;">${numero}</div>
      </td>
      <td style="padding-bottom:17px;">
        <strong>${titulo}</strong><br>
        <span style="font-size:14px;color:${COLOR.grayText};">${descripcion}</span>
      </td>
    </tr>`;
}

/**
 * Envoltorio HTML compartido por todos los correos de la Copa — basado en
 * tablas con estilos en línea (los clientes de correo no soportan bien
 * flexbox/grid ni <style> en <head>). Diseño acordado con Fernando
 * (2026-09-18): tarjeta blanca centrada sobre fondo gris claro, header
 * morado sólido con borde amarillo arriba, footer oscuro con el mismo
 * borde. El logo se carga desde el dominio en producción — no va embebido,
 * así el correo pesa poco y siempre usa la versión más reciente.
 */
function layout(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:${COLOR.bgOuter};font-family:Arial,Helvetica,sans-serif;color:${COLOR.bodyText};">
    <span style="display:none;font-size:1px;color:${COLOR.bgOuter};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.bgOuter};">
      <tr>
        <td align="center" style="padding:30px 15px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:${COLOR.white};border-radius:14px;overflow:hidden;">

            <!-- header -->
            <tr>
              <td align="center" style="background-color:${COLOR.purple};padding:28px 25px 24px;border-top:5px solid ${COLOR.yellow};">
                <img
                  src="${SITE_URL}/brand/logo-horizontal.png"
                  width="230"
                  alt="Copa Muñeca e'Burro"
                  style="display:block;width:230px;max-width:80%;height:auto;margin:0 auto;border:0;"
                />
              </td>
            </tr>

            <!-- body -->
            <tr>
              <td style="padding:38px 42px 30px;color:${COLOR.bodyText};font-size:16px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- footer -->
            <tr>
              <td align="center" style="background-color:${COLOR.footerBg};padding:28px 25px;border-top:3px solid ${COLOR.yellow};">
                <div style="font-size:17px;font-weight:bold;color:${COLOR.white};margin-bottom:7px;">COPA MUÑECA E&apos;BURRO</div>
                <div style="font-size:12px;letter-spacing:1px;color:${COLOR.yellow};margin-bottom:15px;">FÚTBOL · GENTE · COMUNIDAD</div>
                <div style="font-size:12px;color:${COLOR.gray};line-height:1.6;">Montería, Córdoba · Colombia</div>
                <div style="font-size:12px;color:${COLOR.gray};margin-top:8px;">¿Tienes preguntas?</div>
                <a href="mailto:info@copamuñecaburro.com" style="color:${COLOR.yellow};font-size:12px;text-decoration:none;font-weight:bold;">info@copamuñecaburro.com</a>
                <div style="margin-top:18px;font-size:11px;color:${COLOR.grayText};">© ${new Date().getFullYear()} Copa Muñeca e&apos;Burro</div>
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

/**
 * Aviso al admin cada vez que un equipo completa la inscripción oficial
 * (paga, o queda con su plan de cuotas generado) — antes de esto no llegaba
 * ningún correo al admin en este flujo, solo al delegado (ver
 * `correoRegistroEquipo` arriba). Se dispara desde `inscripcion/actions.ts`,
 * justo después de mandar la confirmación al delegado. Reusa
 * `WOMPI_ADMIN_NOTIFICATION_EMAIL` — el nombre viene de cuando solo se usaba
 * para pagos de Wompi, pero hoy es la bandeja general del admin.
 */
export function correoNuevaInscripcionAdmin(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  delegadoCorreo: string;
  contacto: string;
  montoTotal: number;
  cantidadUniformes: number;
  numeroCuotas: number;
}): EmailContent {
  const html = layout(
    `Nueva inscripción oficial: ${params.nombreEquipo}`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">📋 Nueva inscripción oficial</p>
    <p><strong>${params.nombreEquipo}</strong> completó la inscripción oficial y quedó con su plan de pagos generado.</p>
    ${montoDestacado("Total a pagar", params.montoTotal)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;background-color:#FAFAFA;border-radius:12px;">
      <tr><td style="padding:10px 16px 4px;color:${COLOR.grayText};">Delegado</td><td style="padding:10px 16px 4px;font-weight:bold;text-align:right;">${params.delegadoNombre}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Correo</td><td style="padding:4px 16px;text-align:right;">${params.delegadoCorreo}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Contacto</td><td style="padding:4px 16px;text-align:right;">${params.contacto}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Uniformes</td><td style="padding:4px 16px;text-align:right;">${params.cantidadUniformes > 0 ? `${params.cantidadUniformes} (con la Copa)` : "Uniforme propio"}</td></tr>
      <tr><td style="padding:4px 16px 10px;color:${COLOR.grayText};">Plan de pagos</td><td style="padding:4px 16px 10px;text-align:right;">${params.numeroCuotas} partida${params.numeroCuotas === 1 ? "" : "s"}</td></tr>
    </table>
    ${boton(`${SITE_URL}/admin`, "Ver en el panel admin")}
    `
  );

  const text = `${params.nombreEquipo} completó la inscripción oficial y quedó con su plan de pagos generado.

Total a pagar: ${formatCOP(params.montoTotal)}
Delegado: ${params.delegadoNombre}
Correo: ${params.delegadoCorreo}
Contacto: ${params.contacto}
Uniformes: ${params.cantidadUniformes > 0 ? `${params.cantidadUniformes} (con la Copa)` : "Uniforme propio"}
Plan de pagos: ${params.numeroCuotas} partida${params.numeroCuotas === 1 ? "" : "s"}

Ver en el panel admin: ${SITE_URL}/admin`;

  return {
    subject: `Nueva inscripción oficial: ${params.nombreEquipo} (${formatCOP(params.montoTotal)})`,
    html,
    text,
  };
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
 * pagos. Se le avisa que quedó preinscrito y que se le contactará cuando le
 * toque completar la inscripción oficial (ver `claude/plan-fases-tareas.md`).
 *
 * No menciona el número de orden en la fila (decisión de Fernando,
 * 2026-09-18): como la invitación es manual y no estrictamente por orden de
 * llegada, mostrarle el número a cada equipo podía generar reclamos si a
 * alguien con un número más alto le toca el turno antes.
 */
export function correoPreinscripcion(params: {
  nombreEquipo: string;
  delegadoNombre: string;
}): EmailContent {
  const pasos = [
    pasoNumerado("01", "Recibimos tu preinscripción", "Tu equipo ya está registrado en nuestra lista."),
    pasoNumerado("02", "Te contactaremos", "Por WhatsApp o correo cuando llegue el momento."),
    pasoNumerado(
      "03",
      "Activarás oficialmente tu cupo",
      "Te enviaremos las instrucciones para completar la inscripción.",
      true
    ),
  ].join("");

  const html = layout(
    `${params.nombreEquipo} quedó preinscrito — esta es solo la preinscripción, todavía no hay cobro`,
    `
    <div style="font-size:13px;font-weight:bold;letter-spacing:1.5px;color:${COLOR.purpleLight};margin-bottom:18px;">PREINSCRIPCIÓN RECIBIDA</div>
    <h1 style="margin:0 0 18px;font-size:27px;line-height:1.25;color:${COLOR.black};">¡Ya estamos calentando motores! ⚽</h1>
    <p style="margin:0 0 18px;">Hola <strong>${params.delegadoNombre}</strong>,</p>
    <p style="margin:0 0 22px;">Te escribimos de la <strong>Copa Muñeca e&apos;Burro</strong> para confirmarte que <strong>${params.nombreEquipo}</strong> quedó preinscrito.</p>

    ${cajaImportante(
      "IMPORTANTE",
      `Esta es únicamente la <strong>preinscripción</strong>. Por ahora <strong>no debes realizar ningún pago</strong> ni crear una cuenta.`
    )}

    <h2 style="font-size:19px;margin:30px 0 18px;color:${COLOR.purple};">¿Qué sigue?</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${pasos}
    </table>

    <div style="margin-top:32px;padding-top:25px;border-top:1px solid ${COLOR.border};">
      <p style="margin:0;">Gracias por querer ser parte de esta historia.</p>
      <p style="margin:10px 0 0;font-size:18px;font-weight:bold;color:${COLOR.purple};">¡Nos vemos en la cancha! 🐴⚽</p>
    </div>
    `
  );

  const text = `Hola ${params.delegadoNombre},

Te escribimos de la Copa Muñeca e'Burro para confirmarte que ${params.nombreEquipo} quedó preinscrito.

Importante: esta es únicamente la preinscripción. Por ahora no debes realizar ningún pago ni crear una cuenta.

¿Qué sigue?
1. Recibimos tu preinscripción — tu equipo ya está registrado en nuestra lista.
2. Te contactaremos — por WhatsApp o correo cuando llegue el momento.
3. Activarás oficialmente tu cupo — te enviaremos las instrucciones para completar la inscripción.

Gracias por querer ser parte de esta historia.
¡Nos vemos en la cancha!
Copa Muñeca e'Burro — Montería, Córdoba`;

  return { subject: `${params.nombreEquipo} quedó preinscrito — ¡ya estamos calentando motores!`, html, text };
}

/**
 * Aviso al admin cada vez que un equipo nuevo se preinscribe — antes de
 * esto no llegaba ningún correo al admin en este flujo, solo al delegado
 * (ver `correoPreinscripcion` arriba). Se dispara desde
 * `preinscripcion/actions.ts`, justo después de mandar la confirmación al
 * delegado. Reusa `WOMPI_ADMIN_NOTIFICATION_EMAIL` — el nombre viene de
 * cuando solo se usaba para pagos de Wompi, pero hoy es la bandeja general
 * del admin.
 */
export function correoNuevaPreinscripcionAdmin(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  contacto: string;
  correo: string;
  ciudadBarrio: string | null;
}): EmailContent {
  const html = layout(
    `Nueva preinscripción: ${params.nombreEquipo}`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">📝 Nueva preinscripción</p>
    <p>Un equipo nuevo se preinscribió a la Copa Muñeca e&apos;Burro.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;background-color:#FAFAFA;border-radius:12px;">
      <tr><td style="padding:10px 16px 4px;color:${COLOR.grayText};">Equipo</td><td style="padding:10px 16px 4px;font-weight:bold;text-align:right;">${params.nombreEquipo}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Delegado</td><td style="padding:4px 16px;text-align:right;">${params.delegadoNombre}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Contacto</td><td style="padding:4px 16px;text-align:right;">${params.contacto}</td></tr>
      <tr><td style="padding:4px 16px${params.ciudadBarrio ? "" : " 10px"};color:${COLOR.grayText};">Correo</td><td style="padding:4px 16px${params.ciudadBarrio ? "" : " 10px"};text-align:right;">${params.correo}</td></tr>
      ${params.ciudadBarrio ? `<tr><td style="padding:4px 16px 10px;color:${COLOR.grayText};">Ciudad / Barrio</td><td style="padding:4px 16px 10px;text-align:right;">${params.ciudadBarrio}</td></tr>` : ""}
    </table>
    ${boton(`${SITE_URL}/admin/preinscripciones`, "Ver en el panel admin")}
    `
  );

  const text = `Un equipo nuevo se preinscribió a la Copa Muñeca e'Burro.

Equipo: ${params.nombreEquipo}
Delegado: ${params.delegadoNombre}
Contacto: ${params.contacto}
Correo: ${params.correo}${params.ciudadBarrio ? `\nCiudad / Barrio: ${params.ciudadBarrio}` : ""}

Ver en el panel admin: ${SITE_URL}/admin/preinscripciones`;

  return { subject: `Nueva preinscripción: ${params.nombreEquipo}`, html, text };
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

/**
 * Notificación interna al admin cuando un pago llega por un medio
 * automático (checkout de Wompi) — nunca por validación manual, porque ahí
 * el admin es quien acaba de registrarlo. Responde directamente a "¿quién
 * pagó la inscripción de mi equipo?": una notificación bancaria (Nequi,
 * transferencia) solo trae el monto, nunca el equipo ni el delegado — este
 * correo es la única forma confiable de saberlo de inmediato. Ver
 * `aplicarPagoCuota` en `src/lib/pagos/confirmar-cuota.ts`.
 */
export function correoNotificacionPagoAdmin(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  delegadoCorreo: string;
  numeroCuota: number;
  monto: number;
  metodoPago: string;
  referencia: string;
}): EmailContent {
  const html = layout(
    `Pago recibido: ${params.nombreEquipo} — partida ${params.numeroCuota}`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">💰 Pago recibido por Wompi</p>
    <p><strong>${params.nombreEquipo}</strong> pagó la <strong>partida ${params.numeroCuota}</strong> en línea.</p>
    ${montoDestacado(`Partida ${params.numeroCuota}`, params.monto)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;background-color:#FAFAFA;border-radius:12px;">
      <tr><td style="padding:10px 16px 4px;color:${COLOR.grayText};">Delegado</td><td style="padding:10px 16px 4px;font-weight:bold;text-align:right;">${params.delegadoNombre}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Correo</td><td style="padding:4px 16px;text-align:right;">${params.delegadoCorreo}</td></tr>
      <tr><td style="padding:4px 16px;color:${COLOR.grayText};">Medio de pago</td><td style="padding:4px 16px;text-align:right;">${params.metodoPago}</td></tr>
      <tr><td style="padding:4px 16px 10px;color:${COLOR.grayText};">Referencia Wompi</td><td style="padding:4px 16px 10px;text-align:right;">${params.referencia}</td></tr>
    </table>
    ${boton(`${SITE_URL}/admin`, "Ver en el panel admin")}
    `
  );

  const text = `${params.nombreEquipo} pagó la partida ${params.numeroCuota} en línea por ${formatCOP(params.monto)}.

Delegado: ${params.delegadoNombre}
Correo: ${params.delegadoCorreo}
Medio de pago: ${params.metodoPago}
Referencia Wompi: ${params.referencia}

Ver en el panel admin: ${SITE_URL}/admin`;

  return {
    subject: `💰 Pago recibido: ${params.nombreEquipo} — partida ${params.numeroCuota} (${formatCOP(params.monto)})`,
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

// --- Cargos por tarjetas (amarilla/azul/roja) — ver `cargos_tarjetas` y
// `claude/reglamento.md` punto 12. Un jugador con cargos sin pagar no debe
// jugar hasta saldarlos; el sistema no puede impedirlo técnicamente (no hay
// alineación/titulares en la plataforma), así que estos correos son la forma
// de presionar el pago antes del próximo partido.

type ItemCargoTarjeta = { jugadorNombre: string; tipo: string; monto: number };

function tablaCargos(items: ItemCargoTarjeta[]): string {
  const filas = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 16px;color:${COLOR.grayText};">${i.jugadorNombre}</td>
        <td style="padding:8px 16px;color:${COLOR.grayText};">${i.tipo}</td>
        <td style="padding:8px 16px;text-align:right;font-weight:bold;">${formatCOP(i.monto)}</td>
      </tr>`
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;background-color:#FAFAFA;border-radius:12px;">
      ${filas}
    </table>`;
}

function textoCargos(items: ItemCargoTarjeta[]): string {
  return items.map((i) => `- ${i.jugadorNombre} · ${i.tipo} · ${formatCOP(i.monto)}`).join("\n");
}

/**
 * Aviso al delegado el día después de que se registró una tarjeta cobrable —
 * primer contacto, antes de que sea urgente. No es un recordatorio de
 * partido próximo (ver `correoRecordatorioCargoTarjeta` para eso).
 */
export function correoCargoTarjetaGenerado(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  items: ItemCargoTarjeta[];
  total: number;
}): EmailContent {
  const html = layout(
    `${params.nombreEquipo} tiene tarjetas por pagar`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">🟨 Cargo por tarjeta</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p>En el último partido de <strong>${params.nombreEquipo}</strong> se registraron tarjetas con cargo económico, según el reglamento del torneo:</p>
    ${tablaCargos(params.items)}
    ${montoDestacado("Total a pagar", params.total)}
    ${cajaImportante(
      "Importante",
      "Un jugador con tarjetas sin pagar no debe jugar el próximo partido hasta saldar la deuda."
    )}
    ${boton(`${SITE_URL}/portal`, "Pagar desde el portal")}
    <p style="margin-top:20px;font-size:13px;color:${COLOR.grayText};">También se puede pagar por jugador, individualmente, en ${SITE_URL}/pagos-tarjetas.</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

En el último partido de ${params.nombreEquipo} se registraron tarjetas con cargo económico:

${textoCargos(params.items)}

Total a pagar: ${formatCOP(params.total)}

Importante: un jugador con tarjetas sin pagar no debe jugar el próximo partido hasta saldar la deuda.

Pagar desde el portal: ${SITE_URL}/portal
También se puede pagar por jugador, individualmente, en ${SITE_URL}/pagos-tarjetas.

Copa Muñeca e'Burro — Montería, Córdoba`;

  return {
    subject: `🟨 ${params.nombreEquipo} tiene tarjetas por pagar (${formatCOP(params.total)})`,
    html,
    text,
  };
}

/**
 * Recordatorio urgente, 24 horas antes del próximo partido programado del
 * equipo, mientras la deuda de tarjetas siga sin pagar.
 */
export function correoRecordatorioCargoTarjeta(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  items: ItemCargoTarjeta[];
  total: number;
  fechaProximoPartido: string;
}): EmailContent {
  const html = layout(
    `${params.nombreEquipo} juega mañana y tiene tarjetas sin pagar`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">⚠️ Recordatorio urgente</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p><strong>${params.nombreEquipo}</strong> juega mañana y todavía tiene tarjetas sin pagar:</p>
    ${tablaCargos(params.items)}
    ${montoDestacado("Total a pagar", params.total)}
    ${cajaImportante(
      "El jugador no debe jugar si no se paga",
      "Según el reglamento, un jugador con tarjetas sin pagar no debe jugar hasta saldar la deuda. Paga antes del partido para evitar problemas en cancha."
    )}
    ${boton(`${SITE_URL}/portal`, "Pagar ahora")}
    `
  );

  const text = `Hola ${params.delegadoNombre},

${params.nombreEquipo} juega mañana y todavía tiene tarjetas sin pagar:

${textoCargos(params.items)}

Total a pagar: ${formatCOP(params.total)}

Importante: un jugador con tarjetas sin pagar no debe jugar hasta saldar la deuda. Paga antes del partido para evitar problemas en cancha.

Pagar ahora: ${SITE_URL}/portal

Copa Muñeca e'Burro — Montería, Córdoba`;

  return {
    subject: `⚠️ ${params.nombreEquipo} juega mañana y debe tarjetas sin pagar`,
    html,
    text,
  };
}

/** Confirmación al delegado cuando se paga un lote de cargos de tarjetas —
 * ya sea desde el portal (pago grupal) o desde /pagos-tarjetas (un jugador
 * pagando las suyas). */
export function correoCargoTarjetaPagado(params: {
  nombreEquipo: string;
  delegadoNombre: string;
  items: ItemCargoTarjeta[];
  total: number;
}): EmailContent {
  const html = layout(
    `Pago de tarjetas confirmado — ${params.nombreEquipo}`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">✅ Pago confirmado</p>
    <p>Hola ${params.delegadoNombre},</p>
    <p>Recibimos el pago de estas tarjetas de <strong>${params.nombreEquipo}</strong>:</p>
    ${tablaCargos(params.items)}
    ${montoDestacado("Total pagado", params.total)}
    <p>Los jugadores ya quedan habilitados para jugar.</p>
    `
  );

  const text = `Hola ${params.delegadoNombre},

Recibimos el pago de estas tarjetas de ${params.nombreEquipo}:

${textoCargos(params.items)}

Total pagado: ${formatCOP(params.total)}

Los jugadores ya quedan habilitados para jugar.

Copa Muñeca e'Burro — Montería, Córdoba`;

  return { subject: `Pago de tarjetas confirmado — ${params.nombreEquipo}`, html, text };
}

/** Aviso interno al admin cuando se paga un lote de cargos de tarjetas por
 * un medio automático (Wompi) — mismo patrón que `correoNotificacionPagoAdmin`. */
export function correoNotificacionCargoTarjetaAdmin(params: {
  nombreEquipo: string;
  items: ItemCargoTarjeta[];
  total: number;
  metodoPago: string;
  referencia: string;
}): EmailContent {
  const html = layout(
    `Pago de tarjetas recibido: ${params.nombreEquipo}`,
    `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:${COLOR.purple};">💰 Pago de tarjetas recibido por Wompi</p>
    <p><strong>${params.nombreEquipo}</strong> pagó estas tarjetas en línea:</p>
    ${tablaCargos(params.items)}
    ${montoDestacado("Total", params.total)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;background-color:#FAFAFA;border-radius:12px;">
      <tr><td style="padding:10px 16px;color:${COLOR.grayText};">Medio de pago</td><td style="padding:10px 16px;text-align:right;">${params.metodoPago}</td></tr>
      <tr><td style="padding:4px 16px 10px;color:${COLOR.grayText};">Referencia Wompi</td><td style="padding:4px 16px 10px;text-align:right;">${params.referencia}</td></tr>
    </table>
    ${boton(`${SITE_URL}/admin/cargos-tarjetas`, "Ver en el panel admin")}
    `
  );

  const text = `${params.nombreEquipo} pagó estas tarjetas en línea:

${textoCargos(params.items)}

Total: ${formatCOP(params.total)}
Medio de pago: ${params.metodoPago}
Referencia Wompi: ${params.referencia}

Ver en el panel admin: ${SITE_URL}/admin/cargos-tarjetas`;

  return {
    subject: `💰 Pago de tarjetas recibido: ${params.nombreEquipo} (${formatCOP(params.total)})`,
    html,
    text,
  };
}
