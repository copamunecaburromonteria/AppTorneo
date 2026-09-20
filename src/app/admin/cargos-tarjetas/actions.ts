"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { crearLotePagoCargos, aplicarPagoCargos } from "@/lib/pagos/confirmar-cargos";

type ResultadoAccion = { success: true } | { success: false; error: string };

/**
 * Validación manual (mismo patrón que `marcarCuotaPagada` en
 * `admin/actions.ts`) para cuando un equipo paga sus tarjetas por
 * transferencia, Nequi o efectivo en vez de Wompi. Salda TODOS los cargos
 * pendientes del equipo de una sola vez — si algún día hace falta pagar
 * solo algunos, se puede acotar por id más adelante.
 */
export async function marcarCargosTarjetaPagados(teamId: string, formData: FormData): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa." };
  }

  const referencia = (formData.get("referencia") as string | null)?.trim() || "VALIDACION_MANUAL";

  const { data: pendientes } = await supabase
    .from("cargos_tarjetas")
    .select("id")
    .eq("team_id", teamId)
    .eq("estado", "pendiente");

  const ids = (pendientes ?? []).map((c) => c.id as string);
  if (ids.length === 0) {
    return { success: false, error: "No hay cargos pendientes para este equipo." };
  }

  const lote = await crearLotePagoCargos(supabase, ids);
  if (!lote) {
    return { success: false, error: "No hay cargos pendientes para este equipo." };
  }

  const resultado = await aplicarPagoCargos(supabase, { loteId: lote.loteId, referencia });
  if (!resultado.success) return resultado;

  revalidatePath("/admin/cargos-tarjetas");
  return { success: true };
}
