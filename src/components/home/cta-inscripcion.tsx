export function CtaInscripcion() {
  return (
    <section
      id="inscripcion"
      className="relative overflow-hidden bg-muneca-purple-dark text-muneca-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
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
    </section>
  );
}
