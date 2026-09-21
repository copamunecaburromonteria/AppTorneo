"use client";

import Image from "next/image";
import { Fragment, useMemo, useState, useTransition } from "react";
import { Search, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { actualizarPatrocinadorActivo, eliminarPatrocinador } from "@/app/admin/patrocinadores/actions";
import { PatrocinadorForm } from "@/app/admin/patrocinadores/patrocinador-form";
import { NIVEL_LABEL, type NivelPatrocinio, type PatrocinadorPublico } from "@/lib/patrocinadores/tipos";

export type PatrocinadorFila = PatrocinadorPublico & {
  activo: boolean;
  activo_desde: string | null;
  activo_hasta: string | null;
};

const NIVEL_CLASE: Record<string, string> = {
  principal: "bg-muneca-purple/10 text-muneca-purple",
  oficial: "bg-sky-100 text-sky-700",
  experiencia: "bg-violet-100 text-violet-700",
  aliado: "bg-amber-100 text-amber-700",
};

/**
 * Tabla de patrocinadores registrados, con búsqueda y filtro por estado —
 * rediseño "más colorido" pedido por Fernando (2026-09-21) a partir de una
 * captura de referencia. Reemplaza la lista de tarjetas apiladas por una
 * tabla real con badges de color e íconos de acción; la lógica de
 * editar/ocultar/eliminar sigue usando las mismas Server Actions de
 * siempre (`actions.ts`), solo cambia la presentación.
 */
export function PatrocinadoresTabla({ patrocinadores }: { patrocinadores: PatrocinadorFila[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activo" | "oculto">("todos");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return patrocinadores.filter((p) => {
      if (filtroEstado === "activo" && !p.activo) return false;
      if (filtroEstado === "oculto" && p.activo) return false;
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [patrocinadores, busqueda, filtroEstado]);

  function toggleActivo(p: PatrocinadorFila) {
    setError(null);
    startTransition(async () => {
      const result = await actualizarPatrocinadorActivo(p.id, !p.activo);
      if (!result.success) setError(result.error);
    });
  }

  function eliminar(p: PatrocinadorFila) {
    if (!confirm(`¿Eliminar a "${p.nombre}" de los patrocinadores?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarPatrocinador(p.id);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar patrocinadores..."
            className="w-full rounded-md border border-black/15 bg-white py-2 pl-9 pr-3 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="oculto">Oculto</option>
        </select>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {filtrados.length === 0 && (
        <p className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-muneca-black/50">
          {patrocinadores.length === 0
            ? "Todavía no hay patrocinadores registrados."
            : "Ningún patrocinador coincide con la búsqueda."}
        </p>
      )}

      {filtrados.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs font-semibold uppercase tracking-wide text-black/40">
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Nombre de la marca</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">Enlace</th>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <Fragment key={p.id}>
                  <tr className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex h-10 w-16 items-center justify-center rounded-md border border-black/10 bg-black/[0.02] p-1">
                        <Image
                          src={p.logo_url}
                          alt={p.nombre}
                          width={90}
                          height={54}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-muneca-black">{p.nombre}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          NIVEL_CLASE[p.nivel] ?? "bg-black/5 text-muneca-black/50"
                        }`}
                      >
                        {NIVEL_LABEL[p.nivel as NivelPatrocinio] ?? p.nivel}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muneca-black/60">
                      {p.link_url ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muneca-black/60">{p.orden}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.activo ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${p.activo ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {p.activo ? "Activo" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => setEditandoId(editandoId === p.id ? null : p.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muneca-black/50 transition-colors hover:bg-muneca-purple/10 hover:text-muneca-purple"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title={p.activo ? "Ocultar del sitio" : "Mostrar en el sitio"}
                          onClick={() => toggleActivo(p)}
                          disabled={pending}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muneca-black/50 transition-colors hover:bg-sky-100 hover:text-sky-700 disabled:opacity-60"
                        >
                          {p.activo ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => eliminar(p)}
                          disabled={pending}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muneca-black/50 transition-colors hover:bg-rose-100 hover:text-rose-700 disabled:opacity-60"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editandoId === p.id && (
                    <tr className="border-b border-black/5 bg-black/[0.015] last:border-0">
                      <td colSpan={7} className="px-4 py-4">
                        <PatrocinadorForm
                          modo="editar"
                          patrocinador={p}
                          onGuardado={() => setEditandoId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
