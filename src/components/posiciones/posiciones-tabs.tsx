"use client";

import { useState } from "react";
import Link from "next/link";
import { TeamCrest } from "@/components/team-crest";

const COLS = ["Pos", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"];

/** Cuántos equipos por grupo clasifican a la fase eliminatoria (formato-torneo.md). */
const CLASIFICAN_POR_GRUPO = 4;

export type FilaTabla = {
  team_id: string;
  nombre_equipo: string;
  escudo_url: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

export type PartidoResumen = {
  id: string;
  cancha: number;
  fecha: string; // ISO
  local: { nombre_equipo: string; escudo_url: string | null } | null;
  visitante: { nombre_equipo: string; escudo_url: string | null } | null;
};

export type GrupoData = {
  id: string;
  letra: string;
  filas: FilaTabla[];
  proximaJornada: PartidoResumen[];
};

function StatCard({
  icono,
  etiqueta,
  fila,
  valor,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  fila: FilaTabla | null;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muneca-purple">
        {icono}
        <p className="text-xs font-bold uppercase tracking-wide text-muneca-black/50">
          {etiqueta}
        </p>
      </div>
      {fila ? (
        <div className="mt-3 flex items-center gap-2.5">
          <TeamCrest url={fila.escudo_url} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-muneca-black">
              {fila.nombre_equipo}
            </p>
            <p className="text-xs text-muneca-black/50">{valor}</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muneca-black/40">Sin datos todavía</p>
      )}
    </div>
  );
}

function iconoGoles() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.6} />
      <path d="M12 6.5 15.5 9l-1.3 4.2h-4.4L8.5 9 12 6.5Z" stroke="currentColor" strokeWidth={1.3} />
    </svg>
  );
}

function iconoDefensa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 2 4 5v6c0 5 3.4 8.7 8 9.9 4.6-1.2 8-4.9 8-9.9V5l-8-3Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconoDiferencia() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M4 18 9 9l4 5 7-11" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function iconoLider() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 6h14l-1.4 8.4a3 3 0 0 1-3 2.6h-5.2a3 3 0 0 1-3-2.6L5 6Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M9 20h6M12 17v3" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function PosicionesTabs({ grupos }: { grupos: GrupoData[] }) {
  const [activoId, setActivoId] = useState(grupos[0]?.id ?? "");
  const grupo = grupos.find((g) => g.id === activoId) ?? grupos[0];

  if (!grupo) {
    return (
      <p className="text-center text-sm text-muneca-black/40">
        Todavía no hay grupos configurados.
      </p>
    );
  }

  const masGoles = grupo.filas.length
    ? grupo.filas.slice().sort((a, b) => b.gf - a.gf)[0]
    : null;
  const mejorDefensa = grupo.filas.length
    ? grupo.filas.slice().sort((a, b) => a.gc - b.gc)[0]
    : null;
  const mejorDiferencia = grupo.filas.length
    ? grupo.filas.slice().sort((a, b) => b.dg - a.dg)[0]
    : null;
  const lider = grupo.filas[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {grupos.map((g) => {
          const activo = g.id === grupo.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActivoId(g.id)}
              className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                activo
                  ? "bg-muneca-purple text-white shadow-sm"
                  : "border border-black/15 text-muneca-black/60 hover:border-muneca-purple/40 hover:text-muneca-purple"
              }`}
            >
              Grupo {g.letra}
            </button>
          );
        })}
      </div>

      <div>
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-muneca-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-muneca-purple-dark to-muneca-black text-muneca-white">
                {COLS.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide first:pl-4"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupo.filas.map((fila, i) => {
                const clasifica = i < CLASIFICAN_POR_GRUPO;
                return (
                  <tr
                    key={fila.team_id}
                    className={`border-b border-black/5 transition-colors last:border-0 hover:bg-muneca-purple/5 ${
                      clasifica
                        ? "bg-muneca-yellow/10"
                        : i % 2 === 0
                          ? "bg-muneca-white"
                          : "bg-muneca-purple/[0.03]"
                    }`}
                  >
                    <td className="px-3 py-3 pl-4">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          clasifica
                            ? "bg-muneca-yellow text-muneca-black"
                            : "bg-muneca-purple text-white"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/equipos/${fila.team_id}`}
                        className="flex items-center gap-2 hover:text-muneca-purple"
                      >
                        <TeamCrest url={fila.escudo_url} size="sm" />
                        <span className="font-semibold text-muneca-black">
                          {fila.nombre_equipo}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muneca-black/70">{fila.pj}</td>
                    <td className="px-3 py-3 font-semibold text-emerald-600">{fila.pg}</td>
                    <td className="px-3 py-3 text-muneca-black/50">{fila.pe}</td>
                    <td className="px-3 py-3 font-semibold text-rose-600">{fila.pp}</td>
                    <td className="px-3 py-3 text-muneca-black/70">{fila.gf}</td>
                    <td className="px-3 py-3 text-muneca-black/70">{fila.gc}</td>
                    <td
                      className={`px-3 py-3 font-semibold ${
                        fila.dg > 0
                          ? "text-emerald-600"
                          : fila.dg < 0
                            ? "text-rose-600"
                            : "text-muneca-black/50"
                      }`}
                    >
                      {fila.dg > 0 ? `+${fila.dg}` : fila.dg}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-muneca-purple px-2 py-1 text-xs font-bold text-white">
                        {fila.pts}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {grupo.filas.length === 0 && (
                <tr>
                  <td colSpan={COLS.length} className="px-4 py-8 text-center text-sm text-muneca-black/40">
                    Todavía no hay equipos asignados a este grupo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muneca-black/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muneca-yellow" /> Clasifica a eliminatorias
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muneca-purple" /> Fuera de clasificación
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg uppercase tracking-wide text-muneca-black">
            Estadísticas del grupo
          </p>
          <span className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
            Grupo {grupo.letra}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icono={iconoGoles()} etiqueta="Más goles" fila={masGoles} valor={masGoles ? `${masGoles.gf} goles` : ""} />
          <StatCard
            icono={iconoDefensa()}
            etiqueta="Mejor defensa"
            fila={mejorDefensa}
            valor={mejorDefensa ? `${mejorDefensa.gc} goles recibidos` : ""}
          />
          <StatCard
            icono={iconoDiferencia()}
            etiqueta="Mejor diferencia"
            fila={mejorDiferencia}
            valor={mejorDiferencia ? (mejorDiferencia.dg > 0 ? `+${mejorDiferencia.dg}` : `${mejorDiferencia.dg}`) : ""}
          />
          <StatCard icono={iconoLider()} etiqueta="Líder del grupo" fila={lider} valor={lider ? `${lider.pts} puntos` : ""} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg uppercase tracking-wide text-muneca-black">
            Próxima jornada
          </p>
          <span className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
            Grupo {grupo.letra}
          </span>
        </div>

        {grupo.proximaJornada.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-muneca-black/50">
            Todavía no hay partidos programados para este grupo.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {grupo.proximaJornada.map((p) => {
              const fecha = new Date(p.fecha);
              return (
                <div key={p.id} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                  <p className="text-center text-xs font-bold uppercase tracking-wide text-muneca-purple">
                    {fecha.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-center text-xs text-muneca-black/50">
                    {fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                      <TeamCrest url={p.local?.escudo_url} size="sm" />
                      <span className="line-clamp-2 text-xs font-semibold leading-tight text-muneca-black">
                        {p.local?.nombre_equipo ?? "Por definir"}
                      </span>
                    </div>
                    <span className="font-display text-lg text-muneca-black/40">VS</span>
                    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                      <TeamCrest url={p.visitante?.escudo_url} size="sm" />
                      <span className="line-clamp-2 text-xs font-semibold leading-tight text-muneca-black">
                        {p.visitante?.nombre_equipo ?? "Por definir"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-xs text-muneca-black/50">📍 Cancha {p.cancha}</p>

                  <Link
                    href={`/partidos/${p.id}`}
                    className="mt-4 block rounded-md bg-muneca-yellow py-2 text-center text-xs font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02]"
                  >
                    Ver partido
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
