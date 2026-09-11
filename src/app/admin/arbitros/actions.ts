"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

/**
 * Crea una escuela arbitral (nombre, representante, contacto). Las
 * políticas de RLS ya restringen la escritura a usuarios con rol "admin";
 * si alguien sin ese rol llegara a invocar esto, la operación falla por RLS.
 */
export async function crearEscuelaArbitral(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const nombre = (formData.get("nombre") as string | null)?.trim();
  if (!nombre) {
    return { success: false, error: "El nombre de la escuela es obligatorio." };
  }

  const representante = (formData.get("representante") as string | null)?.trim() || null;
  const telefono = (formData.get("telefono") as string | null)?.trim() || null;
  const correo = (formData.get("correo") as string | null)?.trim() || null;
  const notas = (formData.get("notas") as string | null)?.trim() || null;

  const { error } = await supabase
    .from("escuelas_arbitrales")
    .insert({ nombre, representante, telefono, correo, notas });

  if (error) {
    return { success: false, error: `No se pudo crear la escuela: ${error.message}` };
  }

  revalidatePath("/admin/arbitros");
  return { success: true };
}

export async function eliminarEscuelaArbitral(escuelaId: string): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("escuelas_arbitrales").delete().eq("id", escuelaId);

  if (error) {
    return { success: false, error: `No se pudo eliminar la escuela: ${error.message}` };
  }

  revalidatePath("/admin/arbitros");
  return { success: true };
}

/**
 * Agrega un árbitro a la planilla del torneo. La escuela es opcional —
 * algunos árbitros pueden no estar afiliados a ninguna escuela.
 */
export async function crearArbitro(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const nombre = (formData.get("nombre") as string | null)?.trim();
  const numeroDocumento = (formData.get("numero_documento") as string | null)?.trim();

  if (!nombre || !numeroDocumento) {
    return { success: false, error: "Nombre y número de documento son obligatorios." };
  }

  const escuelaId = (formData.get("escuela_id") as string | null) || null;
  const telefono = (formData.get("telefono") as string | null)?.trim() || null;
  const correo = (formData.get("correo") as string | null)?.trim() || null;
  const notas = (formData.get("notas") as string | null)?.trim() || null;

  const { error } = await supabase.from("arbitros").insert({
    nombre,
    numero_documento: numeroDocumento,
    escuela_id: escuelaId,
    telefono,
    correo,
    notas,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Ya existe un árbitro registrado con ese número de documento." };
    }
    return { success: false, error: `No se pudo registrar el árbitro: ${error.message}` };
  }

  revalidatePath("/admin/arbitros");
  return { success: true };
}

export async function actualizarArbitroActivo(
  arbitroId: string,
  activo: boolean
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("arbitros").update({ activo }).eq("id", arbitroId);

  if (error) {
    return { success: false, error: `No se pudo actualizar el árbitro: ${error.message}` };
  }

  revalidatePath("/admin/arbitros");
  return { success: true };
}

export async function eliminarArbitro(arbitroId: string): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("arbitros").delete().eq("id", arbitroId);

  if (error) {
    return { success: false, error: `No se pudo eliminar el árbitro: ${error.message}` };
  }

  revalidatePath("/admin/arbitros");
  return { success: true };
}
