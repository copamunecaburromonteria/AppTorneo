"use client";

import { useState, useTransition } from "react";
import { actualizarArbitroActivoRoster, eliminarArbitroRoster } from "./actions";

export function ArbitroAccionesLider({ arbitroId, activo }: { arbitroId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActivo() {
    setError(null);
    startTransition(async () => {
      const result = await actualizarArbitroActivoRoster(arbitroId, !activo);
      if (!result.success) setError(result.error);
    });
  }

  function eliminar() {
    if (!confirm("¿Eliminar este árbitro de la planilla del torneo?")) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarArbitroRoster(arbitroId);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleActivo}
        disabled={pending}
        className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-semibold text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple disabled:opacity-60"
      >
        {activo ? "Marcar inactivo" : "Marcar activo"}
      </button>
      <button
        type="button"
        onClick={eliminar}
        disabled={pending}
        className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-300 disabled:opacity-60"
      >
        Eliminar
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
