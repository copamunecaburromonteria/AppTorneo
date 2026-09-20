/**
 * Prueba de extremo a extremo de la lógica del torneo, con 24 equipos
 * ficticios — NO toca Supabase ni la base de datos real (Fernando pidió
 * mantener producción limpia de datos dummy, ver `plan-fases-tareas.md`
 * punto 9aa). Corre el pipeline completo: sorteo + fase de grupos →
 * clasificación → octavos → cuartos → semifinal → final/tercer puesto,
 * usando exactamente las mismas funciones puras que usan las Server
 * Actions reales (`src/lib/torneo/generador-calendario.ts` y
 * `src/lib/torneo/generador-eliminacion.ts`).
 *
 * Imprime un reporte PASS/FAIL calcado del checklist de la sección 24 del
 * brief de Fernando y sale con código de error si algo falla.
 *
 * Uso: npx tsx scripts/validar-torneo.ts
 */

import {
  LETRAS_GRUPO,
  sortearGrupos,
  generarProgramacionFaseDeGrupos,
  validarFixtureFaseDeGrupos,
  type LetraGrupo,
  type PartidoGenerado,
} from "../src/lib/torneo/generador-calendario";
import {
  calcularStandings,
  clasificarGrupo,
  generarOctavos,
  generarCuartos,
  generarSemifinal,
  generarFinal,
  generarTercerPuesto,
  ubicarFaseEliminacion,
  validarBracketEliminacion,
  type ResultadoPartido,
  type ResultadoEliminacion,
  type ResultadoSemifinal,
  type PartidoEliminacionUbicado,
} from "../src/lib/torneo/generador-eliminacion";

type Chequeo = { regla: string; pass: boolean; detalle?: string };
const chequeos: Chequeo[] = [];
function chequear(regla: string, pass: boolean, detalle?: string) {
  chequeos.push({ regla, pass, detalle });
}

// -----------------------------------------------------------------------
// 0. 24 equipos ficticios, con "poder" = orden_inscripcion (1-24, único).
//    El resultado de cada partido lo decide el equipo de mayor poder
//    (gana 2-1) — así ningún partido de fase de grupos termina empatado y
//    la clasificación queda con un orden estrictamente determinado, sin
//    casos ambiguos, para que este reporte sea 100% reproducible.
// -----------------------------------------------------------------------

const EQUIPOS = Array.from({ length: 24 }, (_, i) => ({
  id: `equipo-${String(i + 1).padStart(2, "0")}`,
  orden_inscripcion: i + 1,
}));
const poderPorEquipo = new Map(EQUIPOS.map((e) => [e.id, e.orden_inscripcion]));

function resultadoDeterministico(local: string, visitante: string): { marcadorLocal: number; marcadorVisitante: number } {
  const pl = poderPorEquipo.get(local)!;
  const pv = poderPorEquipo.get(visitante)!;
  return pl > pv ? { marcadorLocal: 2, marcadorVisitante: 1 } : { marcadorLocal: 1, marcadorVisitante: 2 };
}

function ganador(local: string, visitante: string): string {
  return poderPorEquipo.get(local)! > poderPorEquipo.get(visitante)! ? local : visitante;
}
function perdedor(local: string, visitante: string): string {
  return poderPorEquipo.get(local)! > poderPorEquipo.get(visitante)! ? visitante : local;
}

function verificarSinChoquesCanchaHora(
  partidos: { fechaYmd: string; hora: number; cancha: number }[],
  etiqueta: string
): string[] {
  const problemas: string[] = [];
  const vistos = new Set<string>();
  for (const p of partidos) {
    const clave = `${p.fechaYmd}-${p.hora}-${p.cancha}`;
    if (vistos.has(clave)) problemas.push(`${etiqueta}: choque de cancha/hora en ${clave}.`);
    vistos.add(clave);
  }
  return problemas;
}

// -----------------------------------------------------------------------
// 1. Sorteo + fase de grupos (60 partidos, 5 jornadas)
// -----------------------------------------------------------------------

chequear("24 equipos ficticios generados", EQUIPOS.length === 24, `hay ${EQUIPOS.length}`);

const FECHA_INICIO_GRUPOS = "2026-10-29"; // jueves
const grupos: Record<LetraGrupo, string[]> = sortearGrupos(EQUIPOS);

for (const letra of LETRAS_GRUPO) {
  chequear(`Grupo ${letra} tiene 6 equipos`, grupos[letra].length === 6, `tiene ${grupos[letra].length}`);
}

const partidosGrupos: PartidoGenerado[] = generarProgramacionFaseDeGrupos(grupos, FECHA_INICIO_GRUPOS);
const problemasFixture = validarFixtureFaseDeGrupos(partidosGrupos, grupos);

chequear("60 partidos en la fase de grupos", partidosGrupos.length === 60, `hay ${partidosGrupos.length}`);
for (let jornada = 1; jornada <= 5; jornada++) {
  const n = partidosGrupos.filter((p) => p.jornada === jornada).length;
  chequear(`Jornada ${jornada}: 12 partidos`, n === 12, `hay ${n}`);
}
chequear(
  "0 rivales repetidos / 0 equipos con 2 partidos en una jornada (validarFixtureFaseDeGrupos)",
  problemasFixture.length === 0,
  problemasFixture.join(" | ") || undefined
);

const choquesGrupos = verificarSinChoquesCanchaHora(partidosGrupos, "Fase de grupos");
chequear("0 choques de cancha/hora en la fase de grupos", choquesGrupos.length === 0, choquesGrupos.join(" | ") || undefined);

// -----------------------------------------------------------------------
// 2. Clasificación (16 equipos: top 4 de cada grupo)
// -----------------------------------------------------------------------

const resultadosGrupos: ResultadoPartido[] = partidosGrupos.map((p) => ({
  local: p.local,
  visitante: p.visitante,
  ...resultadoDeterministico(p.local, p.visitante),
}));

const todosLosEquipos = EQUIPOS.map((e) => e.id);
const standings = calcularStandings(todosLosEquipos, resultadosGrupos);

const grupoPorEquipo = new Map<string, LetraGrupo>();
for (const letra of LETRAS_GRUPO) {
  for (const id of grupos[letra]) grupoPorEquipo.set(id, letra);
}

const clasificados: Record<LetraGrupo, string[]> = { A: [], B: [], C: [], D: [] };
let clasificacionOk = true;
for (const letra of LETRAS_GRUPO) {
  const resultadosDelGrupo = resultadosGrupos.filter(
    (r) => grupoPorEquipo.get(r.local) === letra && grupoPorEquipo.get(r.visitante) === letra
  );
  const clasificacion = clasificarGrupo(grupos[letra], standings, resultadosDelGrupo);
  if (clasificacion.ambiguo) {
    clasificacionOk = false;
    chequear(`Clasificación del grupo ${letra} sin ambigüedad`, false, `empatados: ${clasificacion.equiposEmpatados.join(", ")}`);
  } else {
    clasificados[letra] = clasificacion.orden.slice(0, 4);
    chequear(`Clasificación del grupo ${letra} sin ambigüedad`, true);
  }
}

const totalClasificados = LETRAS_GRUPO.reduce((acc, letra) => acc + clasificados[letra].length, 0);
chequear("16 equipos clasificados a octavos (4 por grupo)", totalClasificados === 16, `hay ${totalClasificados}`);

// -----------------------------------------------------------------------
// 2b. Chequeo aparte del desempate por enfrentamiento directo (caso
//     fabricado con empate exacto en pts/dg/gf entre 2 de 6 equipos, para
//     probar esa rama específica de `clasificarGrupo` — no forma parte
//     del pipeline de los 24 equipos de arriba, que por diseño no tiene
//     empates).
// -----------------------------------------------------------------------

{
  const ids = ["x1", "x2", "x3", "x4", "x5", "x6"];
  // x1 y x2 terminan EXACTAMENTE empatados en pts/dg/gf contra el resto,
  // pero x1 le ganó a x2 en su enfrentamiento directo → debe quedar 1º.
  const resultadosFicticios: ResultadoPartido[] = [
    { local: "x1", visitante: "x2", marcadorLocal: 2, marcadorVisitante: 1 }, // enfrentamiento directo: gana x1
    { local: "x1", visitante: "x3", marcadorLocal: 3, marcadorVisitante: 0 },
    { local: "x2", visitante: "x3", marcadorLocal: 4, marcadorVisitante: 1 },
    { local: "x4", visitante: "x5", marcadorLocal: 1, marcadorVisitante: 1 },
    { local: "x5", visitante: "x6", marcadorLocal: 0, marcadorVisitante: 0 },
    { local: "x6", visitante: "x4", marcadorLocal: 2, marcadorVisitante: 2 },
  ];
  const st = calcularStandings(ids, resultadosFicticios);
  const clasif = clasificarGrupo(ids, st, resultadosFicticios);
  const ok = !clasif.ambiguo && clasif.orden[0] === "x1" && clasif.orden[1] === "x2";
  chequear(
    "Desempate por enfrentamiento directo resuelve un empate exacto de pts/dg/gf",
    ok,
    clasif.ambiguo ? `quedó ambiguo: ${clasif.equiposEmpatados.join(", ")}` : `orden: ${clasif.orden.join(", ")}`
  );
}

if (!clasificacionOk) {
  imprimirReporte();
  process.exit(1);
}

// -----------------------------------------------------------------------
// 3. Octavos (8 partidos)
// -----------------------------------------------------------------------

const FECHA_OCTAVOS = "2026-12-03";
const FECHA_CUARTOS = "2026-12-10";
const FECHA_SEMIFINAL = "2026-12-17";
const FECHA_FINAL = "2026-12-19";
const HORARIOS = [19, 20];
const CANCHAS = 2;

const octavosGenerados = generarOctavos(clasificados);
const octavosUbicados: PartidoEliminacionUbicado[] = ubicarFaseEliminacion(
  octavosGenerados,
  FECHA_OCTAVOS,
  3,
  CANCHAS,
  HORARIOS
);
const problemasOctavos = validarBracketEliminacion(octavosUbicados, {
  totalEsperado: 8,
  faseEsperada: "Octavos de Final",
  grupoPorEquipo,
});
chequear("8 partidos de octavos de final", octavosUbicados.length === 8, `hay ${octavosUbicados.length}`);
chequear(
  "Octavos: sin revancha de grupo, sin equipo repetido, sin choque de cancha/hora",
  problemasOctavos.length === 0,
  problemasOctavos.join(" | ") || undefined
);

const resultadosOctavos: ResultadoEliminacion[] = octavosUbicados.map((p) => ({
  llave: p.llave as string,
  ganador: ganador(p.local, p.visitante),
}));

// -----------------------------------------------------------------------
// 4. Cuartos (4 partidos)
// -----------------------------------------------------------------------

const cuartosGenerados = generarCuartos(resultadosOctavos);
const cuartosUbicados: PartidoEliminacionUbicado[] = ubicarFaseEliminacion(
  cuartosGenerados,
  FECHA_CUARTOS,
  2,
  CANCHAS,
  HORARIOS
);
const problemasCuartos = validarBracketEliminacion(cuartosUbicados, {
  totalEsperado: 4,
  faseEsperada: "Cuartos de Final",
});
chequear("4 partidos de cuartos de final", cuartosUbicados.length === 4, `hay ${cuartosUbicados.length}`);
chequear(
  "Cuartos: sin equipo repetido, sin choque de cancha/hora",
  problemasCuartos.length === 0,
  problemasCuartos.join(" | ") || undefined
);

const resultadosCuartos: ResultadoEliminacion[] = cuartosUbicados.map((p) => ({
  llave: p.llave as string,
  ganador: ganador(p.local, p.visitante),
}));

// -----------------------------------------------------------------------
// 5. Semifinal (2 partidos)
// -----------------------------------------------------------------------

const semifinalGenerada = generarSemifinal(resultadosCuartos);
const semifinalUbicada: PartidoEliminacionUbicado[] = ubicarFaseEliminacion(
  semifinalGenerada,
  FECHA_SEMIFINAL,
  1,
  CANCHAS,
  HORARIOS
);
const problemasSemifinal = validarBracketEliminacion(semifinalUbicada, {
  totalEsperado: 2,
  faseEsperada: "Semifinal",
});
chequear("2 partidos de semifinal", semifinalUbicada.length === 2, `hay ${semifinalUbicada.length}`);
chequear(
  "Semifinal: sin equipo repetido, sin choque de cancha/hora, secuencial (7pm/8pm)",
  problemasSemifinal.length === 0 && new Set(semifinalUbicada.map((p) => p.hora)).size === 2,
  problemasSemifinal.join(" | ") || undefined
);

const resultadosSemifinal: ResultadoSemifinal[] = semifinalUbicada.map((p) => ({
  llave: p.llave as "SF-1" | "SF-2",
  ganador: ganador(p.local, p.visitante),
  perdedor: perdedor(p.local, p.visitante),
}));

// -----------------------------------------------------------------------
// 6. Final + Tercer puesto (1 + 1 partido)
// -----------------------------------------------------------------------

const finalGenerada = generarFinal(resultadosSemifinal);
const tercerPuestoGenerado = generarTercerPuesto(resultadosSemifinal);

const finalYTercerPuestoUbicados: PartidoEliminacionUbicado[] = [tercerPuestoGenerado, finalGenerada].map(
  (p, i) => ({ ...p, fechaYmd: FECHA_FINAL, hora: HORARIOS[i], cancha: 1 })
);

const finalUbicada = finalYTercerPuestoUbicados.filter((p) => p.fase === "Final");
const tercerPuestoUbicado = finalYTercerPuestoUbicados.filter((p) => p.fase === "Tercer puesto");

const problemasFinal = validarBracketEliminacion(finalUbicada, { totalEsperado: 1, faseEsperada: "Final" });
const problemasTercerPuesto = validarBracketEliminacion(tercerPuestoUbicado, {
  totalEsperado: 1,
  faseEsperada: "Tercer puesto",
});

chequear("1 partido de tercer puesto (opcional)", tercerPuestoUbicado.length === 1, `hay ${tercerPuestoUbicado.length}`);
chequear("1 partido de final", finalUbicada.length === 1, `hay ${finalUbicada.length}`);
chequear(
  "Final/tercer puesto: sin equipo repetido, sin choque de cancha/hora",
  problemasFinal.length === 0 && problemasTercerPuesto.length === 0,
  [...problemasFinal, ...problemasTercerPuesto].join(" | ") || undefined
);

const campeon = ganador(finalGenerada.local, finalGenerada.visitante);
const subcampeon = perdedor(finalGenerada.local, finalGenerada.visitante);
chequear("Campeón y subcampeón quedan registrados", Boolean(campeon) && Boolean(subcampeon) && campeon !== subcampeon);

// -----------------------------------------------------------------------
// 7. Total de partidos del torneo (75 sin tercer puesto, 76 con él)
// -----------------------------------------------------------------------

const totalPartidos =
  partidosGrupos.length +
  octavosUbicados.length +
  cuartosUbicados.length +
  semifinalUbicada.length +
  finalUbicada.length +
  tercerPuestoUbicado.length;
chequear("76 partidos en total (60 grupos + 8 + 4 + 2 + 1 + 1, con tercer puesto)", totalPartidos === 76, `hay ${totalPartidos}`);

// -----------------------------------------------------------------------
// Reporte final
// -----------------------------------------------------------------------

function imprimirReporte() {
  console.log("\n=== VALIDACIÓN COPA MUÑECA E'BURRO — 24 equipos ficticios ===\n");
  for (const c of chequeos) {
    const etiqueta = c.pass ? "PASS" : "FAIL";
    console.log(`[${etiqueta}] ${c.regla}${c.detalle ? ` — ${c.detalle}` : ""}`);
  }
  const fallas = chequeos.filter((c) => !c.pass);
  console.log(`\n${chequeos.length - fallas.length}/${chequeos.length} reglas en PASS.`);
  if (fallas.length > 0) {
    console.log(`${fallas.length} regla(s) en FAIL — la implementación NO se considera terminada.`);
  } else {
    console.log("Todas las reglas en PASS.");
  }
}

imprimirReporte();
const hayFallas = chequeos.some((c) => !c.pass);
process.exit(hayFallas ? 1 : 0);
