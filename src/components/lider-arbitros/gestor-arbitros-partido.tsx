"use client";

import { useActionState, useState, useTransition } from "react";
import {
  asignarArbitroPartido,
  confirmarPartidoListo,
  marcarReserva,
  quitarArbitroPartido,
} from "@/app/lider-arbitros/actions";

type EstadoForm = { success: boolean; error: string };
const estadoInicial: EstadoForm = { success: false, error: "" };

type Arbitro = { id: string; nombre: string };
type Asignado = { arbitro_id: string; nombre: string; es_reserva: boolean };

export function GestorArbitrosPartido({
  matchId,
  asignados,
  arbitrosDisponibles,
  requeridosInicial,
  confirmadoEn,
}: {
  matchId: string;
  asignados: Asignado[];
  arbitrosDisponibles: Arbitro[];
  requeridosInicial: number | null;
  confirmadoEn: string | null;
}) {
  const titulares = asignados.filter((a) => !a.es_reserva);

  const [requeridos, setRequeridos] = useState(requeridosInicial ?? Math.max(1, titulares.length || 1));
  const [pendingAccion, startTransition] = useTransition();
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [confirmando, startConfirmar] = useTransition();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmadoLocal, setConfirmadoLocal] = useState(confirmadoEn);

  async function accionAsignar(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
    const result = await asignarArbitroPartido(matchId, { success: false, error: "" }, formData);
    return result.success ? { success: true, error: "" } : { success: false, error: result.error };
  }
  const [state, formAction, asignando] = useActionState(accionAsignar, estadoInicial);

  function quitar(arbitroId: string) {
    setErrorAccion(null);
    startTransition(async () => {
      const result = await quitarArbitroPartido(matchId, arbitroId);
      if (!result.success) setErrorAccion(result.error);
    });
  }

  function toggleReserva(arbitroId: string, actual: boolean) {
    setErrorAccion(null);
    startTransition(async () => {
      const result = await marcarReserva(matchId, arbitroId, !actual);
      if (!result.success) setErrorAccion(result.error);
    });
  }

  function confirmar() {
    setConfirmError(null);
    startConfirmar(async () => {
      const result = await confirmarPartidoListo(matchId, requeridos);
      if (!result.success) {
        setConfirmError(result.error);
      } else {
        setConfirmadoLocal(new Date().toISOString());
      }
    });
  }

  const puedeConfirmar = titulares.length >= requeridos;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl text-muneca-black">Árbitros asignados</h2>
        <p className="mt-1 text-sm text-black/60">
          Hasta 3 árbitros de campo por partido. Los que marques como reserva quedan de respaldo y no
          cuentan para el check de &quot;partido listo&quot;.
        </p>

        <div className="mt-5 space-y-2">
          {asignados.length === 0 && (
            <p className="text-sm text-black/40">Todavía no hay árbitros asignados a este partido.</p>
          )}
          {asignados.map((a) => (
            <div
              key={a.arbitro_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-muneca-black">{a.nombre}</p>
                <p className="text-xs text-black/50">{a.es_reserva ? "Reserva / parrillero" : "Titular"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pendingAccion}
                  onClick={() => toggleReserva(a.arbitro_id, a.es_reserva)}
                  className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-semibold text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple disabled:opacity-50"
                >
                  {a.es_reserva ? "Marcar titular" : "Marcar reserva"}
                </button>
                <button
                  type="button"
                  disabled={pendingAccion}
                  onClick={() => quitar(a.arbitro_id)}
                  className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-300 disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
          {errorAccion && <p className="text-xs text-rose-600">{errorAccion}</p>}
        </div>

        {asignados.length < 3 && arbitrosDisponibles.length > 0 && (
          <form
            action={formAction}
            className="mt-5 flex flex-wrap items-end gap-3 border-t border-black/10 pt-5"
          >
            <label className="min-w-[180px] flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-black/50">
                Agregar árbitro
              </span>
              <select
                name="arbitro_id"
                required
                defaultValue=""
                className="mt-1.5 w-full rounded-md border border-black/15 bg-white px-3 py-2.5 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20"
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
            </label>
            <label className="flex items-center gap-2 pb-2.5 text-sm text-black/70">
              <input type="checkbox" name="es_reserva" className="h-4 w-4 rounded border-black/25" />
              Como reserva / parrillero
            </label>
            <button
              type="submit"
              disabled={asignando}
              className="rounded-md bg-muneca-yellow px-5 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {asignando ? "Asignando..." : "Asignar"}
            </button>
          </form>
        )}
        {asignados.length >= 3 && (
          <p className="mt-5 border-t border-black/10 pt-5 text-xs text-black/40">
            Ya asignaste el máximo de 3 árbitros para este partido.
          </p>
        )}
        {state.error && <p className="mt-2 text-xs text-rose-600">{state.error}</p>}
      </div>

      <div className="rounded-2xl bg-muneca-black p-6 text-muneca-white sm:p-8">
        <p className="text-sm uppercase tracking-wide text-donkey-gray">Confirmar asignación</p>
        <p className="mt-2 text-sm text-white/70">
          Decide cuántos árbitros titulares hacen falta para este partido y confirma cuando ya los
          tengas asignados. Al confirmar, el super admin recibe una notificación.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-white/80">
            Árbitros necesarios:
            <select
              value={requeridos}
              onChange={(e) => setRequeridos(Number(e.target.value))}
              className="ml-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow [&>option]:bg-muneca-black"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
          <span className="text-sm text-white/60">
            Titulares asignados: {titulares.length} / {requeridos}
          </span>
        </div>

        <button
          type="button"
          onClick={confirmar}
          disabled={confirmando || !puedeConfirmar}
          className="mt-5 w-full rounded-md bg-muneca-yellow px-5 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-50 sm:w-auto"
        >
          {confirmando
            ? "Confirmando..."
            : confirmadoLocal
              ? "Partido listo ✓ (volver a confirmar)"
              : "Confirmar partido listo"}
        </button>

        {!puedeConfirmar && (
          <p className="mt-2 text-xs text-amber-300">
            Necesitas asignar al menos {requeridos} árbitro(s) titular(es) antes de confirmar.
          </p>
        )}
        {confirmError && <p className="mt-2 text-xs text-red-300">{confirmError}</p>}
        {confirmadoLocal && !confirmError && (
          <p className="mt-2 text-xs text-emerald-300">
            Confirmado el {new Date(confirmadoLocal).toLocaleString("es-CO")}.
          </p>
        )}
      </div>
    </div>
  );
}
