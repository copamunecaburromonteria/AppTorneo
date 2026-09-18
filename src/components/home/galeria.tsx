/**
 * Antes mostraba 4 recuadros de relleno ("Jugada", "Gol", "Hinchada",
 * "Trofeo") sin fotos ni videos reales. El torneo todavía no arranca, así
 * que en vez de simular contenido mostramos un mensaje claro — retirado el
 * 2026-09-17, ver `claude/plan-fases-tareas.md`.
 */
export function Galeria() {
  return (
    <section id="galeria" className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          Galería
        </p>
        <p className="mt-1 pl-3 text-xs text-white/50">
          Momentos que también cuentan.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
          <span className="text-3xl" aria-hidden="true">
            📸
          </span>
          <p className="font-display text-xl text-white sm:text-2xl">
            Todavía no hay nada que mostrar.
          </p>
          <p className="max-w-md text-sm text-white/50">
            La cámara entra en acción desde la primera jornada — fotos, goles
            y jugadas van a ir apareciendo acá.
          </p>
        </div>
      </div>
    </section>
  );
}
