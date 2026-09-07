export function ProximosPartidos() {
  return (
    <section id="partidos" className="bg-muneca-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
              Próximos partidos
            </p>
            <p className="mt-1 pl-3 text-sm text-muneca-black/60">
              Vive cada jornada.
            </p>
          </div>
          <a
            href="#"
            className="rounded-md border border-muneca-purple px-4 py-2 text-xs font-bold uppercase text-muneca-purple hover:bg-muneca-purple hover:text-muneca-white"
          >
            Ver calendario completo
          </a>
        </div>

        {/* TODO: reemplazar por los partidos reales cuando el calendario del
            torneo quede confirmado y esta sección se alimente desde la base
            de datos. Mientras tanto se deja un mensaje centrado en vez de
            partidos de ejemplo. */}
        <div className="mt-8 rounded-xl border border-dashed border-muneca-purple/30 bg-black/[0.02] px-6 py-16 text-center">
          <p className="font-display text-2xl text-muneca-black sm:text-3xl">
            Acá vas a ver toda la programación
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muneca-black/60">
            Los partidos se publicarán aquí apenas se confirme el calendario del torneo.
          </p>
        </div>
      </div>
    </section>
  );
}
