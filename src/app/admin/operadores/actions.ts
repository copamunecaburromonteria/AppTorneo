"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hashPin } from "@/lib/operador/sesion";

type ResultadoAccion = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, error: "No hay sesión activa." } as const;
  }
  return { supabase, error: null } as const;
}

function validarPin(pin: string): string | null {
  if (!/^\d{4,6}$/.test(pin)) {
    return "El PIN debe tener entre 4 y 6 dígitos numéricos.";
  }
  return null;
}

/**
 * Crea un operador de cancha con su PIN. El PIN nunca se guarda en texto
 * plano — se hashea con scrypt (ver lib/operador/sesion.ts) antes de
 * insertarlo. Las políticas de RLS ya restringen la escritura en
 * `operadores` a usuarios con rol "admin".
 */
export async function crearOperador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const nombre = (formData.get("nombre") as string | null)?.trim();
  const pin = (formData.get("pin") as string | null)?.trim() ?? "";

  if (!nombre) return { success: false, error: "El nombre es obligatorio." };

  const errorPin = validarPin(pin);
  if (errorPin) return { success: false, error: errorPin };

  const { error } = await supabase.from("operadores").insert({
    nombre,
    pin_hash: hashPin(pin),
  });

  if (error) {
    return { success: false, error: `No se pudo crear el operador: ${error.message}` };
  }

  revalidatePath("/admin/operadores");
  return { success: true };
}

export async function actualizarOperadorActivo(
  operadorId: string,
  activo: boolean
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("operadores").update({ activo }).eq("id", operadorId);

  if (error) {
    return { success: false, error: `No se pudo actualizar el operador: ${error.message}` };
  }

  revalidatePath("/admin/operadores");
  return { success: true };
}

export async function eliminarOperador(operadorId: string): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("operadores").delete().eq("id", operadorId);

  if (error) {
    return { success: false, error: `No se pudo eliminar el operador: ${error.message}` };
  }

  revalidatePath("/admin/operadores");
  return { success: true };
}

/** Cambia el PIN de un operador existente (por si lo olvida o se filtra). */
export async function resetearPinOperador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const operadorId = (formData.get("operador_id") as string | null) ?? "";
  const pin = (formData.get("pin") as string | null)?.trim() ?? "";

  if (!operadorId) return { success: false, error: "Falta el operador." };

  const errorPin = validarPin(pin);
  if (errorPin) return { success: false, error: errorPin };

  const { error } = await supabase
    .from("operadores")
    .update({ pin_hash: hashPin(pin) })
    .eq("id", operadorId);

  if (error) {
    return { success: false, error: `No se pudo cambiar el PIN: ${error.message}` };
  }

  revalidatePath("/admin/operadores");
  return { success: true };
}
