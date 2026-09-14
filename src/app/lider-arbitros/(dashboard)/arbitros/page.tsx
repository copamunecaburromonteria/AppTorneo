import { createClient } from "@/lib/supabase/server";
import { NuevoArbitroFormLider } from "./nuevo-arbitro-form";
import { ArbitroAccionesLider } from "./arbitro-acciones";

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type HistorialArbitro = {
  partidos_dirigidos: number;
  calificacion_promedio: number | null;
  total_calificaciones: number;
};

export default async function LiderArbitrosRosterPage() {
  const supabase = await createClient();

  const [{ data: arbitros, error }, { data: historial }] = await Promise.all([
    supabase
      .from("arbitros")
      .select("id, nombre, numero_documento, telefono, correo, activo, notas, created_at")
      .order("nombre", { ascending: true }),
    supabase
      .from("v_arbitro_historial")
      .select("arbitro_id, partidos_dirigidos, calificacion_promedio, total_calificaciones"),
  ]);

  const historialPorArbitro = new Map<string, HistorialArbitro>(
    (historial ?? []).map((h) => [
      h.arbitro_id as string,
      {
        partidos_dirigidos: (h.partidos_dirigidos as number) ?? 0,
        calificacion_promedio: h.calificacion_promedio as number | null,
        total_calificaciones: (h.total_calificaciones as number) ?? 0,
      },
    ])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">
          Planilla de árbitros
        </h1>
        <p className="mt-1 text-sm text-black/60">
          Árbitros de campo del torneo — nombre, documento y contacto. Desde el calendario los
          asignas a cada partido (hasta 3 por partido, titulares o de reserva). Cada árbitro
          muestra su hoja de vida (partidos dirigidos y calificación promedio de los
          aficionados vía QR) — es información interna, solo la ves tú y el super admin.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl text-muneca-black">Agregar árbitro</h2>
        <div className="mt-5">
          <NuevoArbitroFormLider />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-600">
          No se pudieron cargar los árbitros: {error.message}
        </p>
      )}

      {!error && (!arbitros || arbitros.length === 0) && (
        <p className="text-sm text-black/50">Todavía no hay árbitros registrados en la planilla.</p>
      )}

      {arbitros && arbitros.length > 0 && (
        <div className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          {arbitros.map((arbitro) => {
            const h = historialPorArbitro.get(arbitro.id);
            return (
              <div key={arbitro.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-muneca-black">{arbitro.nombre}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        arbitro.activo
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-black/5 text-black/40"
                      }`}
                    >
                      {arbitro.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-sm text-black/60">Doc. {arbitro.numero_documento}</p>
                  <p className="text-sm text-black/60">
                    {[arbitro.telefono, arbitro.correo].filter(Boolean).join(" · ") ||
                      "Sin datos de contacto adicionales"}
                  </p>
                  {arbitro.notas && <p className="mt-1 text-xs text-black/40">{arbitro.notas}</p>}
                  <p className="text-xs text-black/35">Registrado el {formatFecha(arbitro.created_at)}</p>
                  <p className="mt-1.5 text-xs font-semibold text-muneca-purple">
                    {h && h.partidos_dirigidos > 0
                      ? `${h.partidos_dirigidos} partido${h.partidos_dirigidos === 1 ? "" : "s"} dirigido${h.partidos_dirigidos === 1 ? "" : "s"}${
                          h.calificacion_promedio != null
                            ? ` · ⭐ ${h.calificacion_promedio.toFixed(1)} (${h.total_calificaciones} voto${h.total_calificaciones === 1 ? "" : "s"})`
                            : " · sin calificaciones aún"
                        }`
                      : "Todavía no ha dirigido partidos confirmados"}
                  </p>
                </div>
                <ArbitroAccionesLider arbitroId={arbitro.id} activo={arbitro.activo} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
