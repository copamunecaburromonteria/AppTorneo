const PLACEHOLDERS = ["Jugada", "Gol", "Hinchada", "Trofeo"];

export function Galeria() {
  return (
    <section id="galeria" className="bg-muneca-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
          Galería
        </p>
        <p className="mt-1 pl-3 text-xs text-muneca-black/50">
          Momentos que también cuentan.
        </p>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {PLACEHOLDERS.map((label) => (
            <div
              key={label}
              className="flex h-32 w-48 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muneca-purple-dark to-muneca-black text-xs font-semibold uppercase tracking-wide text-white/70"
            >
              {label}
            </div>
          ))}
          <a
            href="#"
            className="flex h-32 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-muneca-purple/50 text-muneca-purple"
          >
            →
          </a>
        </div>
      </div>
    </section>
  );
}
