import { torneoEnNumeros } from "@/lib/mock-data";

const ITEMS = [
  { valor: `${torneoEnNumeros.equipos}`, label: "Equipos" },
  { valor: `${torneoEnNumeros.jugadores}`, label: "Jugadores" },
  { valor: `${torneoEnNumeros.partidos}`, label: "Partidos" },
  { valor: `${torneoEnNumeros.partidosMaxPorEquipo}`, label: "Partidos máximo por equipo" },
  { valor: torneoEnNumeros.premioCampeon, label: "En premios" },
];

export function Numeros() {
  return (
    <section
      className="relative bg-[url('/brand/numeros-bg-mobile.jpg')] bg-cover bg-center text-muneca-white sm:bg-[url('/brand/numeros-bg-desktop.jpg')]"
    >
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          — El torneo
        </p>
        <h2 className="font-display mt-2 text-center text-4xl sm:text-5xl">
          EL TORNEO EN NÚMEROS
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-white/70">
          Cifras que hablan de una gran experiencia.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-6 text-center sm:grid-cols-5">
          {ITEMS.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="font-display text-4xl text-muneca-yellow sm:text-5xl">
                {item.valor}
              </span>
              <span className="max-w-[10rem] text-xs font-semibold uppercase tracking-wide text-white/70">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
