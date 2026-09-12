import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { TeamCrest } from "@/components/team-crest";

const ROL_LABEL: Record<string, string> = {
  dt: "Director técnico",
  preparador_fisico: "Preparador físico",
};

type EquipoInfo = { id: string; nombre_equipo: string; escudo_url: string | null };
type EquipoRel = EquipoInfo | EquipoInfo[] | null;

function unwrapEquipo(rel: EquipoRel): EquipoInfo | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

type GroupRel = { letra: string } | { letra: string }[] | null;

function unwrapGroup(rel: GroupRel): { letra: string } | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teamId } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select(
      "id, nombre_equipo, escudo_url, ciudad_barrio, anio_fundacion, descripcion, tiene_uniforme_propio"
    )
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

  const [
    { data: playersRaw },
    { data: staffRaw },
    { data: teamGroupRaw },
    { data: matchesRaw },
  ] = await Promise.all([
    supabase
      .from("v_players_public")
      .select("id, nombre, numero_camiseta, posicion, foto_url, es_jugador")
      .eq("team_id", teamId)
      .order("numero_camiseta", { ascending: true, nullsFirst: false }),
    supabase.from("v_team_staff_public").select("nombre, rol").eq("team_id", teamId),
    supabase
      .from("team_group")
      .select("group_id, groups:group_id(letra)")
      .eq("team_id", teamId)
      .maybeSingle(),
    supabase
      .from("matches")
      .select(
        "id, fase, cancha, fecha_hora_programada, estado, marcador_local, marcador_visitante, equipo_local_id, equipo_visitante_id, equipo_local:equipo_local_id(id, nombre_equipo, escudo_url), equipo_visitante:equipo_visitante_id(id, nombre_equipo, escudo_url)"
      )
      .or(`equipo_local_id.eq.${teamId},equipo_visitante_id.eq.${teamId}`)
      .order("fecha_hora_programada", { ascending: true }),
  ]);

  const jugadores = playersRaw ?? [];
  const staff = staffRaw ?? [];
  const grupoLetra = unwrapGroup(teamGroupRaw?.groups as GroupRel)?.letra ?? null;
  const groupId = teamGroupRaw?.group_id ?? null;

  const [{ data: standingsRaw }, { data: mvpRaw }] = await Promise.all([
    groupId
      ? supabase
          .from("v_standings")
          .select("team_id, pj, pg, pe, pp, gf, gc, dg, pts")
          .eq("group_id", groupId)
      : Promise.resolve({ data: [] as never[] }),
    jugadores.length > 0
      ? supabase
          .from("v_ranking_mvp")
          .select("player_id, mvp_count")
          .in(
            "player_id",
            jugadores.map((j) => j.id)
          )
      : Promise.resolve({ data: [] as { player_id: string; mvp_count: number }[] }),
  ]);

  const standings = (standingsRaw ?? []).slice().sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf
  );
  const posicionGrupo = standings.findIndex((r) => r.team_id === teamId) + 1;
  const miFila = standings.find((r) => r.team_id === teamId) ?? null;
  const mvpTotal = (mvpRaw ?? []).reduce((sum, r) => sum + (r.mvp_count ?? 0), 0);

  const partidos = (matchesRaw ?? []).map((m) => {
    const local = unwrapEquipo(m.equipo_local as EquipoRel);
    const visitante = unwrapEquipo(m.equipo_visitante as EquipoRel);
    const esLocal = m.equipo_local_id === teamId;
    const rival = esLocal ? visitante : local;
    const golesPropios = esLocal ? m.marcador_local : m.marcador_visitante;
    const golesRival = esLocal ? m.marcador_visitante : m.marcador_local;
    let resultado: "G" | "E" | "P" | null = null;
    if (m.estado === "finalizado" && golesPropios !== null && golesRival !== null) {
      resultado = golesPropios > golesRival ? "G" : golesPropios < golesRival ? "P" : "E";
    }
    return { ...m, rival, esLocal, golesPropios, golesRival, resultado };
  });

  const proximoPartido = partidos.find((p) => p.estado === "programado") ?? null;
  const partidosJugados = partidos
    .filter((p) => p.estado === "finalizado")
    .sort(
      (a, b) =>
        new Date(b.fecha_hora_programada).getTime() - new Date(a.fecha_hora_programada).getTime()
    );

  const breadcrumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Equipos", href: "/#equipos" },
    { label: team.nombre_equipo },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-white">
        <section className="relative overflow-hidden bg-muneca-black pb-10 pt-36 text-muneca-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />

            <div className="mt-5 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
              <TeamCrest url={team.escudo_url} size="xl" />
              <div>
                <h1 className="font-display text-3xl sm:text-4xl">{team.nombre_equipo}</h1>
                <p className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-white/70 sm:justify-start">
                  {grupoLetra && <span>Grupo {grupoLetra}</span>}
                  {team.ciudad_barrio && <span>{team.ciudad_barrio}</span>}
                  {team.anio_fundacion && <span>Fundado en {team.anio_fundacion}</span>}
                </p>
                {team.descripcion && (
                  <p className="mt-2 max-w-xl text-sm text-white/60">{team.descripcion}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          {/* Posición y estadísticas del equipo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                Posición en el grupo {grupoLetra ?? ""}
              </p>
              {miFila ? (
                <>
                  <p className="font-display mt-2 text-3xl text-muneca-black">
                    {posicionGrupo}.º lugar
                  </p>
                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      ["PJ", miFila.pj],
                      ["PG", miFila.pg],
                      ["PE", miFila.pe],
                      ["PP", miFila.pp],
                      ["GF", miFila.gf],
                      ["GC", miFila.gc],
                      ["DG", miFila.dg],
                      ["PTS", miFila.pts],
                    ].map(([label, valor]) => (
                      <div key={label as string} className="rounded-lg bg-black/[0.03] py-2">
                        <p className="font-bold text-muneca-black">{valor}</p>
                        <p className="text-[10px] uppercase text-muneca-black/50">{label}</p>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className="mt-2 text-sm text-muneca-black/40">
                  Aún no hay partidos finalizados para calcular la tabla.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                Reconocimientos
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muneca-purple/10 text-xl">
                  ⭐
                </span>
                <div>
                  <p className="font-display text-2xl text-muneca-black">{mvpTotal}</p>
                  <p className="text-xs text-muneca-black/50">MVP obtenidos por jugadores del equipo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Próximo partido */}
          {proximoPartido && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                Próximo partido
              </p>
              <Link
                href={`/partidos/${proximoPartido.id}`}
                className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/[0.02] p-3 transition-colors hover:bg-muneca-purple/5"
              >
                <div className="flex items-center gap-2">
                  <TeamCrest url={proximoPartido.rival?.escudo_url} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-muneca-black">
                      vs {proximoPartido.rival?.nombre_equipo ?? "Por definir"}
                    </p>
                    <p className="text-xs text-muneca-black/50">
                      Cancha {proximoPartido.cancha} ·{" "}
                      {new Date(proximoPartido.fecha_hora_programada).toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}{" "}
                      ·{" "}
                      {new Date(proximoPartido.fecha_hora_programada).toLocaleTimeString("es-CO", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-muneca-purple">Ver partido →</span>
              </Link>
            </div>
          )}

          {/* Plantilla */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
              Plantilla ({jugadores.length})
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {jugadores.length === 0 && (
                <p className="text-xs text-muneca-black/40">Sin jugadores registrados.</p>
              )}
              {jugadores.map((j) => (
                <Link
                  key={j.id}
                  href={`/jugadores/${j.id}`}
                  className="flex items-center gap-3 rounded-xl border border-black/5 p-2.5 transition-colors hover:bg-muneca-purple/5"
                >
                  <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muneca-purple text-sm text-white">
                    {j.numero_camiseta ?? "—"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-muneca-black">{j.nombre}</p>
                    <p className="text-xs text-muneca-black/50">{j.posicion ?? "—"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Cuerpo técnico */}
          {staff.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
                Cuerpo técnico
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {staff.map((s, i) => (
                  <div
                    key={`${s.nombre}-${i}`}
                    className="rounded-xl border border-black/5 p-2.5"
                  >
                    <p className="text-sm font-semibold text-muneca-black">{s.nombre}</p>
                    <p className="text-xs text-muneca-black/50">{ROL_LABEL[s.rol] ?? s.rol}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados / partidos jugados */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
              Partidos jugados ({partidosJugados.length})
            </p>
            <div className="mt-3 space-y-2">
              {partidosJugados.length === 0 && (
                <p className="text-xs text-muneca-black/40">Aún no hay partidos finalizados.</p>
              )}
              {partidosJugados.map((p) => (
                <Link
                  key={p.id}
                  href={`/partidos/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.02] p-3 transition-colors hover:bg-muneca-purple/5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        p.resultado === "G"
                          ? "bg-emerald-600"
                          : p.resultado === "P"
                            ? "bg-rose-600"
                            : "bg-muneca-black/40"
                      }`}
                    >
                      {p.resultado ?? "—"}
                    </span>
                    <TeamCrest url={p.rival?.escudo_url} size="sm" />
                    <p className="text-sm font-semibold text-muneca-black">
                      vs {p.rival?.nombre_equipo ?? "Por definir"}
                    </p>
                  </div>
                  <p className="font-display text-lg text-muneca-black">
                    {p.golesPropios ?? 0}-{p.golesRival ?? 0}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Foto de equipo / galería — placeholder */}
          <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-muneca-black/40">
              📸 Foto del equipo
            </p>
            <p className="mt-2 text-sm text-muneca-black/40">Próximamente</p>
          </div>

          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-black/50 transition-colors hover:text-muneca-purple"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
