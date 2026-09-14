import { estadisticasDestacadas } from "@/lib/mock-data";

const CARDS = [
  { icon: "⚽", label: "Goleadores", ...estadisticasDestacadas.goleador, cta: "Ver ranking" },
  { icon: "🧤", label: "Mejores arqueros", ...estadisticasDestacadas.arquero, cta: "Ver ranking" },
  { icon: "⭐", label: "MVP de la jornada", ...estadisticasDestacadas.mvp, cta: "Ver más" },
];

export function EstadisticasDestacadas() {
  return (
    <section id="estadisticas" className="bg-muneca-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          Estadísticas destacadas
        </p>
        <p className="mt-1 pl-3 text-xs text-white/50">
          El talento también cuenta.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muneca-purple/20 text-xl">
                {card.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-white/50">
                  {card.label}
                </p>
                <p className="truncate font-semibold text-white">{card.nombre}</p>
                <p className="text-xs text-white/50">{card.equipo}</p>
                <p className="text-xs font-bold text-muneca-yellow">{card.valor}</p>
                <a href="/estadisticas" className="mt-1 inline-block text-xs font-bold text-white/60 hover:text-muneca-yellow">
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
