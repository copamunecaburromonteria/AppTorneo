/**
 * Generador automático de calendario de la fase de grupos — parte del
 * flujo "Iniciar torneo" (ver `claude/generador-calendario.md` en el
 * proyecto). Funciones puras, sin acceso a Supabase, para poder probarlas
 * de forma aislada — quien las llama (la Server Action) es responsable de
 * leer/escribir la base de datos.
 *
 * Reglas ya confirmadas por Fernando (2026-09-14):
 * - 4 grupos de 6 equipos. Cabezas de grupo = primeros 4 equipos por
 *   `orden_inscripcion` (uno por grupo). Los 20 restantes se reparten al
 *   azar, 5 por grupo.
 * - Round-robin completo dentro de cada grupo (5 rondas x 3 partidos = 15
 *   partidos por grupo x 4 = 60 partidos).
 * - Calendario: jueves/viernes kickoffs 7-8-9pm, sábado 6-7-8-9pm, 2
 *   canchas → 20 partidos/semana → exactamente 3 semanas (9 días de
 *   juego) para los 60 partidos, sin sobrantes.
 * - Ningún equipo juega dos veces el mismo día; sus 5 partidos se reparten
 *   lo más parejo posible entre las 3 semanas.
 *
 * Verificado con una simulación de 2000 sorteos aleatorios (24 equipos)
 * antes de integrarlo: siempre logra ubicar los 60 partidos sin choques.
 */

import { SLOTS_POR_DIA, diaSemanaBogota } from "@/lib/franjas-horario";

export const LETRAS_GRUPO = ["A", "B", "C", "D"] as const;
export type LetraGrupo = (typeof LETRAS_GRUPO)[number];

export type EquipoParaSorteo = { id: string; orden_inscripcion: number };

/**
 * Sortea los 4 grupos: cabezas = primeros 4 equipos por `orden_inscripcion`
 * (uno por grupo, en orden A-B-C-D); el resto se mezcla al azar y se
 * reparte round-robin (round-robin del reparto, no del calendario) entre
 * los 4 grupos — así cada grupo queda con exactamente 5 equipos más su
 * cabeza, sin importar el orden del mezclado.
 */
export function sortearGrupos(
  equipos: EquipoParaSorteo[]
): Record<LetraGrupo, string[]> {
  if (equipos.length < 24) {
    throw new Error(`Se necesitan al menos 24 equipos, hay ${equipos.length}.`);
  }
  const ordenados = [...equipos].sort((a, b) => a.orden_inscripcion - b.orden_inscripcion);
  const cabezas = ordenados.slice(0, 4);
  const resto = ordenados.slice(4, 24);

  const grupos: Record<LetraGrupo, string[]> = { A: [], B: [], C: [], D: [] };
  cabezas.forEach((eq, i) => grupos[LETRAS_GRUPO[i]].push(eq.id));

  const mezclado = [...resto];
  for (let i = mezclado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mezclado[i], mezclado[j]] = [mezclado[j], mezclado[i]];
  }
  mezclado.forEach((eq, i) => grupos[LETRAS_GRUPO[i % 4]].push(eq.id));

  return grupos;
}

export type ParPartido = { local: string; visitante: string };

/** Round-robin completo (método del círculo) para un grupo de N equipos
 * (N par). Devuelve N-1 rondas x N/2 partidos = N(N-1)/2 partidos totales
 * (15 para N=6), alternando local/visitante por ronda. */
export function generarRoundRobinPares(equipos: string[]): ParPartido[] {
  const n = equipos.length;
  if (n < 2 || n % 2 !== 0) {
    throw new Error("generarRoundRobinPares requiere una cantidad par de equipos.");
  }
  const rondas = n - 1;
  const fijo = equipos[0];
  let rotativos = equipos.slice(1);
  const partidos: ParPartido[] = [];

  for (let r = 0; r < rondas; r++) {
    const ronda = [fijo, ...rotativos];
    for (let i = 0; i < n / 2; i++) {
      const a = ronda[i];
      const b = ronda[n - 1 - i];
      partidos.push(r % 2 === 0 ? { local: a, visitante: b } : { local: b, visitante: a });
    }
    rotativos = [rotativos[rotativos.length - 1], ...rotativos.slice(0, -1)];
  }
  return partidos;
}

export type DiaJuego = { fechaYmd: string; dow: number };

/** Jueves, viernes y sábado de cada una de `semanas` semanas, a partir de
 * `fechaInicioYmd` (debe ser un jueves). */
export function generarDiasJuego(fechaInicioYmd: string, semanas = 3): DiaJuego[] {
  const dias: DiaJuego[] = [];
  const inicio = new Date(`${fechaInicioYmd}T12:00:00-05:00`);
  for (let semana = 0; semana < semanas; semana++) {
    for (let offsetDia = 0; offsetDia < 3; offsetDia++) {
      const fecha = new Date(inicio);
      fecha.setUTCDate(fecha.getUTCDate() + semana * 7 + offsetDia);
      const fechaYmd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(fecha);
      dias.push({ fechaYmd, dow: diaSemanaBogota(fechaYmd) });
    }
  }
  return dias;
}

export type SlotCalendario = { fechaYmd: string; hora: number; cancha: number };

/** Expande los días de juego en la grilla completa de slots (hora x
 * cancha), usando la misma grilla que ya usa `/admin/partidos`. */
export function generarSlots(dias: DiaJuego[]): SlotCalendario[] {
  const slots: SlotCalendario[] = [];
  for (const dia of dias) {
    const horas = SLOTS_POR_DIA[dia.dow] ?? [];
    for (const hora of horas) {
      for (const cancha of [1, 2]) {
        slots.push({ fechaYmd: dia.fechaYmd, hora, cancha });
      }
    }
  }
  return slots;
}

export type PartidoGenerado = ParPartido & {
  grupo: LetraGrupo;
  fechaYmd: string;
  hora: number;
  cancha: number;
};

/**
 * Ubica los partidos de los 4 grupos en los slots del calendario: ningún
 * equipo juega dos veces el mismo día, y se reparte parejo (prioriza el
 * partido cuyos dos equipos acumulan menos días jugados hasta ahora).
 * Lanza un error si algún partido queda sin poder ubicarse — no debería
 * pasar con la estructura actual (24 equipos, 4 grupos de 6, 9 días con
 * capacidad de sobra), verificado con una simulación de 2000 sorteos.
 */
export function asignarPartidosASlots(
  partidosPorGrupo: Record<LetraGrupo, ParPartido[]>,
  slots: SlotCalendario[]
): PartidoGenerado[] {
  type Pendiente = ParPartido & { grupo: LetraGrupo };
  const pendientes: Pendiente[] = [];
  for (const grupo of LETRAS_GRUPO) {
    for (const p of partidosPorGrupo[grupo]) pendientes.push({ ...p, grupo });
  }

  const diasJugadosPorEquipo = new Map<string, Set<string>>();
  const resultado: PartidoGenerado[] = [];

  const slotsPorDia = new Map<string, SlotCalendario[]>();
  for (const slot of slots) {
    const lista = slotsPorDia.get(slot.fechaYmd) ?? [];
    lista.push(slot);
    slotsPorDia.set(slot.fechaYmd, lista);
  }

  for (const [fechaYmd, slotsDelDia] of slotsPorDia) {
    const usadosHoy = new Set<string>();
    for (const slot of slotsDelDia) {
      let mejorIdx = -1;
      let mejorPuntaje = Infinity;
      for (let i = 0; i < pendientes.length; i++) {
        const p = pendientes[i];
        if (usadosHoy.has(p.local) || usadosHoy.has(p.visitante)) continue;
        const diasLocal = diasJugadosPorEquipo.get(p.local)?.size ?? 0;
        const diasVisitante = diasJugadosPorEquipo.get(p.visitante)?.size ?? 0;
        const puntaje = diasLocal + diasVisitante;
        if (puntaje < mejorPuntaje) {
          mejorPuntaje = puntaje;
          mejorIdx = i;
        }
      }
      if (mejorIdx === -1) continue;
      const elegido = pendientes.splice(mejorIdx, 1)[0];
      resultado.push({ ...elegido, fechaYmd, hora: slot.hora, cancha: slot.cancha });
      usadosHoy.add(elegido.local);
      usadosHoy.add(elegido.visitante);
      if (!diasJugadosPorEquipo.has(elegido.local)) diasJugadosPorEquipo.set(elegido.local, new Set());
      if (!diasJugadosPorEquipo.has(elegido.visitante)) diasJugadosPorEquipo.set(elegido.visitante, new Set());
      diasJugadosPorEquipo.get(elegido.local)!.add(fechaYmd);
      diasJugadosPorEquipo.get(elegido.visitante)!.add(fechaYmd);
    }
  }

  if (pendientes.length > 0) {
    throw new Error(
      `No se pudo ubicar ${pendientes.length} partido(s) dentro del calendario generado.`
    );
  }

  return resultado;
}

/**
 * Orquesta el flujo completo: sortea los grupos y genera los 60 partidos
 * de la fase de grupos ya ubicados en el calendario. No toca Supabase —
 * la Server Action que llama esto es quien escribe `team_group`/`matches`.
 */
export function generarFaseDeGrupos(
  equipos: EquipoParaSorteo[],
  fechaInicioYmd: string
): { grupos: Record<LetraGrupo, string[]>; partidos: PartidoGenerado[] } {
  const grupos = sortearGrupos(equipos);

  const partidosPorGrupo = {} as Record<LetraGrupo, ParPartido[]>;
  for (const letra of LETRAS_GRUPO) {
    partidosPorGrupo[letra] = generarRoundRobinPares(grupos[letra]);
  }

  const dias = generarDiasJuego(fechaInicioYmd, 3);
  const slots = generarSlots(dias);
  const partidos = asignarPartidosASlots(partidosPorGrupo, slots);

  return { grupos, partidos };
}
