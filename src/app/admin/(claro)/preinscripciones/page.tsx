import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IconHeading } from "@/components/admin/icon-heading";
import { PreinscripcionesTabs, type EquipoPreinscrito } from "@/app/admin/preinscripciones/preinscripciones-tabs";

/**
 * Panel para administrar la nueva modalidad de preinscripción (2026-09-17,
 * ver `claude/plan-fases-tareas.md`): equipos que llenaron el formulario
 * abierto de `/preinscripcion` (sin cuenta ni cobro) y esperan a que el admin
 * los invite, uno por uno, a completar la inscripción oficial en
 * `/inscripcion` (donde sí se cobra). La decisión de a quién invitar y
 * cuándo es siempre manual — `orden_preinscripcion` solo orienta el orden de
 * llegada.
 *
 * Rediseño "más colorido" (2026-09-21, a partir de una captura de
 * referencia): las dos listas (antes siempre visibles, una debajo de otra)
 * ahora se alternan con sub-pestañas + búsqueda — ver
 * `preinscripciones-tabs.tsx`. La consulta a Supabase y las Server Actions
 * de invitar/reenviar/revertir/eliminar siguen exactamente igual.
 */
export default async function AdminPreinscripcionesPage() {
  const supabase = await createClient();

  const [{ data: invitadosRaw, error: errorInvitados }, { data: preinscritosRaw, error: errorPreinscritos }] =
    await Promise.all([
      supabase
        .from("teams")
        .select(
          `id, nombre_equipo, orden_preinscripcion, fecha_invitado,
           team_delegado(nombre, apellido, correo, contacto_principal, contacto_alterno, whatsapp_notificaciones)`
        )
        .eq("estado_inscripcion", "invitado")
        .order("fecha_invitado", { ascending: true }),
      supabase
        .from("teams")
        .select(
          `id, nombre_equipo, orden_preinscripcion, created_at,
           team_delegado(nombre, apellido, correo, contacto_principal, contacto_alterno, whatsapp_notificaciones)`
        )
        .eq("estado_inscripcion", "preinscrito")
        .order("orden_preinscripcion", { ascending: true }),
    ]);

  function unwrapDelegado(raw: unknown) {
    return Array.isArray(raw) ? (raw[0] ?? null) : (raw as EquipoPreinscrito["delegado"]);
  }

  const invitados: EquipoPreinscrito[] = (invitadosRaw ?? []).map((e) => ({
    id: e.id,
    nombre_equipo: e.nombre_equipo,
    orden_preinscripcion: e.orden_preinscripcion,
    fecha: e.fecha_invitado ?? "",
    delegado: unwrapDelegado(e.team_delegado),
  }));

  const preinscritos: EquipoPreinscrito[] = (preinscritosRaw ?? []).map((e) => ({
    id: e.id,
    nombre_equipo: e.nombre_equipo,
    orden_preinscripcion: e.orden_preinscripcion,
    fecha: e.created_at,
    delegado: unwrapDelegado(e.team_delegado),
  }));

  return (
    <div className="space-y-6">
      <div>
        <IconHeading icon={UserPlus} color="purple" size="lg">
          Preinscripciones
        </IconHeading>
        <p className="mt-1 text-sm text-muneca-black/60">
          Gestiona las solicitudes de equipos que quieren participar en la Copa Muñeca
          e&apos;Burro.
        </p>
      </div>

      {(errorInvitados || errorPreinscritos) && (
        <p className="text-sm text-rose-600">
          No se pudo cargar la información: {errorInvitados?.message ?? errorPreinscritos?.message}
        </p>
      )}

      <PreinscripcionesTabs invitados={invitados} preinscritos={preinscritos} />
    </div>
  );
}
