"use client";

import { useState, useTransition } from "react";
import { eliminarEscuelaArbitral } from "@/app/admin/arbitros/actions";

export function EscuelaAcciones({ escuelaId }: { escuelaId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function eliminar() {
    if (
      !confirm(
        "¿Eliminar esta escuela? Los árbitros vinculados a ella quedarán sin escuela asignada."
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarEscuelaArbitral(escuelaId);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
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
