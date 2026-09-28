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
 * `fecha_pago`/`pago_reportado_at` son `timestamp with time zone` (momento
 * exacto), no una fecha simple como `fecha_limite` — a diferencia de esa, no
 * se les puede pegar "T00:00:00" directo (arma un string irreconocible, ej.
 * "2026-09-26T17:17:18.734+00:00T00:00:00", que produce una fecha inválida
 * y hace explotar el `.toISOString()` de más abajo). Se toma solo el día
 * calendario y se arma la medianoche local desde ahí.
 */
function calcularLimite(
  fechaBaseYmd: string,
  config: { dias_gracia_plantilla: number | null; dias_limite_previo_torneo: number | null; fecha_inicio_torneo: string | null } | null
): { fecha: Date; str: string } {
  const diasGracia = config?.dias_gracia_plantilla ?? 5;
  const diasLimitePrevio = config?.dias_limite_previo_torneo ?? 3;

  const limitePorPago = new Date(`${fechaBaseYmd}T00:00:00`);
  limitePorPago.setDate(limitePorPago.getDate() + diasGracia);

  let limite = limitePorPago;
  if (config?.fecha_inicio_torneo) {
    const limitePorTorneo = new Date(`${config.fecha_inicio_torneo}T00:00:00`);
    limitePorTorneo.setDate(limitePorTorneo.getDate() - diasLimitePrevio);
    if (limitePorTorneo < limite) limite = limitePorTorneo;
  }

  return { fecha: limite, str: limite.toISOString().slice(0, 10) };
}

/**
 * Calcula si el equipo puede editar su plantilla ahora mismo, según las
 * reglas del torneo: hay que estar validado (1a partida pagada), y hay
 * plazo hasta la fecha de pago de esa partida + `dias_gracia_plantilla`,
 * con tope `dias_limite_previo_torneo` días antes de `fecha_inicio_torneo`
 * (si ya está definida). Se recalcula siempre en el servidor — nunca se
 * confía en lo que diga el cliente — tanto para mostrar el aviso en el
 * portal como para bloquear las acciones que modifican jugadores.
 *
 * Desbloqueo provisional (2026-09-28, decisión de Fernando): si el equipo
 * todavía NO está `validado` pero ya reportó la 1a partida por
 * transferencia con comprobante adjunto, se permite igual cargar la
 * plantilla mientras el admin confirma el pago — así no se pierde tiempo
 * esperando esa confirmación manual. Esto NO toca el cupo: `orden_inscripcion`
 * y `estado_inscripcion='validado'` se siguen asignando únicamente cuando el
 * admin confirma la transferencia (o Wompi la confirma automáticamente) en
 * `aplicarPagoCuota` — este desbloqueo es solo del formulario de plantilla.
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
      .select("fecha_pago, metodo_pago_declarado, pago_reportado_at, comprobante_url")
      .eq("team_id", teamId)
      .eq("numero_cuota", 1)
      .maybeSingle(),
  ]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (!team || team.estado_inscripcion !== "validado") {
    const reportoConComprobante =
      !!team &&
      cuota1?.metodo_pago_declarado === "transferencia" &&
      !!cuota1?.pago_reportado_at &&
      !!cuota1?.comprobante_url;

    // El pago completo (si el torneo lo exige) requiere confirmación real —
    // un simple reporte no puede satisfacerlo, así que ahí no aplica el
    // desbloqueo provisional.
    if (reportoConComprobante && !config?.requiere_pago_completo_para_portal) {
      const fechaBaseYmd = cuota1!.pago_reportado_at!.slice(0, 10);
      const { fecha: limite, str: fechaLimiteStr } = calcularLimite(fechaBaseYmd, config);

      if (hoy > limite) {
        return {
          puedeEditar: false,
          motivo: `El plazo para completar la plantilla venció el ${formatFechaCorta(fechaLimiteStr)}. Si necesitas hacer un cambio, contacta a la organización.`,
          fechaLimite: fechaLimiteStr,
        };
      }

      return {
        puedeEditar: true,
        motivo:
          "Reportaste tu primera partida por transferencia — ya puedes cargar la plantilla mientras confirmamos el pago. Si algo no cuadra, te contactaremos.",
        fechaLimite: fechaLimiteStr,
      };
    }

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

  const fechaPagoYmd = cuota1.fecha_pago.slice(0, 10);
  const { fecha: limite, str: fechaLimiteStr } = calcularLimite(fechaPagoYmd, config);

  if (hoy > limite) {
    return {
      puedeEditar: false,
      motivo: `El plazo para completar la plantilla venció el ${formatFechaCorta(fechaLimiteStr)}. Si necesitas hacer un cambio, contacta a la organización.`,
      fechaLimite: fechaLimiteStr,
    };
  }

  return { puedeEditar: true, motivo: null, fechaLimite: fechaLimiteStr };
}
