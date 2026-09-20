"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminNotificationEmails } from "@/lib/resend/client";
import {
  consultarTransaccionWompi,
  firmarIntegridadWompi,
  generarReferenciaCuota,
  referenciaPerteneceACuota,
} from "@/lib/wompi/client";
import { crearLotePagoCargos, aplicarPagoCargos } from "@/lib/pagos/confirmar-cargos";

const SITE_URL = "https://xn--copamuecaburro-vnb.com";

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

/**
 * Pago grupal desde el portal del equipo: junta TODOS los cargos de
 * tarjetas pendientes del equipo con sesión activa (cualquier jugador) en
 * un solo lote, para cobrarlos juntos en una sola transacción de Wompi.
 * Mismo patrón que `iniciarPagoCuota` en `portal/inscripcion/wompi-actions.ts`
 * — la sesión determina el `team_id`, nunca un id que mande el navegador.
 */
export async function iniciarPagoCargosEquipo(): Promise<IniciarPagoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No hay sesión activa." };

  const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single();
  const teamId = profile?.team_id as string | undefined;
  if (!teamId) return { success: false, error: "No hay sesión activa." };

  const admin = createAdminClient();
  const { data: pendientes } = await admin
    .from("cargos_tarjetas")
    .select("id")
    .eq("team_id", teamId)
    .eq("estado", "pendiente");

  const ids = (pendientes ?? []).map((c) => c.id as string);
  if (ids.length === 0) return { success: false, error: "No hay tarjetas pendientes por pagar." };

  const lote = await crearLotePagoCargos(admin, ids);
  if (!lote) return { success: false, error: "No hay tarjetas pendientes por pagar." };

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  if (!publicKey) return { success: false, error: "El pago en línea todavía no está configurado." };

  const amountInCents = Math.round(lote.total * 100);
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
      redirectUrl: `${SITE_URL}/portal`,
    },
  };
}

export type ConfirmarPagoResult = { success: true } | { success: false; error: string };

export async function confirmarPagoCargosEquipo(loteId: string, transactionId: string): Promise<ConfirmarPagoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No hay sesión activa." };

  const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single();
  const teamId = profile?.team_id as string | undefined;
  if (!teamId) return { success: false, error: "No hay sesión activa." };

  const admin = createAdminClient();
  const { data: cargosDelLote } = await admin
    .from("cargos_tarjetas")
    .select("id, monto, team_id")
    .eq("lote_pago_id", loteId)
    .eq("estado", "pendiente");

  if (!cargosDelLote || cargosDelLote.length === 0) {
    return { success: false, error: "No se encontró el pago." };
  }

  if (cargosDelLote.some((c) => c.team_id !== teamId)) {
    return { success: false, error: "Este pago no corresponde a tu equipo." };
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

  const montoEsperado = Math.round(cargosDelLote.reduce((sum, c) => sum + Number(c.monto), 0) * 100);
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

  if (resultado.success) {
    revalidatePath("/portal");
  }

  return resultado;
}
