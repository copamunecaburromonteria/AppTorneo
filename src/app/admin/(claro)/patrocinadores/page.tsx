import { Handshake, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PatrocinadorForm } from "@/app/admin/patrocinadores/patrocinador-form";
import { PatrocinadoresTabla, type PatrocinadorFila } from "@/app/admin/patrocinadores/patrocinadores-tabla";
import { IconHeading } from "@/components/admin/icon-heading";

/**
 * Panel admin de patrocinadores — Fase 1 del sistema de "espacios de
 * patrocinio" (ver `src/lib/patrocinadores/slots.ts`), con Fase 2 (SponsorSlot
 * desplegado en el sitio) y Fase 3 (tracking con GA4) ya encima. Reemplaza el
 * arreglo harcodeado que antes vivía en `src/lib/patrocinadores-reales.ts`:
 * desde acá Fernando puede agregar/editar/ocultar patrocinadores y subir su
 * logo sin tocar código (migración `23_patrocinadores`, bucket de Storage
 * `patrocinadores`).
 *
 * Rediseño "más colorido" (2026-09-21, a partir de una captura de
 * referencia que le gustó a Fernando): layout de dos columnas — tabla con
 * búsqueda/filtro a la izquierda, formulario de alta siempre visible a la
 * derecha — íconos en los encabezados y en las acciones de cada fila. Los
 * datos y las Server Actions no cambiaron, solo la presentación (ver
 * `patrocinadores-tabla.tsx`).
 *
 * Vive dentro del grupo de rutas `(claro)` (igual que arbitros/operadores/
 * partidos/preinscripciones/cargos-tarjetas) para heredar el layout con
 * SiteHeader/Footer, breadcrumbs y AdminNav — los archivos de soporte
 * (actions.ts, patrocinador-form.tsx, patrocinadores-tabla.tsx) se quedan en
 * la carpeta plana `admin/patrocinadores/`, mismo patrón que esas otras
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
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div>
          <IconHeading icon={Handshake} color="purple" size="lg">
            Patrocinadores
          </IconHeading>
          <p className="mt-1 text-sm text-muneca-black/60">
            Marcas que hacen posible la Copa Muñeca e&apos;Burro. Gestiona, organiza y muestra a
            nuestros aliados.
          </p>
        </div>

        {error && <p className="text-sm text-rose-600">No se pudieron cargar: {error.message}</p>}

        {!error && (
          <PatrocinadoresTabla patrocinadores={(patrocinadores ?? []) as PatrocinadorFila[]} />
        )}
      </div>

      <div className="space-y-3">
        <IconHeading icon={Plus} color="purple">
          Agregar patrocinador
        </IconHeading>
        <PatrocinadorForm modo="crear" />
      </div>
    </div>
  );
}
