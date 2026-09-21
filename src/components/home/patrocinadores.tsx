import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PatrocinadoresSlider } from "@/components/home/patrocinadores-slider";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import type { PatrocinadorPublico } from "@/lib/patrocinadores/tipos";

// Mismo WhatsApp del torneo que ya se usa en /admin/cargos-tarjetas — es el
// número de contacto general de la Copa (ver `contenido-patrocinadores.md`).
const WHATSAPP_TORNEO = "573126070588";
const SLOT_HOME = "home-slider";

/**
 * Sección de patrocinadores del Home. Fase 1 del sistema de espacios de
 * patrocinio (2026-09-21, ver conversación con Fernando y migración
 * `23_patrocinadores`): antes leía el arreglo harcodeado
 * `patrocinadores-reales.ts`; ahora consulta la vista pública
 * `v_patrocinadores_publicos` en Supabase y solo pasa al slider los que
 * tengan asignado el slot "home-slider" — el panel `/admin/patrocinadores`
 * es quien decide qué patrocinador aparece acá, sin tocar código.
 *
 * La fila de cajas punteadas "Espacios disponibles" (con nombres inventados
 * tipo "Patrocinador 1") se reemplaza por el banner real que envió Fernando
 * ("¡Tu marca va aquí!"), enlazado al WhatsApp del torneo con un mensaje
 * precargado — mismo patrón de `armarLinkWhatsApp` que ya se usa en el panel
 * admin.
 */
export async function Patrocinadores() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("v_patrocinadores_publicos")
    .select("id, nombre, nivel, logo_url, link_url, slots, orden");

  const patrocinadores = ((data ?? []) as PatrocinadorPublico[]).filter((p) =>
    p.slots?.includes(SLOT_HOME)
  );

  const linkContacto = armarLinkWhatsApp(
    WHATSAPP_TORNEO,
    "Hola, quiero información sobre los espacios de patrocinio de la Copa Muñeca e'Burro."
  );

  return (
    <section id="patrocinadores" className="bg-muneca-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          Patrocinadores
        </p>
        <p className="mt-1 pl-3 text-xs text-white/50">
          Ellos hacen esta Copa posible.
        </p>

        {patrocinadores.length > 0 && (
          <PatrocinadoresSlider patrocinadores={patrocinadores} />
        )}

        <p className="mt-8 pl-3 text-[11px] font-semibold uppercase tracking-wide text-white/30">
          Espacios disponibles
        </p>
        {linkContacto ? (
          <Link
            href={linkContacto}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-xl transition-transform hover:scale-[1.01]"
          >
            <Image
              src="/brand/patrocinadores/banner-espacio-disponible.png"
              alt="¡Tu marca va aquí! Escríbenos por WhatsApp para patrocinar la Copa Muñeca e'Burro."
              width={1600}
              height={533}
              className="h-auto w-full"
            />
          </Link>
        ) : (
          <Image
            src="/brand/patrocinadores/banner-espacio-disponible.png"
            alt="¡Tu marca va aquí!"
            width={1600}
            height={533}
            className="mt-3 h-auto w-full rounded-xl"
          />
        )}
      </div>
    </section>
  );
}
