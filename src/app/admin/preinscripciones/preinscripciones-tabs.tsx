"use client";

import { useMemo, useState } from "react";
import { Search, Users, Clock } from "lucide-react";
import {
  armarLinkWhatsApp,
  mensajeWhatsAppInvitacionOficial,
  mensajeWhatsAppPreinscripcion,
} from "@/lib/whatsapp";
import {
  EliminarPreinscripcionForm,
  InvitarForm,
  ReenviarForm,
  ReenviarPreinscripcionForm,
  RevertirForm,
} from "@/app/admin/preinscripciones/preinscripcion-forms";
import { IconHeading } from "@/components/admin/icon-heading";

type Delegado = {
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  contacto_principal: string | null;
  contacto_alterno: string | null;
  whatsapp_notificaciones: string | null;
} | null;

export type EquipoPreinscrito = {
  id: string;
  nombre_equipo: string;
  orden_preinscripcion: number | null;
  fecha: string; // fecha_invitado o created_at, ya resuelta por el server
  delegado: Delegado;
};

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function filtrarPorBusqueda(lista: EquipoPreinscrito[], busqueda: string): EquipoPreinscrito[] {
  const q = busqueda.trim().toLowerCase();
  if (!q) return lista;
  return lista.filter(
    (e) =>
      e.nombre_equipo.toLowerCase().includes(q) ||
      [e.delegado?.nombre, e.delegado?.apellido].filter(Boolean).join(" ").toLowerCase().includes(q) ||
      (e.delegado?.correo ?? "").toLowerCase().includes(q)
  );
}

function TarjetaEquipo({
  equipo,
  tipoFecha,
  mensaje,
  acciones,
}: {
  equipo: EquipoPreinscrito;
  tipoFecha: "Invitado el" | "Preinscrito el";
  mensaje: string;
  acciones: React.ReactNode;
}) {
  const d = equipo.delegado;
  const numeroContacto = d?.whatsapp_notificaciones || d?.contacto_principal;
  const linkWhatsApp = armarLinkWhatsApp(numeroContacto, mensaje);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
            ● En fila
          </span>
          {equipo.orden_preinscripcion != null && (
            <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
              #{equipo.orden_preinscripcion}
            </span>
          )}
        </div>
        <p className="font-display mt-1 text-base uppercase tracking-wide text-muneca-black">
          {equipo.nombre_equipo}
        </p>
        <p className="text-sm text-muneca-black/60">
          {[d?.nombre, d?.apellido].filter(Boolean).join(" ") || "Delegado sin nombre"}
          {d?.correo ? ` · ${d.correo}` : ""}
        </p>
        {numeroContacto && <p className="text-xs text-muneca-black/40">{numeroContacto}</p>}
        <p className="text-xs text-muneca-black/40">
          {tipoFecha} {formatFecha(equipo.fecha)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {linkWhatsApp && (
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02]"
          >
            Enviar WhatsApp
          </a>
        )}
        {acciones}
      </div>
    </div>
  );
}

/**
 * Sub-pestañas "Invitados / Preinscritos / Historial" con búsqueda —
 * rediseño "más colorido" pedido por Fernando (2026-09-21) a partir de una
 * captura de referencia. La lógica de invitar/revertir/reenviar sigue
 * usando las mismas Server Actions de siempre; solo cambia la presentación
 * (antes las dos listas se mostraban siempre juntas, una debajo de la
 * otra — ahora se alternan con pestañas, como en la referencia).
 *
 * "Historial" queda como pestaña de catálogo sin datos todavía: no
 * inventamos qué cuenta como "historial" (equipos rechazados, revertidos,
 * etc.) sin que Fernando lo confirme — ver sección 36 del brief original
 * sobre no dar por cerrado algo que no se ha definido.
 */
export function PreinscripcionesTabs({
  invitados,
  preinscritos,
}: {
  invitados: EquipoPreinscrito[];
  preinscritos: EquipoPreinscrito[];
}) {
  const [tab, setTab] = useState<"invitados" | "preinscritos" | "historial">(
    preinscritos.length > 0 ? "preinscritos" : "invitados"
  );
  const [busqueda, setBusqueda] = useState("");

  const invitadosFiltrados = useMemo(() => filtrarPorBusqueda(invitados, busqueda), [invitados, busqueda]);
  const preinscritosFiltrados = useMemo(
    () => filtrarPorBusqueda(preinscritos, busqueda),
    [preinscritos, busqueda]
  );

  const TABS = [
    { id: "invitados" as const, label: "Invitados (esperando pago)", count: invitados.length },
    { id: "preinscritos" as const, label: "Preinscritos (en fila)", count: preinscritos.length },
    { id: "historial" as const, label: "Historial", count: null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-muneca-purple text-white"
                : "border border-black/15 text-muneca-black/70 hover:border-muneca-purple/40 hover:text-muneca-purple"
            }`}
          >
            {t.label}
            {t.count != null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  tab === t.id ? "bg-white/20 text-white" : "bg-black/5 text-black/50"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o teléfono..."
          className="w-full rounded-md border border-black/15 bg-white py-2 pl-9 pr-3 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20"
        />
      </div>

      {tab === "invitados" && (
        <section className="space-y-3">
          <IconHeading icon={Clock} color="purple">
            Invitados — esperando pago
          </IconHeading>
          <p className="text-sm text-muneca-black/60">
            Ya se les avisó — están completando la inscripción oficial en <code>/inscripcion</code>. Si
            uno se demora demasiado, puedes revertirlo para invitar al siguiente de la fila.
          </p>

          {invitadosFiltrados.length === 0 && (
            <p className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-muneca-black/50">
              {invitados.length === 0 ? "Nadie invitado por ahora." : "Nadie invitado coincide con la búsqueda."}
            </p>
          )}

          {invitadosFiltrados.length > 0 && (
            <div className="space-y-3">
              {invitadosFiltrados.map((equipo) => (
                <TarjetaEquipo
                  key={equipo.id}
                  equipo={equipo}
                  tipoFecha="Invitado el"
                  mensaje={mensajeWhatsAppInvitacionOficial({
                    nombreEquipo: equipo.nombre_equipo,
                    delegadoNombre: equipo.delegado?.nombre ?? "",
                    correo: equipo.delegado?.correo ?? "",
                  })}
                  acciones={
                    <>
                      <ReenviarForm teamId={equipo.id} />
                      <RevertirForm teamId={equipo.id} />
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "preinscritos" && (
        <section className="space-y-3">
          <IconHeading icon={Users} color="purple">
            Preinscritos — en fila
          </IconHeading>
          <p className="text-sm text-muneca-black/60">
            Todavía no se les ha invitado a completar la inscripción oficial.
          </p>

          {preinscritosFiltrados.length === 0 && (
            <p className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-muneca-black/50">
              {preinscritos.length === 0
                ? "Nadie preinscrito por ahora."
                : "Nadie preinscrito coincide con la búsqueda."}
            </p>
          )}

          {preinscritosFiltrados.length > 0 && (
            <div className="space-y-3">
              {preinscritosFiltrados.map((equipo) => (
                <TarjetaEquipo
                  key={equipo.id}
                  equipo={equipo}
                  tipoFecha="Preinscrito el"
                  mensaje={mensajeWhatsAppPreinscripcion({
                    nombreEquipo: equipo.nombre_equipo,
                    delegadoNombre: equipo.delegado?.nombre ?? "",
                  })}
                  acciones={
                    <>
                      <ReenviarPreinscripcionForm teamId={equipo.id} />
                      <InvitarForm teamId={equipo.id} />
                      <EliminarPreinscripcionForm teamId={equipo.id} nombreEquipo={equipo.nombre_equipo} />
                    </>
                  }
                />
              ))}
            </div>
          )}

          <div className="rounded-xl border border-muneca-purple/15 bg-muneca-purple/5 p-4 text-sm text-muneca-black/70">
            <span className="font-bold text-muneca-purple">Tip: </span>
            Puedes contactar a los equipos en orden de llegada para invitarlos a completar su
            inscripción. Si uno se demora demasiado, puedes reubicarlo o dejarlo en espera.
          </div>
        </section>
      )}

      {tab === "historial" && (
        <section className="space-y-3">
          <IconHeading icon={Clock} color="purple">
            Historial
          </IconHeading>
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-muneca-black/50">
            El historial de preinscripciones (revertidas, rechazadas o vencidas) todavía no está
            definido — se activa cuando confirmemos qué debe contar como &quot;historial&quot;.
          </p>
        </section>
      )}
    </div>
  );
}
