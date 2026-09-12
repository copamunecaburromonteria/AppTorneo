"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { establecerCookieSesion, verificarPin } from "@/lib/operador/sesion";

type ResultadoAccion = { success: true } | { success: false; error: string };

/**
 * Valida el PIN contra todos los operadores activos (son pocos, así que
 * revisarlos uno por uno con scrypt no es un problema de rendimiento) y, si
 * hay coincidencia, deja la cookie de sesión firmada y redirige a la
 * consola. Usa el cliente de service role porque los operadores no tienen
 * usuario de Supabase Auth — no hay sesión de la que depender para RLS.
 */
export async function iniciarSesionOperador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const pin = (formData.get("pin") as string | null)?.trim();
  if (!pin) return { success: false, error: "Ingresa tu PIN." };

  const admin = createAdminClient();
  const { data: operadores, error } = await admin
    .from("operadores")
    .select("id, nombre, pin_hash")
    .eq("activo", true);

  if (error) {
    return { success: false, error: "No se pudo validar el PIN. Intenta de nuevo." };
  }

  const operador = (operadores ?? []).find((o) => verificarPin(pin, o.pin_hash));
  if (!operador) {
    return { success: false, error: "PIN incorrecto." };
  }

  await establecerCookieSesion(operador.id, operador.nombre);
  redirect("/operador");
}
