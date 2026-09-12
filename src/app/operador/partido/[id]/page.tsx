import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerSesionOperador } from "@/lib/operador/sesion";
import { EstadoAcciones } from "@/components/operador/estado-acciones";
import { FormularioEvento } from "@/components/operador/formulario-evento";
import { DeshacerBoton } from "@/components/operador/deshacer-boton";
import { ArbitroForm } from "@/components/operador/arbitro-form";

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  entretiempo: "Entretiempo",
  finalizado: "Finalizado",
  suspendido: "Suspendido",
};

const TIPO_ICONO: Record<string, string> = {
  gol: "⚽",
  autogol: "⚽ (autogol)",
  tarjeta_amarilla: "🟨",
  tarjeta_roja: "🟥",
  cambio: "🔁",
};

type Jugador = { id: string; nombre: string; numero_camiseta: number | null };

export default async function PartidoOperadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await obtenerSesionOperador();
  if (!sesion) redirect("/operador/login");

  const { id: matchId } = await params;
  const admin = createAdminClient();

  const { data: partido } = await admin
    .from("matches")
    .select(
      "id, fase, cancha, fecha_hora_programada, estado, marcador_local, marcador_visitante, equipo_local_id, equipo_visitante_id, equipo_local:equipo_local_id(nombre_equipo), equipo_visitante:equipo_visitante_id(nombre_equipo)"
    )
    .eq("id", matchId)
    .maybeSingle();

  if (!partido) notFound();

  const local = Array.isArray(partido.equipo_local) ? partido.equipo_local[0] : partido.equipo_local;
  const visitante = Array.isArray(partido.equipo_visitante)
    ? partido.equipo_visitante[0]
    : partido.equipo_visitante;

  const [
    { data: jugadoresLocal },
    { data: jugadoresVisitante },
    { data: eventosRaw },
    { data: arbitrosAsignadosRaw },
    { data: arbitrosActivos },
  ] = await Promise.all([
    admin
      .from("players")
      .select("id, nombre, numero_camiseta")
      .eq("team_id", partido.equipo_local_id)
      .eq("es_jugador", true)
      .neq("estado", "dado_de_baja")
      .order("numero_camiseta", { ascending: true }),
    partido.equipo_visitante_id
      ? admin
          .from("players")
          .select("id, nombre, numero_camiseta")
          .eq("team_id", partido.equipo_visitante_id)
          .eq("es_jugador", true)
          .neq("estado", "dado_de_baja")
          .order("numero_camiseta", { ascending: true })
      : Promise.resolve({ data: [] as Jugador[] }),
    admin
      .from("match_events")
      .select(
        "id, tipo, minuto, equipo_id, jugador_id, jugador:jugador_id(nombre), equipo:equipo_id(nombre_equipo)"
      )
      .eq("match_id", matchId)
      .eq("anulado", false)
      .order("creado_at", { ascending: false }),
    admin.from("partido_arbitros").select("arbitro_id, rol, arbitro:arbitro_id(nombre)").eq("match_id", matchId),
    admin.from("arbitros").select("id, nombre").eq("activo", true).order("nombre", { ascending: true }),
  ]);

  const eventos = (eventosRaw ?? []).map((e) => {
    const jugador = Array.isArray(e.jugador) ? e.jugador[0] : e.jugador;
    const equipo = Array.isArray(e.equipo) ? e.equipo[0] : e.equipo;
    return {
      id: e.id as string,
      tipo: e.tipo as string,
      minuto: e.minuto as number,
      jugadorNombre: jugador?.nombre ?? "—",
      equipoNombre: equipo?.nombre_equipo ?? "—",
    };
  });

  const asignados = (arbitrosAsignadosRaw ?? []).map((a) => {
    const arbitro = Array.isArray(a.arbitro) ? a.arbitro[0] : a.arbitro;
    return { arbitro_id: a.arbitro_id as string, rol: a.rol as string, nombre: arbitro?.nombre ?? "—" };
  });

  const arbitrosDisponibles = (arbitrosActivos ?? []).filter(
    (a) => !asignados.some((x) => x.arbitro_id === a.id)
  );

  return (
    <main className="min-h-screen bg-muneca-black px-4 py-8 text-muneca-white sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/operador" className="text-sm text-white/50 hover:text-white/80">
          ← Volver a la consola
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Cancha {partido.cancha} · {partido.fase} · {ESTADO_LABEL[partido.estado] ?? partido.estado}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="flex-1 text-sm font-semibold sm:text-lg">{local?.nombre_equipo ?? "Por definir"}</p>
            <p className="font-display text-3xl text-muneca-yellow">
              {partido.marcador_local} - {partido.marcador_visitante}
            </p>
            <p className="flex-1 text-right text-sm font-semibold sm:text-lg">
              {visitante?.nombre_equipo ?? "Por definir"}
            </p>
          </div>
          <div className="mt-4">
            <EstadoAcciones matchId={partido.id} estado={partido.estado} />
          </div>
        </div>

        <ArbitroForm matchId={partido.id} arbitrosDisponibles={arbitrosDisponibles} asignados={asignados} />

        {partido.estado === "en_curso" && partido.equipo_visitante_id && (
          <FormularioEvento
            matchId={partido.id}
            equipoLocalId={partido.equipo_local_id}
            equipoLocalNombre={local?.nombre_equipo ?? "Local"}
            jugadoresLocal={jugadoresLocal ?? []}
            equipoVisitanteId={partido.equipo_visitante_id}
            equipoVisitanteNombre={visitante?.nombre_equipo ?? "Visitante"}
            jugadoresVisitante={jugadoresVisitante ?? []}
          />
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Eventos</p>
            {eventos.length > 0 && <DeshacerBoton matchId={partido.id} />}
          </div>
          <div className="mt-3 space-y-2">
            {eventos.length === 0 && (
              <p className="text-xs text-white/50">Sin eventos registrados todavía.</p>
            )}
            {eventos.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm"
              >
                <span>
                  {TIPO_ICONO[e.tipo] ?? e.tipo} {e.jugadorNombre}{" "}
                  <span className="text-white/40">· {e.equipoNombre}</span>
                </span>
                <span className="text-white/50">{e.minuto}&apos;</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
