import { createClient } from "@/lib/supabase/server";
import { NuevaEscuelaForm } from "@/app/admin/arbitros/nueva-escuela-form";
import { NuevoArbitroForm } from "@/app/admin/arbitros/nuevo-arbitro-form";
import { EscuelaAcciones } from "@/app/admin/arbitros/escuela-acciones";
import { ArbitroAcciones } from "@/app/admin/arbitros/arbitro-acciones";

type EscuelaConArbitro = { id: string; nombre: string } | null;

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminArbitrosPage() {
  const supabase = await createClient();

  const [{ data: escuelas, error: escuelasError }, { data: arbitros, error: arbitrosError }] =
    await Promise.all([
      supabase
        .from("escuelas_arbitrales")
        .select("id, nombre, representante, telefono, correo, notas, created_at")
        .order("nombre", { ascending: true }),
      supabase
        .from("arbitros")
        .select(
          "id, nombre, numero_documento, telefono, correo, activo, notas, created_at, escuelas_arbitrales(id, nombre)"
        )
        .order("nombre", { ascending: true }),
    ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">
          Árbitros
        </h1>
        <p className="mt-1 text-sm text-muneca-black/60">
          Registro de escuelas arbitrales y la planilla de árbitros del torneo. La
          coordinación de quién dirige cada partido sigue siendo manual por WhatsApp por
          ahora — la asignación puntual a cada partido se hace desde el panel de Líder de
          Árbitros.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
          Escuelas arbitrales
        </h2>

        <NuevaEscuelaForm />

        {escuelasError && (
          <p className="text-sm text-rose-600">
            No se pudieron cargar las escuelas: {escuelasError.message}
          </p>
        )}

        {!escuelasError && (!escuelas || escuelas.length === 0) && (
          <p className="text-sm text-muneca-black/50">
            Todavía no hay escuelas arbitrales registradas.
          </p>
        )}

        {escuelas && escuelas.length > 0 && (
          <div className="divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
            {escuelas.map((escuela) => (
              <div
                key={escuela.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-muneca-black">{escuela.nombre}</p>
                  <p className="text-sm text-muneca-black/60">
                    {[escuela.representante, escuela.telefono, escuela.correo]
                      .filter(Boolean)
                      .join(" · ") || "Sin datos de contacto adicionales"}
                  </p>
                  {escuela.notas && (
                    <p className="mt-1 text-xs text-muneca-black/40">{escuela.notas}</p>
                  )}
                  <p className="text-xs text-muneca-black/40">
                    Registrada el {formatFecha(escuela.created_at)}
                  </p>
                </div>
                <EscuelaAcciones escuelaId={escuela.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
          Planilla de árbitros del torneo
        </h2>

        <NuevoArbitroForm escuelas={escuelas ?? []} />

        {arbitrosError && (
          <p className="text-sm text-rose-600">
            No se pudieron cargar los árbitros: {arbitrosError.message}
          </p>
        )}

        {!arbitrosError && (!arbitros || arbitros.length === 0) && (
          <p className="text-sm text-muneca-black/50">
            Todavía no hay árbitros registrados en la planilla del torneo.
          </p>
        )}

        {arbitros && arbitros.length > 0 && (
          <div className="divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
            {arbitros.map((arbitro) => {
              const escuelaRaw = arbitro.escuelas_arbitrales as unknown as EscuelaConArbitro;
              const escuela = Array.isArray(escuelaRaw)
                ? (escuelaRaw[0] as EscuelaConArbitro)
                : escuelaRaw;

              return (
                <div
                  key={arbitro.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-muneca-black">{arbitro.nombre}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          arbitro.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-black/5 text-muneca-black/50"
                        }`}
                      >
                        {arbitro.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="text-sm text-muneca-black/60">
                      Doc. {arbitro.numero_documento}
                      {escuela ? ` · ${escuela.nombre}` : " · Independiente"}
                    </p>
                    <p className="text-sm text-muneca-black/60">
                      {[arbitro.telefono, arbitro.correo].filter(Boolean).join(" · ") ||
                        "Sin datos de contacto adicionales"}
                    </p>
                    {arbitro.notas && (
                      <p className="mt-1 text-xs text-muneca-black/40">{arbitro.notas}</p>
                    )}
                    <p className="text-xs text-muneca-black/40">
                      Registrado el {formatFecha(arbitro.created_at)}
                    </p>
                  </div>
                  <ArbitroAcciones arbitroId={arbitro.id} activo={arbitro.activo} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
