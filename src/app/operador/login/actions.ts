"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { establecerCookieSesion, verificarPin } from "@/lib/operador/sesion";
import {
  hashIpOperador,
  verificarLimiteIntentos,
  registrarIntentoFallido,
  limpiarIntentos,
  DURACION_BLOQUEO_MINUTOS,
} from "@/lib/operador/rate-limit";

type ResultadoAccion = { success: true } | { success: false; error: string };

/**
 * Valida el PIN contra todos los operadores activos (son pocos, así que
 * revisarlos uno por uno con scrypt no es un problema de rendimiento) y, si
 * hay coincidencia, deja la cookie de sesión firmada y redirige a la
 * consola. Usa el cliente de service role porque los operadores no tienen
 * usuario de Supabase Auth — no hay sesión de la que depender para RLS.
 *
 * Desde que este login tiene un botón público en el home/header
 * (2026-09-26), se frena antes que nada por IP (`rate-limit.ts`) — son PINs
 * cortos y antes no había ningún límite de intentos.
 */
export async function iniciarSesionOperador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const pin = (formData.get("pin") as string | null)?.trim();
  if (!pin) return { success: false, error: "Ingresa tu PIN." };

  const admin = createAdminClient();
  const ipHash = await hashIpOperador();

  const limite = await verificarLimiteIntentos(admin, ipHash);
  if (limite.bloqueado) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Vuelve a intentar en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? "" : "s"}.`,
    };
  }

  const { data: operadores, error } = await admin
    .from("operadores")
    .select("id, nombre, pin_hash")
    .eq("activo", true);

  if (error) {
    return { success: false, error: "No se pudo validar el PIN. Intenta de nuevo." };
  }

  const operador = (operadores ?? []).find((o) => verificarPin(pin, o.pin_hash));
  if (!operador) {
    const { intentosRestantes } = await registrarIntentoFallido(admin, ipHash);
    return {
      success: false,
      error:
        intentosRestantes > 0
          ? `PIN incorrecto. Te quedan ${intentosRestantes} intento${intentosRestantes === 1 ? "" : "s"} antes de un bloqueo temporal.`
          : `Demasiados intentos fallidos. Vuelve a intentar en ${DURACION_BLOQUEO_MINUTOS} minutos.`,
    };
  }

  await limpiarIntentos(admin, ipHash);
  await establecerCookieSesion(operador.id, operador.nombre);
  redirect("/operador");
}
