"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  image: string;
  alt: string;
  kicker: string;
  headline: string;
  subheadline: string;
  ctaSecondariaLabel: string;
  ctaSecondariaHref: string;
};

/**
 * Slider del hero — 2 slides con las fotos que trajo Fernando (jugador +
 * mascota). El logo, el botón principal ("Inscribe tu equipo") y la línea
 * de datos del torneo quedan fijos (no cambian entre slides) porque son
 * información constante, no parte del mensaje promocional; lo que rota es
 * la foto de fondo, el kicker, el titular, el subtítulo y el botón
 * secundario de cada slide.
 */
const SLIDES: Slide[] = [
  {
    id: "jugador",
    image: "/brand/hero-slide-jugador.jpg",
    alt: "Jugador de la Copa Muñeca e'Burro de espaldas, balón bajo el brazo, bajo las luces de la cancha",
    kicker: "32 equipos · categoría libre",
    headline: "AQUÍ TAMBIÉN SE JUEGA GRANDE",
    subheadline: "El torneo donde vienes a competir, no a jugar tres partidos y empacar.",
    ctaSecondariaLabel: "Conoce el torneo →",
    ctaSecondariaHref: "#torneo",
  },
  {
    id: "mascota",
    image: "/brand/hero-slide-mascota.jpg",
    alt: "Mascota de la Copa Muñeca e'Burro, con camiseta morada y balón, en la cancha",
    kicker: "montería también vive el fútbol",
    headline: "MÁS QUE UN TORNEO, ES EL PARCHE",
    subheadline: "Familia, amigos y barrio alrededor de la cancha — fútbol, gente buena.",
    ctaSecondariaLabel: "Ver calendario →",
    ctaSecondariaHref: "/partidos",
  },
];

const INTERVALO_MS = 6500;

export function Hero() {
  const [activo, setActivo] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !autoplay || SLIDES.length < 2) return;

    timerRef.current = setInterval(() => {
      setActivo((i) => (i + 1) % SLIDES.length);
    }, INTERVALO_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay]);

  function irA(i: number) {
    setActivo(i);
    setAutoplay(false); // el usuario tomó el control — no lo interrumpimos más
  }

  const slide = SLIDES[activo];

  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[640px] items-center overflow-hidden bg-muneca-black text-muneca-white lg:min-h-[820px]"
    >
      {SLIDES.map((s, i) => (
        <Image
          key={s.id}
          src={s.image}
          alt=""
          aria-hidden="true"
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover object-[68%_center] transition-opacity duration-700 ease-out ${
            i === activo ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-muneca-black via-muneca-black/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-muneca-black/95 via-muneca-black/60 to-transparent sm:via-muneca-black/45"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-20 pt-32 text-center sm:items-start sm:px-6 sm:pt-28 sm:text-left lg:pt-24">
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

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-white/70 sm:text-sm">
            {slide.kicker}
          </p>

          <p className="font-display mt-2 text-4xl leading-[1.05] text-muneca-yellow sm:text-5xl lg:text-6xl">
            {slide.headline}
          </p>

          <p className="mt-5 max-w-xl text-lg text-muneca-white/85 sm:text-xl">{slide.subheadline}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            <a
              href="/inscripcion"
              className="rounded-md bg-muneca-yellow px-8 py-4 text-base font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
            >
              Inscribe tu equipo →
            </a>
            <a
              href={slide.ctaSecondariaHref}
              className="rounded-md border border-white/30 px-8 py-4 text-base font-bold uppercase text-muneca-white transition-colors hover:border-muneca-yellow hover:text-muneca-yellow"
            >
              {slide.ctaSecondariaLabel}
            </a>
          </div>

          <p className="mt-7 text-base uppercase tracking-[0.2em] text-donkey-gray">
            24 equipos · Categoría Libre · Montería
          </p>
        </div>
      </div>

      {SLIDES.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 sm:justify-start sm:px-6">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ver slide ${i + 1} de ${SLIDES.length}: ${s.headline}`}
                aria-current={i === activo}
                className={`h-2 rounded-full transition-all ${
                  i === activo ? "w-8 bg-muneca-yellow" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => irA((activo - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Slide anterior"
            className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50 sm:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => irA((activo + 1) % SLIDES.length)}
            aria-label="Siguiente slide"
            className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50 sm:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
