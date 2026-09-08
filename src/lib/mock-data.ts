// Datos de ejemplo (placeholder) para maquetar el Home.
// TODO: reemplazar por datos reales desde Supabase cuando el modelo de datos quede definido.

export type Equipo = {
  id: string;
  nombre: string;
  iniciales: string;
};

export const equipos: Equipo[] = [
  { id: "guerreros", nombre: "Los Guerreros", iniciales: "LG" },
  { id: "real-monteria", nombre: "Real Montería", iniciales: "RM" },
  { id: "atletico-cordoba", nombre: "Atlético Córdoba", iniciales: "AC" },
  { id: "titanes", nombre: "Los Titanes", iniciales: "LT" },
  { id: "deportivo-sur", nombre: "Deportivo Sur", iniciales: "DS" },
  { id: "la-familia", nombre: "La Familia FC", iniciales: "LF" },
  { id: "sinu-fc", nombre: "Sinú FC", iniciales: "SF" },
  { id: "leones-costa", nombre: "Leones de la Costa", iniciales: "LC" },
  { id: "monteria-united", nombre: "Montería United", iniciales: "MU" },
  { id: "parche-fc", nombre: "El Parche FC", iniciales: "PF" },
];

export type Partido = {
  id: string;
  dia: string;
  hora: string;
  equipoLocal: string;
  equipoVisitante: string;
  cancha: string;
};

export const proximosPartidos: Partido[] = [
  { id: "p1", dia: "JUEVES 7 NOV", hora: "7:00 PM", equipoLocal: "Los Guerreros", equipoVisitante: "Real Montería", cancha: "Cancha El Recreo" },
  { id: "p2", dia: "VIERNES 8 NOV", hora: "8:00 PM", equipoLocal: "Atlético Córdoba", equipoVisitante: "Los Titanes", cancha: "Cancha Villa Olímpica" },
  { id: "p3", dia: "SÁBADO 9 NOV", hora: "5:00 PM", equipoLocal: "Deportivo Sur", equipoVisitante: "La Familia FC", cancha: "Cancha Rancho Grande" },
];

export type FilaTabla = {
  posicion: number;
  equipo: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  pts: number;
};

export const tablaPosiciones: FilaTabla[] = [
  { posicion: 1, equipo: "Los Guerreros", pj: 3, pg: 3, pe: 0, pp: 0, gf: 9, gc: 2, pts: 9 },
  { posicion: 2, equipo: "Real Montería", pj: 3, pg: 2, pe: 1, pp: 0, gf: 7, gc: 3, pts: 7 },
  { posicion: 3, equipo: "Atlético Córdoba", pj: 3, pg: 2, pe: 0, pp: 1, gf: 6, gc: 4, pts: 6 },
  { posicion: 4, equipo: "Los Titanes", pj: 3, pg: 1, pe: 1, pp: 1, gf: 5, gc: 5, pts: 4 },
  { posicion: 5, equipo: "Deportivo Sur", pj: 3, pg: 1, pe: 0, pp: 2, gf: 4, gc: 6, pts: 3 },
];

export const estadisticasDestacadas = {
  goleador: { nombre: "Juan Pérez", equipo: "Los Guerreros", valor: "7 goles" },
  arquero: { nombre: "Carlos Díaz", equipo: "Real Montería", valor: "3 vallas invictas" },
  mvp: { nombre: "Andrés Ríos", equipo: "Atlético Córdoba", valor: "2 goles · 1 asistencia" },
};

export const patrocinadoresPlaceholder = [
  "Patrocinador 1",
  "Patrocinador 2",
  "Patrocinador 3",
  "Patrocinador 4",
  "Patrocinador 5",
];

export const torneoEnNumeros = {
  equipos: 24,
  jugadores: 360,
  partidos: "75",
  partidosMaxPorEquipo: 9,
  premioCampeon: "$10M",
};

export const inclusiones = [
  "Canchas",
  "Arbitraje",
  "Uniformes",
  "Hidratación",
  "Plataforma digital",
  "Estadísticas",
  "Cobertura",
  "Premiación",
];
