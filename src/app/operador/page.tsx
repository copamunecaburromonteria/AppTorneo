import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerSesionOperador } from "@/lib/operador/sesion";
import { cerrarSesionOperador } from "./actions";

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  entretiempo: "Entretiempo",
  finalizado: "Finalizado",
  suspendido: "Suspendido",
};

const ESTADO_CLASS: Record<string, string> = {
  programado: "bg-white/10 text-white/60",
  en_curso: "bg-emerald-500/15 text-emerald-300",
  entretiempo: "bg-amber-500/15 text-amber-300",
  finalizado: "bg-white/10 text-white/40",
  suspendido: "bg-red-500/15 text-red-300",
};

function formatHora(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OperadorPage({
  searchParams,
}: {
  searchParams: Promise<{ cancha?: string }>;
}) {
  const sesion = await obtenerSesionOperador();
  if (!sesion) redirect("/operador/login");

  const { cancha: canchaRaw } = await searchParams;
  const cancha = canchaRaw === "2" ? 2 : 1;

  const admin = createAdminClient();
  const { data: partidos } = await admin
    .from("matches")
    .select(
      "id, fase, cancha, fecha_hora_programada, estado, marcador_local, marcador_visitante, equipo_local:equipo_local_id(nombre_equipo), equipo_visitante:equipo_visitante_id(nombre_equipo)"
    )
    .eq("cancha", cancha)
    .order("fecha_hora_programada", { ascending: true });

  return (
    <main className="min-h-screen bg-muneca-black px-4 py-8 text-muneca-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl uppercase tracking-wide">Consola de operador</h1>
            <p className="text-sm text-white/60">{sesion.nombre}</p>
          </div>
          <form action={cerrarSesionOperador}>
            <button
              type="submit"
              className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/20"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="mt-6 flex gap-2">
          {[1, 2].map((n) => (
            <Link
              key={n}
              href={`/operador?cancha=${n}`}
              className={`rounded-md px-4 py-2 text-sm font-bold uppercase transition-colors ${
                cancha === n
                  ? "bg-muneca-yellow text-muneca-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              Cancha {n}
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {(partidos ?? []).map((p) => {
            const local = Array.isArray(p.equipo_local) ? p.equipo_local[0] : p.equipo_local;
            const visitante = Array.isArray(p.equipo_visitante) ? p.equipo_visitante[0] : p.equipo_visitante;
            return (
              <Link
                key={p.id}
                href={`/operador/partido/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-muneca-yellow/40"
              >
                <div>
                  <p className="font-semibold">
                    {local?.nombre_equipo ?? "Por definir"} vs {visitante?.nombre_equipo ?? "Por definir"}
                  </p>
                  <p className="text-xs text-white/50">
                    {formatHora(p.fecha_hora_programada)} · {p.fase}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(p.estado === "en_curso" || p.estado === "entretiempo" || p.estado === "finalizado") && (
                    <span className="font-display text-lg text-muneca-yellow">
                      {p.marcador_local} - {p.marcador_visitante}
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CLASS[p.estado]}`}>
                    {ESTADO_LABEL[p.estado] ?? p.estado}
                  </span>
                </div>
              </Link>
            );
          })}
          {(partidos ?? []).length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
              No hay partidos programados en esta cancha todavía.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
