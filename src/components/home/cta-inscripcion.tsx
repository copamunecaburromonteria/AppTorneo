export function CtaInscripcion() {
  return (
    <section
      id="inscripcion"
      className="relative overflow-hidden bg-muneca-black text-muneca-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/brand/cta-bg.jpg')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-muneca-black/90 via-muneca-black/45 to-muneca-black/10"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl">
            ¿TU EQUIPO ESTÁ LISTO?
          </h2>
          <p className="mt-2 text-white/80">
            32 equipos. Una copa. Una oportunidad para hacer historia.
          </p>
          <a
            href="#"
            className="mt-6 inline-block rounded-md bg-muneca-yellow px-8 py-3 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
          >
            Inscribe tu equipo →
          </a>
        </div>

        <p className="font-display shrink-0 text-2xl leading-[1.05] text-muneca-yellow sm:text-3xl">
          AQUÍ TAMBIÉN
          <br />
          SE JUEGA GRANDE
        </p>
      </div>
    </section>
  );
}
