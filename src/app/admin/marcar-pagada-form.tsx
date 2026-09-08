"use client";

import { useActionState } from "react";
import { marcarCuotaPagada } from "@/app/admin/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

export function MarcarPagadaForm({ cuotaId }: { cuotaId: string }) {
  const accionConId = marcarCuotaPagada.bind(null, cuotaId);

  async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
    const result = await accionConId(formData);
    if (result.success) {
      return { success: true, error: "" };
    }
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="referencia"
        placeholder="Referencia (opcional)"
        className="w-40 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-muneca-yellow"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-muneca-yellow px-3 py-1 text-xs font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Marcar como pagada"}
      </button>
      {state.error && <span className="text-xs text-red-400">{state.error}</span>}
    </form>
  );
}
