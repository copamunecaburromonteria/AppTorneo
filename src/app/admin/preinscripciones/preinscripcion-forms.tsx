"use client";

import { useActionState } from "react";
import { invitarAInscripcionOficial, revertirInvitacion } from "@/app/admin/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

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
