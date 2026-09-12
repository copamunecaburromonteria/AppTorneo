"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearOperador } from "@/app/admin/operadores/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await crearOperador({ success: false, error: "" }, formData);
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muneca-black/50";

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
      className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-3"
    >
      <div>
        <label className={labelClass}>Nombre *</label>
        <input name="nombre" required placeholder="Ej. Operador Cancha 1" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>PIN (4-6 dígitos) *</label>
        <input
          name="pin"
          required
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          placeholder="1234"
          className={inputClass}
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
        <p className="text-xs text-rose-600 sm:col-span-3">{state.error}</p>
      )}
    </form>
  );
}
