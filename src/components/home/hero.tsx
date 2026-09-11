"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function Hero() {
  const imgWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;

    // Respeta si la persona prefiere menos movimiento en pantalla.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    function actualizar() {
      const rect = el!.getBoundingClientRect();
      // Solo se mueve mientras el héroe está cerca del viewport — evita
      // trabajo de más cuando ya se hizo scroll mucho más abajo.
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const offset = Math.min(window.scrollY * 0.15, 200);
        el!.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(actualizar);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[640px] items-center overflow-hidden bg-muneca-black text-muneca-white lg:min-h-[820px]"
    >
      <div
        ref={imgWrapRef}
        aria-hidden="true"
        className="absolute -top-[220px] -bottom-[220px] left-0 right-0 will-change-transform"
      >
        <Image
          src="/brand/hero-stadium.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Toque opaco: oscurece la foto para que el logo y el texto se lean bien */}
      <div aria-hidden className="absolute inset-0 bg-muneca-black/45" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-muneca-black via-muneca-black/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-muneca-black/95 via-muneca-black/60 to-transparent sm:via-muneca-black/45"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-16 pt-32 text-center sm:items-start sm:px-6 sm:pt-28 sm:text-left lg:pt-24">
        <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl">
          <h1 className="flex flex-col items-center sm:items-start">
            <span className="sr-only">Copa Muñeca e&apos;Burro Montería</span>
            <Image
              src="/brand/logo-full.png"
              alt=""
              aria-hidden="true"
              width={1983}
              height={793}
              priority
              className="h-auto w-80 object-contain sm:w-[26rem] lg:w-[32rem]"
            />
          </h1>

          <p className="font-display mt-6 text-4xl leading-[1.05] text-muneca-yellow sm:text-5xl lg:text-6xl">
            AQUÍ TAMBIÉN SE JUEGA GRANDE
          </p>

          <p className="mt-5 max-w-xl text-lg text-muneca-white/85 sm:text-xl">
            El torneo donde vienes a competir, no a jugar tres partidos y empacar.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            <a
              href="/inscripcion"
              className="rounded-md bg-muneca-yellow px-8 py-4 text-base font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
            >
              Inscribe tu equipo →
            </a>
            <a
              href="#torneo"
              className="rounded-md border border-white/30 px-8 py-4 text-base font-bold uppercase text-muneca-white transition-colors hover:border-muneca-yellow hover:text-muneca-yellow"
            >
              Conoce el torneo →
            </a>
          </div>

          <p className="mt-7 text-base uppercase tracking-[0.2em] text-donkey-gray">
            24 equipos · Categoría Libre · Montería
          </p>
        </div>
      </div>
    </section>
  );
}
