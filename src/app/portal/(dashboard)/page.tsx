import { createClient } from "@/lib/supabase/server";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

/**
 * `/portal` — el propio equipo, logueado, gestionando su plantilla y datos.
 * Todo el contenido vive en `PortalDashboard` (compartido con la vista de
 * admin en `/admin/equipos/[id]`, que renderiza lo mismo para el equipo que
 * el admin elija — ver `claude/plan-fases-tareas.md`); acá solo se resuelve
 * el `teamId` desde la sesión, como siempre.
 */
export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user!.id)
    .single();

  const teamId = profile!.team_id as string;

  return <PortalDashboard teamId={teamId} error={error} />;
}
