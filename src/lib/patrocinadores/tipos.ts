/**
 * Tipos compartidos entre el panel admin (`/admin/patrocinadores`) y el
 * consumo público (Home, futuros SponsorSlot) — reemplaza los tipos que
 * antes vivían en `src/lib/patrocinadores-reales.ts` (arreglo harcodeado,
 * retirado al pasar los patrocinadores a Supabase, ver migración
 * 23_patrocinadores y Fase 1 del sistema de espacios de patrocinio).
 */

export const NIVELES_PATROCINIO = ["principal", "oficial", "experiencia", "aliado"] as const;

export type NivelPatrocinio = (typeof NIVELES_PATROCINIO)[number];

export const NIVEL_LABEL: Record<NivelPatrocinio, string> = {
  principal: "Patrocinador principal",
  oficial: "Patrocinador oficial",
  experiencia: "Patrocinador de experiencia",
  aliado: "Aliado local",
};

export type PatrocinadorPublico = {
  id: string;
  nombre: string;
  nivel: NivelPatrocinio;
  logo_url: string;
  link_url: string | null;
  slots: string[];
  orden: number;
};
