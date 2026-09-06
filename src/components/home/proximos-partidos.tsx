import { proximosPartidos } from "@/lib/mock-data";

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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proximosPartidos.map((partido) => (
            <div
              key={partido.id}
              className="rounded-xl border border-black/10 bg-black/[0.02] p-5 text-center"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-black/60">
                {partido.dia} · {partido.hora}
              </p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muneca-purple text-xs font-bold text-white">
                  {partido.equipoLocal.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-muneca-black/40">VS</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muneca-black text-xs font-bold text-white">
                  {partido.equipoVisitante.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold">
                {partido.equipoLocal} <span className="text-muneca-black/40">vs</span>{" "}
                {partido.equipoVisitante}
              </p>
              <p className="mt-1 text-xs text-muneca-black/50">📍 {partido.cancha}</p>
              <a
                href="#"
                className="mt-4 inline-block w-full rounded-md bg-muneca-yellow px-4 py-2 text-xs font-bold uppercase text-muneca-black"
              >
                Ver partido
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
