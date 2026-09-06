import { estadisticasDestacadas } from "@/lib/mock-data";

const CARDS = [
  { icon: "⚽", label: "Goleadores", ...estadisticasDestacadas.goleador, cta: "Ver ranking" },
  { icon: "🧤", label: "Mejores arqueros", ...estadisticasDestacadas.arquero, cta: "Ver ranking" },
  { icon: "⭐", label: "MVP de la jornada", ...estadisticasDestacadas.mvp, cta: "Ver más" },
];

export function EstadisticasDestacadas() {
  return (
    <section id="estadisticas" className="bg-muneca-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
          Estadísticas destacadas
        </p>
        <p className="mt-1 pl-3 text-xs text-muneca-black/50">
          El talento también cuenta.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-xl border border-black/10 p-4"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muneca-purple/10 text-xl">
                {card.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muneca-black/50">
                  {card.label}
                </p>
                <p className="truncate font-semibold">{card.nombre}</p>
                <p className="text-xs text-muneca-black/50">{card.equipo}</p>
                <p className="text-xs font-bold text-muneca-purple">{card.valor}</p>
                <a href="#" className="mt-1 inline-block text-xs font-bold text-muneca-black/70 hover:text-muneca-purple">
                  {card.cta} →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
