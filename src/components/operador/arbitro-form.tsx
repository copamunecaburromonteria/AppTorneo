"use client";

import { useActionState, useTransition } from "react";
import { asignarArbitro, quitarArbitro } from "@/app/operador/actions";

type EstadoForm = { success: boolean; error: string };
const estadoInicial: EstadoForm = { success: false, error: "" };

type Arbitro = { id: string; nombre: string };
type Asignacion = { arbitro_id: string; nombre: string; rol: string };

export function ArbitroForm({
  matchId,
  arbitrosDisponibles,
  asignados,
}: {
  matchId: string;
  arbitrosDisponibles: Arbitro[];
  asignados: Asignacion[];
}) {
  async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
    const result = await asignarArbitro(matchId, { success: false, error: "" }, formData);
    return result.success ? { success: true, error: "" } : { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);
  const [quitando, startQuitar] = useTransition();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Árbitros</p>

      <div className="mt-3 space-y-2">
        {asignados.length === 0 && (
          <p className="text-xs text-white/50">Sin árbitros asignados todavía.</p>
        )}
        {asignados.map((a) => (
          <div
            key={a.arbitro_id}
            className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm"
          >
            <span>
              {a.nombre} <span className="text-white/40">· {a.rol}</span>
            </span>
            <button
              type="button"
              disabled={quitando}
              onClick={() =>
                startQuitar(async () => {
                  await quitarArbitro(matchId, a.arbitro_id);
                })
              }
              className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      {arbitrosDisponibles.length > 0 && (
        <form action={formAction} className="mt-3 flex flex-wrap items-center gap-2">
          <select
            name="arbitro_id"
            required
            defaultValue=""
            className="flex-1 rounded-md border border-white/15 bg-muneca-black px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
          >
            <option value="" disabled>
              Selecciona árbitro
            </option>
            {arbitrosDisponibles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <select
            name="rol"
            defaultValue="principal"
            className="rounded-md border border-white/15 bg-muneca-black px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
          >
            <option value="principal">Principal</option>
            <option value="asistente">Asistente</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-muneca-yellow px-3 py-2 text-sm font-bold uppercase text-muneca-black disabled:opacity-60"
          >
            Asignar
          </button>
        </form>
      )}
      {state.error && <p className="mt-2 text-xs text-red-400">{state.error}</p>}
    </div>
  );
}
