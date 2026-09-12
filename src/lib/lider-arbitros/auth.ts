import { createClient } from "@/lib/supabase/server";

/**
 * Helper compartido para las Server Actions del panel de Líder de Árbitros.
 * Además de exigir sesión iniciada, verifica explícitamente el rol
 * `lider_arbitros` en `profiles` (defensa en profundidad — las políticas
 * RLS de `arbitros`/`partido_arbitros` ya exigen `is_lider_arbitros()`, pero
 * este chequeo da un mensaje de error más claro en vez de un fallo de RLS
 * silencioso).
 */
export async function requireLiderArbitros() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: "No hay sesión activa." } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (profile?.rol !== "lider_arbitros") {
    return { supabase, error: "Esta cuenta no tiene acceso al panel de árbitros." } as const;
  }

  return { supabase, error: null } as const;
}
