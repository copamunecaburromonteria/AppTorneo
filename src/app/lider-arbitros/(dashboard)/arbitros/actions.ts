"use server";

import { revalidatePath } from "next/cache";
import { requireLiderArbitros } from "@/lib/lider-arbitros/auth";

type ResultadoAccion = { success: true } | { success: false; error: string };

/**
 * Agrega un árbitro de campo a la planilla del torneo. En esta edición solo
 * existe un rol/tipo de árbitro ("árbitro de campo" — ver
 * especificacion-funcional-ecosistema.md §19.3 pregunta 2), así que no se
 * pide ningún campo de tipo.
 */
export async function crearArbitroRoster(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireLiderArbitros();
  if (authError) return { success: false, error: authError };

  const nombre = (formData.get("nombre") as string | null)?.trim();
  const numeroDocumento = (formData.get("numero_documento") as string | null)?.trim();

  if (!nombre || !numeroDocumento) {
    return { success: false, error: "Nombre y número de documento son obligatorios." };
  }

  const telefono = (formData.get("telefono") as string | null)?.trim() || null;
  const correo = (formData.get("correo") as string | null)?.trim() || null;
  const notas = (formData.get("notas") as string | null)?.trim() || null;

  const { error } = await supabase.from("arbitros").insert({
    nombre,
    numero_documento: numeroDocumento,
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

  revalidatePath("/lider-arbitros/arbitros");
  return { success: true };
}

export async function actualizarArbitroActivoRoster(
  arbitroId: string,
  activo: boolean
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireLiderArbitros();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("arbitros").update({ activo }).eq("id", arbitroId);

  if (error) return { success: false, error: `No se pudo actualizar el árbitro: ${error.message}` };

  revalidatePath("/lider-arbitros/arbitros");
  return { success: true };
}

export async function eliminarArbitroRoster(arbitroId: string): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireLiderArbitros();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("arbitros").delete().eq("id", arbitroId);

  if (error) return { success: false, error: `No se pudo eliminar el árbitro: ${error.message}` };

  revalidatePath("/lider-arbitros/arbitros");
  return { success: true };
}
