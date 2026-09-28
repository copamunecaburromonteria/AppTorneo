import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

/**
 * `/admin/equipos/[id]` — el super admin viendo y editando el portal de UN
 * equipo específico, con el mismo componente que ve el propio delegado en
 * `/portal` (`PortalDashboard`, `modoAdmin`) — 2026-09-28, a pedido de
 * Fernando: "el super administrador quiero que tenga el privilegio de ver
 * incluso la vista que tenga el rol del dueño de equipo... que pueda editar
 * que pueda corregir" (alcance confirmado: todo el portal, no solo la
 * plantilla) más "agregar el logo de cada equipo y otras cosas más, por si
 * hay algún problema con la información y no haya forma de cómo editarla".
 *
 * Vive dentro de `(claro)` así que el layout ya verificó sesión + rol admin
 * (`(claro)/layout.tsx`) — acá no hace falta repetir esa verificación para
 * la lectura de la página; sí la repiten las Server Actions que se llaman
 * desde `PortalDashboard` (`requireEquipo` en `portal/actions.ts` y
 * `requireAdmin` en `admin/equipos/actions.ts`), porque una Server Action
 * puede invocarse fuera del árbol de esta página.
 *
 * Si el `id` no corresponde a ningún equipo, `PortalDashboard` ya maneja el
 * caso "equipo no encontrado" con un mensaje en vez de reventar (mismo
 * camino que ya usa cuando a un delegado le falta el team_id) — ver esa
 * verificación en `PortalDashboard` antes de las queries dependientes.
 */
export default async function AdminEquipoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: equipo } = await supabase.from("teams").select("id, nombre_equipo").eq("id", id).single();

  if (!equipo) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-8 text-center">
        <p className="text-sm text-muneca-black/60">No se encontró ningún equipo con ese id.</p>
        <Link
          href="/admin"
          className="mt-3 inline-block text-sm font-semibold text-muneca-purple hover:underline"
        >
          ← Volver al panel
        </Link>
      </div>
    );
  }

  return <PortalDashboard teamId={id} error={error} modoAdmin />;
}
