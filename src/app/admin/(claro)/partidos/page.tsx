import { createClient } from "@/lib/supabase/server";
import { DIA_LABEL, SLOTS_POR_DIA, fechaYmdBogota, horaBogota } from "@/lib/franjas-horario";
import { TITULO_JORNADA } from "@/lib/torneo/jornada-labels";
import { PartidoAdminCard } from "./partido-admin-card";
import { IniciarTorneoForm } from "./iniciar-torneo-form";
import { IniciarOctavosForm } from "./iniciar-octavos-form";
import { IniciarCuartosForm } from "./iniciar-cuartos-form";
import { IniciarSemifinalForm } from "./iniciar-semifinal-form";
import { IniciarFinalForm } from "./iniciar-final-form";

type EquipoRel = { nombre_equipo: string } | { nombre_equipo: string }[] | null;

type MatchRow = {
  id: string;
  cancha: number;
  fecha_hora_programada: string;
  estado: string;
  jornada: number | null;
  equipo_local: EquipoRel;
  equipo_visitante: EquipoRel;
};

/** ¿Están los `esperados` partidos de esta jornada generados y todos
 * `finalizado`? Se usa para decidir cuándo mostrar el botón de la
 * siguiente fase (cada una exige que la anterior esté 100% cerrada). */
function faseCompleta(matches: MatchRow[], jornada: number, esperados: number): boolean {
  const delaFase = matches.filter((m) => m.jornada === jornada);
  return delaFase.length === esperados && delaFase.every((m) => m.estado === "finalizado");
}

function nombreEquipo(rel: EquipoRel): string {
  if (!rel) return "Por definir";
  return Array.isArray(rel) ? rel[0]?.nombre_equipo ?? "Por definir" : rel.nombre_equipo;
}

/**
 * Panel para organizar, verificar y reprogramar partidos manualmente,
 * dentro de la grilla fija de franjas del torneo (jueves, viernes y
 * sábado, 7:00 y 8:00 p. m., 2 canchas — ver
 * `especificacion-funcional-ecosistema.md` §19.5).
 *
 * El calendario de la primera ronda se genera automáticamente al validar
 * el equipo #24 (ver `plan-fases-tareas.md`, Fase 2 punto 2, todavía por
 * construir) — este panel NO es ese generador inicial. Es la herramienta
 * manual para, después de eso, verificar que cada partido quedó bien
 * puesto y reprogramarlo puntualmente cuando un equipo tenga un problema
 * de disponibilidad.
 *
 * No hace falta ningún paso extra para que la tabla de posiciones quede
 * bien: `v_standings.pj` (partidos jugados) cuenta solo partidos con
 * `estado = 'finalizado'` — mover la fecha/cancha de un partido
 * `programado` no toca ese conteo hasta que el operador lo cierre de
 * verdad desde la consola de cancha (ver `reprogramarPartido` en
 * `admin/partidos/actions.ts`).
 */
export default async function AdminPartidosPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, cancha, fecha_hora_programada, estado, jornada, equipo_local:equipo_local_id(nombre_equipo), equipo_visitante:equipo_visitante_id(nombre_equipo)"
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
    const { data: config } = await supabase
      .from("torneo_config")
      .select("numero_equipos_torneo")
      .eq("id", 1)
      .maybeSingle();
    const cupoTorneo = config?.numero_equipos_torneo ?? 24;

    const { data: equiposValidados } = await supabase
      .from("teams")
      .select("id")
      .eq("estado_inscripcion", "validado");
    const teamIds = (equiposValidados ?? []).map((e) => e.id);
    const cantidadListos = teamIds.length;

    let cuotasPendientes = 0;
    if (teamIds.length > 0) {
      const { count } = await supabase
        .from("payment_installments")
        .select("id", { count: "exact", head: true })
        .in("team_id", teamIds)
        .neq("estado", "pagada");
      cuotasPendientes = count ?? 0;
    }

    const equiposListos = cantidadListos >= cupoTorneo;
    const pagosCompletos = cuotasPendientes === 0;
    const listoParaIniciar = equiposListos && pagosCompletos;

    return (
      <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
        <h2 className="font-display text-2xl text-muneca-black">Iniciar torneo</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
          Sortea los 4 grupos automáticamente y genera las 60 fechas de la fase de grupos. Octavos,
          cuartos y semifinal se generan aparte, más adelante.
        </p>

        <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              equiposListos
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                : "border-black/10 bg-black/[0.02] text-black/60"
            }`}
          >
            <span>{equiposListos ? "✅" : "⬜"}</span>
            <span>
              {cantidadListos} / {cupoTorneo} equipos inscritos y validados
            </span>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              pagosCompletos
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                : "border-black/10 bg-black/[0.02] text-black/60"
            }`}
          >
            <span>{pagosCompletos ? "✅" : "⬜"}</span>
            <span>
              {pagosCompletos
                ? "Todos los equipos validados tienen su pago completo"
                : `${cuotasPendientes} cuota(s) pendiente(s) entre los equipos validados`}
            </span>
          </div>
        </div>

        {listoParaIniciar ? (
          <IniciarTorneoForm />
        ) : (
          <p className="mx-auto mt-6 max-w-sm text-xs text-black/40">
            El botón &ldquo;Iniciar torneo&rdquo; aparece en cuanto el checklist de arriba esté completo.
          </p>
        )}
      </div>
    );
  }

  const porFecha = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const key = fechaYmdBogota(m.fecha_hora_programada);
    const lista = porFecha.get(key) ?? [];
    lista.push(m);
    porFecha.set(key, lista);
  }
  const fechasOrdenadas = Array.from(porFecha.keys()).sort();

  const totalProgramados = matches.filter((m) => m.estado === "programado").length;
  const totalFinalizados = matches.filter((m) => m.estado === "finalizado").length;

  const partidosDeGrupos = matches.filter((m) => (m.jornada ?? 0) >= 1 && (m.jornada ?? 0) <= 5);
  const faseGruposCompleta =
    partidosDeGrupos.length === 60 && partidosDeGrupos.every((m) => m.estado === "finalizado");
  const octavosExisten = matches.some((m) => m.jornada === 6);
  const octavosCompletos = faseCompleta(matches, 6, 8);
  const cuartosExisten = matches.some((m) => m.jornada === 7);
  const cuartosCompletos = faseCompleta(matches, 7, 4);
  const semifinalExisten = matches.some((m) => m.jornada === 8);
  const semifinalCompletos = faseCompleta(matches, 8, 2);
  const finalExisten = matches.some((m) => m.jornada === 9);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">Partidos</h1>
        <p className="mt-1 text-sm text-black/60">
          Organiza, verifica y reprograma partidos dentro de las franjas fijas del torneo — jueves,
          viernes y sábado, 7:00 y 8:00 p. m., 2 canchas. {totalProgramados} programados ·{" "}
          {totalFinalizados} finalizados.
        </p>
      </div>

      {fechasOrdenadas.map((fechaKey) => {
        const partidosDelDia = porFecha.get(fechaKey)!;
        const fechaRef = new Date(`${fechaKey}T12:00:00-05:00`);
        const dow = fechaRef.getDay();
        const slots = SLOTS_POR_DIA[dow] ?? [];
        const diaLabel = DIA_LABEL[dow] ?? fechaRef.toLocaleDateString("es-CO", { weekday: "long" });
        const fechaLabel = fechaRef.toLocaleDateString("es-CO", { day: "2-digit", month: "long" });

        const porHoraCancha = new Map<string, MatchRow>();
        for (const m of partidosDelDia) {
          const hora = horaBogota(m.fecha_hora_programada);
          porHoraCancha.set(`${hora}-${m.cancha}`, m);
        }

        const jornadaDelDia = partidosDelDia[0]?.jornada ?? null;
        const tituloFase = jornadaDelDia !== null ? TITULO_JORNADA[jornadaDelDia] : null;

        return (
          <div key={fechaKey} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-black/10 px-5 py-3">
              <p className="font-display text-lg uppercase tracking-wide text-muneca-black">
                {diaLabel} · {fechaLabel}
              </p>
              {tituloFase && (
                <span className="rounded-full bg-muneca-purple/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muneca-purple">
                  {tituloFase}
                </span>
              )}
            </div>

            {slots.length === 0 ? (
              <p className="px-5 py-4 text-xs text-rose-600">
                Ese día no cae jueves, viernes ni sábado — revisa este partido, quedó fuera de la
                grilla del torneo.
              </p>
            ) : (
              <div className="grid grid-cols-[64px_1fr_1fr] gap-px bg-black/5 sm:grid-cols-[80px_1fr_1fr]">
                <div className="bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black/40">
                  Hora
                </div>
                <div className="bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black/40">
                  Cancha 1
                </div>
                <div className="bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black/40">
                  Cancha 2
                </div>

                {slots.map((hora) => (
                  <div key={hora} className="contents">
                    <div className="flex items-center bg-white px-3 py-3 text-sm font-semibold text-black/50">
                      {hora}:00
                    </div>
                    {[1, 2].map((cancha) => {
                      const match = porHoraCancha.get(`${hora}-${cancha}`);
                      return (
                        <div key={cancha} className="bg-white px-2 py-2">
                          {match ? (
                            <PartidoAdminCard
                              matchId={match.id}
                              local={nombreEquipo(match.equipo_local)}
                              visitante={nombreEquipo(match.equipo_visitante)}
                              estado={match.estado}
                              fechaYmd={fechaKey}
                              hora={hora}
                              cancha={cancha}
                            />
                          ) : (
                            <p className="px-1 py-2 text-xs text-black/25">Libre</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {faseGruposCompleta && !octavosExisten && (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
          <h2 className="font-display text-2xl text-muneca-black">Fase de grupos cerrada</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
            Los 60 partidos de la fase de grupos ya están finalizados — cuando quieras, genera los
            octavos de final.
          </p>
          <IniciarOctavosForm />
        </div>
      )}

      {octavosCompletos && !cuartosExisten && (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
          <h2 className="font-display text-2xl text-muneca-black">Octavos de final cerrados</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
            Los 8 partidos de octavos ya están finalizados — cuando quieras, genera los cuartos de
            final.
          </p>
          <IniciarCuartosForm />
        </div>
      )}

      {cuartosCompletos && !semifinalExisten && (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
          <h2 className="font-display text-2xl text-muneca-black">Cuartos de final cerrados</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
            Los 4 partidos de cuartos ya están finalizados — cuando quieras, genera la semifinal.
          </p>
          <IniciarSemifinalForm />
        </div>
      )}

      {semifinalCompletos && !finalExisten && (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
          <h2 className="font-display text-2xl text-muneca-black">Semifinal cerrada</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
            Las 2 semifinales ya están finalizadas — cuando quieras, genera la gran final (y el tercer
            puesto, si está habilitado).
          </p>
          <IniciarFinalForm />
        </div>
      )}
    </div>
  );
}
