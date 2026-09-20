import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { correoCargoTarjetaGenerado, correoRecordatorioCargoTarjeta } from "@/lib/resend/templates";

type Delegado = { correo: string; nombre: string };
type DelegadoRel = Delegado | Delegado[] | null;
type EquipoConDelegado = { nombre_equipo: string; team_delegado: DelegadoRel };
type EquipoRel = EquipoConDelegado | EquipoConDelegado[] | null;
type JugadorInfo = { nombre: string };
type JugadorRel = JugadorInfo | JugadorInfo[] | null;

type CargoRaw = {
  id: string;
  tipo_tarjeta: string;
  monto: number;
  team_id: string;
  created_at: string;
  jugador: JugadorRel;
  teams: EquipoRel;
};

function unwrap<T>(rel: T | T[] | null): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

const LABEL_TIPO: Record<string, string> = {
  tarjeta_amarilla: "🟨 Amarilla",
  tarjeta_azul: "🟦 Azul",
  tarjeta_roja: "🟥 Roja",
};

/** Fecha (YYYY-MM-DD) en hora de Bogotá — mismo criterio horario que el
 * resto de la plataforma (ver `src/lib/franjas-horario.ts`). */
function fechaBogota(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(fecha);
}

function agruparPorEquipo(cargos: CargoRaw[]) {
  const porEquipo = new Map<
    string,
    { equipo: EquipoConDelegado; ids: string[]; items: { jugadorNombre: string; tipo: string; monto: number }[] }
  >();

  for (const c of cargos) {
    const equipo = unwrap<EquipoConDelegado>(c.teams);
    if (!equipo) continue;
    const jugador = unwrap<JugadorInfo>(c.jugador);
    const entrada = porEquipo.get(c.team_id) ?? { equipo, ids: [], items: [] };
    entrada.ids.push(c.id);
    entrada.items.push({
      jugadorNombre: jugador?.nombre ?? "—",
      tipo: LABEL_TIPO[c.tipo_tarjeta] ?? c.tipo_tarjeta,
      monto: Number(c.monto),
    });
    porEquipo.set(c.team_id, entrada);
  }

  return porEquipo;
}

export type ResultadoRecordatoriosCargos = { revisados: number; enviados: number };

/**
 * Aviso "día después": el delegado recibe un correo con las tarjetas
 * cobrables que se registraron en el partido anterior de su equipo, una vez
 * pasado al menos un día calendario (Bogotá) desde que se generó el cargo.
 * Una sola vez por cargo — controlado con `recordatorio_dia_despues_enviado_at`.
 *
 * Extraído a un helper compartido (mismo patrón que
 * `enviarRecordatoriosCuotasPendientes` en `@/lib/recordatorios`) para que lo
 * pueda disparar tanto el cron diario como un botón manual desde el admin si
 * hace falta más adelante.
 */
export async function enviarAvisosCargosTarjetasGenerados(): Promise<ResultadoRecordatoriosCargos> {
  const admin = createAdminClient();
  const hoy = fechaBogota(new Date());

  const { data: cargosRaw, error } = await admin
    .from("cargos_tarjetas")
    .select(
      "id, tipo_tarjeta, monto, team_id, created_at, jugador:jugador_id(nombre), teams:team_id(nombre_equipo, team_delegado(correo, nombre))"
    )
    .eq("estado", "pendiente")
    .is("recordatorio_dia_despues_enviado_at", null)
    .returns<CargoRaw[]>();

  if (error) throw new Error(error.message);

  const candidatos = (cargosRaw ?? []).filter((c) => fechaBogota(new Date(c.created_at)) < hoy);
  const porEquipo = agruparPorEquipo(candidatos);

  let enviados = 0;

  for (const { equipo, ids, items } of porEquipo.values()) {
    const delegado = unwrap<Delegado>(equipo.team_delegado);
    if (!delegado?.correo) continue;

    const total = items.reduce((s, i) => s + i.monto, 0);
    const { subject, html, text } = correoCargoTarjetaGenerado({
      nombreEquipo: equipo.nombre_equipo,
      delegadoNombre: delegado.nombre,
      items,
      total,
    });

    const resultado = await sendEmail({ to: delegado.correo, subject, html, text });
    if (resultado.ok) {
      await admin
        .from("cargos_tarjetas")
        .update({ recordatorio_dia_despues_enviado_at: new Date().toISOString() })
        .in("id", ids);
      enviados += ids.length;
    }
  }

  return { revisados: candidatos.length, enviados };
}

/**
 * Recordatorio urgente, 24 horas antes del próximo partido programado del
 * equipo, mientras la deuda de tarjetas siga sin pagar. Una sola vez por
 * cargo — controlado con `recordatorio_previo_partido_enviado_at`.
 */
export async function enviarRecordatoriosCargosTarjetasPrevioPartido(): Promise<ResultadoRecordatoriosCargos> {
  const admin = createAdminClient();

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fechaManana = fechaBogota(manana);

  const { data: partidosMananaRaw, error: errorPartidos } = await admin
    .from("matches")
    .select("id, fecha_hora_programada, equipo_local_id, equipo_visitante_id")
    .eq("estado", "programado");

  if (errorPartidos) throw new Error(errorPartidos.message);

  const equiposQueJueganManana = new Set<string>();
  for (const p of partidosMananaRaw ?? []) {
    if (fechaBogota(new Date(p.fecha_hora_programada as string)) !== fechaManana) continue;
    if (p.equipo_local_id) equiposQueJueganManana.add(p.equipo_local_id as string);
    if (p.equipo_visitante_id) equiposQueJueganManana.add(p.equipo_visitante_id as string);
  }

  if (equiposQueJueganManana.size === 0) {
    return { revisados: 0, enviados: 0 };
  }

  const { data: cargosRaw, error } = await admin
    .from("cargos_tarjetas")
    .select(
      "id, tipo_tarjeta, monto, team_id, created_at, jugador:jugador_id(nombre), teams:team_id(nombre_equipo, team_delegado(correo, nombre))"
    )
    .eq("estado", "pendiente")
    .is("recordatorio_previo_partido_enviado_at", null)
    .in("team_id", Array.from(equiposQueJueganManana))
    .returns<CargoRaw[]>();

  if (error) throw new Error(error.message);

  const porEquipo = agruparPorEquipo(cargosRaw ?? []);
  let enviados = 0;

  for (const { equipo, ids, items } of porEquipo.values()) {
    const delegado = unwrap<Delegado>(equipo.team_delegado);
    if (!delegado?.correo) continue;

    const total = items.reduce((s, i) => s + i.monto, 0);
    const { subject, html, text } = correoRecordatorioCargoTarjeta({
      nombreEquipo: equipo.nombre_equipo,
      delegadoNombre: delegado.nombre,
      items,
      total,
      fechaProximoPartido: fechaManana,
    });

    const resultado = await sendEmail({ to: delegado.correo, subject, html, text });
    if (resultado.ok) {
      await admin
        .from("cargos_tarjetas")
        .update({ recordatorio_previo_partido_enviado_at: new Date().toISOString() })
        .in("id", ids);
      enviados += ids.length;
    }
  }

  return { revisados: cargosRaw?.length ?? 0, enviados };
}
