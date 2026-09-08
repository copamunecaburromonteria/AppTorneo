"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type RegistroEquipoInput = {
  nombreEquipo: string;
  colorPrimario: string;
  colorSecundario: string;
  correo: string;
  password: string;
  delegadoNombre: string;
  delegadoApellido: string;
  delegadoDocumento: string;
  delegadoContactoPrincipal: string;
  delegadoContactoAlterno: string;
  delegadoWhatsapp: string;
  dtNombre: string;
  dtDocumento: string;
  preparadorNombre: string;
  preparadorDocumento: string;
  tieneUniformePropio: boolean | null;
  compraUniformeCopa: boolean;
};

export type RegistroEquipoResult =
  | {
      success: true;
      teamId: string;
      montoTotal: number;
      montoInscripcion: number;
      montoUniformes: number;
      cantidadUniformes: number;
    }
  | { success: false; error: string };

export async function registrarEquipo(
  input: RegistroEquipoInput
): Promise<RegistroEquipoResult> {
  // --- Validación de servidor (nunca confiar solo en la del navegador) ---
  const nombreEquipo = input.nombreEquipo.trim();
  const correo = input.correo.trim().toLowerCase();
  const delegadoNombre = input.delegadoNombre.trim();
  const delegadoApellido = input.delegadoApellido.trim();
  const delegadoDocumento = input.delegadoDocumento.trim();
  const delegadoContactoPrincipal = input.delegadoContactoPrincipal.trim();

  if (!nombreEquipo) return { success: false, error: "Falta el nombre del equipo." };
  if (!correo || !correo.includes("@"))
    return { success: false, error: "El correo no es válido." };
  if (!input.password || input.password.length < 8)
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
  if (!delegadoNombre || !delegadoApellido || !delegadoDocumento || !delegadoContactoPrincipal)
    return { success: false, error: "Faltan datos obligatorios del delegado." };
  if (input.tieneUniformePropio === null)
    return { success: false, error: "Indica si el equipo ya cuenta con uniforme propio." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "No se pudo conectar con la base de datos.",
    };
  }

  // --- Precios vigentes (torneo_config es la única fuente de verdad) ---
  const { data: config, error: configError } = await admin
    .from("torneo_config")
    .select("monto_inscripcion, precio_uniforme, max_jugadores_por_equipo")
    .eq("id", 1)
    .single();

  if (configError || !config) {
    return { success: false, error: "No se pudo leer la configuración del torneo." };
  }

  const montoInscripcion = Number(config.monto_inscripcion);
  const precioUniforme = Number(config.precio_uniforme);
  const maxJugadores = config.max_jugadores_por_equipo as number;

  const compraUniforme = input.tieneUniformePropio === false && input.compraUniformeCopa;
  const cantidadUniformes = compraUniforme ? maxJugadores : 0;
  const montoUniformes = cantidadUniformes * precioUniforme;
  const montoTotal = montoInscripcion + montoUniformes;

  // --- 1. Usuario de Auth (rol equipo) ---
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: correo,
    password: input.password,
    email_confirm: true,
  });

  if (authError || !authUser?.user) {
    const message =
      authError?.message === "User already registered" || authError?.code === "email_exists"
        ? "Ya existe una cuenta registrada con ese correo."
        : authError?.message ?? "No se pudo crear la cuenta.";
    return { success: false, error: message };
  }

  const userId = authUser.user.id;

  // Deshace el usuario de Auth si algún paso posterior falla, para no dejar
  // cuentas huérfanas sin equipo.
  const rollbackAuthUser = async () => {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  };

  // --- 2. Equipo ---
  const { data: team, error: teamError } = await admin
    .from("teams")
    .insert({
      nombre_equipo: nombreEquipo,
      color_primario: input.colorPrimario || null,
      color_secundario: input.colorSecundario || null,
      tiene_uniforme_propio: input.tieneUniformePropio,
      compra_uniforme_copa: compraUniforme,
    })
    .select("id")
    .single();

  if (teamError || !team) {
    await rollbackAuthUser();
    return { success: false, error: "No se pudo crear el equipo. Intenta de nuevo." };
  }

  const teamId = team.id as string;

  // --- 3. Perfil (vincula el usuario de Auth con el equipo) ---
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: userId, rol: "equipo", team_id: teamId });

  if (profileError) {
    await admin.from("teams").delete().eq("id", teamId);
    await rollbackAuthUser();
    return { success: false, error: "No se pudo vincular la cuenta con el equipo." };
  }

  // --- 4. Delegado ---
  const { error: delegadoError } = await admin.from("team_delegado").insert({
    team_id: teamId,
    nombre: delegadoNombre,
    apellido: delegadoApellido,
    documento: delegadoDocumento,
    contacto_principal: delegadoContactoPrincipal,
    contacto_alterno: input.delegadoContactoAlterno.trim() || null,
    correo,
    whatsapp_notificaciones: input.delegadoWhatsapp.trim() || null,
  });

  if (delegadoError) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.from("teams").delete().eq("id", teamId);
    await rollbackAuthUser();
    return { success: false, error: "No se pudieron guardar los datos del delegado." };
  }

  // --- 5. Cuerpo técnico (opcional, se puede completar después en el portal) ---
  const staffRows = [
    input.dtNombre.trim()
      ? {
          team_id: teamId,
          rol: "dt" as const,
          nombre: input.dtNombre.trim(),
          documento: input.dtDocumento.trim() || null,
        }
      : null,
    input.preparadorNombre.trim()
      ? {
          team_id: teamId,
          rol: "preparador_fisico" as const,
          nombre: input.preparadorNombre.trim(),
          documento: input.preparadorDocumento.trim() || null,
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  if (staffRows.length > 0) {
    await admin.from("team_staff").insert(staffRows);
    // No es bloqueante: el cuerpo técnico se puede completar después desde
    // el portal, así que un fallo aquí no revierte el registro del equipo.
  }

  // --- 6. Pago pendiente ---
  const { error: paymentError } = await admin.from("payments").insert({
    team_id: teamId,
    monto_total: montoTotal,
    monto_pagado: 0,
    tipo_pago: "pendiente",
    monto_inscripcion_cobrado: montoInscripcion,
    cantidad_uniformes: cantidadUniformes,
    monto_uniformes_cobrado: montoUniformes,
  });

  if (paymentError) {
    // El equipo ya existe en este punto; no lo revertimos (se perdería el
    // trabajo de los pasos anteriores) — el cobro se puede generar
    // manualmente desde el panel admin si esto llegara a fallar.
    return {
      success: false,
      error: "El equipo se registró, pero no se pudo generar el cobro. Contáctanos para completarlo.",
    };
  }

  return {
    success: true,
    teamId,
    montoTotal,
    montoInscripcion,
    montoUniformes,
    cantidadUniformes,
  };
}
