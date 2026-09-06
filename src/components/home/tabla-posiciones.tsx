import { tablaPosiciones } from "@/lib/mock-data";

const COLS = ["Pos", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"];

export function TablaPosiciones() {
  return (
    <section id="posiciones" className="bg-black/[0.02]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
          Tabla de posiciones
        </p>
        <p className="mt-1 pl-3 text-xs text-muneca-black/50">
          Tabla de posiciones presentada por [Patrocinador]
        </p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-muneca-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-muneca-black text-muneca-white">
                {COLS.map((col) => (
                  <th key={col} className="px-3 py-3 text-left font-semibold uppercase text-xs tracking-wide first:pl-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tablaPosiciones.map((fila, i) => (
                <tr
                  key={fila.equipo}
                  className={i % 2 === 0 ? "bg-muneca-white" : "bg-black/[0.015]"}
                >
                  <td className="px-3 py-3 pl-4 font-bold text-muneca-purple">{fila.posicion}</td>
                  <td className="px-3 py-3 font-semibold">{fila.equipo}</td>
                  <td className="px-3 py-3">{fila.pj}</td>
                  <td className="px-3 py-3">{fila.pg}</td>
                  <td className="px-3 py-3">{fila.pe}</td>
                  <td className="px-3 py-3">{fila.pp}</td>
                  <td className="px-3 py-3">{fila.gf}</td>
                  <td className="px-3 py-3">{fila.gc}</td>
                  <td className="px-3 py-3">{fila.gf - fila.gc}</td>
                  <td className="px-3 py-3 font-bold">{fila.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muneca-black/40">
          Datos de ejemplo — se conecta a resultados reales una vez definido el formato del torneo.
        </p>
      </div>
    </section>
  );
}
