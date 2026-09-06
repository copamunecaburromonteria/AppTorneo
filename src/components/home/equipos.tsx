import { equipos } from "@/lib/mock-data";

export function Equipos() {
  return (
    <section id="equipos" className="bg-black/[0.02]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
          Equipos participantes
        </p>
        <p className="mt-1 pl-3 text-xs text-muneca-black/50">
          32 historias, un mismo sueño.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          {equipos.map((equipo) => (
            <div
              key={equipo.id}
              title={equipo.nombre}
              className="flex h-16 w-16 items-center justify-center rounded-lg border border-black/10 bg-muneca-white text-sm font-bold text-muneca-purple shadow-sm"
            >
              {equipo.iniciales}
            </div>
          ))}
          <a
            href="#"
            className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-muneca-purple/50 text-muneca-purple"
          >
            →
          </a>
        </div>
      </div>
    </section>
  );
}
