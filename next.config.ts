import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Límite por defecto es 1mb — muy justo para la subida de logos de
      // patrocinadores desde /admin/patrocinadores (panel admin, Fase 1 del
      // sistema de espacios de patrocinio, 2026-09-21). Los PNG con
      // transparencia de una marca pueden pesar un par de MB.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // Bucket público "patrocinadores" en Supabase Storage (migración
    // 23_patrocinadores) — de acá salen los logos subidos desde el panel
    // admin. Los patrocinadores sembrados de entrada siguen usando archivos
    // estáticos en /public/brand/patrocinadores, que no necesitan esto.
    remotePatterns: [new URL("https://jnbototdivmesmciubxo.supabase.co/storage/v1/object/public/patrocinadores/**")],
  },
};

export default nextConfig;
