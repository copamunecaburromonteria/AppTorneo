import type { Metadata } from "next";
import { PreinscripcionForm } from "./preinscripcion-form";

export const metadata: Metadata = {
  title: "Preinscribe tu equipo | Copa Muñeca e'Burro",
  description:
    "Preinscribe a tu equipo en la Copa Muñeca e'Burro — sin costo, para hacer fila mientras confirmamos los 24 cupos. Montería, Córdoba.",
};

/**
 * Puerta de entrada por defecto al torneo (reemplaza a `/inscripcion` como
 * primer contacto, 2026-09-17): solo pide datos del equipo y del delegado,
 * sin cuenta ni cobro — es la nueva "preinscripción" que decidió Fernando en
 * vez de cobrar de una vez. Cuando el admin decide invitar a un equipo
 * preinscrito a completar la inscripción oficial (desde
 * `/admin/preinscripciones`), ese equipo pasa a `/inscripcion`, que ahora
 * reconoce por correo a quién ya fue invitado (ver `inscripcion/actions.ts`,
 * `verificarInvitacion`). Ver `claude/plan-fases-tareas.md` para el detalle
 * completo de esta modalidad.
 */
export default function PreinscripcionPage() {
  return <PreinscripcionForm />;
}
