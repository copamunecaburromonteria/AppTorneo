"use client";

import { useState, useTransition } from "react";
import { actualizarCupoEquipos } from "@/app/admin/config/actions";

/**
 * Panel de la acción rápida "Gestionar cupos": ajusta
 * `torneo_config.numero_equipos_torneo`. No mueve gente de la lista de
 * espera automáticamente — eso lo sigue haciendo el admin a mano desde la
 * sección "Equipos en espera" de esta misma página.
 */
export function CuposForm({ cupoActual, validados }: { cupoActual: number; validados: number }) {
  const [valor, setValor] = useState(String(cupoActual));
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function guardar() {
    const nuevoCupo = Number(valor);
    setMensaje(null);
    startTransition(async () => {
      const res = await actualizarCupoEquipos(nuevoCupo);
      setMensaje(
        res.success
          ? { tipo: "ok", texto: "Cupo actualizado." }
          : { tipo: "error", texto: res.error }
      );
    });
  }

  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.015] p-4">
      <p className="text-sm text-muneca-black/70">
        Hoy hay <strong className="text-muneca-black">{validados}</strong> equipos validados sobre un
        cupo de <strong className="text-muneca-black">{cupoActual}</strong>. El cupo no se puede bajar
        por debajo de los equipos ya validados.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-black/50">
          Cupo del torneo
          <input
            type="number"
            min={validados}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-28 rounded-md border border-black/15 px-3 py-2 text-sm font-semibold text-muneca-black"
          />
        </label>
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="rounded-md bg-muneca-purple px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cupo"}
        </button>
      </div>

      {mensaje && (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
          }`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
