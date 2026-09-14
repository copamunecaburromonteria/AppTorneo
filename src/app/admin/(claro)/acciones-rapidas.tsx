"use client";

import { useState } from "react";
import { RecordatoriosPanel } from "./recordatorios-panel";
import { CuposForm } from "./cupos-form";
import { ConfigPagosForm } from "./config-pagos-form";
import type { ConfiguracionPagos } from "@/app/admin/config/actions";

type PanelAbierto = "recordatorios" | "cupos" | "pagos" | null;

const BOTONES: { id: Exclude<PanelAbierto, null>; label: string; icono: string }[] = [
  { id: "recordatorios", label: "Enviar recordatorios", icono: "📨" },
  { id: "cupos", label: "Gestionar cupos", icono: "🎟️" },
  { id: "pagos", label: "Configuración de pagos", icono: "💳" },
];

/**
 * "Acciones rápidas" de la página de Equipos y pagos. "Exportar reportes"
 * es un link directo a la descarga (no necesita panel ni estado); las otras
 * tres abren su panel correspondiente debajo de la grilla de botones.
 */
export function AccionesRapidas({
  cupoActual,
  validados,
  configPagos,
}: {
  cupoActual: number;
  validados: number;
  configPagos: ConfiguracionPagos;
}) {
  const [abierto, setAbierto] = useState<PanelAbierto>(null);

  return (
    <section>
      <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
        Acciones rápidas
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="/admin/reportes/equipos.csv"
          className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-muneca-black shadow-sm transition-colors hover:border-muneca-purple/40 hover:text-muneca-purple"
        >
          <span aria-hidden="true">📊</span> Exportar reportes
        </a>

        {BOTONES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setAbierto((prev) => (prev === b.id ? null : b.id))}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold shadow-sm transition-colors ${
              abierto === b.id
                ? "border-muneca-purple bg-muneca-purple/5 text-muneca-purple"
                : "border-black/10 bg-white text-muneca-black hover:border-muneca-purple/40 hover:text-muneca-purple"
            }`}
          >
            <span aria-hidden="true">{b.icono}</span> {b.label}
          </button>
        ))}
      </div>

      {abierto && (
        <div className="mt-4">
          {abierto === "recordatorios" && <RecordatoriosPanel />}
          {abierto === "cupos" && <CuposForm cupoActual={cupoActual} validados={validados} />}
          {abierto === "pagos" && <ConfigPagosForm inicial={configPagos} />}
        </div>
      )}
    </section>
  );
}
