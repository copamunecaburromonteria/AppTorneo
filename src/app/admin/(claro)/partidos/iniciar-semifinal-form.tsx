"use client";

import { useState, useTransition } from "react";
import { iniciarSemifinal } from "@/app/admin/torneo/actions";

export function IniciarSemifinalForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    if (
      !confirm(
        "¿Generar la semifinal? Arma los 2 partidos a partir de los ganadores de cuartos (secuenciales: 7pm y 8pm). No se puede deshacer desde aquí."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await iniciarSemifinal();
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-muneca-purple/25 bg-muneca-purple/5 p-5">
      {error && <p className="max-w-sm text-center text-xs text-rose-600">{error}</p>}
      <button
        type="button"
        onClick={confirmar}
        disabled={pending}
        className="rounded-md bg-muneca-yellow px-6 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? "Generando semifinal..." : "Iniciar semifinal"}
      </button>
      <p className="max-w-xs text-center text-[11px] text-black/40">
        Arma los 2 partidos de semifinal a partir de los ganadores de cuartos. No se puede deshacer desde
        aquí.
      </p>
    </div>
  );
}
