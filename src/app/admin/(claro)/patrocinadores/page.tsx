import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PatrocinadorForm } from "@/app/admin/patrocinadores/patrocinador-form";
import { PatrocinadorAcciones } from "@/app/admin/patrocinadores/patrocinador-acciones";
import { NIVEL_LABEL, type NivelPatrocinio } from "@/lib/patrocinadores/tipos";

/**
 * Panel admin de patrocinadores — Fase 1 del sistema de "espacios de
 * patrocinio" (ver `src/lib/patrocinadores/slots.ts`). Reemplaza el arreglo
 * harcodeado que antes vivía en `src/lib/patrocinadores-reales.ts`: desde
 * acá Fernando puede agregar/editar/ocultar patrocinadores y subir su logo
 * sin tocar código (migración `23_patrocinadores`, bucket de Storage
 * `patrocinadores`).
 *
 * Vive dentro del grupo de rutas `(claro)` (igual que arbitros/operadores/
 * partidos/preinscripciones/cargos-tarjetas) para heredar el layout con
 * SiteHeader/Footer, breadcrumbs y AdminNav — los archivos de soporte
 * (actions.ts, patrocinador-form.tsx, patrocinador-acciones.tsx) se quedan
 * en la carpeta plana `admin/patrocinadores/`, mismo patrón que esas otras
 * secciones.
 */
export default async function AdminPatrocinadoresPage() {
  const supabase = await createClient();

  const { data: patrocinadores, error } = await supabase
    .from("patrocinadores")
    .select("id, nombre, nivel, logo_url, link_url, slots, orden, activo, activo_desde, activo_hasta")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">
          Patrocinadores
        </h1>
        <p className="mt-1 text-sm text-muneca-black/60">
          Marcas que aparecen en la Copa. Marca los espacios donde quieres que aparezca cada una
          — carrusel del Home, tabla de posiciones, votación MVP, resultado del MVP del partido y
          perfil de equipo ya están conectados. La galería queda pendiente hasta que exista esa
          página. Un patrocinador oculto o fuera de su rango de fechas simplemente no se muestra,
          sin borrarlo.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
          Agregar patrocinador
        </h2>
        <PatrocinadorForm modo="crear" />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
          Patrocinadores registrados
        </h2>

        {error && (
          <p className="text-sm text-rose-600">No se pudieron cargar: {error.message}</p>
        )}

        {!error && (!patrocinadores || patrocinadores.length === 0) && (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-muneca-black/50">
            Todavía no hay patrocinadores registrados.
          </p>
        )}

        {patrocinadores && patrocinadores.length > 0 && (
          <div className="divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
            {patrocinadores.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md border border-black/10 bg-black/[0.02] p-1.5">
                    <Image
                      src={p.logo_url}
                      alt={p.nombre}
                      width={120}
                      height={72}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-muneca-black">{p.nombre}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-black/5 text-muneca-black/50"
                        }`}
                      >
                        {p.activo ? "Visible" : "Oculto"}
                      </span>
                    </div>
                    <p className="text-sm text-muneca-black/60">
                      {NIVEL_LABEL[p.nivel as NivelPatrocinio] ?? p.nivel}
                      {p.link_url ? ` · ${p.link_url}` : ""}
                    </p>
                    <p className="text-xs text-muneca-black/40">
                      {p.slots && p.slots.length > 0 ? p.slots.join(", ") : "Sin espacio asignado"}
                      {(p.activo_desde || p.activo_hasta) &&
                        ` · ${p.activo_desde ?? "sin inicio"} → ${p.activo_hasta ?? "sin fin"}`}
                    </p>
                  </div>
                </div>
                <PatrocinadorAcciones patrocinador={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
