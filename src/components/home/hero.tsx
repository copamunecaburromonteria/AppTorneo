import Image from "next/image";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-muneca-black text-muneca-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-muneca-purple-dark/60 via-muneca-black to-muneca-black"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:py-24">
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-donkey-gray">
            Más que un torneo,{" "}
            <span className="text-muneca-yellow">es el parche.</span>
          </p>
          <h1 className="font-display mt-3 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            <span className="text-muneca-purple">COPA</span>
            <br />
            <span className="text-muneca-yellow">MUÑECA E&apos;BURRO</span>
          </h1>
          <p className="font-display mt-2 text-xl tracking-[0.3em] text-muneca-white/80">
            MONTERÍA
          </p>
          <p
            className="mt-4 text-2xl text-muneca-white/90"
            style={{ fontFamily: "var(--font-accent-script)" }}
          >
            Fútbol. Gente buena.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <a
              href="#inscripcion"
              className="rounded-md bg-muneca-yellow px-6 py-3 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
            >
              Inscribe tu equipo →
            </a>
            <a
              href="#torneo"
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-bold uppercase text-muneca-white transition-colors hover:border-muneca-yellow hover:text-muneca-yellow"
            >
              Conoce el torneo →
            </a>
          </div>

          <p className="mt-6 text-sm text-donkey-gray">
            32 equipos · Categoría Libre · Montería
          </p>
        </div>

        <div className="flex flex-1 justify-center">
          <Image
            src="/brand/mascota-01.png"
            alt="Mascota Copa Muñeca e'Burro"
            width={420}
            height={420}
            priority
            className="h-auto w-64 object-contain drop-shadow-2xl sm:w-80 lg:w-96"
          />
        </div>
      </div>
    </section>
  );
}
