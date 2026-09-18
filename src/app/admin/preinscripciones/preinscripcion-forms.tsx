"use client";

import { useActionState } from "react";
import {
  eliminarPreinscripcion,
  invitarAInscripcionOficial,
  reenviarInvitacionInscripcionOficial,
  reenviarCorreoPreinscripcion,
  revertirInvitacion,
} from "@/app/admin/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

/**
 * Reenvía la confirmación de preinscripción (número de orden en la fila) —
 * para cuando el delegado dice que no le llegó o no encuentra su #.
 */
export function ReenviarPreinscripcionForm({ teamId }: { teamId: string }) {
  const accionConId = reenviarCorreoPreinscripcion.bind(null, teamId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-black/15 px-4 py-2 text-xs font-bold uppercase text-muneca-black/70 transition-colors hover:border-muneca-purple/40 hover:text-muneca-purple disabled:opacity-60"
      >
        {pending ? "Reenviando..." : "Reenviar correo"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      {state.success && <span className="text-xs font-semibold text-emerald-600">Enviado ✓</span>}
    </form>
  );
}

export function InvitarForm({ teamId }: { teamId: string }) {
  const accionConId = invitarAInscripcionOficial.bind(null, teamId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md bg-muneca-purple px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {pending ? "Invitando..." : "Invitar a inscripción oficial"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
    </form>
  );
}

/**
 * Reenvía el correo de invitación sin tocar el estado del equipo — para
 * cuando el delegado dice que no le llegó o lo perdió. A diferencia de
 * Invitar/Revertir, esto no cambia nada visible en la lista, así que el
 * único feedback es el mensaje de "correo reenviado" bajo el botón.
 */
export function ReenviarForm({ teamId }: { teamId: string }) {
  const accionConId = reenviarInvitacionInscripcionOficial.bind(null, teamId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-muneca-purple/30 px-4 py-2 text-xs font-bold uppercase text-muneca-purple transition-colors hover:bg-muneca-purple/10 disabled:opacity-60"
      >
        {pending ? "Reenviando..." : "Reenviar correo"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      {state.success && <span className="text-xs font-semibold text-emerald-600">Correo reenviado ✓</span>}
    </form>
  );
}

/**
 * Elimina un equipo de la fila de preinscritos — para corregir errores de
 * creación o quitar equipos de prueba antes de que avancen. Pide
 * confirmación en el navegador porque no se puede deshacer.
 */
export function EliminarPreinscripcionForm({
  teamId,
  nombreEquipo,
}: {
  teamId: string;
  nombreEquipo: string;
}) {
  const accionConId = eliminarPreinscripcion.bind(null, teamId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Eliminar a "${nombreEquipo}" de la fila de preinscritos? Esta acción no se puede deshacer.`
          )
        ) {
          event.preventDefault();
        }
      }}
      className="flex items-center gap-2"
    >
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-rose-200 px-4 py-2 text-xs font-bold uppercase text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
    </form>
  );
}

export function RevertirForm({ teamId }: { teamId: string }) {
  const accionConId = revertirInvitacion.bind(null, teamId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-black/15 px-4 py-2 text-xs font-bold uppercase text-muneca-black/70 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
      >
        {pending ? "Revirtiendo..." : "Revertir a preinscrito"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
    </form>
  );
}
