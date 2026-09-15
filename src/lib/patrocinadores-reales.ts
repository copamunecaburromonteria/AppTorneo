/**
 * Patrocinadores reales confirmados, a mostrar junto a los espacios
 * reservados de `mock-data.ts` (`patrocinadoresPlaceholder`). Se separa en
 * su propio archivo (en vez de meterlo en mock-data.ts, que es
 * explícitamente placeholder/TODO) porque esta sí es información real,
 * aunque el logo se cargue como archivo estático por ahora en vez de desde
 * una tabla en Supabase — no existe todavía un panel para que Fernando
 * suba patrocinadores él mismo (ver Fase 4, punto 2 del plan).
 */

export type NivelPatrocinio = "principal" | "oficial" | "experiencia" | "aliado";

export const NIVEL_LABEL: Record<NivelPatrocinio, string> = {
  principal: "Patrocinador principal",
  oficial: "Patrocinador oficial",
  experiencia: "Patrocinador de experiencia",
  aliado: "Aliado local",
};

export type PatrocinadorReal = {
  /** Nombre de la marca. Placeholder hasta que Fernando confirme el nombre real. */
  nombre: string;
  nivel: NivelPatrocinio;
  logoUrl: string;
  /** Enlace opcional (web/redes) al hacer clic en el logo. */
  url?: string;
};

export const patrocinadoresReales: PatrocinadorReal[] = [
  {
    nombre: "Patrocinador oficial",
    nivel: "oficial",
    logoUrl: "/brand/patrocinadores/patrocinador-01.png",
  },
  {
    nombre: "SST Asesorías y Consultorías",
    nivel: "oficial",
    logoUrl: "/brand/patrocinadores/sst.png",
  },
  {
    nombre: "Hakunna Fit",
    nivel: "oficial",
    logoUrl: "/brand/patrocinadores/hakunna-fit.png",
  },
  {
    nombre: "Hakunna Fotografía",
    nivel: "oficial",
    logoUrl: "/brand/patrocinadores/hakunna-fotografia.png",
  },
  {
    // Nombre asumido: el logo no trae texto, se infiere de la marca de Fernando (Hakunna Digital) — confirmar.
    nombre: "Hakunna Digital",
    nivel: "oficial",
    logoUrl: "/brand/patrocinadores/hakunna-digital.png",
  },
];
