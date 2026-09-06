import { patrocinadoresPlaceholder } from "@/lib/mock-data";

export function Patrocinadores() {
  return (
    <section id="patrocinadores" className="bg-black/[0.02]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
          Patrocinadores
        </p>
        <p className="mt-1 pl-3 text-xs text-muneca-black/50">
          Ellos hacen esta Copa posible.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {patrocinadoresPlaceholder.map((nombre) => (
            <div
              key={nombre}
              className="flex h-14 w-36 items-center justify-center rounded-lg border border-dashed border-black/15 bg-muneca-white text-xs font-semibold uppercase text-muneca-black/40"
            >
              {nombre}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muneca-black/40">
          Espacios reservados — se reemplazan por logos reales una vez cerrados los acuerdos de patrocinio.
        </p>
      </div>
    </section>
  );
}
