"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trophy } from "@phosphor-icons/react/dist/ssr";
import { TeamCrest } from "@/components/team-crest";
import type { EstadoEnVivoHome, PartidoEnVivo, ProximoPartidoResumen } from "@/lib/home/en-vivo";

const INTERVALO_MS = 15_000;
const DURACION_TOAST_MS = 6_000;
const COLS = ["Pos", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"];

function minutosTranscurridos(horaInicioReal: string | null): number | null {
  if (!horaInicioReal) return null;
  const min = Math.floor((Date.now() - new Date(horaInicioReal).getTime()) / 60000);
  return min < 0 ? 0 : min;
}

function EquipoColumna({ nombre, escudoUrl }: { nombre: string; escudoUrl: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <TeamCrest url={escudoUrl} size="md" />
      <span className="line-clamp-2 text-sm font-semibold leading-tight text-white">{nombre}</span>
    </div>
  );
}

function TarjetaPartidoEnVivo({ partido, mostrarGol }: { partido: PartidoEnVivo; mostrarGol: boolean }) {
  const minuto = minutosTranscurridos(partido.horaInicioReal);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="flex items-center justify-between bg-gradient-to-r from-muneca-purple-dark to-muneca-black px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wide text-white">
          {partido.groupLetra ? `Grupo ${partido.groupLetra}` : partido.fase}
        </span>
        <span className="text-xs text-white/60">
          Jornada {partido.jornada} · Cancha {partido.cancha}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <EquipoColumna nombre={partido.equipoLocal.nombre} escudoUrl={partido.equipoLocal.escudoUrl} />

          <div className="flex shrink-0 flex-col items-center gap-1.5 px-2">
            <span className="font-display text-3xl text-white sm:text-4xl">
              {partido.marcadorLocal} - {partido.marcadorVisitante}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-300">
              {partido.estado === "entretiempo" ? (
                "Entretiempo"
              ) : (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                  {minuto ?? 0}&apos;
                </>
              )}
            </span>
          </div>

          <EquipoColumna nombre={partido.equipoVisitante.nombre} escudoUrl={partido.equipoVisitante.escudoUrl} />
        </div>

        <div
          className={`grid overflow-hidden transition-all duration-500 ${
            mostrarGol && partido.ultimoGol ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <p className="rounded-lg bg-muneca-yellow/15 px-3 py-2 text-center text-sm font-bold text-muneca-yellow">
              ⚽ ¡GOL! {partido.ultimoGol?.equipoNombre}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TarjetaProximoPartido({ partido }: { partido: ProximoPartidoResumen }) {
  const fecha = new Date(partido.fechaHoraProgramada);
  const fechaLabel = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Bogota",
  }).format(fecha);
  const horaLabel = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(fecha);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="flex items-center justify-between bg-gradient-to-r from-muneca-purple-dark to-muneca-black px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wide text-white">
          {partido.groupLetra ? `Grupo ${partido.groupLetra}` : partido.fase}
        </span>
        <span className="text-xs text-white/60">
          Jornada {partido.jornada} · Cancha {partido.cancha}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <EquipoColumna nombre={partido.equipoLocal.nombre} escudoUrl={partido.equipoLocal.escudoUrl} />
          <span className="font-display shrink-0 px-2 text-lg text-white/40">VS</span>
          <EquipoColumna nombre={partido.equipoVisitante.nombre} escudoUrl={partido.equipoVisitante.escudoUrl} />
        </div>

        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-white/50">
          {fechaLabel} · {horaLabel}
        </p>

        <Link
          href={`/partidos/${partido.matchId}`}
          className="mt-4 block rounded-md bg-muneca-yellow py-2 text-center text-xs font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02]"
        >
          Ver partido
        </Link>
      </div>
    </div>
  );
}

function TablaGrupo({ tabla }: { tabla: EstadoEnVivoHome["tablas"][number] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
          Grupo {tabla.letra}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[380px] text-xs sm:text-sm">
          <thead>
            <tr className="text-white/40">
              {COLS.map((col) => (
                <th key={col} className="px-2 py-2 text-left font-semibold uppercase tracking-wide first:pl-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabla.filas.map((fila, i) => {
              const esLider = i === 0;
              return (
                <tr
                  key={fila.teamId}
                  className={`border-t border-white/5 ${esLider ? "bg-muneca-yellow/10" : ""}`}
                >
                  <td className="px-2 py-2 pl-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        esLider ? "bg-muneca-yellow text-muneca-black" : "bg-white/10 text-white/70"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <TeamCrest url={fila.escudoUrl} size="xs" />
                      <span className="line-clamp-1 font-semibold text-white">{fila.nombreEquipo}</span>
                      {esLider && <Trophy size={13} weight="fill" className="shrink-0 text-muneca-yellow" />}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-white/60">{fila.pj}</td>
                  <td className="px-2 py-2 text-emerald-400">{fila.pg}</td>
                  <td className="px-2 py-2 text-white/50">{fila.pe}</td>
                  <td className="px-2 py-2 text-rose-400">{fila.pp}</td>
                  <td className="px-2 py-2 text-white/60">{fila.gf}</td>
                  <td className="px-2 py-2 text-white/60">{fila.gc}</td>
                  <td
                    className={`px-2 py-2 font-semibold ${
                      fila.dg > 0 ? "text-emerald-400" : fila.dg < 0 ? "text-rose-400" : "text-white/50"
                    }`}
                  >
                    {fila.dg > 0 ? `+${fila.dg}` : fila.dg}
                  </td>
                  <td className="px-2 py-2">
                    <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-muneca-purple px-1.5 py-0.5 text-xs font-bold text-white">
                      {fila.pts}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PartidosEnVivoClient({ inicial }: { inicial: EstadoEnVivoHome }) {
  const [estado, setEstado] = useState(inicial);
  const [golesVisibles, setGolesVisibles] = useState<Record<string, boolean>>({});
  const ultimosGolIds = useRef<Map<string, string>>(
    new Map(
      inicial.enVivo.filter((p) => p.ultimoGol).map((p) => [p.matchId, p.ultimoGol!.eventoId])
    )
  );
  const primerPoll = useRef(true);

  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch("/api/home/en-vivo", { cache: "no-store" });
        if (!res.ok) return;
        const nuevo: EstadoEnVivoHome = await res.json();

        // Detecta goles nuevos comparando el último evento de cada partido
        // contra el que se vio en el sondeo anterior — sin guardar nada
        // nuevo en la base de datos.
        if (!primerPoll.current) {
          for (const p of nuevo.enVivo) {
            if (!p.ultimoGol) continue;
            const anterior = ultimosGolIds.current.get(p.matchId);
            if (anterior !== p.ultimoGol.eventoId) {
              setGolesVisibles((prev) => ({ ...prev, [p.matchId]: true }));
              setTimeout(() => {
                setGolesVisibles((prev) => ({ ...prev, [p.matchId]: false }));
              }, DURACION_TOAST_MS);
            }
          }
        }
        primerPoll.current = false;
        ultimosGolIds.current = new Map(
          nuevo.enVivo.filter((p) => p.ultimoGol).map((p) => [p.matchId, p.ultimoGol!.eventoId])
        );

        setEstado(nuevo);
      } catch {
        // Sondeo silencioso — si falla un intento, se reintenta en el
        // siguiente ciclo sin romper la sección.
      }
    }, INTERVALO_MS);

    return () => clearInterval(intervalo);
  }, []);

  const hayEnVivo = estado.enVivo.length > 0;
  const hayProximos = estado.proximosPartidos.length > 0;
  const vacio = !hayEnVivo && !hayProximos && estado.tablas.length === 0;

  return (
    <section id="partidos-en-vivo" className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
              {hayEnVivo ? "Partidos en vivo" : "Próximos partidos"}
            </p>
            <p className="mt-1 pl-3 text-xs text-white/50">
              {hayEnVivo
                ? "Sigue aquí los partidos que se están jugando ahora"
                : "No hay partidos en juego ahora mismo — estos son los próximos que se van a jugar"}
            </p>
          </div>
          {hayEnVivo && (
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
              {estado.enVivo.length} {estado.enVivo.length === 1 ? "partido en vivo" : "partidos en vivo"}
            </span>
          )}
        </div>

        {vacio ? (
          <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <p className="font-display text-2xl text-white sm:text-3xl">
              Próximamente conocerás las posiciones del torneo.
            </p>
          </div>
        ) : (
          <>
            {hayEnVivo && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {estado.enVivo.map((p) => (
                  <TarjetaPartidoEnVivo key={p.matchId} partido={p} mostrarGol={Boolean(golesVisibles[p.matchId])} />
                ))}
              </div>
            )}

            {!hayEnVivo && hayProximos && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {estado.proximosPartidos.map((p) => (
                  <TarjetaProximoPartido key={p.matchId} partido={p} />
                ))}
              </div>
            )}

            {estado.tablas.length > 0 && (
              <>
                <p className="mt-10 border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
                  Tablas de posiciones
                </p>
                <p className="mt-1 pl-3 text-xs text-white/50">
                  {hayEnVivo
                    ? "Grupos de los partidos en juego"
                    : "Grupos de los próximos partidos"}{" "}
                  · Presentada por [Patrocinador]
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {estado.tablas.map((t) => (
                    <TablaGrupo key={t.groupId} tabla={t} />
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 text-right">
              <Link
                href="/posiciones"
                className="text-xs font-bold text-white/70 hover:text-muneca-yellow"
              >
                Ver tabla completa →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
