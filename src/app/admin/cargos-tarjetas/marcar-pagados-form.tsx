"use client";

import { useActionState } from "react";
import { marcarCargosTarjetaPagados } from "@/app/admin/cargos-tarjetas/actions";

type EstadoForm = { success: boolean; error: string };
const estadoInicial: EstadoForm = { success: false, error: "" };

export function MarcarCargosPagadosForm({ teamId }: { teamId: string }) {
  const accionConTeam = marcarCargosTarjetaPagados.bind(null, teamId);

  async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
    const result = await accionConTeam(formData);
    return result.success ? { success: true, error: "" } : { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="referencia"
        placeholder="Referencia (opcional)"
        className="w-36 rounded-md border border-black/15 bg-white px-2 py-1 text-xs text-muneca-black outline-none focus:border-muneca-purple"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-muneca-yellow px-3 py-1.5 text-xs font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Marcar pagado"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
    </form>
  );
}
