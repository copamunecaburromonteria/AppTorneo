import Image from "next/image";
import Link from "next/link";
import { Trophy } from "@phosphor-icons/react/dist/ssr";
import { tablaPosiciones } from "@/lib/mock-data";

const COLS = ["Pos", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"];

export function TablaPosiciones() {
  return (
    <section id="posiciones" className="bg-black/[0.02]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
              Tabla de posiciones
            </p>
            <p className="mt-1 pl-3 text-xs text-muneca-black/50">
              Tabla de posiciones presentada por [Patrocinador]
            </p>
          </div>
          <Link
            href="/posiciones"
            className="pl-3 text-xs font-bold text-muneca-black/70 hover:text-muneca-purple sm:pl-0"
          >
            Ver tabla completa →
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-muneca-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-muneca-purple-dark to-muneca-black text-muneca-white">
                {COLS.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide first:pl-4"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tablaPosiciones.map((fila, i) => {
                const dg = fila.gf - fila.gc;
                const esLider = fila.posicion === 1;
                return (
                  <tr
                    key={fila.equipo}
                    className={`border-b border-black/5 transition-colors last:border-0 hover:bg-muneca-purple/5 ${
                      esLider
                        ? "bg-muneca-yellow/10"
                        : i % 2 === 0
                          ? "bg-muneca-white"
                          : "bg-muneca-purple/[0.03]"
                    }`}
                  >
                    <td className="px-3 py-3 pl-4">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          esLider
                            ? "bg-muneca-yellow text-muneca-black"
                            : "bg-muneca-purple text-white"
                        }`}
                      >
                        {fila.posicion}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/brand/escudo-dummy.png"
                          alt=""
                          aria-hidden="true"
                          width={1208}
                          height={1283}
                          className="h-6 w-6 object-contain"
                        />
                        <span className="font-semibold text-muneca-black">
                          {fila.equipo}
                        </span>
                        {esLider && (
                          <Trophy
                            size={16}
                            weight="fill"
                            className="text-muneca-yellow"
                            aria-label="Líder"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muneca-black/70">{fila.pj}</td>
                    <td className="px-3 py-3 font-semibold text-emerald-600">{fila.pg}</td>
                    <td className="px-3 py-3 text-muneca-black/50">{fila.pe}</td>
                    <td className="px-3 py-3 font-semibold text-rose-600">{fila.pp}</td>
                    <td className="px-3 py-3 text-muneca-black/70">{fila.gf}</td>
                    <td className="px-3 py-3 text-muneca-black/70">{fila.gc}</td>
                    <td
                      className={`px-3 py-3 font-semibold ${
                        dg > 0
                          ? "text-emerald-600"
                          : dg < 0
                            ? "text-rose-600"
                            : "text-muneca-black/50"
                      }`}
                    >
                      {dg > 0 ? `+${dg}` : dg}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-muneca-purple px-2 py-1 text-xs font-bold text-white">
                        {fila.pts}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
