import Link from "next/link";
import { Star, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TeamCrest } from "@/components/team-crest";
import { votacionAbierta, type ConfigVentana, type MatchVentana } from "@/lib/votacion/ventana";

type TeamInfo = { nombre_equipo: string; escudo_url: string | null };
type TeamRel = TeamInfo | TeamInfo[] | null;

function unwrapTeam(rel: TeamRel): TeamInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

type PartidoRow = MatchVentana & {
  id: string;
  cancha: number;
  equipo_local: TeamRel;
  equipo_visitante: TeamRel;
};

/**
 * Página del QR único del torneo (brief original, sección 18): SIEMPRE la
 * misma URL, pegada físicamente en ambas canchas. Al escanear, detecta los
 * partidos con votación abierta en este momento (MVP + calificación del
 * equipo arbitral) y deja elegir cuál — no hay una URL distinta por
 * partido que memorizar ni regenerar.
 *
 * La ventana de votación (ver `src/lib/votacion/ventana.ts`) exige árbitro
 * confirmado + estar dentro del horario — la validación real, la que no se
 * puede saltar, vive en `registrar_voto_partido` en Supabase.
 */
export default async function VotarPage() {
  const supabase = await createClient();

  const [{ data: partidosRaw }, { data: config }] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, cancha, estado, hora_inicio_real, hora_fin_real, arbitros_confirmados_at, equipo_local:equipo_local_id(nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(nombre_equipo, escudo_url)"
      )
      .in("estado", ["en_curso", "entretiempo", "finalizado"])
      .not("arbitros_confirmados_at", "is", null)
      .order("cancha", { ascending: true }),
    supabase
      .from("torneo_config")
      .select(
        "duracion_tiempo_minutos, duracion_descanso_minutos, minutos_previos_fin_para_votacion, horas_ventana_votacion_post_partido"
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const cfg: ConfigVentana = {
    duracion_tiempo_minutos: config?.duracion_tiempo_minutos ?? 25,
    duracion_descanso_minutos: config?.duracion_descanso_minutos ?? 5,
    minutos_previos_fin_para_votacion: config?.minutos_previos_fin_para_votacion ?? 10,
    horas_ventana_votacion_post_partido: config?.horas_ventana_votacion_post_partido ?? 3,
  };

  const partidos = (partidosRaw ?? []) as PartidoRow[];
  const abiertos = partidos.filter((p) => votacionAbierta(p, cfg));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-muneca-black text-white">
        <section className="relative overflow-hidden pb-16 pt-36">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-muneca-purple/25 blur-3xl" />
            <div className="absolute -right-20 top-48 h-72 w-72 rounded-full bg-muneca-yellow/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-sm font-bold uppercase tracking-widest text-muneca-yellow">
              Votación en vivo
            </p>
            <h1 className="font-display mt-3 text-4xl sm:text-5xl">
              Elige tu partido y vota
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              MVP del partido y calificación al arbitraje — un voto por dispositivo, por
              partido.
            </p>
          </div>

          <div className="relative mx-auto mt-10 max-w-3xl px-4 sm:px-6">
            {abiertos.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center">
                <UsersThree size={40} weight="regular" className="text-muneca-yellow" aria-hidden="true" />
                <p className="font-display mt-4 text-2xl sm:text-3xl">
                  No hay votación abierta ahora mismo
                </p>
                <p className="mt-3 max-w-sm text-sm text-white/60">
                  La votación se habilita hacia el final de cada partido y sigue abierta un
                  rato después de terminar. Vuelve a escanear el QR cuando estés en la
                  cancha.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Partidos con votación abierta
                </p>
                {[1, 2].map((cancha) => {
                  const partidosCancha = abiertos.filter((p) => p.cancha === cancha);
                  if (partidosCancha.length === 0) return null;
                  return (
                    <div key={cancha}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muneca-yellow">
                        Cancha {cancha}
                      </p>
                      <div className="space-y-3">
                        {partidosCancha.map((p) => {
                          const local = unwrapTeam(p.equipo_local);
                          const visitante = unwrapTeam(p.equipo_visitante);
                          return (
                            <Link
                              key={p.id}
                              href={`/votar/${p.id}`}
                              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition-colors hover:border-muneca-yellow/50 hover:bg-white/[0.07] sm:px-6"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <TeamCrest url={local?.escudo_url} size="sm" />
                                <span className="truncate text-sm font-semibold sm:text-base">
                                  {local?.nombre_equipo ?? "Por definir"}
                                </span>
                                <span className="text-xs font-bold text-white/40">VS</span>
                                <span className="truncate text-sm font-semibold sm:text-base">
                                  {visitante?.nombre_equipo ?? "Por definir"}
                                </span>
                                <TeamCrest url={visitante?.escudo_url} size="sm" />
                              </div>
                              <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-muneca-yellow px-3 py-2 text-xs font-bold uppercase text-muneca-black">
                                <Star size={14} weight="fill" aria-hidden="true" />
                                Votar
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
