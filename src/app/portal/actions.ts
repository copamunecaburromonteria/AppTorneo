"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { evaluarEstadoPlantilla } from "@/lib/portal/plantilla";

export async function cerrarSesionEquipo() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}

function volverConError(mensaje: string): never {
  redirect(`/portal?error=${encodeURIComponent(mensaje)}`);
}

async function requireEquipo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) redirect("/portal/login");

  return { supabase, teamId: profile.team_id as string };
}

// --- Delegado ---

export async function guardarDelegado(formData: FormData) {
  const { supabase, teamId } = await requireEquipo();

  const nombre = (formData.get("nombre") as string)?.trim();
  const apellido = (formData.get("apellido") as string)?.trim();
  const documento = (formData.get("documento") as string)?.trim();
  const contactoPrincipal = (formData.get("contacto_principal") as string)?.trim();
  const contactoAlterno = (formData.get("contacto_alterno") as string)?.trim();
  const whatsapp = (formData.get("whatsapp") as string)?.trim();

  if (!nombre || !apellido || !documento || !contactoPrincipal) {
    volverConError("Faltan datos obligatorios del delegado.");
  }

  const { error } = await supabase
    .from("team_delegado")
    .update({
      nombre,
      apellido,
      documento,
      contacto_principal: contactoPrincipal,
      contacto_alterno: contactoAlterno || null,
      whatsapp_notificaciones: whatsapp || null,
    })
    .eq("team_id", teamId);

  if (error) volverConError(`No se pudo guardar el delegado: ${error.message}`);

  revalidatePath("/portal");
}

// --- Colores del equipo ---

export async function guardarColores(formData: FormData) {
  const { supabase, teamId } = await requireEquipo();

  const colorPrimario = (formData.get("color_primario") as string) || null;
  const colorSecundario = (formData.get("color_secundario") as string) || null;

  const { error } = await supabase
    .from("teams")
    .update({ color_primario: colorPrimario, color_secundario: colorSecundario })
    .eq("id", teamId);

  if (error) volverConError(`No se pudieron guardar los colores: ${error.message}`);

  revalidatePath("/portal");
}

// --- Cuerpo técnico ---

export async function agregarStaff(formData: FormData) {
  const { supabase, teamId } = await requireEquipo();

  const rol = formData.get("rol") as string;
  const nombre = (formData.get("nombre") as string)?.trim();
  const documento = (formData.get("documento") as string)?.trim();

  if (rol !== "dt" && rol !== "preparador_fisico") {
    volverConError("Rol de cuerpo técnico inválido.");
  }
  if (!nombre) {
    volverConError("Falta el nombre del integrante del cuerpo técnico.");
  }

  const { error } = await supabase.from("team_staff").insert({
    team_id: teamId,
    rol,
    nombre,
    documento: documento || null,
  });

  if (error) volverConError(`No se pudo agregar: ${error.message}`);

  revalidatePath("/portal");
}

export async function eliminarStaff(staffId: string, _formData: FormData) {
  const { supabase, teamId } = await requireEquipo();

  const { error } = await supabase
    .from("team_staff")
    .delete()
    .eq("id", staffId)
    .eq("team_id", teamId);

  if (error) volverConError(`No se pudo eliminar: ${error.message}`);

  revalidatePath("/portal");
}

// --- Plantilla de jugadores ---

const TIPOS_DOCUMENTO = new Set(["TI", "CC", "CE", "RC", "PA"]);
const POSICIONES = new Set(["Arquero", "Defensa", "Mediocampista", "Delantero"]);
const TALLAS = new Set(["XS", "S", "M", "L", "XL", "XXL", "3XL"]);

function leerDatosJugador(formData: FormData) {
  const nombre = (formData.get("nombre") as string)?.trim();
  const tipoDocumento = formData.get("tipo_documento") as string;
  const numeroDocumento = (formData.get("numero_documento") as string)?.trim();
  const eps = (formData.get("eps") as string)?.trim();
  const numeroCamisetaRaw = (formData.get("numero_camiseta") as string)?.trim();
  const posicion = formData.get("posicion") as string;
  const tallaUniforme = formData.get("talla_uniforme") as string;

  if (!nombre) volverConError("Falta el nombre del jugador.");
  if (!TIPOS_DOCUMENTO.has(tipoDocumento)) volverConError("Tipo de documento inválido.");
  if (!numeroDocumento) volverConError("Falta el número de documento.");
  if (posicion && !POSICIONES.has(posicion)) volverConError("Posición inválida.");
  if (tallaUniforme && !TALLAS.has(tallaUniforme)) volverConError("Talla de uniforme inválida.");

  const numeroCamiseta = numeroCamisetaRaw ? Number(numeroCamisetaRaw) : null;
  if (numeroCamisetaRaw && (!Number.isInteger(numeroCamiseta) || numeroCamiseta! < 0)) {
    volverConError("El número de camiseta debe ser un entero positivo.");
  }

  return {
    nombre,
    tipo_documento: tipoDocumento,
    numero_documento: numeroDocumento,
    eps: eps || null,
    numero_camiseta: numeroCamiseta,
    posicion: posicion || null,
    talla_uniforme: tallaUniforme || null,
  };
}

export async function agregarJugador(formData: FormData) {
  const { supabase, teamId } = await requireEquipo();

  const estado = await evaluarEstadoPlantilla(supabase, teamId);
  if (!estado.puedeEditar) volverConError(estado.motivo ?? "No puedes editar la plantilla en este momento.");

  const [{ count }, { data: config }] = await Promise.all([
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId),
    supabase.from("torneo_config").select("max_jugadores_por_equipo").eq("id", 1).single(),
  ]);

  const maxJugadores = config?.max_jugadores_por_equipo ?? 15;
  if ((count ?? 0) >= maxJugadores) {
    volverConError(`Ya alcanzaste el máximo de ${maxJugadores} jugadores.`);
  }

  const datos = leerDatosJugador(formData);

  const { error } = await supabase.from("players").insert({ team_id: teamId, ...datos });

  if (error) {
    const mensaje =
      error.code === "23505"
        ? "Ese número de documento ya está registrado (puede que en otro equipo)."
        : `No se pudo agregar el jugador: ${error.message}`;
    volverConError(mensaje);
  }

  revalidatePath("/portal");
}

export async function editarJugador(jugadorId: string, formData: FormData) {
  const { supabase, teamId } = await requireEquipo();

  const estado = await evaluarEstadoPlantilla(supabase, teamId);
  if (!estado.puedeEditar) volverConError(estado.motivo ?? "No puedes editar la plantilla en este momento.");

  const datos = leerDatosJugador(formData);

  const { error } = await supabase
    .from("players")
    .update(datos)
    .eq("id", jugadorId)
    .eq("team_id", teamId);

  if (error) {
    const mensaje =
      error.code === "23505"
        ? "Ese número de documento ya está registrado (puede que en otro equipo)."
        : `No se pudo actualizar el jugador: ${error.message}`;
    volverConError(mensaje);
  }

  revalidatePath("/portal");
}

export async function eliminarJugador(jugadorId: string, _formData: FormData) {
  const { supabase, teamId } = await requireEquipo();

  const estado = await evaluarEstadoPlantilla(supabase, teamId);
  if (!estado.puedeEditar) volverConError(estado.motivo ?? "No puedes editar la plantilla en este momento.");

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", jugadorId)
    .eq("team_id", teamId);

  if (error) volverConError(`No se pudo eliminar el jugador: ${error.message}`);

  revalidatePath("/portal");
}
