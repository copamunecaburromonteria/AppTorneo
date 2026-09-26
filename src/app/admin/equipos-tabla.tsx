"use client";

import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import { Search, ChevronDown, Eye, Users } from "lucide-react";
import { MarcarPagadaForm } from "@/app/admin/marcar-pagada-form";
import {
  ReenviarRegistroForm,
  ReenviarRecordatorioForm,
  ReenviarConfirmacionForm,
} from "@/app/admin/reenvio-forms";

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

const ESTADO_EQUIPO_LABEL: Record<string, string> = {
  pendiente_validacion: "Pendiente de validación",
  validado: "Validado",
  rechazado: "Rechazado",
};

const ESTADO_EQUIPO_CLASE: Record<string, string> = {
  pendiente_validacion: "bg-amber-50 text-amber-700",
  validado: "bg-emerald-50 text-emerald-700",
  rechazado: "bg-rose-50 text-rose-700",
};

const ESTADO_CUOTA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

const ESTADO_CUOTA_CLASE: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  pagada: "bg-emerald-50 text-emerald-700",
  vencida: "bg-rose-50 text-rose-700",
};

export type Cuota = {
  id: string;
  numero_cuota: number;
  monto: number;
  fecha_limite: string;
  estado: string;
  fecha_pago: string | null;
  referencia_wompi: string | null;
  metodo_pago_declarado: string | null;
  pago_reportado_at: string | null;
  comprobante_url: string | null;
};

export type EquipoFila = {
  id: string;
  nombre_equipo: string;
  escudo_url: string | null;
  estado_inscripcion: string;
  orden_inscripcion: number | null;
  created_at: string;
  grupo: string | null;
  delegadoNombre: string;
  delegadoCorreo: string | null;
  montoPagado: number;
  montoTotal: number;
  cuotas: Cuota[];
};

/**
 * Tabla de equipos y pagos con búsqueda + filtros — rediseño "más
 * colorido" (2026-09-21, a partir de una captura de referencia). Antes
 * cada equipo era una tarjeta expandida por defecto con sus cuotas visibles;
 * ahora es una fila de tabla compacta que se expande con la flecha para no
 * perder el flujo de validar pagos que ya existía (MarcarPagadaForm,
 * ReenviarRecordatorioForm, ReenviarConfirmacionForm, ReenviarRegistroForm
 * — mismas Server Actions de siempre).
 */
export function EquiposTabla({ equipos, grupos }: { equipos: EquipoFila[]; grupos: string[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return equipos.filter((e) => {
      if (filtroEstado !== "todos" && e.estado_inscripcion !== filtroEstado) return false;
      if (filtroGrupo !== "todos" && e.grupo !== filtroGrupo) return false;
      if (
        q &&
        !e.nombre_equipo.toLowerCase().includes(q) &&
        !e.delegadoNombre.toLowerCase().includes(q) &&
        !(e.delegadoCorreo ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [equipos, busqueda, filtroEstado, filtroGrupo]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar equipo, capitán o teléfono..."
            className="w-full rounded-md border border-black/15 bg-white py-2 pl-9 pr-3 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20"
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADO_EQUIPO_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
        {grupos.length > 0 && (
          <select
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20"
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>
        )}
        {(busqueda || filtroEstado !== "todos" || filtroGrupo !== "todos") && (
          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setFiltroEstado("todos");
              setFiltroGrupo("todos");
            }}
            className="rounded-md border border-black/15 px-3 py-2 text-sm font-semibold text-muneca-black/60 transition-colors hover:border-muneca-purple/40 hover:text-muneca-purple"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtrados.length === 0 && (
        <div className="rounded-xl border border-dashed border-black/15 px-4 py-10 text-center">
          <Users size={28} className="mx-auto text-black/20" />
          <p className="font-display mt-3 text-base uppercase tracking-wide text-muneca-black/70">
            {equipos.length === 0 ? "Aún no hay equipos inscritos" : "Ningún equipo coincide"}
          </p>
          <p className="mt-1 text-sm text-muneca-black/50">
            {equipos.length === 0
              ? "Cuando los equipos se inscriban al torneo, aparecerán aquí para que puedas gestionarlos fácilmente."
              : "Prueba con otra búsqueda o quita algún filtro."}
          </p>
        </div>
      )}

      {filtrados.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs font-semibold uppercase tracking-wide text-black/40">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Nombre del equipo</th>
                <th className="px-4 py-3">Capitán</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => {
                const expandido = expandidoId === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 text-muneca-black/50">{e.orden_inscripcion ?? "—"}</td>
                      <td className="px-4 py-3">
                        {e.escudo_url ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/[0.02]">
                            <Image
                              src={e.escudo_url}
                              alt={e.nombre_equipo}
                              width={32}
                              height={32}
                              className="h-full w-full rounded-full object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-xs font-bold text-black/30">
                            {e.nombre_equipo.slice(0, 1)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-muneca-black">{e.nombre_equipo}</td>
                      <td className="px-4 py-3 text-muneca-black/70">{e.delegadoNombre || "—"}</td>
                      <td className="px-4 py-3 text-muneca-black/60">{e.delegadoCorreo ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ESTADO_EQUIPO_CLASE[e.estado_inscripcion] ?? "bg-black/5 text-muneca-black/50"
                          }`}
                        >
                          {ESTADO_EQUIPO_LABEL[e.estado_inscripcion] ?? e.estado_inscripcion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muneca-black/70">
                        {e.montoTotal > 0 ? (
                          <>
                            {formatCOP(e.montoPagado)}{" "}
                            <span className="text-muneca-black/40">de {formatCOP(e.montoTotal)}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/equipos/${e.id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver perfil público"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muneca-black/50 transition-colors hover:bg-sky-100 hover:text-sky-700"
                          >
                            <Eye size={15} />
                          </a>
                          {e.cuotas.length > 0 && (
                            <button
                              type="button"
                              title="Ver cuotas"
                              onClick={() => setExpandidoId(expandido ? null : e.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muneca-black/50 transition-colors hover:bg-muneca-purple/10 hover:text-muneca-purple"
                            >
                              <ChevronDown size={15} className={`transition-transform ${expandido ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandido && (
                      <tr className="border-b border-black/5 bg-black/[0.015] last:border-0">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-muneca-black/40">
                              Inscrito el {formatFecha(e.created_at)}
                            </p>
                            <ReenviarRegistroForm teamId={e.id} />
                          </div>
                          <div className="mt-3 divide-y divide-black/10 rounded-lg border border-black/10">
                            {e.cuotas.map((cuota) => (
                              <div
                                key={cuota.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                              >
                                <div className="text-sm">
                                  <span className="font-semibold text-muneca-black">
                                    Partida {cuota.numero_cuota}
                                  </span>{" "}
                                  <span className="text-muneca-black/60">
                                    — {formatCOP(Number(cuota.monto))} · vence {formatFecha(cuota.fecha_limite)}
                                  </span>
                                  {cuota.estado === "pagada" && cuota.fecha_pago && (
                                    <span className="ml-2 text-xs text-muneca-black/40">
                                      pagada el {formatFecha(cuota.fecha_pago)}
                                      {cuota.referencia_wompi ? ` · ref. ${cuota.referencia_wompi}` : ""}
                                    </span>
                                  )}
                                  {cuota.estado !== "pagada" && cuota.pago_reportado_at && (
                                    <div className="mt-1 text-xs font-semibold text-muneca-purple">
                                      💜 Reportó transferencia el{" "}
                                      {new Date(cuota.pago_reportado_at).toLocaleString("es-CO", {
                                        timeZone: "America/Bogota",
                                      })}
                                      {cuota.comprobante_url && (
                                        <>
                                          {" · "}
                                          <a href={cuota.comprobante_url} target="_blank" rel="noreferrer" className="underline">
                                            Ver comprobante
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      ESTADO_CUOTA_CLASE[cuota.estado] ?? "bg-black/5 text-muneca-black/50"
                                    }`}
                                  >
                                    {ESTADO_CUOTA_LABEL[cuota.estado] ?? cuota.estado}
                                  </span>
                                  {cuota.estado !== "pagada" && (
                                    <>
                                      <ReenviarRecordatorioForm cuotaId={cuota.id} />
                                      <MarcarPagadaForm cuotaId={cuota.id} />
                                    </>
                                  )}
                                  {cuota.estado === "pagada" && <ReenviarConfirmacionForm cuotaId={cuota.id} />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
