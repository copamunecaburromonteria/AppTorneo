"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminNotificationEmails } from "@/lib/resend/client";
import {
  consultarTransaccionWompi,
  firmarIntegridadWompi,
  generarReferenciaCuota,
  referenciaPerteneceACuota,
} from "@/lib/wompi/client";
import { crearLotePagoCargos, aplicarPagoCargos, LABEL_TIPO_TARJETA } from "@/lib/pagos/confirmar-cargos";
import { calcularMontoConRecargoWompi } from "@/lib/pagos/recargo-wompi";
import {
  reportarTransferencia,
  subirComprobante,
  calcularTextoLimiteReporte,
  estaATiempo,
} from "@/lib/pagos/reportar-transferencia";
import { correoTransferenciaReportadaCargosAdmin } from "@/lib/resend/templates";
import { sendEmail } from "@/lib/resend/client";

const SITE_URL = "https://xn--copamuecaburro-vnb.com";

/**
 * Búsqueda pública de tarjetas pendientes por cédula — sin login, porque los
 * jugadores no tienen cuenta propia (solo el delegado, en `/portal`). Pide
 * cédula + nombre completo (segundo factor acordado con Fernando) para que
 * no baste con adivinar/probar números de cédula ajenos para ver la deuda de
 * otra persona. El mismo mensaje de error cubre "cédula no existe" y
 * "nombre no coincide", para no confirmarle a quien pregunta cuál de las dos
 * cosas falló.
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

type ItemCargo = { id: string; tipo: string; monto: number; rival: string; fecha: string };

export type ResultadoBusquedaCargos =
  | {
      success: true;
      jugadorNombre: string;
      equipoNombre: string;
      items: ItemCargo[];
      total: number;
      // Datos para mostrar las opciones de pago (transferencia/Wompi) — ver
      // `OpcionesPago` y `reportarTransferenciaCargosJugador` más abajo.
      recargoWompiPct: number;
      llave: string;
      deadlineTexto: string;
      yaReportado: { at: string; aTiempo: boolean } | null;
    }
  | { success: false; error: string };

const ERROR_GENERICO = "No encontramos un jugador con esa cédula y ese nombre. Revisa que estén escritos igual que en la inscripción.";

/**
 * Localiza al jugador por cédula + nombre y trae sus cargos pendientes. Se
 * reutiliza tal cual (misma verificación) desde `iniciarPagoCargosJugador`,
 * para no confiar en ids de cargo que pudiera mandar el navegador — acá se
 * vuelven a calcular desde cero cada vez.
 */
async function localizarJugadorConCargos(cedula: string, nombreCompleto: string) {
  const admin = createAdminClient();
  const cedulaLimpia = cedula.replace(/\D/g, "");
  if (!cedulaLimpia) return null;

  const { data: jugador } = await admin
    .from("players")
    .select("id, nombre, team_id, teams:team_id(nombre_equipo)")
    .eq("numero_documento", cedulaLimpia)
    .maybeSingle();

  if (!jugador) return null;

  const equipo = Array.isArray(jugador.teams) ? jugador.teams[0] : jugador.teams;
  if (normalizarTexto(jugador.nombre as string) !== normalizarTexto(nombreCompleto)) return null;

  const { data: cargos } = await admin
    .from("cargos_tarjetas")
    .select(
      "id, tipo_tarjeta, monto, created_at, pago_reportado_at, match:match_id(fecha_hora_programada, equipo_local:equipo_local_id(nombre_equipo), equipo_visitante:equipo_visitante_id(nombre_equipo)), equipo_id_evento:team_id"
    )
    .eq("jugador_id", jugador.id)
    .eq("estado", "pendiente");

  return { jugador, equipo, cargos: cargos ?? [], admin };
}

export async function buscarCargosPorCedula(
  cedula: string,
  nombreCompleto: string
): Promise<ResultadoBusquedaCargos> {
  if (!cedula.trim() || !nombreCompleto.trim()) {
    return { success: false, error: "Escribe tu cédula y tu nombre completo." };
  }

  const resultado = await localizarJugadorConCargos(cedula, nombreCompleto);
  if (!resultado) return { success: false, error: ERROR_GENERICO };

  const { jugador, equipo, cargos, admin } = resultado;

  const { data: config } = await admin
    .from("torneo_config")
    .select("recargo_wompi_pct, horas_plazo_notificacion_transferencia, llave_pago_transferencia")
    .eq("id", 1)
    .single();
  const recargoWompiPct = Number(config?.recargo_wompi_pct ?? 0);
  const horasPlazo = config?.horas_plazo_notificacion_transferencia ?? 24;
  const llave = config?.llave_pago_transferencia ?? "@FGC368";

  const masAntiguo = cargos.length > 0
    ? cargos.reduce((min, c) => ((c.created_at as string) < min ? (c.created_at as string) : min), cargos[0].created_at as string)
    : new Date().toISOString();
  const deadlineTexto = calcularTextoLimiteReporte(new Date(masAntiguo), horasPlazo);
  const yaReportado =
    cargos.length > 0 && cargos.every((c) => c.pago_reportado_at)
      ? {
          at: cargos[0].pago_reportado_at as string,
          aTiempo: estaATiempo(cargos[0].pago_reportado_at as string, new Date(masAntiguo), horasPlazo),
        }
      : null;

  const items: ItemCargo[] = cargos.map((c) => {
    const match = Array.isArray(c.match) ? c.match[0] : c.match;
    const local = match ? (Array.isArray(match.equipo_local) ? match.equipo_local[0] : match.equipo_local) : null;
    const visitante = match
      ? Array.isArray(match.equipo_visitante)
        ? match.equipo_visitante[0]
        : match.equipo_visitante
      : null;
    const rival =
      c.equipo_id_evento === jugador.team_id
        ? [local, visitante].find((eq) => eq && eq.nombre_equipo !== equipo?.nombre_equipo)?.nombre_equipo
        : null;

    return {
      id: c.id as string,
      tipo: LABEL_TIPO_TARJETA[c.tipo_tarjeta as string] ?? (c.tipo_tarjeta as string),
      monto: Number(c.monto),
      rival: rival ?? "—",
      fecha: match?.fecha_hora_programada ?? "",
    };
  });

  return {
    success: true,
    jugadorNombre: jugador.nombre as string,
    equipoNombre: equipo?.nombre_equipo ?? "—",
    items,
    total: items.reduce((sum, i) => sum + i.monto, 0),
    recargoWompiPct,
    llave,
    deadlineTexto,
    yaReportado,
  };
}

export type IniciarPagoResult =
  | {
      success: true;
      loteId: string;
      datos: {
        publicKey: string;
        currency: "COP";
        amountInCents: number;
        reference: string;
        signature: string;
        redirectUrl: string;
      };
    }
  | { success: false; error: string };

/** Vuelve a verificar cédula + nombre (nunca se confía en ids que pudiera
 * mandar el navegador) y agrupa los cargos pendientes en un lote para
 * cobrarlos juntos en una sola transacción de Wompi. */
export async function iniciarPagoCargosJugador(cedula: string, nombreCompleto: string): Promise<IniciarPagoResult> {
  const resultado = await localizarJugadorConCargos(cedula, nombreCompleto);
  if (!resultado) return { success: false, error: ERROR_GENERICO };

  const { cargos, admin } = resultado;
  const pendientes = cargos.map((c) => c.id as string);
  if (pendientes.length === 0) return { success: false, error: "No hay tarjetas pendientes por pagar." };

  const lote = await crearLotePagoCargos(admin, pendientes);
  if (!lote) return { success: false, error: "No hay tarjetas pendientes por pagar." };

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  if (!publicKey) return { success: false, error: "El pago en línea todavía no está configurado." };

  const { data: config } = await admin.from("torneo_config").select("recargo_wompi_pct").eq("id", 1).single();
  const recargoPct = Number(config?.recargo_wompi_pct ?? 0);
  const totalConRecargo = calcularMontoConRecargoWompi(lote.total, recargoPct);
  const amountInCents = Math.round(totalConRecargo * 100);
  const reference = generarReferenciaCuota(lote.loteId);
  let signature: string;
  try {
    signature = firmarIntegridadWompi(reference, amountInCents, "COP");
  } catch {
    return { success: false, error: "El pago en línea todavía no está configurado." };
  }

  return {
    success: true,
    loteId: lote.loteId,
    datos: {
      publicKey,
      currency: "COP",
      amountInCents,
      reference,
      signature,
      redirectUrl: `${SITE_URL}/pagos-tarjetas`,
    },
  };
}

export type ConfirmarPagoResult = { success: true } | { success: false; error: string };

export async function confirmarPagoCargosJugador(
  loteId: string,
  transactionId: string
): Promise<ConfirmarPagoResult> {
  const admin = createAdminClient();

  const [{ data: cargosDelLote }, { data: config }] = await Promise.all([
    admin.from("cargos_tarjetas").select("id, monto").eq("lote_pago_id", loteId).eq("estado", "pendiente"),
    admin.from("torneo_config").select("recargo_wompi_pct").eq("id", 1).single(),
  ]);

  if (!cargosDelLote || cargosDelLote.length === 0) {
    return { success: false, error: "No se encontró el pago." };
  }

  const transaccion = await consultarTransaccionWompi(transactionId);
  if (!transaccion) {
    return {
      success: false,
      error: "No se pudo confirmar el pago con Wompi todavía. Si ya pagaste, espera un momento y recarga la página.",
    };
  }

  if (!referenciaPerteneceACuota(transaccion.reference, loteId)) {
    return { success: false, error: "La transacción no corresponde a este pago." };
  }

  const recargoPct = Number(config?.recargo_wompi_pct ?? 0);
  const totalReal = cargosDelLote.reduce((sum, c) => sum + Number(c.monto), 0);
  const montoEsperado = Math.round(calcularMontoConRecargoWompi(totalReal, recargoPct) * 100);
  if (transaccion.amount_in_cents !== montoEsperado || transaccion.currency !== "COP") {
    return { success: false, error: "El monto de la transacción no coincide con lo que se debe." };
  }

  if (transaccion.status !== "APPROVED") {
    return {
      success: false,
      error:
        transaccion.status === "PENDING"
          ? "Wompi todavía está procesando el pago. Espera un momento y recarga la página."
          : "El pago no fue aprobado por Wompi.",
    };
  }

  const resultado = await aplicarPagoCargos(admin, {
    loteId,
    referencia: transaccion.reference,
    notificarAdmin: getAdminNotificationEmails() ? { metodoPago: transaccion.payment_method_type } : undefined,
  });

  return resultado;
}

export type ReportarTransferenciaResult = { success: true } | { success: false; error: string };

/**
 * Reporte de pago por transferencia para el jugador que paga desde
 * /pagos-tarjetas (sin sesión) — vuelve a verificar cédula + nombre, igual
 * que el resto de las acciones de este archivo, en vez de confiar en ids que
 * pudiera mandar el navegador. NO marca las tarjetas como pagadas: el admin
 * sigue confirmándolo a mano tras revisar su cuenta Nu (ver
 * `reportarTransferencia` en `lib/pagos/reportar-transferencia.ts`).
 */
export async function reportarTransferenciaCargosJugador(
  cedula: string,
  nombreCompleto: string,
  formData: FormData
): Promise<ReportarTransferenciaResult> {
  const resultado = await localizarJugadorConCargos(cedula, nombreCompleto);
  if (!resultado) return { success: false, error: ERROR_GENERICO };

  const { jugador, equipo, cargos, admin } = resultado;
  if (cargos.length === 0) return { success: false, error: "No hay tarjetas pendientes por pagar." };

  const { data: config } = await admin
    .from("torneo_config")
    .select("horas_plazo_notificacion_transferencia")
    .eq("id", 1)
    .single();
  const horasPlazo = config?.horas_plazo_notificacion_transferencia ?? 24;

  let comprobanteUrl: string | null = null;
  const file = formData.get("comprobante") as File | null;
  if (file && file.size > 0) {
    const subida = await subirComprobante(admin, file);
    if ("error" in subida) return { success: false, error: subida.error };
    comprobanteUrl = subida.url;
  }

  const masAntiguo = cargos.reduce(
    (min, c) => ((c.created_at as string) < min ? (c.created_at as string) : min),
    cargos[0].created_at as string
  );

  const resultadoReporte = await reportarTransferencia(admin, {
    tabla: "cargos_tarjetas",
    ids: cargos.map((c) => c.id as string),
    comprobanteUrl,
    desde: new Date(masAntiguo),
    horasPlazo,
  });

  if (!resultadoReporte.success) return resultadoReporte;

  const items = cargos.map((c) => ({
    jugadorNombre: jugador.nombre as string,
    tipo: LABEL_TIPO_TARJETA[c.tipo_tarjeta as string] ?? (c.tipo_tarjeta as string),
    monto: Number(c.monto),
  }));
  const total = items.reduce((sum, i) => sum + i.monto, 0);

  const adminEmails = getAdminNotificationEmails();
  if (adminEmails) {
    const correo = correoTransferenciaReportadaCargosAdmin({
      nombreEquipo: equipo?.nombre_equipo ?? "—",
      items,
      total,
      comprobanteUrl,
      aTiempo: resultadoReporte.aTiempo,
      plazoTexto: `${horasPlazo} horas`,
    });
    await sendEmail({ to: adminEmails, subject: correo.subject, html: correo.html, text: correo.text }).catch(() => {});
  }

  return { success: true };
}
