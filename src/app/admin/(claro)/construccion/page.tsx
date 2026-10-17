import { Construction } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IconHeading } from "@/components/admin/icon-heading";
import { ModoConstruccionForm } from "./modo-construccion-form";

/**
 * Panel para prender/apagar la página pública "en construcción" y fijar la
 * fecha meta de su contador — sin tocar código ni Vercel (pedido de
 * Fernando, 2026-10-17: poder seguir trabajando en el sitio real mientras
 * el público ve el contador). Ver `src/middleware.ts` para el gate y
 * `/en-construccion` para la página pública.
 */
export default async function AdminConstruccionPage() {
  const supabase = await createClient();
  const { data: config, error } = await supabase
    .from("torneo_config")
    .select("modo_construccion_activo, modo_construccion_fecha_meta")
    .eq("id", 1)
    .single();

  if (error) {
    return <p className="text-sm text-rose-600">No se pudo cargar la configuración: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <IconHeading icon={Construction} color="purple" size="lg">
          Modo construcción
        </IconHeading>
        <p className="mt-1 max-w-2xl text-sm text-muneca-black/60">
          Mientras está activo, cualquier visitante sin sesión de admin ve la página &quot;en
          construcción&quot; con el contador, en vez del sitio real — tú sigues viendo y usando el
          sitio real con normalidad porque ya tienes sesión iniciada acá, sin necesidad de ningún link
          especial.
        </p>
      </div>

      <ModoConstruccionForm
        activoInicial={config?.modo_construccion_activo ?? false}
        fechaMetaInicialIso={config?.modo_construccion_fecha_meta ?? null}
      />
    </div>
  );
}
