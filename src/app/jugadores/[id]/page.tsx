import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { TeamCrest } from "@/components/team-crest";

/**
 * Foto del jugador. Mientras `players.foto_url` siga vacío para todo el
 * dataset, se muestra el texto placeholder acordado ("Foto de jugador
 * aquí") en vez de inventar una imagen genérica.
 */
function FotoJugador({ url }: { url?: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-28 w-28 shrink-0 rounded-2xl object-cover sm:h-32 sm:w-32"
      />
    );
  }
  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 p-2 text-center text-[11px] font-semibold uppercase tracking-wide text-white/40 sm:h-32 sm:w-32">
      Foto de jugador aquí
    </div>
  );
}

export default async function JugadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: playerId } = await params;
  const supabase = await createClient();

  const { data: jugador } = await supabase
    .from("v_players_public")
    .select("id, team_id, nombre, numero_camiseta, posicion, foto_url, es_jugador")
    .eq("id", playerId)
    .maybeSingle();

  if (!jugador) notFound();

  const [{ data: team }, { data: golesRow }, { data: tarjetasRow }, { data: mvpRow }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, nombre_equipo, escudo_url")
        .eq("id", jugador.team_id)
        .maybeSingle(),
      supabase.from("v_goleadores").select("goles").eq("player_id", playerId).maybeSingle(),
      supabase
        .from("v_tarjetas")
        .select("amarillas, rojas")
        .eq("player_id", playerId)
        .maybeSingle(),
      supabase
        .from("v_ranking_mvp")
        .select("mvp_count")
        .eq("player_id", playerId)
        .maybeSingle(),
    ]);

  const goles = golesRow?.goles ?? 0;
  const amarillas = tarjetasRow?.amarillas ?? 0;
  const rojas = tarjetasRow?.rojas ?? 0;
  const mvpCount = mvpRow?.mvp_count ?? 0;

  const breadcrumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Equipos", href: "/#equipos" },
    ...(team ? [{ label: team.nombre_equipo, href: `/equipos/${team.id}` }] : []),
    { label: jugador.nombre },
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

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />

            <div className="mt-5 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <FotoJugador url={jugador.foto_url} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muneca-yellow">
                  {jugador.posicion ?? "Jugador"}
                </p>
                <h1 className="font-display mt-1 text-3xl sm:text-4xl">{jugador.nombre}</h1>
                {team && (
                  <Link
                    href={`/equipos/${team.id}`}
                    className="mt-2 inline-flex items-center gap-2 text-sm text-white/70 hover:text-muneca-yellow"
                  >
                    <TeamCrest url={team.escudo_url} size="sm" />
                    {team.nombre_equipo}
                  </Link>
                )}
              </div>
              {jugador.numero_camiseta !== null && (
                <span className="font-display ml-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muneca-purple text-3xl text-white sm:ml-0">
                  {jugador.numero_camiseta}
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl text-muneca-black">{goles}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muneca-black/50">
                ⚽ Goles
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl text-muneca-black">
                {amarillas}
                <span className="mx-1 text-lg text-muneca-black/30">/</span>
                {rojas}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muneca-black/50">
                🟨/🟥 Tarjetas
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl text-muneca-black">{mvpCount}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muneca-black/50">
                ⭐ MVP
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muneca-black/40">
            Partidos jugados por el jugador se mostrarán aquí una vez la plataforma maneje la
            selección de titulares por partido.
          </p>

          <div>
            {team && (
              <Link
                href={`/equipos/${team.id}`}
                className="text-sm font-semibold text-black/50 transition-colors hover:text-muneca-purple"
              >
                ← Volver a {team.nombre_equipo}
              </Link>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
