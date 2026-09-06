const ITEMS = [
  "Resultados en vivo",
  "Posiciones",
  "Calendario",
  "Estadísticas",
  "Equipos",
  "Noticias y más",
];

export function AppPromo() {
  return (
    <section className="bg-muneca-black text-muneca-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-16 sm:px-6 lg:flex-row">
        <div className="flex flex-1 justify-center">
          <div className="flex h-64 w-40 flex-col items-center justify-center gap-2 rounded-3xl border-4 border-muneca-purple/60 bg-gradient-to-b from-muneca-purple-dark to-muneca-black p-4 shadow-2xl">
            <span className="font-display text-lg text-muneca-yellow">MUÑECA</span>
            <span className="text-[10px] uppercase text-white/60">e&apos;Burro App</span>
          </div>
        </div>

        <div className="flex-1 text-center lg:text-left">
          <h2 className="font-display text-4xl sm:text-5xl">
            TODO EL TORNEO EN TU CELULAR
          </h2>
          <ul className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/80 lg:mx-0">
            {ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-muneca-yellow">✔</span> {item}
              </li>
            ))}
          </ul>
          <a
            href="#"
            className="mt-6 inline-block rounded-md bg-muneca-purple px-6 py-3 text-sm font-bold uppercase text-white hover:bg-muneca-purple-dark"
          >
            Ingresar a la app web
          </a>
        </div>
      </div>
    </section>
  );
}
