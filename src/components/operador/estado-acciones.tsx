"use client";

import { useState, useTransition } from "react";
import {
  iniciarPrimerTiempo,
  marcarDescanso,
  iniciarSegundoTiempo,
  cerrarPartido,
} from "@/app/operador/actions";

type Resultado = { success: boolean; error?: string };

const botonClass =
  "rounded-md bg-muneca-yellow px-5 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100";

export function EstadoAcciones({ matchId, estado }: { matchId: string; estado: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function ejecutar(fn: (id: string) => Promise<Resultado>) {
    setError(null);
    startTransition(async () => {
      const result = await fn(matchId);
      if (!result.success) setError(result.error ?? "Ocurrió un error.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {estado === "programado" && (
        <button type="button" onClick={() => ejecutar(iniciarPrimerTiempo)} disabled={pending} className={botonClass}>
          Iniciar primer tiempo →
        </button>
      )}

      {estado === "en_curso" && (
        <>
          <button
            type="button"
            onClick={() => ejecutar(marcarDescanso)}
            disabled={pending}
            className="rounded-md border border-white/15 px-5 py-2.5 text-sm font-bold uppercase text-white/80 transition-colors hover:border-muneca-yellow/60 hover:text-muneca-yellow disabled:opacity-60"
          >
            Marcar descanso
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "¿Cerrar y oficializar el partido? El resultado y las estadísticas quedan públicas de inmediato."
                )
              ) {
                ejecutar(cerrarPartido);
              }
            }}
            disabled={pending}
            className={botonClass}
          >
            Cerrar y oficializar partido
          </button>
        </>
      )}

      {estado === "entretiempo" && (
        <button type="button" onClick={() => ejecutar(iniciarSegundoTiempo)} disabled={pending} className={botonClass}>
          Iniciar segundo tiempo →
        </button>
      )}

      {estado === "finalizado" && (
        <span className="text-sm font-semibold text-white/50">Partido finalizado.</span>
      )}
      {estado === "suspendido" && (
        <span className="text-sm font-semibold text-red-300">Partido suspendido.</span>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
