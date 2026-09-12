"use client";

import { useState, useTransition } from "react";
import { deshacerUltimoEvento } from "@/app/operador/actions";

export function DeshacerBoton({ matchId, disabled }: { matchId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function deshacer() {
    if (!confirm("¿Deshacer el último evento registrado?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deshacerUltimoEvento(matchId);
      if (!result.success) setError(result.error ?? "Ocurrió un error.");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={deshacer}
        disabled={disabled || pending}
        className="rounded-md border border-red-400/40 px-3 py-1.5 text-xs font-bold uppercase text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
      >
        {pending ? "Deshaciendo..." : "Deshacer último"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
