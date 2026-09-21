/**
 * Catálogo de "espacios de patrocinio" del sitio — el equivalente casero a
 * los ads de Google (sin subasta: son un puñado de marcas vendidas a mano,
 * ver conversación con Fernando 2026-09-20/21). Cada slot es un lugar fijo
 * de la plataforma donde puede aparecer un patrocinador.
 *
 * Fase 1 (2026-09-21) solo conecta `home-slider` de verdad (el carrusel del
 * Home, `src/components/home/patrocinadores.tsx`). Los demás quedan listados
 * aquí como catálogo de inventario — se ven en el panel admin marcados
 * "Próximamente" para que Fernando ya visualice qué se puede vender, pero no
 * son seleccionables todavía porque el componente reutilizable `SponsorSlot`
 * que los va a mostrar (Fase 2) no está construido. Cuando se construya cada
 * uno, basta con marcar `disponible: true` acá.
 */

export type SlotPatrocinio = {
  id: string;
  /** Texto explicando exactamente dónde aparece — se muestra tal cual en el admin. */
  label: string;
  disponible: boolean;
};

export const SLOTS_PATROCINIO: SlotPatrocinio[] = [
  { id: "home-slider", label: "Carrusel de patrocinadores — Home", disponible: true },
  { id: "tabla-posiciones", label: '"Presentado por" — Tabla de posiciones', disponible: false },
  { id: "mvp-votacion", label: '"Presentado por" — Pantalla de votación MVP', disponible: false },
  { id: "mvp-resultado", label: '"Presentado por" — Resultado del MVP del partido', disponible: false },
  { id: "equipo-perfil", label: "Logo en caja — Perfil de cada equipo", disponible: false },
  { id: "galeria", label: "Logo en caja — Galería / contenido", disponible: false },
];
