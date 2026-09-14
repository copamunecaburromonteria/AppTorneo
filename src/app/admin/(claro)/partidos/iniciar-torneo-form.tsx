"use client";

import { useState, useTransition } from "react";
import { iniciarTorneo } from "@/app/admin/torneo/actions";
import { diaSemanaBogota } from "@/lib/franjas-horario";

/**
 * Formulario del botón "Iniciar torneo" — ver diseño completo en
 * `claude/generador-calendario.md` del proyecto. Solo se muestra cuando el
 * checklist de equipos listos está en verde (ver `page.tsx`); valida que
 * la fecha elegida sea un jueves antes de habilitar el botón, mismo patrón
 * que ya usa `ReprogramarPartidoForm`.
 */
export function IniciarTorneoForm() {
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const esJueves = fecha ? diaSemanaBogota(fecha) === 4 : false;

  function confirmar() {
    if (!esJueves) {
      setError("La fecha de inicio debe ser un jueves.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await iniciarTorneo(fecha);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-muneca-purple/25 bg-muneca-purple/5 p-5">
      <div>
        <label className="mb-1 block text-center text-[11px] font-semibold uppercase tracking-wide text-black/50">
          Fecha de inicio (debe ser jueves)
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          disabled={pending}
          className="rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      {fecha && !esJueves && (
        <p className="text-xs text-amber-600">Esa fecha no es jueves — elige un jueves.</p>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <button
        type="button"
        onClick={confirmar}
        disabled={pending || !esJueves}
        className="rounded-md bg-muneca-yellow px-6 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? "Generando calendario..." : "Iniciar torneo"}
      </button>
      <p className="max-w-xs text-center text-[11px] text-black/40">
        Sortea los 4 grupos automáticamente y genera las 60 fechas de la fase de grupos. No se puede
        deshacer desde aquí.
      </p>
    </div>
  );
}
