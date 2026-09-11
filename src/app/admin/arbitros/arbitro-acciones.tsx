"use client";

import { useState, useTransition } from "react";
import { actualizarArbitroActivo, eliminarArbitro } from "@/app/admin/arbitros/actions";

export function ArbitroAcciones({ arbitroId, activo }: { arbitroId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActivo() {
    setError(null);
    startTransition(async () => {
      const result = await actualizarArbitroActivo(arbitroId, !activo);
      if (!result.success) setError(result.error);
    });
  }

  function eliminar() {
    if (!confirm("¿Eliminar este árbitro de la planilla del torneo?")) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarArbitro(arbitroId);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
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
        onClick={eliminar}
        disabled={pending}
        className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors hover:border-red-400/60 disabled:opacity-60"
      >
        Eliminar
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
