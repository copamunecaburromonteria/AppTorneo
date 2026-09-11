"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearArbitro } from "@/app/admin/arbitros/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await crearArbitro({ success: false, error: "" }, formData);
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

type Escuela = { id: string; nombre: string };

export function NuevoArbitroForm({ escuelas }: { escuelas: Escuela[] }) {
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
      className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Nombre *
        </label>
        <input
          name="nombre"
          required
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Número de documento *
        </label>
        <input
          name="numero_documento"
          required
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Escuela arbitral
        </label>
        <select
          name="escuela_id"
          defaultValue=""
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow [&>option]:bg-muneca-black"
        >
          <option value="">Sin escuela / independiente</option>
          {escuelas.map((escuela) => (
            <option key={escuela.id} value={escuela.id}>
              {escuela.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Teléfono
        </label>
        <input
          name="telefono"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Correo
        </label>
        <input
          name="correo"
          type="email"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Notas
        </label>
        <input
          name="notas"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Agregar árbitro"}
        </button>
        {state.error && <span className="text-xs text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
