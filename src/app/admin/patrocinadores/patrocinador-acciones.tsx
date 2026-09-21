"use client";

import { useState, useTransition } from "react";
import {
  actualizarPatrocinadorActivo,
  eliminarPatrocinador,
} from "@/app/admin/patrocinadores/actions";
import { PatrocinadorForm } from "@/app/admin/patrocinadores/patrocinador-form";
import type { PatrocinadorPublico } from "@/lib/patrocinadores/tipos";

type PatrocinadorFila = PatrocinadorPublico & {
  activo: boolean;
  activo_desde: string | null;
  activo_hasta: string | null;
};

export function PatrocinadorAcciones({ patrocinador }: { patrocinador: PatrocinadorFila }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  function toggleActivo() {
    setError(null);
    startTransition(async () => {
      const result = await actualizarPatrocinadorActivo(patrocinador.id, !patrocinador.activo);
      if (!result.success) setError(result.error);
    });
  }

  function eliminar() {
    if (!confirm(`¿Eliminar a "${patrocinador.nombre}" de los patrocinadores?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarPatrocinador(patrocinador.id);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditando((v) => !v)}
          className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-semibold text-muneca-black/70 transition-colors hover:border-muneca-purple/40 hover:text-muneca-purple"
        >
          {editando ? "Cerrar edición" : "Editar"}
        </button>
        <button
          type="button"
          onClick={toggleActivo}
          disabled={pending}
          className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-semibold text-muneca-black/70 transition-colors hover:border-muneca-purple/40 hover:text-muneca-purple disabled:opacity-60"
        >
          {patrocinador.activo ? "Ocultar del sitio" : "Mostrar en el sitio"}
        </button>
        <button
          type="button"
          onClick={eliminar}
          disabled={pending}
          className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
        >
          Eliminar
        </button>
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </div>

      {editando && (
        <div className="mt-3">
          <PatrocinadorForm
            modo="editar"
            patrocinador={patrocinador}
            onGuardado={() => setEditando(false)}
          />
        </div>
      )}
    </div>
  );
}
