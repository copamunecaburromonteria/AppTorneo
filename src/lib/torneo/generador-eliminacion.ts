/**
 * Generador de la fase eliminatoria (octavos → cuartos → semifinal → final
 * / tercer puesto) — continúa el trabajo de `generador-calendario.ts`
 * (fase de grupos). Mismo criterio: funciones puras, sin acceso a
 * Supabase, para poder probarlas de forma aislada — quien llama a esto (la
 * Server Action) es responsable de leer/escribir la base de datos.
 *
 * Reglas confirmadas por Fernando ("logica de los partidos y programacion",
 * 2026-09-18):
 * - Clasifican los 4 primeros de cada grupo (16 equipos). Desempate:
 *   puntos → diferencia de gol → goles a favor → enfrentamiento directo
 *   entre los equipos empatados. Si después de eso sigue habiendo empate
 *   exacto, no se inventa un ganador — se reporta como `ambiguo` para que
 *   un admin lo resuelva manualmente (p. ej. sorteo presencial).
 * - Octavos: cruces fijos entre grupos A-B y C-D — A1-B4, A2-B3, A3-B2,
 *   A4-B1 (llave "AB") y C1-D4, C2-D3, C3-D2, C4-D1 (llave "CD"). Por
 *   construcción nunca hay revancha de grupo (A solo cruza con B, C solo
 *   con D).
 * - Cuartos/semifinal/final: se arma el bracket manteniendo separados los
 *   lados "AB" y "CD" hasta la final (ver `claude/generador-calendario.md`
 *   del proyecto y el plan de esta funcionalidad) — el ganador de la mitad
 *   AB no se cruza con otro equipo de la mitad AB antes de la final.
 * - El campo `llave` de cada partido (ya existe en `matches`) codifica su
 *   posición exacta en el bracket ("AB-1".."AB-4", "CD-1".."CD-4" en
 *   octavos; "AB-1"/"AB-2"/"CD-1"/"CD-2" en cuartos; "SF-1"/"SF-2" en
 *   semifinal; `null` en final/tercer puesto, que se distinguen por
 *   `fase`). Así la siguiente ronda se arma leyendo llave + ganador de la
 *   ronda anterior, sin tener que re-derivar la clasificación de grupos.
 * - Empates en fase eliminatoria se resuelven por penales
 *   (`matches.penales_local`/`penales_visitante`) — ver
 *   `src/app/operador/actions.ts`. Un partido de esta fase SIEMPRE debe
 *   terminar con `winner_team_id` para poder generar la siguiente ronda.
 */

import { LETRAS_GRUPO, diasDeLaJornada, type LetraGrupo, type DiaJuego } from "./generador-calendario";

// ---------------------------------------------------------------------
// Standings y clasificación
// ---------------------------------------------------------------------

export type ResultadoPartido = {
  local: string;
  visitante: string;
  marcadorLocal: number;
  marcadorVisitante: number;
};

export type StandingRow = {
  team_id: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

export type PuntosConfig = { victoria: number; empate: number; derrota: number };

const PUNTOS_DEFAULT: PuntosConfig = { victoria: 3, empate: 1, derrota: 0 };

/**
 * Calcula la tabla de posiciones (misma fórmula que la vista SQL
 * `v_standings`) a partir de resultados ya jugados. Función pura,
 * reutilizada tanto por la Server Action de clasificación a octavos como
 * por el script de validación con equipos sintéticos — `v_standings` se
 * deja intacta y se sigue usando tal cual para la tabla pública.
 */
export function calcularStandings(
  equipoIds: string[],
  resultados: ResultadoPartido[],
  puntos: PuntosConfig = PUNTOS_DEFAULT
): Map<string, StandingRow> {
  const tabla = new Map<string, StandingRow>();
  for (const id of equipoIds) {
    tabla.set(id, { team_id: id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
  }

  for (const r of resultados) {
    const local = tabla.get(r.local);
    const visitante = tabla.get(r.visitante);
    if (!local || !visitante) continue; // partido de un equipo fuera de la lista pedida

    local.pj += 1;
    visitante.pj += 1;
    local.gf += r.marcadorLocal;
    local.gc += r.marcadorVisitante;
    visitante.gf += r.marcadorVisitante;
    visitante.gc += r.marcadorLocal;

    if (r.marcadorLocal > r.marcadorVisitante) {
      local.pg += 1;
      local.pts += puntos.victoria;
      visitante.pp += 1;
      visitante.pts += puntos.derrota;
    } else if (r.marcadorLocal < r.marcadorVisitante) {
      visitante.pg += 1;
      visitante.pts += puntos.victoria;
      local.pp += 1;
      local.pts += puntos.derrota;
    } else {
      local.pe += 1;
      local.pts += puntos.empate;
      visitante.pe += 1;
      visitante.pts += puntos.empate;
    }
  }

  for (const fila of tabla.values()) fila.dg = fila.gf - fila.gc;
  return tabla;
}

function compararStanding(a: StandingRow, b: StandingRow): number {
  return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf;
}

export type ClasificacionGrupo =
  | { ambiguo: false; orden: string[] } // 6 ids, del 1º al 6º — los primeros 4 clasifican
  | { ambiguo: true; equiposEmpatados: string[] };

/**
 * Ordena los 6 equipos de un grupo (1º a 6º). Aplica puntos → diferencia
 * de gol → goles a favor y, para cualquier grupo de equipos exactamente
 * empatados en esos tres criterios, desempata por enfrentamiento directo
 * (mini-tabla solo con los partidos jugados entre ellos). Si el
 * enfrentamiento directo tampoco separa a 2+ equipos, devuelve
 * `ambiguo: true` en vez de adivinar un orden — la Server Action bloquea
 * la generación de octavos y pide resolución manual.
 */
export function clasificarGrupo(
  equipoIdsDelGrupo: string[],
  standings: Map<string, StandingRow>,
  resultadosDelGrupo: ResultadoPartido[]
): ClasificacionGrupo {
  const filas = equipoIdsDelGrupo.map((id) => {
    const fila = standings.get(id);
    if (!fila) throw new Error(`Falta la fila de standings del equipo ${id}.`);
    return fila;
  });
  const ordenado = [...filas].sort(compararStanding);

  const resultado: StandingRow[] = [];
  let i = 0;
  while (i < ordenado.length) {
    let j = i + 1;
    while (
      j < ordenado.length &&
      ordenado[j].pts === ordenado[i].pts &&
      ordenado[j].dg === ordenado[i].dg &&
      ordenado[j].gf === ordenado[i].gf
    ) {
      j++;
    }
    const cluster = ordenado.slice(i, j);

    if (cluster.length === 1) {
      resultado.push(cluster[0]);
    } else {
      const idsCluster = new Set(cluster.map((f) => f.team_id));
      const resultadosCluster = resultadosDelGrupo.filter(
        (r) => idsCluster.has(r.local) && idsCluster.has(r.visitante)
      );
      const miniTabla = calcularStandings([...idsCluster], resultadosCluster);
      const clusterOrdenado = [...cluster].sort((a, b) =>
        compararStanding(miniTabla.get(a.team_id)!, miniTabla.get(b.team_id)!)
      );

      // ¿El enfrentamiento directo separó a todos? Si 2+ siguen empatados
      // entre sí en la mini-tabla, es un empate real sin resolver.
      let k = 0;
      while (k < clusterOrdenado.length) {
        let m = k + 1;
        while (
          m < clusterOrdenado.length &&
          compararStanding(
            miniTabla.get(clusterOrdenado[m].team_id)!,
            miniTabla.get(clusterOrdenado[k].team_id)!
          ) === 0
        ) {
          m++;
        }
        if (m - k > 1) {
          return {
            ambiguo: true,
            equiposEmpatados: clusterOrdenado.slice(k, m).map((f) => f.team_id),
          };
        }
        k = m;
      }

      resultado.push(...clusterOrdenado);
    }
    i = j;
  }

  return { ambiguo: false, orden: resultado.map((f) => f.team_id) };
}

// ---------------------------------------------------------------------
// Generadores de cada ronda del bracket
// ---------------------------------------------------------------------

export type PartidoEliminacionGenerado = {
  local: string;
  visitante: string;
  llave: string | null;
  fase: string;
};

/** Cruces fijos de octavos a partir de los 4 clasificados de cada grupo
 * (ordenados 1º-4º). Siempre cruza A con B y C con D, así que nunca hay
 * revancha de grupo. */
export function generarOctavos(
  clasificados: Record<LetraGrupo, string[]>
): PartidoEliminacionGenerado[] {
  for (const letra of LETRAS_GRUPO) {
    if (clasificados[letra].length !== 4) {
      throw new Error(
        `El grupo ${letra} no tiene 4 clasificados (tiene ${clasificados[letra].length}).`
      );
    }
  }

  const [a1, a2, a3, a4] = clasificados.A;
  const [b1, b2, b3, b4] = clasificados.B;
  const [c1, c2, c3, c4] = clasificados.C;
  const [d1, d2, d3, d4] = clasificados.D;

  const fase = "Octavos de Final";
  return [
    { local: a1, visitante: b4, llave: "AB-1", fase },
    { local: a2, visitante: b3, llave: "AB-2", fase },
    { local: a3, visitante: b2, llave: "AB-3", fase },
    { local: a4, visitante: b1, llave: "AB-4", fase },
    { local: c1, visitante: d4, llave: "CD-1", fase },
    { local: c2, visitante: d3, llave: "CD-2", fase },
    { local: c3, visitante: d2, llave: "CD-3", fase },
    { local: c4, visitante: d1, llave: "CD-4", fase },
  ];
}

export type ResultadoEliminacion = { llave: string; ganador: string };

/** Toma los resultados de una ronda (llave + ganador), filtra por prefijo
 * ("AB"/"CD"), valida la cantidad esperada y los devuelve ordenados por
 * el número de la llave ("AB-1", "AB-2", ...). */
function ganadoresPorPrefijo(
  resultados: ResultadoEliminacion[],
  prefijo: "AB" | "CD",
  totalEsperado: number
): string[] {
  const delPrefijo = resultados
    .filter((r) => r.llave.startsWith(`${prefijo}-`))
    .sort((a, b) => a.llave.localeCompare(b.llave, undefined, { numeric: true }));

  if (delPrefijo.length !== totalEsperado) {
    throw new Error(
      `Se esperaban ${totalEsperado} resultados con llave "${prefijo}-*", hay ${delPrefijo.length}.`
    );
  }
  return delPrefijo.map((r) => r.ganador);
}

/** Cuartos: dentro de cada lado (AB / CD), enfrenta al ganador de la
 * llave 1 con el de la llave 2, y al de la 3 con el de la 4 — mantiene
 * los lados AB y CD separados hasta la final. */
export function generarCuartos(
  resultadosOctavos: ResultadoEliminacion[]
): PartidoEliminacionGenerado[] {
  const [ab1, ab2, ab3, ab4] = ganadoresPorPrefijo(resultadosOctavos, "AB", 4);
  const [cd1, cd2, cd3, cd4] = ganadoresPorPrefijo(resultadosOctavos, "CD", 4);

  const fase = "Cuartos de Final";
  return [
    { local: ab1, visitante: ab2, llave: "AB-1", fase },
    { local: ab3, visitante: ab4, llave: "AB-2", fase },
    { local: cd1, visitante: cd2, llave: "CD-1", fase },
    { local: cd3, visitante: cd4, llave: "CD-2", fase },
  ];
}

/** Semifinal: SF-1 = ganador cuartos AB-1 vs ganador cuartos CD-1; SF-2 =
 * ganador cuartos AB-2 vs ganador cuartos CD-2 — así el lado AB y el lado
 * CD solo pueden volver a cruzarse en la final. */
export function generarSemifinal(
  resultadosCuartos: ResultadoEliminacion[]
): PartidoEliminacionGenerado[] {
  const [ab1, ab2] = ganadoresPorPrefijo(resultadosCuartos, "AB", 2);
  const [cd1, cd2] = ganadoresPorPrefijo(resultadosCuartos, "CD", 2);

  const fase = "Semifinal";
  return [
    { local: ab1, visitante: cd1, llave: "SF-1", fase },
    { local: ab2, visitante: cd2, llave: "SF-2", fase },
  ];
}

export type ResultadoSemifinal = { llave: "SF-1" | "SF-2"; ganador: string; perdedor: string };

function obtenerSemifinal(
  resultadosSemifinal: ResultadoSemifinal[],
  llave: "SF-1" | "SF-2"
): ResultadoSemifinal {
  const sf = resultadosSemifinal.find((r) => r.llave === llave);
  if (!sf) throw new Error(`Falta el resultado de la semifinal ${llave}.`);
  return sf;
}

/** Final: ganador SF-1 vs ganador SF-2. */
export function generarFinal(resultadosSemifinal: ResultadoSemifinal[]): PartidoEliminacionGenerado {
  const sf1 = obtenerSemifinal(resultadosSemifinal, "SF-1");
  const sf2 = obtenerSemifinal(resultadosSemifinal, "SF-2");
  return { local: sf1.ganador, visitante: sf2.ganador, llave: null, fase: "Final" };
}

/** Tercer puesto: perdedor SF-1 vs perdedor SF-2 — opcional
 * (`torneo_config.incluye_tercer_puesto`), decide la Server Action. */
export function generarTercerPuesto(
  resultadosSemifinal: ResultadoSemifinal[]
): PartidoEliminacionGenerado {
  const sf1 = obtenerSemifinal(resultadosSemifinal, "SF-1");
  const sf2 = obtenerSemifinal(resultadosSemifinal, "SF-2");
  return { local: sf1.perdedor, visitante: sf2.perdedor, llave: null, fase: "Tercer puesto" };
}

// ---------------------------------------------------------------------
// Ubicación en el calendario (día / hora / cancha)
// ---------------------------------------------------------------------

export type PartidoEliminacionUbicado = PartidoEliminacionGenerado & {
  fechaYmd: string;
  hora: number;
  cancha: number;
};

/**
 * Reparte los partidos de una fase eliminatoria en los días disponibles
 * desde `fechaInicioYmd` (debe ser un jueves; se usa `diasDeLaJornada` con
 * jornada=1 para obtener jueves/viernes/sábado de esa semana, recortado a
 * `numDiasMax` días). No exige llenar todas las franjas — reparte los
 * partidos lo más parejo posible entre los días y, dentro de cada día,
 * llena horario×cancha en orden. Con 2 horarios × 2 canchas = 4 franjas
 * por día, alcanza para 8 partidos en 3 días (octavos), 4 en 2 días
 * (cuartos) o 2/1 en un solo día (semifinal, final, tercer puesto).
 */
export function ubicarFaseEliminacion(
  partidos: PartidoEliminacionGenerado[],
  fechaInicioYmd: string,
  numDiasMax: number,
  numeroCanchas: number,
  horarios: number[]
): PartidoEliminacionUbicado[] {
  const todosLosDias: DiaJuego[] = diasDeLaJornada(fechaInicioYmd, 1);
  const dias = todosLosDias.slice(0, numDiasMax);
  if (dias.length < numDiasMax) {
    throw new Error(`No se pudieron calcular ${numDiasMax} días desde ${fechaInicioYmd}.`);
  }

  const slotsPorDia = horarios.length * numeroCanchas;
  const capacidad = dias.length * slotsPorDia;
  if (partidos.length > capacidad) {
    throw new Error(
      `Hay ${partidos.length} partidos para ubicar pero la capacidad es ${capacidad} ` +
        `(${dias.length} días × ${horarios.length} horarios × ${numeroCanchas} canchas).`
    );
  }

  const porDia: PartidoEliminacionGenerado[][] = dias.map(() => []);
  partidos.forEach((p, i) => {
    porDia[i % dias.length].push(p);
  });

  const resultado: PartidoEliminacionUbicado[] = [];
  dias.forEach((dia, diaIdx) => {
    // Cancha por fuera, hora por dentro: así, cuando un día tiene pocos
    // partidos (el caso típico de esta fase — p. ej. 2 en semifinal), se
    // reparten primero en horas distintas de la misma cancha en vez de
    // amontonarse en la misma hora de canchas distintas. Para semifinal
    // esto es lo que hace que quede secuencial (7pm/8pm) y no simultánea
    // (decisión confirmada con Fernando).
    const slotsDisponibles: { hora: number; cancha: number }[] = [];
    for (let cancha = 1; cancha <= numeroCanchas; cancha++) {
      for (const hora of horarios) slotsDisponibles.push({ hora, cancha });
    }
    porDia[diaIdx].forEach((partido, i) => {
      const slot = slotsDisponibles[i];
      resultado.push({ ...partido, fechaYmd: dia.fechaYmd, hora: slot.hora, cancha: slot.cancha });
    });
  });

  return resultado;
}

// ---------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------

/**
 * Valida un bracket generado (octavos, cuartos, semifinal, final o
 * tercer puesto) contra las reglas de la fase eliminatoria. Devuelve la
 * lista de problemas encontrados — vacía si es válido. Mismo criterio que
 * `validarFixtureFaseDeGrupos`: no se debe guardar ni presentar como
 * correcto un bracket con algún problema en esta lista.
 */
export function validarBracketEliminacion(
  partidos: PartidoEliminacionUbicado[],
  opciones: {
    totalEsperado: number;
    faseEsperada: string;
    grupoPorEquipo?: Map<string, LetraGrupo>;
  }
): string[] {
  const problemas: string[] = [];

  if (partidos.length !== opciones.totalEsperado) {
    problemas.push(`Se esperaban ${opciones.totalEsperado} partidos, hay ${partidos.length}.`);
  }

  for (const p of partidos) {
    if (p.fase !== opciones.faseEsperada) {
      problemas.push(
        `Partido ${p.local} vs ${p.visitante} tiene fase "${p.fase}", se esperaba "${opciones.faseEsperada}".`
      );
    }
    if (p.local === p.visitante) {
      problemas.push(`Partido con el mismo equipo como local y visitante: ${p.local}.`);
    }
  }

  const equipos = partidos.flatMap((p) => [p.local, p.visitante]);
  if (new Set(equipos).size !== equipos.length) {
    problemas.push(`Hay un equipo jugando más de un partido en ${opciones.faseEsperada}.`);
  }

  const slotsUsados = new Set<string>();
  for (const p of partidos) {
    const clave = `${p.fechaYmd}-${p.hora}-${p.cancha}`;
    if (slotsUsados.has(clave)) {
      problemas.push(`Choque de cancha/hora en ${opciones.faseEsperada}: ${clave}.`);
    }
    slotsUsados.add(clave);
  }

  if (opciones.grupoPorEquipo) {
    const grupoPorEquipo = opciones.grupoPorEquipo;
    for (const p of partidos) {
      const gLocal = grupoPorEquipo.get(p.local);
      const gVisitante = grupoPorEquipo.get(p.visitante);
      if (gLocal && gVisitante && gLocal === gVisitante) {
        problemas.push(
          `Revancha de grupo en ${opciones.faseEsperada}: ${p.local} vs ${p.visitante} (ambos del grupo ${gLocal}).`
        );
      }
    }
  }

  return problemas;
}
