import Image from "next/image";
import Link from "next/link";
import { patrocinadoresPlaceholder } from "@/lib/mock-data";
import { patrocinadoresReales, NIVEL_LABEL } from "@/lib/patrocinadores-reales";

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
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {patrocinadoresReales.map((p) => {
              const logo = (
                <Image
                  src={p.logoUrl}
                  alt={p.nombre}
                  width={160}
                  height={160}
                  className="h-full w-full object-contain"
                />
              );
              return (
                <div key={p.logoUrl} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-white/5 p-2 sm:h-24 sm:w-36">
                    {p.url ? (
                      <Link href={p.url} target="_blank" rel="noopener noreferrer" className="h-full w-full">
                        {logo}
                      </Link>
                    ) : (
                      logo
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    {NIVEL_LABEL[p.nivel]}
                  </span>
                </div>
              );
            })}
          </div>
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
