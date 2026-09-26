import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reporte de pago por transferencia (QR Nu / Llave @FGC368) — agregado
 * 2026-09-26 a pedido de Fernando. La aprobación SIGUE siendo 100% manual
 * para transferencias: el admin revisa su cuenta Nu y marca la partida/
 * tarjeta como pagada a mano, exactamente igual que antes (ver
 * `aplicarPagoCuota`/`aplicarPagoCargos`). Lo que agrega este módulo es solo
 * la posibilidad de que el equipo/jugador avise "ya transferí" (con
 * comprobante opcional) y que quede un registro de cuándo avisó y si fue
 * dentro del plazo — nunca marca nada como pagado por sí solo.
 */

export type TablaPago = "payment_installments" | "cargos_tarjetas";

const BUCKET_COMPROBANTES = "comprobantes-pago";

/**
 * Sube el comprobante (imagen o PDF) que adjunta el equipo/jugador al
 * reportar su transferencia. Siempre con el cliente de service role: el
 * equipo no tiene por qué tener permiso directo de Storage, y quien paga
 * desde /pagos-tarjetas ni siquiera tiene sesión.
 */
export async function subirComprobante(
  admin: SupabaseClient,
  file: File
): Promise<{ url: string } | { error: string }> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const ruta = `${crypto.randomUUID()}.${extension}`;

  const { error } = await admin.storage.from(BUCKET_COMPROBANTES).upload(ruta, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) return { error: `No se pudo subir el comprobante: ${error.message}` };

  const { data } = admin.storage.from(BUCKET_COMPROBANTES).getPublicUrl(ruta);
  return { url: data.publicUrl };
}

export type ReportarTransferenciaResult =
  | { success: true; aTiempo: boolean }
  | { success: false; error: string };

/**
 * Marca uno o varios registros pendientes (una cuota, o todos los cargos de
 * un mismo equipo/jugador) como "transferencia reportada" — NUNCA los marca
 * pagados. `desde` es el ancla del plazo de notificación: la fecha límite de
 * la cuota, o la fecha de creación del cargo más antiguo del lote (no hay un
 * "cuándo pagaste" exacto que la plataforma pueda conocer, así que el plazo
 * se cuenta desde cuándo se generó la obligación, no desde que se reporta).
 */
export async function reportarTransferencia(
  admin: SupabaseClient,
  params: {
    tabla: TablaPago;
    ids: string[];
    comprobanteUrl: string | null;
    desde: Date;
    horasPlazo: number;
  }
): Promise<ReportarTransferenciaResult> {
  if (params.ids.length === 0) {
    return { success: false, error: "No hay nada pendiente por reportar." };
  }

  const ahora = new Date();
  const plazo = new Date(params.desde.getTime() + params.horasPlazo * 60 * 60 * 1000);
  const aTiempo = ahora.getTime() <= plazo.getTime();

  const { error } = await admin
    .from(params.tabla)
    .update({
      metodo_pago_declarado: "transferencia",
      pago_reportado_at: ahora.toISOString(),
      ...(params.comprobanteUrl ? { comprobante_url: params.comprobanteUrl } : {}),
    })
    .in("id", params.ids)
    .eq("estado", "pendiente");

  if (error) {
    return { success: false, error: `No se pudo registrar el reporte: ${error.message}` };
  }

  return { success: true, aTiempo };
}

/**
 * Recalcula, a partir de datos ya guardados (para cuando se vuelve a
 * renderizar la página, no en el momento de reportar), si un reporte quedó
 * dentro del plazo — mismo cálculo que hace `reportarTransferencia` al
 * guardar, para que el badge que ve el equipo/jugador no cambie entre
 * recargas.
 */
export function estaATiempo(reportadoAtIso: string, desde: Date, horasPlazo: number): boolean {
  const plazo = new Date(desde.getTime() + horasPlazo * 60 * 60 * 1000);
  return new Date(reportadoAtIso).getTime() <= plazo.getTime();
}

export function formatearPlazoTexto(horas: number): string {
  return horas === 24 ? "24 horas" : `${horas} horas`;
}

/**
 * Texto para mostrarle al equipo/jugador antes de que reporte su pago —
 * "Repórtalo antes del <fecha corta> a las <hora>" — calculado desde el
 * mismo `desde`/`horasPlazo` que usa `reportarTransferencia`, para que la
 * fecha que ven coincida exactamente con el corte real.
 */
export function calcularTextoLimiteReporte(desde: Date, horasPlazo: number): string {
  const limite = new Date(desde.getTime() + horasPlazo * 60 * 60 * 1000);
  const fecha = limite.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Bogota",
  });
  const hora = limite.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
  return `Repórtalo antes del ${fecha}, ${hora}`;
}
