"use client";

import { useState } from "react";
import Link from "next/link";
import { TeamCrest } from "@/components/team-crest";

export type PartidoCalendario = {
  id: string;
  cancha: number;
  fecha: string; // ISO
  estado: string;
  local: { nombre_equipo: string; escudo_url: string | null } | null;
  visitante: { nombre_equipo: string; escudo_url: string | null } | null;
};

export type DiaData = {
  key: string; // YYYY-MM-DD (Bogotá)
  label: string; // "Jueves 11 de septiembre"
  partidos: PartidoCalendario[];
};

export type JornadaData = {
  numero: number;
  rangoLabel: string;
  dias: DiaData[];
  totalPartidos: number;
  diasDeFutbol: number;
};

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  entretiempo: "Entretiempo",
  finalizado: "Finalizado",
  suspendido: "Suspendido",
};

const ESTADO_CLASE: Record<string, string> = {
  programado: "bg-white/10 text-white/70",
  en_curso: "bg-amber-400/20 text-amber-300",
  entretiempo: "bg-amber-400/20 text-amber-300",
  finalizado: "bg-emerald-500/15 text-emerald-300",
  suspendido: "bg-rose-500/20 text-rose-300",
};

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth={1.6} />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={1.6} />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoUbicacion() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function InfoPill({ icon, etiqueta, valor }: { icon: React.ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
      <span className="text-muneca-yellow">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">{etiqueta}</p>
        <p className="text-sm font-bold text-white">{valor}</p>
      </div>
    </div>
  );
}

/**
 * Calendario completo del torneo con pestañas por Jornada — mismo patrón
 * de pestañas que `PosicionesTabs`, pero agrupando por día (jueves/
 * viernes/sábado) dentro de cada jornada en vez de por grupo.
 */
export function CalendarioTabs({ jornadas }: { jornadas: JornadaData[] }) {
  const [activa, setActiva] = useState(jornadas[0]?.numero ?? 1);
  const jornada = jornadas.find((j) => j.numero === activa) ?? jornadas[0];

  function siguienteJornada() {
    const idx = jornadas.findIndex((j) => j.numero === activa);
    if (idx >= 0 && idx < jornadas.length - 1) setActiva(jornadas[idx + 1].numero);
  }

  if (!jornada) return null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          {jornadas.map((j) => {
            const activo = j.numero === jornada.numero;
            return (
              <button
                key={j.numero}
                type="button"
                onClick={() => setActiva(j.numero)}
                className={`shrink-0 rounded-xl border px-4 py-2 text-left transition-colors ${
                  activo
                    ? "border-muneca-purple bg-muneca-purple text-white"
                    : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
                }`}
              >
                <span className="block text-sm font-bold uppercase tracking-wide">Jornada {j.numero}</span>
                <span className={`block text-[11px] ${activo ? "text-white/70" : "text-white/35"}`}>
                  {j.rangoLabel}
                </span>
              </button>
            );
          })}
        </div>
        {jornadas.length > 1 && (
          <button
            type="button"
            onClick={siguienteJornada}
            aria-label="Siguiente jornada"
            className="hidden shrink-0 items-center justify-center rounded-full border border-white/10 p-2 text-white/50 transition-colors hover:border-white/25 hover:text-white sm:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muneca-purple/20 text-muneca-yellow">
              <IconoCalendario />
            </span>
            <div>
              <p className="font-display text-lg uppercase tracking-wide">Jornada {jornada.numero}</p>
              <p className="text-xs text-white/40">{jornada.rangoLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <InfoPill icon={<IconoCalendario />} etiqueta="Partidos" valor={String(jornada.totalPartidos)} />
            <InfoPill icon={<IconoReloj />} etiqueta="Días de fútbol" valor={String(jornada.diasDeFutbol)} />
            <InfoPill icon={<IconoUbicacion />} etiqueta="Sede" valor="Montería" />
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {jornada.dias.map((dia) => (
            <div key={dia.key}>
              <div className="flex items-center justify-between bg-white/[0.03] px-5 py-2.5 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">{dia.label}</p>
                <span className="rounded-full bg-muneca-purple/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muneca-yellow">
                  {dia.partidos.length} {dia.partidos.length === 1 ? "partido" : "partidos"}
                </span>
              </div>

              <div>
                {dia.partidos.map((p) => {
                  const hora = new Date(p.fecha).toLocaleTimeString("es-CO", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Bogota",
                  });
                  return (
                    <Link
                      key={p.id}
                      href={`/partidos/${p.id}`}
                      className="flex flex-wrap items-center gap-3 border-t border-white/5 px-5 py-3 transition-colors first:border-t-0 hover:bg-white/[0.04] sm:flex-nowrap sm:px-6"
                    >
                      <div className="flex w-full items-center gap-3 sm:w-auto">
                        <span className="w-14 shrink-0 text-sm font-semibold text-white/70">{hora}</span>
                        <span className="w-16 shrink-0 text-xs text-white/35">Cancha {p.cancha}</span>
                      </div>

                      <div className="flex flex-1 items-center justify-center gap-2 sm:gap-3">
                        <TeamCrest url={p.local?.escudo_url} size="xs" />
                        <span className="max-w-[100px] truncate text-sm font-semibold text-white sm:max-w-[170px]">
                          {p.local?.nombre_equipo ?? "Por definir"}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-white/30">VS</span>
                        <span className="max-w-[100px] truncate text-sm font-semibold text-white sm:max-w-[170px]">
                          {p.visitante?.nombre_equipo ?? "Por definir"}
                        </span>
                        <TeamCrest url={p.visitante?.escudo_url} size="xs" />
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          ESTADO_CLASE[p.estado] ?? "bg-white/10 text-white/60"
                        }`}
                      >
                        {ESTADO_LABEL[p.estado] ?? p.estado}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
