"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearEscuelaArbitral } from "@/app/admin/arbitros/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await crearEscuelaArbitral({ success: false, error: "" }, formData);
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muneca-black/50";

export function NuevaEscuelaForm() {
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
      className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className={labelClass}>Nombre de la escuela *</label>
        <input name="nombre" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Representante</label>
        <input name="representante" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Teléfono</label>
        <input name="telefono" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Correo</label>
        <input name="correo" type="email" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Notas</label>
        <input name="notas" className={inputClass} />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Agregar escuela"}
        </button>
        {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}
