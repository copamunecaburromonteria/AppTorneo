"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireLiderArbitros } from "@/lib/lider-arbitros/auth";

type ResultadoAccion = { success: true } | { success: false; error: string };

export async function cerrarSesionLiderArbitros() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/lider-arbitros/login");
}

/** Los 3 cupos posibles por partido (ver esquema `partido_arbitros_rol_check`). */
const ROLES_SLOT = ["principal", "asistente1", "asistente2"] as const;

/**
 * Asigna un árbitro de campo a un partido, en el primer cupo libre (hasta 3
 * por partido). `es_reserva` (checkbox del formulario) marca que ese árbitro
 * queda como refuerzo/backup y no cuenta para el check de "partido listo"
 * (ver especificacion-funcional-ecosistema.md §19.4).
 */
export async function asignarArbitroPartido(
  matchId: string,
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireLiderArbitros();
  if (authError) return { success: false, error: authError };

  const arbitroId = formData.get("arbitro_id") as string | null;
  if (!arbitroId) return { success: false, error: "Selecciona un árbitro." };

  const esReserva = formData.get("es_reserva") === "on";

  const { data: existentes, error: errorExistentes } = await supabase
    .from("partido_arbitros")
    .select("rol")
    .eq("match_id", matchId);

  if (errorExistentes) {
    return { success: false, error: `No se pudo verificar la asignación: ${errorExistentes.message}` };
  }

  const rolesUsados = new Set((existentes ?? []).map((r) => r.rol as string));
  const rolLibre = ROLES_SLOT.find((r) => !rolesUsados.has(r));

  if (!rolLibre) {
    return { success: false, error: "Este partido ya tiene 3 árbitros asignados." };
  }

  const { error } = await supabase.from("partido_arbitros").insert({
    match_id: matchId,
    arbitro_id: arbitroId,
    rol: rolLibre,
    es_reserva: esReserva,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Ese árbitro ya está asignado a este partido." };
    }
    return { success: false, error: `No se pudo asignar: ${error.message}` };
  }

  revalidatePath(`/lider-arbitros/partido/${matchId}`);
  revalidatePath("/lider-arbitros");
  return { success: true };
}

export async function quitarArbitroPartido(matchId: string, arbitroId: string): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireLiderArbitros();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase
    .from("partido_arbitros")
    .delete()
    .eq("match_id", matchId)
    .eq("arbitro_id", arbitroId);

  if (error) return { success: false, error: `No se pudo quitar: ${error.message}` };

  revalidatePath(`/lider-arbitros/partido/${matchId}`);
  revalidatePath("/lider-arbitros");
  return { success: true };
}

export async function marcarReserva(
  matchId: string,
  arbitroId: string,
  esReserva: boolean
): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireLiderArbitros();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase
    .from("partido_arbitros")
    .update({ es_reserva: esReserva })
    .eq("match_id", matchId)
    .eq("arbitro_id", arbitroId);

  if (error) return { success: false, error: `No se pudo actualizar: ${error.message}` };

  revalidatePath(`/lider-arbitros/partido/${matchId}`);
  return { success: true };
}

/**
 * Marca el partido como "listo" con la cantidad de árbitros titulares que el
 * Líder de Árbitros decidió que hacían falta, y dispara la notificación al
 * super admin (panel + fila en `notificaciones_admin`; el correo vía Resend
 * todavía no está conectado — ver especificacion-funcional-ecosistema.md §19.6).
 */
export async function confirmarPartidoListo(matchId: string, requeridos: number): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireLiderArbitros();
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.rpc("confirmar_asignacion_arbitros", {
    p_match_id: matchId,
    p_requeridos: requeridos,
  });

  if (error) return { success: false, error: `No se pudo confirmar: ${error.message}` };

  revalidatePath(`/lider-arbitros/partido/${matchId}`);
  revalidatePath("/lider-arbitros");
  return { success: true };
}
