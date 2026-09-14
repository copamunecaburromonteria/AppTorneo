import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TeamCrest } from "@/components/team-crest";
import { votacionAbierta, type ConfigVentana } from "@/lib/votacion/ventana";
import { VotoForm, type JugadorVotable } from "./voto-form";

type TeamInfo = { id: string; nombre_equipo: string; escudo_url: string | null };
type TeamRel = TeamInfo | TeamInfo[] | null;

function unwrapTeam(rel: TeamRel): TeamInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export default async function VotarPartidoPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();

  const [{ data: match }, { data: config }] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, cancha, estado, hora_inicio_real, hora_fin_real, arbitros_confirmados_at, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url)"
      )
      .eq("id", matchId)
      .maybeSingle(),
    supabase
      .from("torneo_config")
      .select(
        "duracion_tiempo_minutos, duracion_descanso_minutos, minutos_previos_fin_para_votacion, horas_ventana_votacion_post_partido"
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (!match) notFound();

  const local = unwrapTeam(match.equipo_local as TeamRel);
  const visitante = unwrapTeam(match.equipo_visitante as TeamRel);

  const cfg: ConfigVentana = {
    duracion_tiempo_minutos: config?.duracion_tiempo_minutos ?? 25,
    duracion_descanso_minutos: config?.duracion_descanso_minutos ?? 5,
    minutos_previos_fin_para_votacion: config?.minutos_previos_fin_para_votacion ?? 10,
    horas_ventana_votacion_post_partido: config?.horas_ventana_votacion_post_partido ?? 3,
  };

  const abierta = votacionAbierta(match, cfg);

  let jugadores: JugadorVotable[] = [];
  if (abierta && local && visitante) {
    const { data: jugadoresRaw } = await supabase
      .from("v_players_public")
      .select("id, team_id, nombre, numero_camiseta")
      .in("team_id", [local.id, visitante.id])
      .eq("es_jugador", true)
      .order("numero_camiseta", { ascending: true, nullsFirst: false });

    jugadores = (jugadoresRaw ?? []).map((j) => ({
      id: j.id as string,
      teamId: j.team_id as string,
      nombre: j.nombre as string,
      numero: j.numero_camiseta as number | null,
    }));
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-muneca-black text-white">
        <section className="relative overflow-hidden pb-16 pt-36">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(123,31,162,0.35),transparent)]" />
          </div>

          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <Link
              href="/votar"
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 transition-colors hover:text-white"
            >
              <CaretLeft size={14} weight="bold" aria-hidden="true" />
              Elegir otro partido
            </Link>

            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-1 flex-col items-center gap-2 text-center">
                <TeamCrest url={local?.escudo_url} size="lg" />
                <span className="text-sm font-semibold sm:text-base">
                  {local?.nombre_equipo ?? "Por definir"}
                </span>
              </div>
              <span className="font-display text-2xl text-white/30">VS</span>
              <div className="flex flex-1 flex-col items-center gap-2 text-center">
                <TeamCrest url={visitante?.escudo_url} size="lg" />
                <span className="text-sm font-semibold sm:text-base">
                  {visitante?.nombre_equipo ?? "Por definir"}
                </span>
              </div>
            </div>

            <div className="mt-10">
              {!abierta ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center">
                  <p className="font-display text-2xl sm:text-3xl">
                    La votación de este partido no está abierta
                  </p>
                  <p className="mt-3 max-w-sm text-sm text-white/60">
                    Se habilita hacia el final del partido y sigue abierta un rato después de
                    terminar.
                  </p>
                  <Link
                    href="/votar"
                    className="mt-6 rounded-md bg-muneca-yellow px-6 py-3 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
                  >
                    Ver partidos en votación
                  </Link>
                </div>
              ) : (
                <VotoForm
                  matchId={match.id}
                  equipoLocal={{ id: local!.id, nombre: local!.nombre_equipo }}
                  equipoVisitante={{ id: visitante!.id, nombre: visitante!.nombre_equipo }}
                  jugadores={jugadores}
                />
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
