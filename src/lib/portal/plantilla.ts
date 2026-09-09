import type { createClient } from "@/lib/supabase/server";

export type EstadoPlantilla = {
  puedeEditar: boolean;
  motivo: string | null;
  fechaLimite: string | null;
};

function formatFechaCorta(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calcula si el equipo puede editar su plantilla ahora mismo, según las
 * reglas del torneo: hay que estar validado (1a partida pagada), y hay
 * plazo hasta la fecha de pago de esa partida + `dias_gracia_plantilla`,
 * con tope `dias_limite_previo_torneo` días antes de `fecha_inicio_torneo`
 * (si ya está definida). Se recalcula siempre en el servidor — nunca se
 * confía en lo que diga el cliente — tanto para mostrar el aviso en el
 * portal como para bloquear las acciones que modifican jugadores.
 */
export async function evaluarEstadoPlantilla(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string
): Promise<EstadoPlantilla> {
  const [{ data: team }, { data: config }, { data: pago }, { data: cuota1 }] = await Promise.all([
    supabase.from("teams").select("estado_inscripcion").eq("id", teamId).single(),
    supabase
      .from("torneo_config")
      .select(
        "dias_gracia_plantilla, dias_limite_previo_torneo, fecha_inicio_torneo, requiere_pago_completo_para_portal"
      )
      .eq("id", 1)
      .single(),
    supabase.from("payments").select("tipo_pago").eq("team_id", teamId).maybeSingle(),
    supabase
      .from("payment_installments")
      .select("fecha_pago")
      .eq("team_id", teamId)
      .eq("numero_cuota", 1)
      .maybeSingle(),
  ]);

  if (!team || team.estado_inscripcion !== "validado") {
    return {
      puedeEditar: false,
      motivo:
        "Tu inscripción todavía no está validada. En cuanto se confirme el pago de tu primera partida vas a poder cargar la plantilla.",
      fechaLimite: null,
    };
  }

  if (config?.requiere_pago_completo_para_portal && pago?.tipo_pago !== "completo") {
    return {
      puedeEditar: false,
      motivo:
        "Este torneo requiere el pago completo del plan de cuotas para habilitar la plantilla. Todavía tienes partidas pendientes.",
      fechaLimite: null,
    };
  }

  if (!cuota1?.fecha_pago) {
    return {
      puedeEditar: false,
      motivo: "Aún no se registra el pago de tu primera partida.",
      fechaLimite: null,
    };
  }

  const diasGracia = config?.dias_gracia_plantilla ?? 5;
  const diasLimitePrevio = config?.dias_limite_previo_torneo ?? 3;

  const limitePorPago = new Date(`${cuota1.fecha_pago}T00:00:00`);
  limitePorPago.setDate(limitePorPago.getDate() + diasGracia);

  let limite = limitePorPago;
  if (config?.fecha_inicio_torneo) {
    const limitePorTorneo = new Date(`${config.fecha_inicio_torneo}T00:00:00`);
    limitePorTorneo.setDate(limitePorTorneo.getDate() - diasLimitePrevio);
    if (limitePorTorneo < limite) limite = limitePorTorneo;
  }

  const fechaLimiteStr = limite.toISOString().slice(0, 10);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (hoy > limite) {
    return {
      puedeEditar: false,
      motivo: `El plazo para completar la plantilla venció el ${formatFechaCorta(fechaLimiteStr)}. Si necesitas hacer un cambio, contacta a la organización.`,
      fechaLimite: fechaLimiteStr,
    };
  }

  return { puedeEditar: true, motivo: null, fechaLimite: fechaLimiteStr };
}
