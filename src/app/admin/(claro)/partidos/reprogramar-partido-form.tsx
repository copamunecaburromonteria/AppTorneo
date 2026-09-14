"use client";

import { useState, useTransition } from "react";
import { reprogramarPartido } from "@/app/admin/partidos/actions";
import { SLOTS_POR_DIA, DIAS_VALIDOS, diaSemanaBogota } from "@/lib/franjas-horario";

export function ReprogramarPartidoForm({
  matchId,
  fechaActualYmd,
  horaActual,
  canchaActual,
  onCerrar,
}: {
  matchId: string;
  fechaActualYmd: string;
  horaActual: number;
  canchaActual: number;
  onCerrar: () => void;
}) {
  const [fecha, setFecha] = useState(fechaActualYmd);
  const [hora, setHora] = useState(horaActual);
  const [cancha, setCancha] = useState(canchaActual);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dow = fecha ? diaSemanaBogota(fecha) : -1;
  const diaValido = DIAS_VALIDOS.includes(dow);
  const slots = diaValido ? SLOTS_POR_DIA[dow] ?? [] : [];

  function onFechaChange(valor: string) {
    setFecha(valor);
    const nuevoDow = diaSemanaBogota(valor);
    const nuevosSlots = SLOTS_POR_DIA[nuevoDow] ?? [];
    if (nuevosSlots.length > 0 && !nuevosSlots.includes(hora)) setHora(nuevosSlots[0]);
  }

  function guardar() {
    if (!diaValido) {
      setError("Elige un jueves, viernes o sábado.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reprogramarPartido(matchId, fecha, hora, cancha);
      if (!result.success) {
        setError(result.error);
      } else {
        onCerrar();
      }
    });
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-muneca-purple/30 bg-muneca-purple/5 p-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-black/40">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="w-full rounded-md border border-black/15 px-2 py-1.5 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-black/40">
            Hora
          </label>
          <select
            value={hora}
            onChange={(e) => setHora(Number(e.target.value))}
            disabled={!diaValido}
            className="w-full rounded-md border border-black/15 px-2 py-1.5 text-xs disabled:opacity-50"
          >
            {slots.map((h) => (
              <option key={h} value={h}>
                {h}:00
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-black/40">
            Cancha
          </label>
          <select
            value={cancha}
            onChange={(e) => setCancha(Number(e.target.value))}
            className="w-full rounded-md border border-black/15 px-2 py-1.5 text-xs"
          >
            <option value={1}>Cancha 1</option>
            <option value={2}>Cancha 2</option>
          </select>
        </div>
      </div>

      {!diaValido && fecha && (
        <p className="text-[11px] text-amber-600">Solo se juega jueves, viernes o sábado.</p>
      )}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !diaValido}
          className="rounded-md bg-muneca-purple px-3 py-1.5 text-xs font-bold uppercase text-white disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCerrar}
          disabled={pending}
          className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-semibold text-black/60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
