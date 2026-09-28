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

function rutaVolver(teamId: string, esAdmin: boolean): string {
  return esAdmin ? `/admin/equipos/${teamId}` : "/portal";
}

function volverConError(ruta: string, mensaje: string): never {
  redirect(`${ruta}?error=${encodeURIComponent(mensaje)}`);
}

/**
 * Resuelve sobre qué equipo actúa esta Server Action. Normalmente es el
 * equipo de la sesión (`profiles.team_id`, rol 'equipo'). Pero si la sesión
 * es de un admin Y el formulario manda `_admin_team_id` (lo agrega
 * `CampoAdminTeamId` en `PortalDashboard` cuando `modoAdmin` está prendido —
 * ver `/admin/equipos/[id]`), se actúa sobre ESE equipo en su lugar — es lo
 * que permite al super admin ver/editar/corregir la plantilla y datos de
 * cualquier equipo, agregado 2026-09-28 a pedido de Fernando. Nunca se
 * confía en `_admin_team_id` si la sesión no es realmente de un admin.
 */
async function requireEquipo(formData?: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, rol")
    .eq("id", user.id)
    .single();

  const teamIdAdmin = formData?.get("_admin_team_id");
  if (profile?.rol === "admin" && typeof teamIdAdmin === "string" && teamIdAdmin) {
    return { supabase, teamId: teamIdAdmin, esAdmin: true };
  }

  if (!profile?.team_id) redirect("/portal/login");

  return { supabase, teamId: profile.team_id as string, esAdmin: false };
}

// --- Delegado ---

export async function guardarDelegado(formData: FormData) {
  const { supabase, teamId, esAdmin } = await requireEquipo(formData);
  const ruta = rutaVolver(teamId, esAdmin);

  const nombre = (formData.get("nombre") as string)?.trim();
  const apellido = (formData.get("apellido") as string)?.trim();
  const documento = (formData.get("documento") as string)?.trim();
  const contactoPrincipal = (formData.get("contacto_principal") as string)?.trim();
  const contactoAlterno = (formData.get("contacto_alterno") as string)?.trim();
  const whatsapp = (formData.get("whatsapp") as string)?.trim();

  if (!nombre || !apellido || !documento || !contactoPrincipal) {
    volverConError(ruta, "Faltan datos obligatorios del delegado.");
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

  if (error) volverConError(ruta, `No se pudo guardar el delegado: ${error.message}`);

  revalidatePath(ruta);
}

// --- Colores del equipo ---

export async function guardarColores(formData: FormData) {
  const { supabase, teamId, esAdmin } = await requireEquipo(formData);
  const ruta = rutaVolver(teamId, esAdmin);

  const colorPrimario = (formData.get("color_primario") as string) || null;
  const colorSecundario = (formData.get("color_secundario") as string) || null;

  const { error } = await supabase
    .from("teams")
    .update({ color_primario: colorPrimario, color_secundario: colorSecundario })
    .eq("id", teamId);

  if (error) volverConError(ruta, `No se pudieron guardar los colores: ${error.message}`);

  revalidatePath(ruta);
}

// --- Cuerpo técnico ---

export async function agregarStaff(formData: FormData) {
  const { supabase, teamId, esAdmin } = await requireEquipo(formData);
  const ruta = rutaVolver(teamId, esAdmin);

  const rol = formData.get("rol") as string;
  const nombre = (formData.get("nombre") as string)?.trim();
  const documento = (formData.get("documento") as string)?.trim();

  if (rol !== "dt" && rol !== "preparador_fisico") {
    volverConError(ruta, "Rol de cuerpo técnico inválido.");
  }
  if (!nombre) {
    volverConError(ruta, "Falta el nombre del integrante del cuerpo técnico.");
  }

  const { error } = await supabase.from("team_staff").insert({
    team_id: teamId,
    rol,
    nombre,
    documento: documento || null,
  });

  if (error) volverConError(ruta, `No se pudo agregar: ${error.message}`);

  revalidatePath(ruta);
}

export async function eliminarStaff(staffId: string, formData: FormData) {
  const { supabase, teamId, esAdmin } = await requireEquipo(formData);
  const ruta = rutaVolver(teamId, esAdmin);

  const { error } = await supabase
    .from("team_staff")
    .delete()
    .eq("id", staffId)
    .eq("team_id", teamId);

  if (error) volverConError(ruta, `No se pudo eliminar: ${error.message}`);

  revalidatePath(ruta);
}

// --- Plantilla de jugadores ---

const TIPOS_DOCUMENTO = new Set(["TI", "CC", "CE", "RC", "PA"]);
// Simplificado el 2026-09-26 a pedido de Fernando: antes era Arquero/Defensa/
// Mediocampista/Delantero — ahora solo importa distinguir arquero de jugador
// de campo.
const POSICIONES = new Set(["Arquero", "Jugador de Campo"]);
const TALLAS = new Set(["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
// Un jugador puede marcarse también como DT o Asistente Técnico del equipo
// (en vez de registrarlo dos veces: una en la plantilla y otra en "Cuerpo
// técnico") — ver `rol_cuerpo_tecnico` en `players`.
const ROLES_CUERPO_TECNICO = new Set(["dt", "asistente_tecnico"]);

function leerDatosJugador(formData: FormData, ruta: string) {
  const nombre = (formData.get("nombre") as string)?.trim();
  const tipoDocumento = formData.get("tipo_documento") as string;
  const numeroDocumento = (formData.get("numero_documento") as string)?.trim();
  const eps = (formData.get("eps") as string)?.trim();
  const numeroCamisetaRaw = (formData.get("numero_camiseta") as string)?.trim();
  const posicion = formData.get("posicion") as string;
  const tallaUniforme = formData.get("talla_uniforme") as string;
  const rolCuerpoTecnico = formData.get("rol_cuerpo_tecnico") as string;

  if (!nombre) volverConError(ruta, "Falta el nombre del jugador.");
  if (!TIPOS_DOCUMENTO.has(tipoDocumento)) volverConError(ruta, "Tipo de documento inválido.");
  if (!numeroDocumento) volverConError(ruta, "Falta el número de documento.");
  if (posicion && !POSICIONES.has(posicion)) volverConError(ruta, "Posición inválida.");
  if (tallaUniforme && !TALLAS.has(tallaUniforme)) volverConError(ruta, "Talla de uniforme inválida.");
  if (rolCuerpoTecnico && !ROLES_CUERPO_TECNICO.has(rolCuerpoTecnico)) {
    volverConError(ruta, "Rol de cuerpo técnico inválido.");
  }

  const numeroCamiseta = numeroCamisetaRaw ? Number(numeroCamisetaRaw) : null;
  if (numeroCamisetaRaw && (!Number.isInteger(numeroCamiseta) || numeroCamiseta! < 0)) {
    volverConError(ruta, "El número de camiseta debe ser un entero positivo.");
  }

  return {
    nombre,
    tipo_documento: tipoDocumento,
    numero_documento: numeroDocumento,
    eps: eps || null,
    numero_camiseta: numeroCamiseta,
    posicion: posicion || null,
    talla_uniforme: tallaUniforme || null,
    rol_cuerpo_tecnico: rolCuerpoTecnico || null,
  };
}

export async function agregarJugador(formData: FormData) {
  const { supabase, teamId, esAdmin } = await requireEquipo(formData);
  const ruta = rutaVolver(teamId, esAdmin);

  // El super admin puede cargar/corregir jugadores siempre, sin importar el
  // plazo del equipo — es justamente para poder corregir errores fuera de
  // esa ventana (ver nota en `PortalDashboard`).
  if (!esAdmin) {
    const estado = await evaluarEstadoPlantilla(supabase, teamId);
    if (!estado.puedeEditar) volverConError(ruta, estado.motivo ?? "No puedes editar la plantilla en este momento.");
  }

  const [{ count }, { data: config }] = await Promise.all([
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId),
    supabase.from("torneo_config").select("max_jugadores_por_equipo").eq("id", 1).single(),
  ]);

  const maxJugadores = config?.max_jugadores_por_equipo ?? 15;
  if ((count ?? 0) >= maxJugadores) {
    volverConError(ruta, `Ya alcanzaste el máximo de ${maxJugadores} jugadores.`);
  }

  const datos = leerDatosJugador(formData, ruta);

  const { error } = await supabase.from("players").insert({ team_id: teamId, ...datos });

  if (error) {
    const mensaje =
      error.code === "23505"
        ? "Ese número de documento ya está registrado (puede que en otro equipo)."
        : `No se pudo agregar el jugador: ${error.message}`;
    volverConError(ruta, mensaje);
  }

  revalidatePath(ruta);
}

export async function editarJugador(jugadorId: string, formData: FormData) {
  const { supabase, teamId, esAdmin } = await requireEquipo(formData);
  const ruta = rutaVolver(teamId, esAdmin);

  if (!esAdmin) {
    const estado = await evaluarEstadoPlantilla(supabase, teamId);
    if (!estado.puedeEditar) volverConError(ruta, estado.motivo ?? "No puedes editar la plantilla en este momento.");
  }

  const datos = leerDatosJugador(formData, ruta);

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
    volverConError(ruta, mensaje);
  }

  revalidatePath(ruta);
}

export async function eliminarJugador(jugadorId: string, formData: FormData) {
  const { supabase, teamId, esAdmin } = await requireEquipo(formData);
  const ruta = rutaVolver(teamId, esAdmin);

  if (!esAdmin) {
    const estado = await evaluarEstadoPlantilla(supabase, teamId);
    if (!estado.puedeEditar) volverConError(ruta, estado.motivo ?? "No puedes editar la plantilla en este momento.");
  }

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", jugadorId)
    .eq("team_id", teamId);

  if (error) volverConError(ruta, `No se pudo eliminar el jugador: ${error.message}`);

  revalidatePath(ruta);
}
