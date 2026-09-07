import Image from "next/image";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-muneca-black text-muneca-white lg:min-h-[760px]"
    >
      <Image
        src="/brand/hero-photo-01.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_center]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-muneca-black via-muneca-black/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-muneca-black/95 via-muneca-black/55 to-transparent lg:via-muneca-black/35"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:items-start lg:py-28 lg:text-left">
        <h1 className="flex flex-col items-center lg:items-start">
          <span className="sr-only">Copa Muñeca e&apos;Burro Montería</span>
          <Image
            src="/brand/logo-full.png"
            alt=""
            aria-hidden="true"
            width={1983}
            height={793}
            priority
            className="h-auto w-72 object-contain sm:w-96 lg:w-[28rem]"
          />
        </h1>

        <p className="font-display mt-6 max-w-xl text-3xl leading-[1.05] text-muneca-yellow sm:text-4xl lg:text-5xl">
          AQUÍ TAMBIÉN SE JUEGA GRANDE
        </p>

        <p className="mt-4 max-w-lg text-base text-muneca-white/85 sm:text-lg">
          El torneo donde vienes a competir, no a jugar tres partidos y empacar.
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

        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-donkey-gray">
          32 equipos · Categoría Libre · Montería
        </p>
      </div>
    </section>
  );
}
