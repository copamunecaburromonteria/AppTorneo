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

export default async function LiderArbitrosRosterPage() {
  const supabase = await createClient();

  const { data: arbitros, error } = await supabase
    .from("arbitros")
    .select("id, nombre, numero_documento, telefono, correo, activo, notas, created_at")
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">
          Planilla de árbitros
        </h1>
        <p className="mt-1 text-sm text-black/60">
          Árbitros de campo del torneo — nombre, documento y contacto. Desde el calendario los
          asignas a cada partido (hasta 3 por partido, titulares o de reserva).
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
          {arbitros.map((arbitro) => (
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
              </div>
              <ArbitroAccionesLider arbitroId={arbitro.id} activo={arbitro.activo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
