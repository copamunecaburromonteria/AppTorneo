"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { correoRegistroEquipo, correoEquipoListaEspera } from "@/lib/resend/templates";

/**
 * Correo del super admin al que llega el aviso cuando un equipo entra a
 * lista de espera. Sujeto a la misma limitación de Resend en modo de
 * prueba que el resto de los correos (ver `lib/resend/client.ts`) — la fila
 * en `notificaciones_admin` y la sección "Equipos en espera" del panel
 * admin no dependen de que el correo llegue.
 */
const ADMIN_NOTIFICATION_EMAIL = "copamunecaburromonteria@gmail.com";

export type RegistroEquipoInput = {
  nombreEquipo: string;
  anioFundacion: string;
  ciudadBarrio: string;
  descripcion: string;
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

export type CuotaPlan = {
  numeroCuota: number;
  monto: number;
  fechaLimite: string;
};

export type RegistroEquipoResult =
  | {
      success: true;
      listaEspera: false;
      teamId: string;
      correo: string;
      montoTotal: number;
      montoInscripcion: number;
      montoUniformes: number;
      cantidadUniformes: number;
      cuotas: CuotaPlan[];
    }
  | {
      // El equipo quedó registrado en lista de espera (cupos llenos): no se
      // le creó cuenta de Auth ni plan de pagos, así que no hay "botón de
      // cobro" que mostrarle — solo se le avisa que quedó en espera.
      success: true;
      listaEspera: true;
      teamId: string;
      nombreEquipo: string;
    }
  | { success: false; error: string };

/**
 * Reparte `total` en `partes` montos enteros que suman exactamente `total`.
 * Las primeras `partes - 1` cuotas son iguales (redondeadas hacia abajo); la
 * última absorbe el residuo del redondeo para que la suma cuadre siempre.
 */
function repartirEnPartesIguales(total: number, partes: number): number[] {
  const base = Math.floor(total / partes);
  const montos = Array.from({ length: partes }, () => base);
  montos[partes - 1] = total - base * (partes - 1);
  return montos;
}

function sumarDias(fecha: Date, dias: number): string {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia.toISOString().slice(0, 10);
}

/**
 * Para que `/inscripcion` sepa, antes de mostrar el formulario, si debe
 * mostrar el flujo normal de pago o el de lista de espera (ver
 * `registrarEquipo` para el criterio de cupo). Se usa solo para decidir qué
 * formulario mostrar — `registrarEquipo` vuelve a verificar el cupo por su
 * cuenta al momento de guardar, así que no hay forma de saltarse la lista
 * de espera manipulando el formulario del navegador.
 */
export async function verificarCupoDisponible(): Promise<{ cupoLleno: boolean }> {
  try {
    const admin = createAdminClient();
    const [{ count: validadosCount }, { data: config }] = await Promise.all([
      admin.from("teams").select("id", { count: "exact", head: true }).eq("estado_inscripcion", "validado"),
      admin.from("torneo_config").select("numero_equipos_torneo").eq("id", 1).single(),
    ]);
    const numeroEquiposTorneo = (config?.numero_equipos_torneo as number | undefined) ?? 24;
    return { cupoLleno: (validadosCount ?? 0) >= numeroEquiposTorneo };
  } catch {
    // Si algo falla acá, no bloqueamos la inscripción — se deja pasar al
    // flujo normal, que vuelve a verificar el cupo de todas formas.
    return { cupoLleno: false };
  }
}

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

  const ciudadBarrio = input.ciudadBarrio.trim();
  const descripcion = input.descripcion.trim();
  const anioFundacionRaw = input.anioFundacion.trim();
  let anioFundacion: number | null = null;
  if (anioFundacionRaw) {
    const parsed = Number(anioFundacionRaw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > new Date().getFullYear()) {
      return { success: false, error: "El año de fundación no es válido." };
    }
    anioFundacion = parsed;
  }

  // --- Validaciones comunes a ambos flujos (inscripción normal y lista de espera) ---
  if (!nombreEquipo) return { success: false, error: "Falta el nombre del equipo." };
  if (!correo || !correo.includes("@"))
    return { success: false, error: "El correo no es válido." };
  if (!delegadoNombre || !delegadoApellido || !delegadoDocumento || !delegadoContactoPrincipal)
    return { success: false, error: "Faltan datos obligatorios del delegado." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "No se pudo conectar con la base de datos.",
    };
  }

  // --- Precios, plan de pagos y cupo vigentes (torneo_config es la única fuente de verdad) ---
  const { data: config, error: configError } = await admin
    .from("torneo_config")
    .select(
      "monto_inscripcion, precio_uniforme, max_jugadores_por_equipo, numero_cuotas_sin_uniforme, numero_cuotas_con_uniforme, dias_plazo_saldo, numero_equipos_torneo"
    )
    .eq("id", 1)
    .single();

  if (configError || !config) {
    return { success: false, error: "No se pudo leer la configuración del torneo." };
  }

  // --- ¿Hay cupo? Un equipo ocupa cupo real cuando queda VALIDADO (1a
  // partida pagada, ver punto 3 de la Fase 1) — uno apenas registrado y sin
  // pagar todavía no lo ocupa. Si ya no hay cupo, el equipo entra a lista de
  // espera: sin cuenta de Auth ni plan de pagos (nada de "botón de cobro"),
  // solo su dato de contacto guardado y un aviso al super admin.
  const { count: validadosCount, error: countError } = await admin
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("estado_inscripcion", "validado");

  const numeroEquiposTorneo = config.numero_equipos_torneo as number;
  const cupoLleno = !countError && (validadosCount ?? 0) >= numeroEquiposTorneo;

  if (cupoLleno) {
    const { data: team, error: teamError } = await admin
      .from("teams")
      .insert({
        nombre_equipo: nombreEquipo,
        anio_fundacion: anioFundacion,
        ciudad_barrio: ciudadBarrio || null,
        descripcion: descripcion || null,
        estado_inscripcion: "lista_espera",
      })
      .select("id")
      .single();

    if (teamError || !team) {
      return {
        success: false,
        error: "No se pudo registrar el equipo en la lista de espera. Intenta de nuevo.",
      };
    }

    const teamId = team.id as string;

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
      await admin.from("teams").delete().eq("id", teamId);
      return { success: false, error: "No se pudieron guardar los datos del delegado." };
    }

    const { error: notifError } = await admin.from("notificaciones_admin").insert({
      tipo: "equipo_lista_espera",
      mensaje: `${nombreEquipo} quedó en lista de espera (cupos llenos) — delegado ${delegadoNombre} ${delegadoApellido}, contacto ${delegadoContactoPrincipal}.`,
    });
    if (notifError) {
      console.error("[lista_espera] No se pudo insertar notificación admin:", notifError);
    }

    // Aviso por correo al super admin — no bloqueante (ver ADMIN_NOTIFICATION_EMAIL).
    const { subject, html, text } = correoEquipoListaEspera({
      nombreEquipo,
      delegadoNombre: `${delegadoNombre} ${delegadoApellido}`,
      contacto: input.delegadoWhatsapp.trim() || delegadoContactoPrincipal,
      correo,
    });
    await sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, subject, html, text }).catch(() => {});

    return { success: true, listaEspera: true, teamId, nombreEquipo };
  }

  // --- Flujo normal (hay cupo disponible): valida contraseña y uniforme antes de continuar ---
  if (!input.password || input.password.length < 8)
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
  if (input.tieneUniformePropio === null)
    return { success: false, error: "Indica si el equipo ya cuenta con uniforme propio." };

  const montoInscripcion = Number(config.monto_inscripcion);
  const precioUniforme = Number(config.precio_uniforme);
  const maxJugadores = config.max_jugadores_por_equipo as number;
  const diasPlazoSaldo = config.dias_plazo_saldo as number;

  const compraUniforme = input.tieneUniformePropio === false && input.compraUniformeCopa;
  const cantidadUniformes = compraUniforme ? maxJugadores : 0;
  const montoUniformes = cantidadUniformes * precioUniforme;
  const montoTotal = montoInscripcion + montoUniformes;

  const numeroCuotas = compraUniforme
    ? (config.numero_cuotas_con_uniforme as number)
    : (config.numero_cuotas_sin_uniforme as number);

  const montosCuotas = repartirEnPartesIguales(montoTotal, numeroCuotas);
  const hoy = new Date();
  const cuotas: CuotaPlan[] = montosCuotas.map((monto, index) => ({
    numeroCuota: index + 1,
    monto,
    fechaLimite: sumarDias(hoy, index * diasPlazoSaldo),
  }));

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
      anio_fundacion: anioFundacion,
      ciudad_barrio: ciudadBarrio || null,
      descripcion: descripcion || null,
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

  // --- 6. Pago (agregado) + plan de cuotas ---
  const { data: paymentRow, error: paymentError } = await admin
    .from("payments")
    .insert({
      team_id: teamId,
      monto_total: montoTotal,
      monto_pagado: 0,
      tipo_pago: "pendiente",
      monto_inscripcion_cobrado: montoInscripcion,
      cantidad_uniformes: cantidadUniformes,
      monto_uniformes_cobrado: montoUniformes,
    })
    .select("id")
    .single();

  if (paymentError || !paymentRow) {
    return {
      success: false,
      error: "El equipo se registró, pero no se pudo generar el plan de pagos. Contáctanos para completarlo.",
    };
  }

  const { error: installmentsError } = await admin.from("payment_installments").insert(
    cuotas.map((c) => ({
      payment_id: paymentRow.id,
      team_id: teamId,
      numero_cuota: c.numeroCuota,
      monto: c.monto,
      fecha_limite: c.fechaLimite,
    }))
  );

  if (installmentsError) {
    return {
      success: false,
      error: "El equipo se registró, pero no se pudo generar el plan de pagos. Contáctanos para completarlo.",
    };
  }

  // --- 7. Correo de confirmación ---
  // Se espera (await) aunque el resultado no cambie la respuesta: en un
  // entorno serverless, una promesa sin await puede cortarse apenas la
  // función retorna, y el correo nunca saldría.
  const { subject, html, text } = correoRegistroEquipo({
    nombreEquipo,
    delegadoNombre,
    correo,
    montoTotal,
    cuotas,
  });
  await sendEmail({ to: correo, subject, html, text }).catch(() => {});

  return {
    success: true,
    listaEspera: false,
    teamId,
    correo,
    montoTotal,
    montoInscripcion,
    montoUniformes,
    cantidadUniformes,
    cuotas,
  };
}

/**
 * Inicia sesión inmediatamente después de registrar el equipo, usando el
 * cliente ligado a las cookies de la petición (a diferencia de
 * `registrarEquipo`, que usa el cliente de service role y no deja sesión).
 * Así el delegado no tiene que volver a loguearse para continuar el wizard
 * en /portal/inscripcion.
 */
export async function iniciarSesionTrasRegistro(
  correo: string,
  password: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password });
  return { success: !error };
}
