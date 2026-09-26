"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aplicarPagoCuota } from "@/lib/pagos/confirmar-cuota";
import { calcularMontoConRecargoWompi } from "@/lib/pagos/recargo-wompi";
import {
  consultarTransaccionWompi,
  firmarIntegridadWompi,
  generarReferenciaCuota,
  referenciaPerteneceACuota,
} from "@/lib/wompi/client";

const SITE_URL = "https://xn--copamuecaburro-vnb.com";

export type DatosCheckoutWompi = {
  publicKey: string;
  currency: "COP";
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl: string;
};

export type IniciarPagoResult =
  | { success: true; datos: DatosCheckoutWompi }
  | { success: false; error: string };

/**
 * Prepara los datos para abrir el Widget de Wompi para una partida
 * específica: valida que la cuota pertenezca al equipo con sesión activa
 * (por RLS, un equipo solo puede LEER su propio plan de pagos — se usa el
 * cliente con sesión, no el de service role, precisamente para que esa
 * verificación de propiedad la haga Supabase y no solo el código) y genera
 * una referencia + firma de integridad nuevas para este intento.
 */
export async function iniciarPagoCuota(cuotaId: string): Promise<IniciarPagoResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const [{ data: cuota, error }, { data: config }] = await Promise.all([
    supabase.from("payment_installments").select("id, monto, estado").eq("id", cuotaId).maybeSingle(),
    supabase.from("torneo_config").select("recargo_wompi_pct").eq("id", 1).single(),
  ]);

  if (error || !cuota) {
    // Si la cuota no es del equipo con sesión, RLS hace que no aparezca —
    // se reporta como "no encontrada" en ambos casos, sin distinguir.
    return { success: false, error: "No se encontró la partida." };
  }

  if (cuota.estado === "pagada") {
    return { success: false, error: "Esta partida ya está pagada." };
  }

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  if (!publicKey) {
    return { success: false, error: "El pago en línea todavía no está configurado." };
  }

  // El monto que cobra Wompi lleva el recargo de procesamiento — el que
  // queda registrado como pagado en `payment_installments` sigue siendo el
  // monto real de la cuota (`aplicarPagoCuota` usa `cuota.monto`, no lo que
  // Wompi cobró), así que la inscripción nunca "cuesta más" en el sistema.
  const recargoPct = Number(config?.recargo_wompi_pct ?? 0);
  const montoConRecargo = calcularMontoConRecargoWompi(Number(cuota.monto), recargoPct);
  const amountInCents = Math.round(montoConRecargo * 100);
  const reference = generarReferenciaCuota(cuota.id);
  let signature: string;
  try {
    signature = firmarIntegridadWompi(reference, amountInCents, "COP");
  } catch {
    return { success: false, error: "El pago en línea todavía no está configurado." };
  }

  return {
    success: true,
    datos: {
      publicKey,
      currency: "COP",
      amountInCents,
      reference,
      signature,
      redirectUrl: `${SITE_URL}/portal/inscripcion?paso=6`,
    },
  };
}

export type ConfirmarPagoResult = { success: true } | { success: false; error: string };

/**
 * Se llama desde el navegador con el id de transacción que devuelve el
 * Widget al cerrarse — ese resultado del navegador NUNCA se usa como fuente
 * de verdad (se puede falsificar desde devtools). Acá se vuelve a consultar
 * la transacción directamente contra la API de Wompi y solo se marca la
 * cuota como pagada si Wompi confirma que está APPROVED, que el monto
 * coincide exactamente y que la referencia corresponde a esta cuota (evita
 * que se reutilice la transacción aprobada de otra cuota).
 */
export async function confirmarPagoWompi(
  cuotaId: string,
  transactionId: string
): Promise<ConfirmarPagoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const [{ data: cuotaPropia }, { data: config }] = await Promise.all([
    supabase.from("payment_installments").select("id, monto").eq("id", cuotaId).maybeSingle(),
    supabase.from("torneo_config").select("recargo_wompi_pct").eq("id", 1).single(),
  ]);

  if (!cuotaPropia) {
    return { success: false, error: "No se encontró la partida." };
  }

  const transaccion = await consultarTransaccionWompi(transactionId);
  if (!transaccion) {
    return {
      success: false,
      error: "No se pudo confirmar el pago con Wompi todavía. Si ya pagaste, espera un momento y recarga la página.",
    };
  }

  if (!referenciaPerteneceACuota(transaccion.reference, cuotaId)) {
    return { success: false, error: "La transacción no corresponde a esta partida." };
  }

  const recargoPct = Number(config?.recargo_wompi_pct ?? 0);
  const montoConRecargo = calcularMontoConRecargoWompi(Number(cuotaPropia.monto), recargoPct);
  const montoEsperado = Math.round(montoConRecargo * 100);
  if (transaccion.amount_in_cents !== montoEsperado || transaccion.currency !== "COP") {
    return { success: false, error: "El monto de la transacción no coincide con esta partida." };
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

  // A partir de acá el pago ya está verificado contra Wompi — se aplica con
  // el cliente de service role porque, por RLS, el equipo solo puede leer su
  // plan de pagos, no editarlo (ver `esquema-base-datos.md`).
  const admin = createAdminClient();
  const resultado = await aplicarPagoCuota(admin, {
    cuotaId,
    referencia: transaccion.reference,
    notificarAdmin: { metodoPago: transaccion.payment_method_type },
  });

  if (resultado.success) {
    revalidatePath("/portal/inscripcion");
    revalidatePath("/portal");
  }

  return resultado;
}
