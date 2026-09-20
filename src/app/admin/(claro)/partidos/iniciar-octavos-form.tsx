"use client";

import { useState, useTransition } from "react";
import { iniciarOctavos } from "@/app/admin/torneo/actions";

/** Mismo look & feel que `IniciarTorneoForm` — ver ese archivo. Acá no
 * hace falta pedir una fecha: la fecha de inicio de octavos ya está en
 * `torneo_config.fecha_inicio_octavos`, la clasificación se calcula sola
 * a partir de los resultados de la fase de grupos. */
export function IniciarOctavosForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    if (
      !confirm(
        "¿Generar los octavos de final? Clasifica automáticamente a los 4 primeros de cada grupo y arma los cruces A-B / C-D. No se puede deshacer desde aquí."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await iniciarOctavos();
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
        {pending ? "Generando octavos..." : "Iniciar octavos de final"}
      </button>
      <p className="max-w-xs text-center text-[11px] text-black/40">
        Clasifica a los 4 primeros de cada grupo (desempate automático) y arma los cruces. No se puede
        deshacer desde aquí.
      </p>
    </div>
  );
}
