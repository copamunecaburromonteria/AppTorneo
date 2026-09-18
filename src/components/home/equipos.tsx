import Link from "next/link";
import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { TeamCrest } from "@/components/team-crest";

type Equipo = { id: string; nombre_equipo: string; escudo_url: string | null };

/**
 * Sección "Equipos participantes" del home — fondo oscuro (2026-09-14, junto
 * con el resto de la plataforma). Se mantiene `equipos-bg.jpg` (silueta de
 * estadio + trazos morados) pero con un velo oscuro encima para que el texto
 * en blanco siga siendo legible, mismo criterio que los héroes de
 * /partidos y /equipos/[equipo] sobre `hero-stadium.jpg`.
 */
export async function Equipos() {
  const supabase = await createClient();

  const [{ data: equiposRaw }, { data: config }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, nombre_equipo, escudo_url")
      .eq("estado_inscripcion", "validado")
      .order("orden_inscripcion", { ascending: true }),
    supabase.from("torneo_config").select("numero_equipos_torneo").eq("id", 1).maybeSingle(),
  ]);

  const equipos: Equipo[] = equiposRaw ?? [];
  const cupo = config?.numero_equipos_torneo ?? equipos.length;

  return (
    <section
      id="equipos"
      className="relative isolate overflow-hidden bg-muneca-black bg-[url('/brand/equipos-bg.jpg')] bg-cover bg-center bg-no-repeat"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-muneca-black/80" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          Equipos participantes
        </p>

        {equipos.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center backdrop-blur-sm sm:py-24">
            <p className="font-display text-4xl leading-none text-white sm:text-6xl">
              TE ESTAMOS ESPERANDO
            </p>
            <p className="mt-4 max-w-md text-sm text-white/60 sm:text-base">
              Todavía no hay equipos confirmados — sé de los primeros en hacer parte de la Copa.
            </p>
            <Link
              href="/preinscripcion"
              className="mt-7 rounded-md bg-muneca-yellow px-8 py-3.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
            >
              Preinscribe tu equipo →
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
              <p className="font-display pl-3 text-3xl leading-[1.05] text-white sm:text-5xl">
                {cupo} EQUIPOS,{" "}
                <span className="text-muneca-yellow underline decoration-muneca-purple decoration-4 underline-offset-8">
                  UN MISMO SUEÑO
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-6 pl-3 sm:pl-0">
                <div className="flex items-center gap-2.5">
                  <UsersThree size={28} weight="regular" className="text-muneca-yellow" aria-hidden="true" />
                  <div>
                    <p className="font-display text-2xl leading-none text-white sm:text-3xl">
                      <span className="text-muneca-yellow">{equipos.length}</span>
                      <span className="text-white/30"> / {cupo}</span>
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Equipos confirmados
                    </p>
                  </div>
                </div>

                <p className="hidden max-w-xs text-sm text-white/60 lg:block">
                  Talento, pasión y buena gente en una sola cancha. Conoce los equipos que ya hacen
                  parte de la Copa.
                </p>

                <Link
                  href="/equipos"
                  className="shrink-0 rounded-md border border-muneca-yellow px-4 py-2.5 text-xs font-bold uppercase text-muneca-yellow transition-colors hover:bg-muneca-yellow hover:text-muneca-black"
                >
                  Ver todos los equipos →
                </Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-10">
              {equipos.map((equipo) => (
                <Link
                  key={equipo.id}
                  href={`/equipos/${equipo.id}`}
                  title={equipo.nombre_equipo}
                  className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-3 transition-transform hover:scale-[1.03] hover:border-muneca-yellow/40"
                >
                  <TeamCrest url={equipo.escudo_url} size="md" />
                  <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-white/70">
                    {equipo.nombre_equipo}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
