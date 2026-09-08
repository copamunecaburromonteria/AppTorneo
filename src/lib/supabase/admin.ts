import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la service role key: acceso total, ignora Row
 * Level Security. SOLO se debe usar en código de servidor (Server Actions,
 * Route Handlers) — nunca debe llegar al navegador.
 *
 * Se necesita para el alta de un equipo nuevo: en ese momento el usuario
 * todavía no tiene una fila en `profiles` con `team_id`, así que las
 * políticas RLS de "equipo" no le permiten crear su propio equipo. El alta
 * completa (usuario de Auth + teams + profiles + team_delegado + team_staff
 * + payments) se hace como una operación de servidor controlada.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor. " +
        "Se obtiene en Supabase → Project Settings → API → service_role (secreta, nunca se sube a git)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
