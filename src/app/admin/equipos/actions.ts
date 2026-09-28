"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const BUCKET_ESCUDOS = "escudos-equipos";

/**
 * Solo super admin — corrección de los datos generales de un equipo desde
 * `/admin/equipos/[id]` (2026-09-28, a pedido de Fernando: "la idea es que
 * pueda agregar el logo de cada equipo y otras cosas más, por si hay algún
 * problema con la información y no haya forma de cómo editarla"). Antes NO
 * existía ninguna forma de cargar/corregir el escudo, ni de corregir
 * nombre/ciudad/año/descripción después del registro — ni el equipo ni el
 * admin tenían dónde hacerlo.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (profile?.rol !== "admin") redirect("/admin/login");

  return supabase;
}

function volverConError(teamId: string, mensaje: string): never {
  redirect(`/admin/equipos/${teamId}?error=${encodeURIComponent(mensaje)}`);
}

// Mismo patrón que `rutaStorageDesdeUrl`/`subirLogo` en
// `admin/patrocinadores/actions.ts` — se reutiliza la idea, no el código
// (bucket distinto).
function rutaStorageDesdeUrl(url: string): string | null {
  const marcador = `/storage/v1/object/public/${BUCKET_ESCUDOS}/`;
  const i = url.indexOf(marcador);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marcador.length));
}

async function subirEscudo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File
): Promise<{ url: string } | { error: string }> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const ruta = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET_ESCUDOS).upload(ruta, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) return { error: `No se pudo subir el escudo: ${error.message}` };

  const { data } = supabase.storage.from(BUCKET_ESCUDOS).getPublicUrl(ruta);
  return { url: data.publicUrl };
}

export async function actualizarDatosEquipoAdmin(teamId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const nombreEquipo = (formData.get("nombre_equipo") as string)?.trim();
  const ciudadBarrio = (formData.get("ciudad_barrio") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const anioFundacionRaw = (formData.get("anio_fundacion") as string)?.trim();

  if (!nombreEquipo) {
    volverConError(teamId, "El nombre del equipo no puede quedar vacío.");
  }

  let anioFundacion: number | null = null;
  if (anioFundacionRaw) {
    const parsed = Number(anioFundacionRaw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > new Date().getFullYear()) {
      volverConError(teamId, "El año de fundación no es válido.");
    }
    anioFundacion = parsed;
  }

  const update: Record<string, unknown> = {
    nombre_equipo: nombreEquipo,
    ciudad_barrio: ciudadBarrio || null,
    descripcion: descripcion || null,
    anio_fundacion: anioFundacion,
  };

  const file = formData.get("escudo") as File | null;
  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      volverConError(teamId, "El escudo debe ser una imagen.");
    }
    if (file.size > 5 * 1024 * 1024) {
      volverConError(teamId, "El escudo no puede pesar más de 5MB.");
    }

    const subida = await subirEscudo(supabase, file);
    if ("error" in subida) volverConError(teamId, subida.error);
    update.escudo_url = subida.url;

    const { data: actual } = await supabase.from("teams").select("escudo_url").eq("id", teamId).single();
    const rutaVieja = actual?.escudo_url ? rutaStorageDesdeUrl(actual.escudo_url) : null;
    if (rutaVieja) {
      await supabase.storage.from(BUCKET_ESCUDOS).remove([rutaVieja]);
    }
  }

  const { error } = await supabase.from("teams").update(update).eq("id", teamId);
  if (error) volverConError(teamId, `No se pudo actualizar el equipo: ${error.message}`);

  revalidatePath(`/admin/equipos/${teamId}`);
  revalidatePath(`/equipos/${teamId}`);
  revalidatePath("/equipos");
  revalidatePath("/");
}
