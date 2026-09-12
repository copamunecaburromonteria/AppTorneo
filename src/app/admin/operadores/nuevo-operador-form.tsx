"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearOperador } from "@/app/admin/operadores/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await crearOperador({ success: false, error: "" }, formData);
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

export function NuevoOperadorForm() {
  const [state, formAction, pending] = useActionState(accion, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-3"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Nombre *
        </label>
        <input
          name="nombre"
          required
          placeholder="Ej. Operador Cancha 1"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          PIN (4-6 dígitos) *
        </label>
        <input
          name="pin"
          required
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          placeholder="1234"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>

      <div className="flex items-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Agregar operador"}
        </button>
      </div>

      {state.error && (
        <p className="text-xs text-red-400 sm:col-span-3">{state.error}</p>
      )}
    </form>
  );
}
