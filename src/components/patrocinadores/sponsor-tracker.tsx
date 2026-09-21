"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";

type SponsorTrackerProps = {
  sponsorId: string;
  sponsorNombre: string;
  nivel: string;
  slot: string;
  children: React.ReactNode;
};

/**
 * Instrumentación de patrocinadores con Google Analytics 4 (2026-09-21, a
 * petición de Fernando: aprovechar el GA que ya se integró en todo el sitio
 * en vez de construir un sistema de tracking propio en Supabase).
 *
 * Envuelve el logo/link que ya renderiza `sponsor-slot.tsx` sin tocar su
 * apariencia (`display: contents` no genera caja propia) y dispara dos
 * eventos personalizados vía `sendGAEvent`:
 *
 *   - `sponsor_impression`: al montarse — la página ya renderizó ese
 *     espacio, cuenta como "se mostró" (no usa IntersectionObserver;
 *     suficiente para el objetivo de reportarle exposición a cada marca,
 *     ver conversación con Fernando).
 *   - `sponsor_click`: al hacer clic en el logo/enlace.
 *
 * Se ve en Google Analytics → Informes → Interacción → Eventos, o armando
 * un informe "Explorar" con desglose por `sponsor_nombre` y `slot`.
 */
export function SponsorTracker({
  sponsorId,
  sponsorNombre,
  nivel,
  slot,
  children,
}: SponsorTrackerProps) {
  useEffect(() => {
    sendGAEvent("event", "sponsor_impression", {
      sponsor_id: sponsorId,
      sponsor_nombre: sponsorNombre,
      sponsor_nivel: nivel,
      slot,
    });
    // Solo una vez al montar — una impresión por carga de página, no una
    // por cada re-render del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    sendGAEvent("event", "sponsor_click", {
      sponsor_id: sponsorId,
      sponsor_nombre: sponsorNombre,
      sponsor_nivel: nivel,
      slot,
    });
  };

  return (
    <span onClick={handleClick} className="contents">
      {children}
    </span>
  );
}
