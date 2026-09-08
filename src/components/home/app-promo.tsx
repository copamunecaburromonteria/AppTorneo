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
    <section className="relative overflow-hidden bg-muneca-black text-muneca-white lg:bg-[url('/brand/app-promo-bg.jpg')] lg:bg-cover lg:bg-center">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:flex lg:min-h-[440px] lg:items-center lg:py-0">
        <div className="text-center lg:ml-[48%] lg:max-w-sm lg:text-left">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">
            TODO EL TORNEO
            <br />
            <span className="text-muneca-yellow">EN TU CELULAR</span>
          </h2>
          <ul className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/80 lg:mx-0 lg:grid-cols-1">
            {ITEMS.map((item) => (
              <li key={item} className="flex items-center justify-center gap-2 lg:justify-start">
                <span className="text-muneca-yellow">✔</span> {item}
              </li>
            ))}
          </ul>
          <a
            href="#"
            className="mt-6 inline-block rounded-md bg-muneca-purple px-6 py-3 text-sm font-bold uppercase text-white hover:bg-muneca-purple-dark"
          >
            Ingresar a la app web →
          </a>
        </div>
      </div>
    </section>
  );
}
