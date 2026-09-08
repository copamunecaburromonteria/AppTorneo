import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components / Server Actions, con la
 * sesión del usuario si existe. Usa la anon/publishable key — respeta Row
 * Level Security. Para operaciones privilegiadas (alta de equipo) usar el
 * cliente de "./admin" en su lugar.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede llamar desde un Server Component sin permiso de
            // escribir cookies; se ignora porque una ruta/Server Action que
            // sí pueda escribir se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
