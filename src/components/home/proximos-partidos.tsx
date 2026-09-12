import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TeamCrest } from "@/components/team-crest";

const LIMITE = 3;

type TeamInfo = { id: string; nombre_equipo: string; escudo_url: string | null };
type TeamRel = TeamInfo | TeamInfo[] | null;

function unwrapTeam(rel: TeamRel): TeamInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

export async function ProximosPartidos() {
  const supabase = await createClient();

  const { data: partidosRaw } = await supabase
    .from("matches")
    .select(
      "id, cancha, fecha_hora_programada, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url)"
    )
    .eq("estado", "programado")
    .order("fecha_hora_programada", { ascending: true })
    .limit(LIMITE);

  const partidos = (partidosRaw ?? []).map((p) => ({
    id: p.id as string,
    cancha: p.cancha as number,
    fecha: new Date(p.fecha_hora_programada as string),
    local: unwrapTeam(p.equipo_local as TeamRel),
    visitante: unwrapTeam(p.equipo_visitante as TeamRel),
  }));

  return (
    <section id="partidos" className="bg-muneca-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
              Próximos partidos
            </p>
            <p className="mt-1 pl-3 text-sm text-muneca-black/60">
              Vive cada jornada.
            </p>
          </div>
          <a
            href="#"
            className="rounded-md border border-muneca-purple px-4 py-2 text-xs font-bold uppercase text-muneca-purple hover:bg-muneca-purple hover:text-muneca-white"
          >
            Ver calendario completo
          </a>
        </div>

        {partidos.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-muneca-purple/30 bg-black/[0.02] px-6 py-16 text-center">
            <p className="font-display text-2xl text-muneca-black sm:text-3xl">
              Acá vas a ver toda la programación
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muneca-black/60">
              Los partidos se publicarán aquí apenas se confirme el calendario del torneo.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {partidos.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-black/10 bg-white p-5 shadow-sm"
              >
                <p className="text-center text-xs font-bold uppercase tracking-wide text-muneca-purple">
                  {p.fecha.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "short" })}
                  {" · "}
                  {p.fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                    <TeamCrest url={p.local?.escudo_url} size="sm" />
                    <span className="line-clamp-2 text-xs font-semibold leading-tight text-muneca-black">
                      {p.local?.nombre_equipo ?? "Por definir"}
                    </span>
                  </div>
                  <span className="font-display text-lg text-muneca-black/40">VS</span>
                  <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                    <TeamCrest url={p.visitante?.escudo_url} size="sm" />
                    <span className="line-clamp-2 text-xs font-semibold leading-tight text-muneca-black">
                      {p.visitante?.nombre_equipo ?? "Por definir"}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-center text-xs text-muneca-black/50">
                  📍 Cancha {p.cancha}
                </p>

                <Link
                  href={`/partidos/${p.id}`}
                  className="mt-4 block rounded-md bg-muneca-purple py-2 text-center text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02]"
                >
                  Ver partido
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
