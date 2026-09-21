/**
 * Catálogo de "espacios de patrocinio" del sitio — el equivalente casero a
 * los ads de Google (sin subasta: son un puñado de marcas vendidas a mano,
 * ver conversación con Fernando 2026-09-20/21). Cada slot es un lugar fijo
 * de la plataforma donde puede aparecer un patrocinador.
 *
 * Fase 1 (2026-09-21) conectó `home-slider` (el carrusel del Home,
 * `src/components/home/patrocinadores.tsx`). Fase 2 (mismo día) construyó
 * el componente reutilizable `SponsorSlot`
 * (`src/components/patrocinadores/sponsor-slot.tsx`) y lo desplegó en
 * tabla de posiciones, votación MVP, resultado de MVP del partido y perfil
 * de equipo — quedan marcados `disponible: true`.
 *
 * `galeria` sigue en `disponible: false` porque la página de galería en sí
 * (punto 25 del brief) todavía no está construida — no hay dónde montar el
 * slot. Se activa cuando exista esa página.
 */

export type SlotPatrocinio = {
  id: string;
  /** Texto explicando exactamente dónde aparece — se muestra tal cual en el admin. */
  label: string;
  disponible: boolean;
};

export const SLOTS_PATROCINIO: SlotPatrocinio[] = [
  { id: "home-slider", label: "Carrusel de patrocinadores — Home", disponible: true },
  { id: "tabla-posiciones", label: '"Presentado por" — Tabla de posiciones', disponible: true },
  { id: "mvp-votacion", label: '"Presentado por" — Pantalla de votación MVP', disponible: true },
  { id: "mvp-resultado", label: '"Presentado por" — Resultado del MVP del partido', disponible: true },
  { id: "equipo-perfil", label: "Logo en caja — Perfil de cada equipo", disponible: true },
  { id: "galeria", label: "Logo en caja — Galería / contenido (aún no existe la página)", disponible: false },
];
