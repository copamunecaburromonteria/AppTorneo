/**
 * Antes mostraba 3 tarjetas con datos inventados (goleador/arquero/MVP de
 * ejemplo, ver `src/lib/mock-data.ts`). El torneo todavía no arranca, así
 * que en vez de simular resultados mostramos un mensaje claro de que esto
 * se llena solo apenas haya partidos — retirado el 2026-09-17, ver
 * `claude/plan-fases-tareas.md`.
 */
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

        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
          <span className="text-3xl" aria-hidden="true">
            😌
          </span>
          <p className="font-display text-xl text-white sm:text-2xl">
            Ey, cálmate que ya viene el torneo.
          </p>
          <p className="max-w-md text-sm text-white/50">
            Todavía no hay goleadores, arqueros ni MVP porque el balón aún no
            rueda. En cuanto arranquen los partidos, esto se llena solo.
          </p>
          <a
            href="/preinscripcion"
            className="mt-1 text-xs font-bold uppercase tracking-wide text-muneca-yellow hover:text-white"
          >
            Preinscribe tu equipo →
          </a>
        </div>
      </div>
    </section>
  );
}
