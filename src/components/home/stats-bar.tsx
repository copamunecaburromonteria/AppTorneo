import { UsersThree, User, SoccerBall, Trophy, Heart } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { META_EQUIPOS, META_JUGADORES, META_PARTIDOS } from "@/lib/home/metas-torneo";

export async function StatsBar() {
  const supabase = await createClient();

  const [{ count: totalEquipos }, { count: totalJugadores }, { count: totalPartidos }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("estado_inscripcion", "validado"),
      supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("es_jugador", true)
        .neq("estado", "dado_de_baja"),
      supabase.from("matches").select("*", { count: "exact", head: true }),
    ]);

  // Mismo criterio que numeros.tsx: mientras no haya ningún equipo validado
  // todavía, se muestran las metas previstas del torneo en vez de ceros.
  const hayEquiposValidados = (totalEquipos ?? 0) > 0;

  const ITEMS = [
    {
      Icon: UsersThree,
      valor: hayEquiposValidados ? `${totalEquipos}` : `${META_EQUIPOS}`,
      label: "Equipos",
    },
    {
      Icon: User,
      valor: hayEquiposValidados ? `${totalJugadores ?? 0}` : `${META_JUGADORES}`,
      label: "Jugadores",
    },
    {
      Icon: SoccerBall,
      valor: hayEquiposValidados ? `${totalPartidos ?? 0}` : `${META_PARTIDOS}`,
      label: "Partidos",
    },
    { Icon: Trophy, valor: "1", label: "Campeón" },
    { Icon: Heart, valor: "Una", label: "Comunidad" },
  ];

  return (
    <div className="border-y border-white/10 bg-muneca-black text-muneca-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-8 text-center sm:grid-cols-5 sm:gap-y-0 sm:divide-x sm:divide-white/10 sm:px-6 sm:py-10">
        {ITEMS.map(({ Icon, valor, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 sm:px-4">
            <Icon size={32} weight="regular" className="text-muneca-yellow" aria-hidden="true" />
            <span className="font-display text-4xl sm:text-5xl">{valor}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-donkey-gray sm:text-sm">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
