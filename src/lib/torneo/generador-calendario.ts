/**
 * Generador automático de calendario de la fase de grupos — parte del
 * flujo "Iniciar torneo" (ver `claude/generador-calendario.md` en el
 * proyecto). Funciones puras, sin acceso a Supabase, para poder probarlas
 * de forma aislada — quien las llama (la Server Action) es responsable de
 * leer/escribir la base de datos.
 *
 * Reglas confirmadas por Fernando (2026-09-15, corrige el diseño anterior
 * del 2026-09-14):
 * - 4 grupos de 6 equipos. Cabezas de grupo = primeros 4 equipos por
 *   `orden_inscripcion` (uno por grupo). Los 20 restantes se reparten al
 *   azar, 5 por grupo.
 * - Round-robin completo dentro de cada grupo (5 rondas x 3 partidos = 15
 *   partidos por grupo x 4 = 60 partidos).
 * - La "jornada" de un partido de fase de grupos ES la ronda del
 *   round-robin de su grupo (1 a 5) — no se deriva del calendario, se
 *   genera junto con el partido y se guarda en `matches.jornada`. Por
 *   construcción del método del círculo, cada equipo aparece exactamente
 *   una vez por ronda: eso ya garantiza "1 partido por equipo por
 *   jornada" y "ningún rival repetido" sin lógica aparte.
 * - Cada jornada ocupa una semana calendario (jueves/viernes/sábado) y
 *   reúne los 12 partidos de esa ronda en los 4 grupos (3 por grupo). Se
 *   reparte 1 partido de cada grupo por día para que los 4 grupos queden
 *   balanceados entre jueves/viernes/sábado en cada jornada.
 * - Horarios oficiales: jueves y viernes 7-8-9pm (3 franjas), sábado
 *   5-6-7-8-9pm (5 franjas) — ver `franjas-horario.ts`. 2 canchas. No hace
 *   falta usar todas las franjas disponibles: con 4 partidos/día y hasta
 *   6-10 franjas libres por día, sobra margen para rotar hora y cancha
 *   por equipo entre jornadas.
 * - Como cada equipo juega una sola vez por jornada (una vez por semana),
 *   el "descanso" entre dos partidos consecutivos de un mismo equipo
 *   queda garantizado en ~7 días por el simple hecho de pertenecer a
 *   jornadas distintas — no hace falta una regla aparte para eso en la
 *   fase de grupos.
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

export type ParPartido = { local: string; visitante: string; ronda: number };

/**
 * Round-robin completo (método del círculo) para un grupo de N equipos
 * (N par). Devuelve N-1 rondas x N/2 partidos = N(N-1)/2 partidos totales
 * (15 para N=6), alternando local/visitante por ronda, cada partido
 * etiquetado con su `ronda` (1-based) — esa ronda ES la jornada del
 * partido dentro de la fase de grupos.
 */
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
      partidos.push(
        r % 2 === 0
          ? { local: a, visitante: b, ronda: r + 1 }
          : { local: b, visitante: a, ronda: r + 1 }
      );
    }
    rotativos = [rotativos[rotativos.length - 1], ...rotativos.slice(0, -1)];
  }
  return partidos;
}

export type DiaJuego = { fechaYmd: string; dow: number };

/** Jueves, viernes y sábado de la semana de una jornada (1-based), a
 * partir de `fechaInicioYmd` (debe ser un jueves) — la jornada 1 cae esa
 * semana, la jornada 2 la siguiente, etc. */
export function diasDeLaJornada(fechaInicioYmd: string, jornada: number): DiaJuego[] {
  const dias: DiaJuego[] = [];
  const inicio = new Date(`${fechaInicioYmd}T12:00:00-05:00`);
  for (let offsetDia = 0; offsetDia < 3; offsetDia++) {
    const fecha = new Date(inicio);
    fecha.setUTCDate(fecha.getUTCDate() + (jornada - 1) * 7 + offsetDia);
    const fechaYmd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(fecha);
    dias.push({ fechaYmd, dow: diaSemanaBogota(fechaYmd) });
  }
  return dias;
}

export type PartidoGenerado = {
  local: string;
  visitante: string;
  grupo: LetraGrupo;
  jornada: number;
  fechaYmd: string;
  hora: number;
  cancha: number;
};

/**
 * Ubica los 12 partidos de una jornada (3 por grupo) en los 3 días de su
 * semana (jueves/viernes/sábado): 1 partido de cada grupo por día (así
 * los 4 grupos quedan parejos entre los 3 días, todas las jornadas), y
 * dentro de cada día, la combinación hora+cancha que menos se repite en
 * el historial de cada equipo (rota horario y cancha con el correr de
 * las jornadas). Los historiales (`horaHistorial`/`canchaHistorial`) se
 * pasan por referencia y se actualizan in-place para que la rotación se
 * acumule jornada tras jornada.
 */
function ubicarJornada(
  partidosDeLaJornada: { local: string; visitante: string; grupo: LetraGrupo; ronda: number }[],
  dias: DiaJuego[],
  jornada: number,
  horaHistorial: Map<string, number[]>,
  canchaHistorial: Map<string, number[]>
): PartidoGenerado[] {
  // 1 partido de cada grupo por día, desplazado por jornada para que, a
  // lo largo del torneo, un grupo no quede siempre "pegado" al mismo día.
  const porDia: { local: string; visitante: string; grupo: LetraGrupo }[][] = [[], [], []];
  for (const letra of LETRAS_GRUPO) {
    const partidosDelGrupo = partidosDeLaJornada.filter((p) => p.grupo === letra);
    partidosDelGrupo.forEach((p, i) => {
      const diaIdx = (i + LETRAS_GRUPO.indexOf(letra) + jornada) % 3;
      porDia[diaIdx].push(p);
    });
  }

  function puntaje(historial: Map<string, number[]>, equipo: string, valor: number): number {
    const usos = historial.get(equipo) ?? [];
    return usos.filter((v) => v === valor).length;
  }

  const resultado: PartidoGenerado[] = [];

  dias.forEach((dia, diaIdx) => {
    const horas = SLOTS_POR_DIA[dia.dow] ?? [];
    const slotsDisponibles: { hora: number; cancha: number }[] = [];
    for (const hora of horas) {
      for (const cancha of [1, 2]) slotsDisponibles.push({ hora, cancha });
    }

    for (const partido of porDia[diaIdx]) {
      let mejorSlot = -1;
      let mejorPuntaje = Infinity;
      for (let i = 0; i < slotsDisponibles.length; i++) {
        const { hora, cancha } = slotsDisponibles[i];
        const p =
          puntaje(horaHistorial, partido.local, hora) +
          puntaje(horaHistorial, partido.visitante, hora) +
          puntaje(canchaHistorial, partido.local, cancha) +
          puntaje(canchaHistorial, partido.visitante, cancha);
        if (p < mejorPuntaje) {
          mejorPuntaje = p;
          mejorSlot = i;
        }
      }
      if (mejorSlot === -1) {
        throw new Error(
          `No hay franja disponible para ubicar un partido de ${dia.fechaYmd} (jornada ${jornada}).`
        );
      }
      const slot = slotsDisponibles.splice(mejorSlot, 1)[0];
      resultado.push({
        local: partido.local,
        visitante: partido.visitante,
        grupo: partido.grupo,
        jornada,
        fechaYmd: dia.fechaYmd,
        hora: slot.hora,
        cancha: slot.cancha,
      });

      for (const equipo of [partido.local, partido.visitante]) {
        horaHistorial.set(equipo, [...(horaHistorial.get(equipo) ?? []), slot.hora]);
        canchaHistorial.set(equipo, [...(canchaHistorial.get(equipo) ?? []), slot.cancha]);
      }
    }
  });

  return resultado;
}

/**
 * Genera la programación completa de la fase de grupos (60 partidos, 5
 * jornadas de 12 partidos) a partir de los 4 grupos YA definidos (no
 * vuelve a sortear equipos — para eso está `sortearGrupos`, aparte).
 */
export function generarProgramacionFaseDeGrupos(
  grupos: Record<LetraGrupo, string[]>,
  fechaInicioYmd: string
): PartidoGenerado[] {
  const partidosPorGrupo = {} as Record<LetraGrupo, ParPartido[]>;
  for (const letra of LETRAS_GRUPO) {
    if (grupos[letra].length !== 6) {
      throw new Error(`El grupo ${letra} no tiene 6 equipos (tiene ${grupos[letra].length}).`);
    }
    partidosPorGrupo[letra] = generarRoundRobinPares(grupos[letra]);
  }

  const horaHistorial = new Map<string, number[]>();
  const canchaHistorial = new Map<string, number[]>();
  const resultado: PartidoGenerado[] = [];

  for (let jornada = 1; jornada <= 5; jornada++) {
    const dias = diasDeLaJornada(fechaInicioYmd, jornada);
    const partidosDeLaJornada: { local: string; visitante: string; grupo: LetraGrupo; ronda: number }[] = [];
    for (const letra of LETRAS_GRUPO) {
      for (const p of partidosPorGrupo[letra]) {
        if (p.ronda === jornada) partidosDeLaJornada.push({ ...p, grupo: letra });
      }
    }
    if (partidosDeLaJornada.length !== 12) {
      throw new Error(
        `La jornada ${jornada} no tiene 12 partidos (tiene ${partidosDeLaJornada.length}).`
      );
    }
    resultado.push(...ubicarJornada(partidosDeLaJornada, dias, jornada, horaHistorial, canchaHistorial));
  }

  return resultado;
}

/**
 * Valida un fixture de fase de grupos generado contra las reglas
 * confirmadas por Fernando (2026-09-15). Devuelve la lista de problemas
 * encontrados — vacía si el fixture es válido. No se debe guardar ni
 * presentar como correcto un fixture con algún problema en esta lista.
 */
export function validarFixtureFaseDeGrupos(
  partidos: PartidoGenerado[],
  grupos: Record<LetraGrupo, string[]>
): string[] {
  const problemas: string[] = [];

  if (partidos.length !== 60) {
    problemas.push(`Se esperaban 60 partidos, hay ${partidos.length}.`);
  }

  const letras = LETRAS_GRUPO;
  if (letras.length !== 4) problemas.push(`Se esperaban 4 grupos, hay ${letras.length}.`);

  const equiposTotales = new Set<string>();
  for (const letra of letras) {
    if (grupos[letra].length !== 6) {
      problemas.push(`El grupo ${letra} no tiene 6 equipos (tiene ${grupos[letra].length}).`);
    }
    for (const id of grupos[letra]) equiposTotales.add(id);
  }
  if (equiposTotales.size !== 24) {
    problemas.push(`Se esperaban 24 equipos en total, hay ${equiposTotales.size}.`);
  }

  for (const letra of letras) {
    const partidosDelGrupo = partidos.filter((p) => p.grupo === letra);
    if (partidosDelGrupo.length !== 15) {
      problemas.push(`El grupo ${letra} no tiene 15 partidos (tiene ${partidosDelGrupo.length}).`);
    }
    // Ningún partido entre grupos: local y visitante deben pertenecer al grupo.
    const idsDelGrupo = new Set(grupos[letra]);
    for (const p of partidosDelGrupo) {
      if (!idsDelGrupo.has(p.local) || !idsDelGrupo.has(p.visitante)) {
        problemas.push(
          `Partido ${p.local} vs ${p.visitante} etiquetado como grupo ${letra} pero involucra un equipo de otro grupo.`
        );
      }
    }
  }

  for (let jornada = 1; jornada <= 5; jornada++) {
    const partidosDeLaJornada = partidos.filter((p) => p.jornada === jornada);
    if (partidosDeLaJornada.length !== 12) {
      problemas.push(`La jornada ${jornada} no tiene 12 partidos (tiene ${partidosDeLaJornada.length}).`);
    }
    const equiposDeLaJornada = partidosDeLaJornada.flatMap((p) => [p.local, p.visitante]);
    const setEquipos = new Set(equiposDeLaJornada);
    if (setEquipos.size !== equiposDeLaJornada.length) {
      problemas.push(`La jornada ${jornada} tiene un equipo jugando más de un partido.`);
    }
  }

  const partidosPorEquipo = new Map<string, PartidoGenerado[]>();
  for (const p of partidos) {
    partidosPorEquipo.set(p.local, [...(partidosPorEquipo.get(p.local) ?? []), p]);
    partidosPorEquipo.set(p.visitante, [...(partidosPorEquipo.get(p.visitante) ?? []), p]);
  }
  for (const [equipo, partidosDelEquipo] of partidosPorEquipo) {
    if (partidosDelEquipo.length !== 5) {
      problemas.push(`El equipo ${equipo} tiene ${partidosDelEquipo.length} partidos, se esperaban 5.`);
    }
    const rivales = partidosDelEquipo.map((p) => (p.local === equipo ? p.visitante : p.local));
    if (new Set(rivales).size !== rivales.length) {
      problemas.push(`El equipo ${equipo} tiene un rival repetido en la fase de grupos.`);
    }
  }

  return problemas;
}

/**
 * Orquesta el flujo completo: sortea los grupos y genera los 60 partidos
 * de la fase de grupos ya ubicados en el calendario, validados. No toca
 * Supabase — la Server Action que llama esto es quien escribe
 * `team_group`/`matches`.
 */
export function generarFaseDeGrupos(
  equipos: EquipoParaSorteo[],
  fechaInicioYmd: string
): { grupos: Record<LetraGrupo, string[]>; partidos: PartidoGenerado[] } {
  const grupos = sortearGrupos(equipos);
  const partidos = generarProgramacionFaseDeGrupos(grupos, fechaInicioYmd);

  const problemas = validarFixtureFaseDeGrupos(partidos, grupos);
  if (problemas.length > 0) {
    throw new Error(`El fixture generado no pasó la validación: ${problemas.join(" | ")}`);
  }

  return { grupos, partidos };
}
