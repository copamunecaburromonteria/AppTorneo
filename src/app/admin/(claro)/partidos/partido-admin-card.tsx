"use client";

import { useState } from "react";
import { ReprogramarPartidoForm } from "./reprogramar-partido-form";

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  entretiempo: "Entretiempo",
  finalizado: "Finalizado",
  suspendido: "Suspendido",
};

const ESTADO_CLASE: Record<string, string> = {
  programado: "bg-black/5 text-black/60",
  en_curso: "bg-amber-400/20 text-amber-700",
  entretiempo: "bg-amber-400/20 text-amber-700",
  finalizado: "bg-emerald-500/15 text-emerald-700",
  suspendido: "bg-rose-500/15 text-rose-700",
};

/** Solo un partido `programado` o `suspendido` se puede mover — uno en
 * curso o ya finalizado no tiene sentido reprogramarlo. */
const ESTADOS_REPROGRAMABLES = ["programado", "suspendido"];

export function PartidoAdminCard({
  matchId,
  local,
  visitante,
  estado,
  fechaYmd,
  hora,
  cancha,
}: {
  matchId: string;
  local: string;
  visitante: string;
  estado: string;
  fechaYmd: string;
  hora: number;
  cancha: number;
}) {
  const [editando, setEditando] = useState(false);
  const puedeReprogramar = ESTADOS_REPROGRAMABLES.includes(estado);

  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug text-muneca-black">
          {local} vs {visitante}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            ESTADO_CLASE[estado] ?? "bg-black/5 text-black/50"
          }`}
        >
          {ESTADO_LABEL[estado] ?? estado}
        </span>
      </div>

      {puedeReprogramar &&
        (editando ? (
          <ReprogramarPartidoForm
            matchId={matchId}
            fechaActualYmd={fechaYmd}
            horaActual={hora}
            canchaActual={cancha}
            onCerrar={() => setEditando(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="mt-2 rounded-md border border-black/15 px-2.5 py-1 text-[11px] font-semibold text-black/60 transition-colors hover:border-muneca-purple/40 hover:text-muneca-purple"
          >
            Reprogramar
          </button>
        ))}
    </div>
  );
}
