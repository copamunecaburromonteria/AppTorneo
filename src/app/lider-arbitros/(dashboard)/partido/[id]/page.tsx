import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GestorArbitrosPartido } from "@/components/lider-arbitros/gestor-arbitros-partido";

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  entretiempo: "Entretiempo",
  finalizado: "Finalizado",
  suspendido: "Suspendido",
};

type EquipoRel = { nombre_equipo: string } | { nombre_equipo: string }[] | null;

function nombreEquipo(rel: EquipoRel): string {
  if (!rel) return "Por definir";
  return Array.isArray(rel) ? rel[0]?.nombre_equipo ?? "Por definir" : rel.nombre_equipo;
}

type ArbitroRel = { nombre: string } | { nombre: string }[] | null;

export default async function LiderArbitrosPartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;
  const supabase = await createClient();

  const { data: partido } = await supabase
    .from("matches")
    .select(
      "id, fase, cancha, fecha_hora_programada, estado, arbitros_requeridos, arbitros_confirmados_at, equipo_local:equipo_local_id(nombre_equipo), equipo_visitante:equipo_visitante_id(nombre_equipo)"
    )
    .eq("id", matchId)
    .maybeSingle();

  if (!partido) notFound();

  const [{ data: asignadosRaw }, { data: activos }] = await Promise.all([
    supabase
      .from("partido_arbitros")
      .select("arbitro_id, es_reserva, arbitro:arbitro_id(nombre)")
      .eq("match_id", matchId),
    supabase
      .from("arbitros")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
  ]);

  const asignados = (asignadosRaw ?? []).map((a) => {
    const arbitroRel = a.arbitro as unknown as ArbitroRel;
    const arbitro = Array.isArray(arbitroRel) ? arbitroRel[0] : arbitroRel;
    return {
      arbitro_id: a.arbitro_id as string,
      es_reserva: Boolean(a.es_reserva),
      nombre: arbitro?.nombre ?? "—",
    };
  });

  const arbitrosDisponibles = (activos ?? []).filter(
    (a) => !asignados.some((x) => x.arbitro_id === a.id)
  );

  const fecha = new Date(partido.fecha_hora_programada);

  return (
    <div className="space-y-6">
      <Link
        href="/lider-arbitros"
        className="inline-block text-sm font-semibold text-black/50 transition-colors hover:text-muneca-purple"
      >
        ← Volver al calendario
      </Link>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
          Cancha {partido.cancha} · {partido.fase} · {ESTADO_LABEL[partido.estado] ?? partido.estado}
        </p>
        <p className="mt-1 text-sm text-black/60">
          {fecha.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long" })} ·{" "}
          {fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="flex-1 font-display text-xl text-muneca-black sm:text-2xl">
            {nombreEquipo(partido.equipo_local)}
          </p>
          <p className="font-display text-2xl text-muneca-purple">vs</p>
          <p className="flex-1 text-right font-display text-xl text-muneca-black sm:text-2xl">
            {nombreEquipo(partido.equipo_visitante)}
          </p>
        </div>
      </div>

      <GestorArbitrosPartido
        matchId={partido.id}
        asignados={asignados}
        arbitrosDisponibles={arbitrosDisponibles}
        requeridosInicial={partido.arbitros_requeridos}
        confirmadoEn={partido.arbitros_confirmados_at}
      />
    </div>
  );
}
