import { UsersThree, User, SoccerBall, Trophy, Heart } from "@phosphor-icons/react/dist/ssr";
import { torneoEnNumeros } from "@/lib/mock-data";

const ITEMS = [
  { Icon: UsersThree, valor: `${torneoEnNumeros.equipos}`, label: "Equipos" },
  { Icon: User, valor: `${torneoEnNumeros.jugadores}`, label: "Jugadores" },
  { Icon: SoccerBall, valor: `${torneoEnNumeros.partidos}`, label: "Partidos" },
  { Icon: Trophy, valor: "1", label: "Campeón" },
  { Icon: Heart, valor: "Una", label: "Comunidad" },
];

export function StatsBar() {
  return (
    <div className="border-y border-white/10 bg-muneca-black text-muneca-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-4 py-5 text-center sm:grid-cols-5 sm:px-6">
        {ITEMS.map(({ Icon, valor, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon size={22} weight="regular" className="text-muneca-yellow" aria-hidden="true" />
            <span className="font-display text-2xl sm:text-3xl">{valor}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-donkey-gray">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
