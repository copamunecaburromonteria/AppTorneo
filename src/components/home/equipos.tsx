import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TeamCrest } from "@/components/team-crest";

type Equipo = {
  id: string;
  nombre_equipo: string;
  escudo_url: string | null;
};

export async function Equipos() {
  const supabase = await createClient();

  const { data: equiposRaw } = await supabase
    .from("teams")
    .select("id, nombre_equipo, escudo_url")
    .eq("estado_inscripcion", "validado")
    .order("orden_inscripcion", { ascending: true });

  const equipos: Equipo[] = equiposRaw ?? [];

  return (
    <section id="equipos" className="bg-black/[0.02]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-purple pl-3 text-sm font-bold uppercase tracking-widest text-muneca-purple">
          Equipos participantes
        </p>
        <p className="mt-1 pl-3 text-xs text-muneca-black/50">
          {equipos.length > 0
            ? `${equipos.length} equipos, un mismo sueño.`
            : "Muy pronto, los equipos confirmados."}
        </p>

        {equipos.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muneca-black/40">
            Todavía no hay equipos validados para mostrar.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-10">
            {equipos.map((equipo) => (
              <Link
                key={equipo.id}
                href={`/equipos/${equipo.id}`}
                title={equipo.nombre_equipo}
                className="flex flex-col items-center gap-2 rounded-lg border border-black/10 bg-muneca-white px-2 py-3 shadow-sm transition-transform hover:scale-[1.03] hover:border-muneca-purple/30"
              >
                <TeamCrest url={equipo.escudo_url} size="md" />
                <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-muneca-black/70">
                  {equipo.nombre_equipo}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
