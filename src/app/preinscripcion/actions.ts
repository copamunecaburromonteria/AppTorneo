"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminNotificationEmails, sendEmail } from "@/lib/resend/client";
import { correoNuevaPreinscripcionAdmin, correoPreinscripcion } from "@/lib/resend/templates";
import { esCanalValido } from "@/lib/canales-preinscripcion";

/**
 * Nueva modalidad de entrada al torneo (2026-09-17, decisión de Fernando):
 * la preinscripción es la puerta de entrada por defecto — solo pide datos
 * del equipo y del delegado, sin cuenta de Auth ni plan de pagos. Es
 * abierta, sin tope (cualquier cantidad de equipos puede preinscribirse);
 * el admin decide manualmente, desde `/admin/preinscripciones`, a cuáles
 * preinscritos invitar a completar la inscripción oficial (que sí cobra),
 * normalmente por orden de llegada. Ver `claude/plan-fases-tareas.md`.
 *
 * Es, a propósito, casi el mismo formulario/datos que antes usaba el flujo
 * de "lista de espera" dentro de `/inscripcion` (ver `inscripcion/actions.ts`)
 * — esa modalidad quedó superada por esta.
 */
export type PreinscripcionInput = {
  nombreEquipo: string;
  anioFundacion: string;
  ciudadBarrio: string;
  descripcion: string;
  comoSeEntero: string;
  correo: string;
  delegadoNombre: string;
  delegadoApellido: string;
  delegadoDocumento: string;
  delegadoContactoPrincipal: string;
  delegadoContactoAlterno: string;
  delegadoWhatsapp: string;
};

export type PreinscripcionResult =
  | { success: true; nombreEquipo: string; ordenPreinscripcion: number }
  | { success: false; error: string };

export async function preinscribirEquipo(
  input: PreinscripcionInput
): Promise<PreinscripcionResult> {
  const nombreEquipo = input.nombreEquipo.trim();
  const correo = input.correo.trim().toLowerCase();
  const delegadoNombre = input.delegadoNombre.trim();
  const delegadoApellido = input.delegadoApellido.trim();
  const delegadoDocumento = input.delegadoDocumento.trim();
  const delegadoContactoPrincipal = input.delegadoContactoPrincipal.trim();
  const ciudadBarrio = input.ciudadBarrio.trim();
  const descripcion = input.descripcion.trim();
  const comoSeEntero = input.comoSeEntero.trim();

  if (comoSeEntero && !esCanalValido(comoSeEntero)) {
    return { success: false, error: "La opción de '¿Dónde te enteraste?' no es válida." };
  }

  const anioFundacionRaw = input.anioFundacion.trim();
  let anioFundacion: number | null = null;
  if (anioFundacionRaw) {
    const parsed = Number(anioFundacionRaw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > new Date().getFullYear()) {
      return { success: false, error: "El año de fundación no es válido." };
    }
    anioFundacion = parsed;
  }

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

  // Orden de llegada: siguiente número disponible, igual patrón que
  // `orden_inscripcion` en la inscripción oficial (ver admin/actions.ts).
  const { data: maxOrdenRow } = await admin
    .from("teams")
    .select("orden_preinscripcion")
    .not("orden_preinscripcion", "is", null)
    .order("orden_preinscripcion", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordenPreinscripcion = (maxOrdenRow?.orden_preinscripcion ?? 0) + 1;

  const { data: team, error: teamError } = await admin
    .from("teams")
    .insert({
      nombre_equipo: nombreEquipo,
      anio_fundacion: anioFundacion,
      ciudad_barrio: ciudadBarrio || null,
      descripcion: descripcion || null,
      como_se_entero: comoSeEntero || null,
      estado_inscripcion: "preinscrito",
      orden_preinscripcion: ordenPreinscripcion,
    })
    .select("id")
    .single();

  if (teamError || !team) {
    return { success: false, error: "No se pudo registrar la preinscripción. Intenta de nuevo." };
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

  const { subject, html, text } = correoPreinscripcion({
    nombreEquipo,
    delegadoNombre,
  });
  await sendEmail({ to: correo, subject, html, text }).catch(() => {});

  // Aviso interno al admin — no bloquea el resultado si falla ni si no hay
  // correo de admin configurado (ver `correoNuevaPreinscripcionAdmin`).
  const adminEmails = getAdminNotificationEmails();
  if (adminEmails) {
    const correoAdmin = correoNuevaPreinscripcionAdmin({
      nombreEquipo,
      delegadoNombre: `${delegadoNombre} ${delegadoApellido}`.trim(),
      contacto: delegadoContactoPrincipal,
      correo,
      ciudadBarrio: ciudadBarrio || null,
      comoSeEntero: comoSeEntero || null,
    });
    await sendEmail({
      to: adminEmails,
      subject: correoAdmin.subject,
      html: correoAdmin.html,
      text: correoAdmin.text,
    }).catch(() => {});
  } else {
    console.warn("[preinscripcion] WOMPI_ADMIN_NOTIFICATION_EMAIL no configurada — no se avisó al admin.");
  }

  return { success: true, nombreEquipo, ordenPreinscripcion };
}
