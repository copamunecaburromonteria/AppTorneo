"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NIVELES_PATROCINIO } from "@/lib/patrocinadores/tipos";

type ResultadoAccion = { success: true } | { success: false; error: string };

const BUCKET_LOGOS = "patrocinadores";

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
 * Extrae la ruta dentro del bucket a partir de una public URL de Supabase
 * Storage, para poder borrar el archivo viejo al reemplazar un logo. Si la
 * URL no es de este bucket (ej. sigue siendo un archivo estático en
 * /public/brand/patrocinadores de la siembra inicial) devuelve null y
 * simplemente no se borra nada — no hay archivo de Storage que limpiar.
 */
function rutaStorageDesdeUrl(url: string): string | null {
  const marcador = `/storage/v1/object/public/${BUCKET_LOGOS}/`;
  const i = url.indexOf(marcador);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marcador.length));
}

async function subirLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File
): Promise<{ url: string } | { error: string }> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const ruta = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET_LOGOS).upload(ruta, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) {
    return { error: `No se pudo subir el logo: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET_LOGOS).getPublicUrl(ruta);
  return { url: data.publicUrl };
}

function leerCamposComunes(formData: FormData) {
  const nombre = (formData.get("nombre") as string | null)?.trim() || "";
  const nivel = (formData.get("nivel") as string | null) || "";
  const linkUrl = (formData.get("link_url") as string | null)?.trim() || null;
  const ordenRaw = (formData.get("orden") as string | null)?.trim();
  const orden = ordenRaw ? Number(ordenRaw) : 0;
  const activo = formData.get("activo") === "on";
  const activoDesde = (formData.get("activo_desde") as string | null)?.trim() || null;
  const activoHasta = (formData.get("activo_hasta") as string | null)?.trim() || null;
  const slots = formData.getAll("slots").map(String);

  return { nombre, nivel, linkUrl, orden, activo, activoDesde, activoHasta, slots };
}

function validarCamposComunes(campos: ReturnType<typeof leerCamposComunes>): string | null {
  if (!campos.nombre) return "El nombre de la marca es obligatorio.";
  if (!NIVELES_PATROCINIO.includes(campos.nivel as (typeof NIVELES_PATROCINIO)[number])) {
    return "Selecciona un nivel de patrocinio válido.";
  }
  if (Number.isNaN(campos.orden)) return "El orden debe ser un número.";
  return null;
}

/**
 * Crea un patrocinador nuevo. El logo es obligatorio al crear (no tiene
 * sentido un patrocinador sin logo — el slider siempre necesita algo que
 * mostrar). Sube el archivo al bucket público `patrocinadores` de Storage
 * (el primero de la app, ver migración 23_patrocinadores) antes de insertar
 * la fila.
 */
export async function crearPatrocinador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const campos = leerCamposComunes(formData);
  const errorValidacion = validarCamposComunes(campos);
  if (errorValidacion) return { success: false, error: errorValidacion };

  const logo = formData.get("logo") as File | null;
  if (!logo || logo.size === 0) {
    return { success: false, error: "El logo es obligatorio." };
  }

  const subida = await subirLogo(supabase, logo);
  if ("error" in subida) return { success: false, error: subida.error };

  const { error } = await supabase.from("patrocinadores").insert({
    nombre: campos.nombre,
    nivel: campos.nivel,
    logo_url: subida.url,
    link_url: campos.linkUrl,
    slots: campos.slots,
    orden: campos.orden,
    activo: campos.activo,
    activo_desde: campos.activoDesde,
    activo_hasta: campos.activoHasta,
  });

  if (error) {
    return { success: false, error: `No se pudo guardar el patrocinador: ${error.message}` };
  }

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/");
  return { success: true };
}

/**
 * Edita un patrocinador existente. El logo es opcional acá — si no se sube
 * uno nuevo se conserva el actual. Si se sube uno nuevo y el anterior vivía
 * en este mismo bucket de Storage (no en /public, como los 5 de la siembra
 * inicial), se borra el archivo viejo para no dejar basura acumulándose.
 */
export async function actualizarPatrocinador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const id = (formData.get("id") as string | null) || "";
  if (!id) return { success: false, error: "Falta el identificador del patrocinador." };

  const campos = leerCamposComunes(formData);
  const errorValidacion = validarCamposComunes(campos);
  if (errorValidacion) return { success: false, error: errorValidacion };

  const update: Record<string, unknown> = {
    nombre: campos.nombre,
    nivel: campos.nivel,
    link_url: campos.linkUrl,
    slots: campos.slots,
    orden: campos.orden,
    activo: campos.activo,
    activo_desde: campos.activoDesde,
    activo_hasta: campos.activoHasta,
  };

  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    const { data: actual } = await supabase
      .from("patrocinadores")
      .select("logo_url")
      .eq("id", id)
      .single();

    const subida = await subirLogo(supabase, logo);
    if ("error" in subida) return { success: false, error: subida.error };
    update.logo_url = subida.url;

    const rutaVieja = actual?.logo_url ? rutaStorageDesdeUrl(actual.logo_url) : null;
    if (rutaVieja) {
      await supabase.storage.from(BUCKET_LOGOS).remove([rutaVieja]);
    }
  }

  const { error } = await supabase.from("patrocinadores").update(update).eq("id", id);

  if (error) {
    return { success: false, error: `No se pudo actualizar el patrocinador: ${error.message}` };
  }

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/");
  return { success: true };
}

export async function actualizarPatrocinadorActivo(
  id: string,
  activo: boolean
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("patrocinadores").update({ activo }).eq("id", id);

  if (error) {
    return { success: false, error: `No se pudo actualizar el patrocinador: ${error.message}` };
  }

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/");
  return { success: true };
}

export async function eliminarPatrocinador(id: string): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { data: actual } = await supabase
    .from("patrocinadores")
    .select("logo_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("patrocinadores").delete().eq("id", id);

  if (error) {
    return { success: false, error: `No se pudo eliminar el patrocinador: ${error.message}` };
  }

  const ruta = actual?.logo_url ? rutaStorageDesdeUrl(actual.logo_url) : null;
  if (ruta) {
    await supabase.storage.from(BUCKET_LOGOS).remove([ruta]);
  }

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/");
  return { success: true };
}
