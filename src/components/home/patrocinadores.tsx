import { patrocinadoresPlaceholder } from "@/lib/mock-data";
import { patrocinadoresReales } from "@/lib/patrocinadores-reales";
import { PatrocinadoresSlider } from "@/components/home/patrocinadores-slider";

export function Patrocinadores() {
  return (
    <section id="patrocinadores" className="bg-muneca-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          Patrocinadores
        </p>
        <p className="mt-1 pl-3 text-xs text-white/50">
          Ellos hacen esta Copa posible.
        </p>

        {patrocinadoresReales.length > 0 && (
          <PatrocinadoresSlider patrocinadores={patrocinadoresReales} />
        )}

        <p className="mt-6 pl-3 text-[11px] font-semibold uppercase tracking-wide text-white/30">
          Espacios disponibles
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {patrocinadoresPlaceholder.map((nombre) => (
            <div
              key={nombre}
              className="flex h-14 w-36 items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/5 text-xs font-semibold uppercase text-white/40"
            >
              {nombre}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">
          Espacios reservados — se reemplazan por logos reales una vez cerrados los acuerdos de patrocinio.
        </p>
      </div>
    </section>
  );
}
