"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearArbitroRoster } from "./actions";

type EstadoForm = { success: boolean; error: string };
const estadoInicial: EstadoForm = { success: false, error: "" };

const inputClass =
  "mt-1.5 w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-sm text-muneca-black placeholder:text-black/35 focus:border-muneca-purple focus:outline-none focus:ring-2 focus:ring-muneca-purple/20";

const labelClass = "block text-sm font-semibold text-muneca-black";

async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await crearArbitroRoster({ success: false, error: "" }, formData);
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

export function NuevoArbitroFormLider() {
  const [state, formAction, pending] = useActionState(accion, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={labelClass}>Nombre *</span>
        <input name="nombre" required className={inputClass} />
      </label>
      <label className="block">
        <span className={labelClass}>Número de documento *</span>
        <input name="numero_documento" required className={inputClass} />
      </label>
      <label className="block">
        <span className={labelClass}>Teléfono</span>
        <input name="telefono" className={inputClass} />
      </label>
      <label className="block">
        <span className={labelClass}>Correo</span>
        <input name="correo" type="email" className={inputClass} />
      </label>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Notas</span>
        <input name="notas" className={inputClass} placeholder="Opcional" />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-muneca-yellow px-5 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Agregar árbitro"}
        </button>
        {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}
