import { createHash } from "crypto";

/**
 * Integración con Wompi (checkout en línea de las partidas del plan de
 * pagos). Usa la misma cuenta de Wompi que Hakunna Fit (mismas llaves) — ver
 * `analisis-arquitectura-backend.md`. Para no depender de la URL de eventos
 * (webhook) compartida con Hakunna Fit, el flujo NO usa webhook: el Widget
 * de Wompi devuelve el id de la transacción al cerrar el checkout, y el
 * servidor confirma el pago consultando esa transacción directamente contra
 * la API de Wompi (GET /v1/transactions/:id) antes de marcar la cuota como
 * pagada — ver `confirmarPagoWompi` en `src/app/portal/inscripcion/wompi-actions.ts`.
 * Esto evita tocar la configuración de Wompi compartida con Hakunna Fit.
 */

export type WompiTransaction = {
  id: string;
  reference: string;
  status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
  amount_in_cents: number;
  currency: string;
  payment_method_type: string;
  customer_email: string | null;
  created_at: string;
  finalized_at: string | null;
};

/**
 * La llave pública indica el ambiente: `pub_test_...` → sandbox,
 * `pub_prod_...` → producción. Así, si más adelante se agregan llaves de
 * prueba, el cliente apunta solo con cambiar la variable de entorno.
 */
function baseUrl(): string {
  const pub = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "";
  return pub.startsWith("pub_test_")
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";
}

/**
 * Firma de integridad que exige el Widget de Wompi para cada checkout —
 * evita que alguien manipule el monto o la referencia desde el navegador.
 * Fórmula exacta de Wompi (sin separadores entre los campos):
 * SHA256(referencia + montoEnCentavos + moneda + secretoDeIntegridad).
 */
export function firmarIntegridadWompi(
  reference: string,
  amountInCents: number,
  currency: string
): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) {
    throw new Error("Falta configurar WOMPI_INTEGRITY_SECRET en las variables de entorno del servidor.");
  }
  const cadena = `${reference}${amountInCents}${currency}${secret}`;
  return createHash("sha256").update(cadena).digest("hex");
}

/**
 * Consulta el estado real de una transacción directamente contra la API de
 * Wompi — nunca se confía en el estado que reporta el navegador (el widget
 * corre en el cliente y su resultado se puede falsificar desde devtools).
 * La llave pública es suficiente para leer transacciones (no hace falta la
 * privada, que Wompi reserva para crear fuentes de pago/tokens).
 */
export async function consultarTransaccionWompi(
  transactionId: string
): Promise<WompiTransaction | null> {
  const pub = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  if (!pub) {
    console.error("[wompi] Falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY.");
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${pub}` },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[wompi] Error al consultar transacción:", res.status, await res.text());
      return null;
    }

    const body = await res.json();
    return (body?.data as WompiTransaction) ?? null;
  } catch (err) {
    console.error("[wompi] Excepción al consultar transacción:", err);
    return null;
  }
}

/**
 * Referencia única por intento de pago de una partida. Wompi no permite
 * reutilizar una referencia ya usada en la cuenta, así que cada intento
 * (incluyendo reintentos tras un pago fallido) lleva un sufijo de tiempo.
 * El id de la cuota queda embebido (separado por "_", que nunca aparece en
 * un UUID) para poder verificar, al confirmar, que la transacción aprobada
 * corresponde exactamente a esta cuota y no a otra.
 */
export function generarReferenciaCuota(cuotaId: string): string {
  return `CMEB_${cuotaId}_${Date.now()}`;
}

export function referenciaPerteneceACuota(reference: string, cuotaId: string): boolean {
  return reference.startsWith(`CMEB_${cuotaId}_`);
}
