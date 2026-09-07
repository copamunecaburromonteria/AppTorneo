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
