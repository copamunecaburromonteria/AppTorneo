import { torneoEnNumeros } from "@/lib/mock-data";

const ITEMS = [
  { valor: `${torneoEnNumeros.equipos}`, label: "Equipos" },
  { valor: `${torneoEnNumeros.jugadores}`, label: "Jugadores" },
  { valor: `${torneoEnNumeros.partidos}`, label: "Partidos" },
  { valor: "1", label: "Campeón" },
  { valor: "Una", label: "Comunidad" },
];

export function StatsBar() {
  return (
    <div className="border-y border-white/10 bg-muneca-black text-muneca-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-4 px-4 py-5 text-center sm:grid-cols-5 sm:px-6">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-0.5">
            <span className="font-display text-2xl text-muneca-yellow sm:text-3xl">
              {item.valor}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-donkey-gray">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
