import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TeamCrest } from "@/components/team-crest";

type TeamInfo = { id: string; nombre_equipo: string; escudo_url: string | null };
type TeamRel = TeamInfo | TeamInfo[] | null;

function unwrapTeam(rel: TeamRel): TeamInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/**
 * Banner de Campeón/Subcampeón — aparece solo cuando la gran final
 * (jornada 9, `fase = "Final"`) ya quedó `finalizado`. `winner_team_id` se
 * calcula automáticamente al cerrar el partido (ver `cerrarPartido` en
 * `src/app/operador/actions.ts`), así que este componente no tiene que
 * calcular nada — solo lee el resultado. Antes de que exista la final no
 * renderiza nada (`return null`), no un placeholder.
 */
export async function CampeonBanner() {
  const supabase = await createClient();

  const { data: partido } = await supabase
    .from("matches")
    .select(
      "id, marcador_local, marcador_visitante, winner_team_id, equipo_local_id, equipo_visitante_id, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url)"
    )
    .eq("jornada", 9)
    .eq("fase", "Final")
    .eq("estado", "finalizado")
    .maybeSingle();

  if (!partido || !partido.winner_team_id) return null;

  const local = unwrapTeam(partido.equipo_local as TeamRel);
  const visitante = unwrapTeam(partido.equipo_visitante as TeamRel);
  if (!local || !visitante) return null;

  const campeon = partido.winner_team_id === local.id ? local : visitante;
  const subcampeon = partido.winner_team_id === local.id ? visitante : local;

  return (
    <section className="bg-muneca-black">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-muneca-yellow/30 bg-gradient-to-b from-muneca-purple/20 to-transparent px-4 py-10 text-center sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,217,0,0.15),transparent)]"
        />
        <p className="relative text-xs font-bold uppercase tracking-[0.3em] text-muneca-yellow">
          🏆 Campeón de la Copa Muñeca e&apos;Burro
        </p>
        <div className="relative mt-4 flex items-center justify-center gap-3">
          <TeamCrest url={campeon.escudo_url} size="lg" />
        </div>
        <p className="font-display relative mt-3 text-3xl text-white sm:text-4xl">{campeon.nombre_equipo}</p>
        <p className="relative mt-1 text-sm text-white/60">
          {partido.marcador_local}-{partido.marcador_visitante}
          {" · "}Subcampeón: {subcampeon.nombre_equipo}
        </p>
        <Link
          href={`/partidos/${partido.id}`}
          className="relative mt-5 inline-block rounded-md bg-muneca-yellow px-6 py-2.5 text-xs font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
        >
          Ver la final
        </Link>
      </div>
    </section>
  );
}
