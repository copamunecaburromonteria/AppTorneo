import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/** getDay(): 0=domingo ... 4=jueves, 5=viernes, 6=sábado. */
const DIA_LABEL: Record<number, string> = { 4: "Jueves", 5: "Viernes", 6: "Sábado" };

/** Franjas horarias fijas del torneo (ver especificacion-funcional-ecosistema.md §19.5). */
const SLOTS_POR_DIA: Record<number, number[]> = {
  4: [19, 20, 21, 22],
  5: [19, 20, 21, 22],
  6: [17, 18, 19, 20, 21],
};

type EquipoRel = { nombre_equipo: string } | { nombre_equipo: string }[] | null;

type PartidoArbitroRow = { arbitro_id: string; es_reserva: boolean };

type MatchRow = {
  id: string;
  cancha: number;
  fecha_hora_programada: string;
  estado: string;
  arbitros_requeridos: number | null;
  arbitros_confirmados_at: string | null;
  equipo_local: EquipoRel;
  equipo_visitante: EquipoRel;
  partido_arbitros: PartidoArbitroRow[] | null;
};

function nombreEquipo(rel: EquipoRel): string {
  if (!rel) return "Por definir";
  return Array.isArray(rel) ? rel[0]?.nombre_equipo ?? "Por definir" : rel.nombre_equipo;
}

export default async function LiderArbitrosCalendarioPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, cancha, fecha_hora_programada, estado, arbitros_requeridos, arbitros_confirmados_at, equipo_local:equipo_local_id(nombre_equipo), equipo_visitante:equipo_visitante_id(nombre_equipo), partido_arbitros(arbitro_id, es_reserva)"
    )
    .order("fecha_hora_programada", { ascending: true });

  if (error) {
    return (
      <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-600">
        No se pudo cargar el calendario: {error.message}
      </p>
    );
  }

  const matches = (data ?? []) as unknown as MatchRow[];

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
        <h2 className="font-display text-2xl text-muneca-black">Todavía no hay partidos programados</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
          El calendario se genera cuando se valida el equipo #24 y el administrador confirma el
          sorteo. En cuanto exista, los partidos aparecerán aquí para que asignes los árbitros.
        </p>
      </div>
    );
  }

  const porFecha = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const key = m.fecha_hora_programada.slice(0, 10);
    const lista = porFecha.get(key);
    if (lista) lista.push(m);
    else porFecha.set(key, [m]);
  }

  const fechasOrdenadas = Array.from(porFecha.keys()).sort();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">Calendario</h1>
        <p className="mt-1 text-sm text-black/60">
          Jueves y viernes 7:00–10:00 p.m., sábado 5:00–9:00 p.m. — un partido por hora, por cancha.
          Toca un partido para asignarle árbitros.
        </p>
      </div>

      {fechasOrdenadas.map((fechaKey) => {
        const partidosDelDia = porFecha.get(fechaKey)!;
        const fechaRef = new Date(partidosDelDia[0].fecha_hora_programada);
        const dow = fechaRef.getDay();
        const slots = SLOTS_POR_DIA[dow] ?? [];
        const diaLabel = DIA_LABEL[dow] ?? fechaRef.toLocaleDateString("es-CO", { weekday: "long" });
        const fechaLabel = fechaRef.toLocaleDateString("es-CO", { day: "2-digit", month: "long" });

        const porHoraCancha = new Map<string, MatchRow>();
        for (const m of partidosDelDia) {
          const hora = new Date(m.fecha_hora_programada).getHours();
          porHoraCancha.set(`${hora}-${m.cancha}`, m);
        }

        return (
          <div key={fechaKey} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="border-b border-black/10 px-5 py-3">
              <p className="font-display text-lg uppercase tracking-wide text-muneca-black">
                {diaLabel} · {fechaLabel}
              </p>
            </div>

            <div className="grid grid-cols-[64px_1fr_1fr] gap-px bg-black/5 text-xs font-semibold uppercase tracking-wide text-black/40 sm:grid-cols-[80px_1fr_1fr]">
              <div className="bg-white px-3 py-2">Hora</div>
              <div className="bg-white px-3 py-2">Cancha 1</div>
              <div className="bg-white px-3 py-2">Cancha 2</div>
            </div>

            {slots.map((hora) => (
              <div
                key={hora}
                className="grid grid-cols-[64px_1fr_1fr] gap-px bg-black/5 sm:grid-cols-[80px_1fr_1fr]"
              >
                <div className="flex items-center bg-white px-3 py-3 text-sm font-semibold text-black/50">
                  {hora}:00
                </div>
                {[1, 2].map((cancha) => {
                  const match = porHoraCancha.get(`${hora}-${cancha}`);

                  if (!match) {
                    return (
                      <div key={cancha} className="bg-white px-3 py-3 text-xs text-black/25">
                        Libre
                      </div>
                    );
                  }

                  const titulares = (match.partido_arbitros ?? []).filter((a) => !a.es_reserva).length;
                  const requeridos = match.arbitros_requeridos;
                  const confirmado = Boolean(match.arbitros_confirmados_at);

                  let estadoLabel = "Sin asignar";
                  let estadoClase = "bg-black/5 text-black/50";
                  if (confirmado) {
                    estadoLabel = "Listo ✓";
                    estadoClase = "bg-emerald-500/15 text-emerald-700";
                  } else if (titulares > 0) {
                    estadoLabel = requeridos ? `${titulares}/${requeridos} asignado(s)` : `${titulares} asignado(s)`;
                    estadoClase = "bg-amber-400/20 text-amber-700";
                  }

                  return (
                    <Link
                      key={cancha}
                      href={`/lider-arbitros/partido/${match.id}`}
                      className="flex flex-col gap-1.5 bg-white px-3 py-3 text-xs transition-colors hover:bg-muneca-purple/5"
                    >
                      <span className="font-semibold leading-snug text-muneca-black">
                        {nombreEquipo(match.equipo_local)} vs {nombreEquipo(match.equipo_visitante)}
                      </span>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 font-semibold ${estadoClase}`}
                      >
                        {estadoLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
