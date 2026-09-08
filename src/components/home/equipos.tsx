import Image from "next/image";
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

        {/* TODO: reemplazar escudo-dummy.png por el escudo real de cada
            equipo cuando los equipos confirmen su identidad. */}
        <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-10">
          {equipos.map((equipo) => (
            <div
              key={equipo.id}
              title={equipo.nombre}
              className="flex flex-col items-center gap-2 rounded-lg border border-black/10 bg-muneca-white px-2 py-3 shadow-sm"
            >
              <Image
                src="/brand/escudo-dummy.png"
                alt=""
                aria-hidden="true"
                width={1208}
                height={1283}
                className="h-12 w-12 object-contain"
              />
              <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-muneca-black/70">
                {equipo.nombre}
              </span>
            </div>
          ))}
          <a
            href="#"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muneca-purple/50 px-2 py-3 text-muneca-purple"
          >
            <span className="text-xl">→</span>
            <span className="text-center text-[11px] font-semibold leading-tight">
              Ver todos
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
