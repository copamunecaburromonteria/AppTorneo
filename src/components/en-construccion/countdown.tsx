"use client";

import { useEffect, useState } from "react";

type Restante = { dias: number; horas: number; minutos: number; segundos: number };

function calcularRestante(fechaMetaMs: number): Restante {
  const diff = Math.max(0, fechaMetaMs - Date.now());
  return {
    dias: Math.floor(diff / 86_400_000),
    horas: Math.floor((diff % 86_400_000) / 3_600_000),
    minutos: Math.floor((diff % 3_600_000) / 60_000),
    segundos: Math.floor((diff % 60_000) / 1_000),
  };
}

const SEGMENTOS: { clave: keyof Restante; label: string }[] = [
  { clave: "dias", label: "Días" },
  { clave: "horas", label: "Horas" },
  { clave: "minutos", label: "Min" },
  { clave: "segundos", label: "Seg" },
];

/**
 * Contador regresivo de la página "en construcción" (`/en-construccion`).
 * `fechaMetaIso` viene de `torneo_config.modo_construccion_fecha_meta`,
 * editable desde /admin/construccion sin tocar código ni redeploy (pedido
 * de Fernando, 2026-10-17).
 *
 * - Sin fecha definida todavía (null): mensaje genérico sin números, para
 *   no mostrar un contador en 00:00:00:00 mientras no hay fecha real — la
 *   regla del proyecto es no inventar fechas que no se han confirmado.
 * - Arranca en `null` y recién calcula en `useEffect` (cliente) para que el
 *   primer render del servidor y el del cliente coincidan (sin esto,
 *   Date.now() en el servidor vs. en el navegador podría disparar un
 *   mismatch de hidratación) — se ve un placeholder "—" por una fracción de
 *   segundo y enseguida se llena con los números reales.
 * - Fecha ya cumplida: mensaje de cierre en vez de números en cero: apagar
 *   el modo construcción sigue siendo una acción manual desde el panel
 *   (el contador llegando a cero no cambia nada por sí solo).
 */
export function Countdown({ fechaMetaIso }: { fechaMetaIso: string | null }) {
  const fechaMetaMs = fechaMetaIso ? new Date(fechaMetaIso).getTime() : null;
  const [restante, setRestante] = useState<Restante | null>(null);

  useEffect(() => {
    if (!fechaMetaMs) return;
    const meta = fechaMetaMs;
    function tick() {
      setRestante(calcularRestante(meta));
    }
    // El primer cálculo se dispara en un timer (no sincrónicamente en el
    // cuerpo del efecto) para evitar el render en cascada que marca
    // react-hooks/set-state-in-effect — 0ms de todos modos se siente
    // inmediato para quien mira la página.
    const primerTick = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(primerTick);
      clearInterval(id);
    };
  }, [fechaMetaMs]);

  if (!fechaMetaMs) {
    return (
      <p className="text-center text-sm font-semibold uppercase tracking-wide text-white/60 sm:text-left">
        Muy pronto anunciamos la fecha. ¡No te lo pierdas!
      </p>
    );
  }

  const cumplida =
    restante != null &&
    restante.dias === 0 &&
    restante.horas === 0 &&
    restante.minutos === 0 &&
    restante.segundos === 0;

  if (cumplida) {
    return (
      <p className="text-center font-display text-xl uppercase tracking-wide text-muneca-yellow sm:text-left">
        ¡Ya casi! Estamos en los últimos ajustes.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muneca-yellow">Arrancamos en</p>
      <div className="flex gap-2.5 sm:gap-3">
        {SEGMENTOS.map(({ clave, label }) => (
          <div
            key={clave}
            className="flex w-16 flex-col items-center rounded-2xl border border-muneca-yellow/20 bg-muneca-black/60 py-3 shadow-[0_0_24px_-6px_rgba(255,217,0,0.25)] backdrop-blur-sm sm:w-[4.75rem] sm:py-4"
          >
            <span className="font-display text-3xl tabular-nums text-white sm:text-4xl">
              {restante != null ? String(restante[clave]).padStart(2, "0") : "—"}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
