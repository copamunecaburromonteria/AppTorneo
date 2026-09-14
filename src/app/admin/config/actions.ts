"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enviarRecordatoriosCuotasPendientes, type ResultadoRecordatorios } from "@/lib/recordatorios";

type ResultadoAccion = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, error: "No hay sesión activa." } as const;
  }
  return { supabase, error: null } as const;
}

/**
 * Dispara ahora mismo el mismo envío de recordatorios de pago que corre
 * solo una vez al día vía cron — botón "Enviar recordatorios" del panel
 * admin. No duplica correos: sigue respetando `recordatorio_enviado_at`
 * (una cuota que ya recibió su recordatorio no vuelve a recibir otro hasta
 * que se marque pagada o venza el siguiente ciclo).
 */
export async function enviarRecordatoriosAhora(): Promise<
  ({ success: true } & ResultadoRecordatorios) | { success: false; error: string }
> {
  const { error: authError } = await requireAdmin();
  if (authError) {
    return { success: false, error: authError };
  }

  try {
    const resultado = await enviarRecordatoriosCuotasPendientes();
    revalidatePath("/admin");
    return { success: true, ...resultado };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return { success: false, error: `No se pudieron enviar los recordatorios: ${mensaje}` };
  }
}

/**
 * Ajusta el cupo del torneo (`torneo_config.numero_equipos_torneo`). Un
 * equipo que se inscribe cuando el cupo ya está lleno cae en lista de
 * espera (`teams.estado_inscripcion = 'lista_espera'`) — subir el cupo NO
 * mueve automáticamente a nadie de esa lista a inscrito; eso lo sigue
 * haciendo el admin a mano, contactando en orden de llegada (ver sección
 * "Equipos en espera" de este mismo panel).
 */
export async function actualizarCupoEquipos(nuevoCupo: number): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) {
    return { success: false, error: authError };
  }

  if (!Number.isInteger(nuevoCupo) || nuevoCupo < 1) {
    return { success: false, error: "El cupo debe ser un número entero mayor a 0." };
  }

  const { count: validados } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("estado_inscripcion", "validado");

  if (validados != null && nuevoCupo < validados) {
    return {
      success: false,
      error: `Ya hay ${validados} equipos validados — el cupo no puede quedar por debajo de esa cifra.`,
    };
  }

  const { error } = await supabase
    .from("torneo_config")
    .update({ numero_equipos_torneo: nuevoCupo })
    .eq("id", 1);

  if (error) {
    return { success: false, error: `No se pudo actualizar el cupo: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export type ConfiguracionPagos = {
  monto_inscripcion: number;
  precio_uniforme: number;
  porcentaje_abono_minimo: number;
  dias_plazo_saldo: number;
  dias_aviso_previo_cuota: number;
  numero_cuotas_sin_uniforme: number;
  numero_cuotas_con_uniforme: number;
};

/**
 * Actualiza las condiciones de pago del torneo (`torneo_config`). Solo
 * afecta inscripciones NUEVAS: el monto que ya debe cada equipo inscrito
 * queda congelado en `payments.monto_total` desde el momento en que se
 * inscribió (ver `src/app/inscripcion/actions.ts`), así que cambiar estos
 * valores no altera lo que ya le corresponde pagar a nadie.
 */
export async function actualizarConfiguracionPagos(datos: ConfiguracionPagos): Promise<ResultadoAccion> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) {
    return { success: false, error: authError };
  }

  if (
    datos.monto_inscripcion < 0 ||
    datos.precio_uniforme < 0 ||
    datos.porcentaje_abono_minimo < 0 ||
    datos.porcentaje_abono_minimo > 100 ||
    datos.dias_plazo_saldo < 1 ||
    datos.dias_aviso_previo_cuota < 0 ||
    datos.numero_cuotas_sin_uniforme < 1 ||
    datos.numero_cuotas_con_uniforme < 1
  ) {
    return { success: false, error: "Alguno de los valores no es válido." };
  }

  const { error } = await supabase.from("torneo_config").update(datos).eq("id", 1);

  if (error) {
    return { success: false, error: `No se pudo actualizar la configuración: ${error.message}` };
  }

  revalidatePath("/admin");
  return { success: true };
}
