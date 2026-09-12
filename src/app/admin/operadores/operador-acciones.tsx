"use client";

import { useState, useTransition } from "react";
import {
  actualizarOperadorActivo,
  eliminarOperador,
  resetearPinOperador,
} from "@/app/admin/operadores/actions";

export function OperadorAcciones({ operadorId, activo }: { operadorId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cambiandoPin, setCambiandoPin] = useState(false);
  const [nuevoPin, setNuevoPin] = useState("");

  function toggleActivo() {
    setError(null);
    startTransition(async () => {
      const result = await actualizarOperadorActivo(operadorId, !activo);
      if (!result.success) setError(result.error);
    });
  }

  function eliminar() {
    if (!confirm("¿Eliminar este operador?")) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarOperador(operadorId);
      if (!result.success) setError(result.error);
    });
  }

  function guardarNuevoPin() {
    setError(null);
    const formData = new FormData();
    formData.set("operador_id", operadorId);
    formData.set("pin", nuevoPin);
    startTransition(async () => {
      const result = await resetearPinOperador({ success: false, error: "" }, formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setCambiandoPin(false);
        setNuevoPin("");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleActivo}
          disabled={pending}
          className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-muneca-yellow/60 hover:text-muneca-yellow disabled:opacity-60"
        >
          {activo ? "Marcar inactivo" : "Marcar activo"}
        </button>
        <button
          type="button"
          onClick={() => setCambiandoPin((v) => !v)}
          disabled={pending}
          className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-muneca-yellow/60 hover:text-muneca-yellow disabled:opacity-60"
        >
          Cambiar PIN
        </button>
        <button
          type="button"
          onClick={eliminar}
          disabled={pending}
          className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors hover:border-red-400/60 disabled:opacity-60"
        >
          Eliminar
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {cambiandoPin && (
        <div className="flex items-center gap-2">
          <input
            value={nuevoPin}
            onChange={(e) => setNuevoPin(e.target.value)}
            inputMode="numeric"
            pattern="\d{4,6}"
            maxLength={6}
            placeholder="Nuevo PIN"
            className="w-28 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-muneca-yellow"
          />
          <button
            type="button"
            onClick={guardarNuevoPin}
            disabled={pending || nuevoPin.length < 4}
            className="rounded-md bg-muneca-yellow px-2.5 py-1 text-xs font-bold uppercase text-muneca-black disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
