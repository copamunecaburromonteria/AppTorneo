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

/**
 * `jornada`/`marcadorLocal`/`marcadorVisitante` se usan solo para decidir
 * si hay que pedir penales antes de cerrar: un empate en fase eliminatoria
 * (jornada 6 en adelante) no se puede cerrar sin ellos — ver
 * `cerrarPartido` en `src/app/operador/actions.ts`, que es quien valida
 * de verdad (esto es solo para no hacerle pedir penales a un partido de
 * fase de grupos, donde el empate es válido tal cual).
 */
export function EstadoAcciones({
  matchId,
  estado,
  jornada,
  marcadorLocal,
  marcadorVisitante,
}: {
  matchId: string;
  estado: string;
  jornada: number | null;
  marcadorLocal: number;
  marcadorVisitante: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [penalesLocal, setPenalesLocal] = useState("");
  const [penalesVisitante, setPenalesVisitante] = useState("");

  const esFaseEliminatoria = jornada !== null && jornada >= 6;
  const empatadoEnEliminacion = esFaseEliminatoria && marcadorLocal === marcadorVisitante;

  function ejecutar(fn: (id: string) => Promise<Resultado>) {
    setError(null);
    startTransition(async () => {
      const result = await fn(matchId);
      if (!result.success) setError(result.error ?? "Ocurrió un error.");
    });
  }

  function cerrarSinPenales() {
    if (
      confirm(
        "¿Cerrar y oficializar el partido? El resultado y las estadísticas quedan públicas de inmediato."
      )
    ) {
      ejecutar((id) => cerrarPartido(id));
    }
  }

  function cerrarConPenales() {
    const local = Number(penalesLocal);
    const visitante = Number(penalesVisitante);
    if (
      !penalesLocal.trim() ||
      !penalesVisitante.trim() ||
      !Number.isInteger(local) ||
      !Number.isInteger(visitante) ||
      local < 0 ||
      visitante < 0
    ) {
      setError("Completa el marcador de penales de ambos equipos.");
      return;
    }
    if (local === visitante) {
      setError("El marcador de penales no puede quedar empatado.");
      return;
    }
    if (!confirm("¿Cerrar el partido con este marcador de penales? Queda público de inmediato.")) return;
    setError(null);
    startTransition(async () => {
      const result = await cerrarPartido(matchId, local, visitante);
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

          {empatadoEnEliminacion ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-muneca-yellow/40 bg-muneca-yellow/10 px-3 py-2">
              <span className="text-xs font-semibold uppercase text-white/70">
                Empate en fase eliminatoria — penales:
              </span>
              <input
                type="number"
                min={0}
                value={penalesLocal}
                onChange={(e) => setPenalesLocal(e.target.value)}
                disabled={pending}
                className="w-14 rounded-md border border-white/20 bg-transparent px-2 py-1 text-center text-sm text-white"
                aria-label="Penales equipo local"
              />
              <span className="text-white/50">-</span>
              <input
                type="number"
                min={0}
                value={penalesVisitante}
                onChange={(e) => setPenalesVisitante(e.target.value)}
                disabled={pending}
                className="w-14 rounded-md border border-white/20 bg-transparent px-2 py-1 text-center text-sm text-white"
                aria-label="Penales equipo visitante"
              />
              <button type="button" onClick={cerrarConPenales} disabled={pending} className={botonClass}>
                Cerrar con penales
              </button>
            </div>
          ) : (
            <button type="button" onClick={cerrarSinPenales} disabled={pending} className={botonClass}>
              Cerrar y oficializar partido
            </button>
          )}
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
