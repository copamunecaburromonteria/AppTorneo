"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { NIVEL_LABEL, type PatrocinadorReal } from "@/lib/patrocinadores-reales";

const PASO_SCROLL = 260;

/**
 * Carrusel de logos de patrocinadores (2026-09-18, pedido de Fernando: "la
 * quiero así, centra en tipo slider"). Antes era una fila con flex-wrap que
 * simplemente partía en varias líneas — ahora es un track con scroll-snap
 * centrado por tarjeta, con flechas en desktop y swipe nativo en celular
 * (mobile-first, sin librería externa de carrusel).
 *
 * Cliente porque las flechas necesitan `scrollBy` sobre un ref; el fetch de
 * `patrocinadoresReales` sigue pasando por el server component
 * `Patrocinadores` (`patrocinadores.tsx`), que le pasa el arreglo ya listo.
 */
export function PatrocinadoresSlider({
  patrocinadores,
}: {
  patrocinadores: PatrocinadorReal[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function desplazar(direccion: 1 | -1) {
    trackRef.current?.scrollBy({ left: direccion * PASO_SCROLL, behavior: "smooth" });
  }

  // Con pocos logos no hace falta desplazar — las flechas solo estorban.
  const mostrarFlechas = patrocinadores.length > 4;

  return (
    <div className="relative mt-6">
      {mostrarFlechas && (
        <button
          type="button"
          onClick={() => desplazar(-1)}
          aria-label="Ver patrocinador anterior"
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-3 -translate-y-1/2 rounded-full border border-white/15 bg-muneca-black/80 p-2 text-white/70 backdrop-blur-sm transition-colors hover:border-muneca-yellow hover:text-muneca-yellow sm:flex"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
      )}

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory justify-start gap-4 overflow-x-auto scroll-smooth px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)",
        }}
      >
        {patrocinadores.map((p) => {
          const logo = (
            <Image
              src={p.logoUrl}
              alt={p.nombre}
              width={200}
              height={200}
              className="h-full w-full object-contain"
            />
          );
          return (
            <div
              key={p.logoUrl}
              className="flex w-36 shrink-0 snap-center flex-col items-center gap-2 sm:w-44"
            >
              <div className="flex h-24 w-full items-center justify-center rounded-xl bg-white/5 p-3 transition-transform hover:scale-[1.04] sm:h-28">
                {p.url ? (
                  <Link href={p.url} target="_blank" rel="noopener noreferrer" className="h-full w-full">
                    {logo}
                  </Link>
                ) : (
                  logo
                )}
              </div>
              <span className="text-center text-[10px] font-semibold uppercase tracking-wide text-white/40">
                {NIVEL_LABEL[p.nivel]}
              </span>
            </div>
          );
        })}
      </div>

      {mostrarFlechas && (
        <button
          type="button"
          onClick={() => desplazar(1)}
          aria-label="Ver siguiente patrocinador"
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-3 rounded-full border border-white/15 bg-muneca-black/80 p-2 text-white/70 backdrop-blur-sm transition-colors hover:border-muneca-yellow hover:text-muneca-yellow sm:flex"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      )}
    </div>
  );
}
