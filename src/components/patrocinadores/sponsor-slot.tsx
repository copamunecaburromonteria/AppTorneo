import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import type { PatrocinadorPublico } from "@/lib/patrocinadores/tipos";
import { SponsorTracker } from "./sponsor-tracker";

/**
 * Fase 2 del sistema de espacios de patrocinio (2026-09-21): estos
 * componentes son el "SponsorSlot" reutilizable que la Fase 1 dejó
 * pendiente — el mismo patrón del carrusel del Home
 * (`components/home/patrocinadores.tsx`) pero empaquetado para usarse en
 * cualquier página, en dos formatos:
 *
 *   - `SponsorPresentadoPor` / `SponsorPresentadoPorInline`: formato
 *     "presentado por" — logo chico (~20-24px) en línea junto a un texto.
 *     Para tabla de posiciones, votación MVP y resultado de MVP.
 *   - `SponsorSlotCaja`: formato "logo en caja" — caja más grande
 *     (~96-112px de alto), con placeholder "Tu marca va aquí" cuando el
 *     espacio no está vendido (nunca deja un hueco vacío ni un bug visual
 *     — dobla como vitrina de venta). Para el perfil de cada equipo.
 *
 * Todos consultan `v_patrocinadores_publicos` (Supabase) filtrando por el
 * slot pedido — el catálogo completo de slots vive en
 * `src/lib/patrocinadores/slots.ts`. Si un slot tiene más de un
 * patrocinador asignado, se rota con un simple azar en cada carga de
 * página (no hay subasta ni prioridad — ver conversación con Fernando
 * 2026-09-20: "los ads de Google" era la referencia, pero acá alcanza con
 * algo mucho más simple).
 *
 * Fase 3 (2026-09-21): cada logo/link renderizado queda envuelto en
 * `SponsorTracker`, que mide exposición e interacción vía Google Analytics
 * 4 (eventos `sponsor_impression` / `sponsor_click`) — no se construyó un
 * sistema de tracking propio en Supabase, se reusa el GA que ya cubre todo
 * el sitio.
 */

const WHATSAPP_TORNEO = "573126070588";
const MENSAJE_CONTACTO =
  "Hola, quiero información sobre los espacios de patrocinio de la Copa Muñeca e'Burro.";

async function patrocinadorDelSlot(slot: string): Promise<PatrocinadorPublico | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_patrocinadores_publicos")
    .select("id, nombre, nivel, logo_url, link_url, slots, orden");

  const candidatos = ((data ?? []) as PatrocinadorPublico[]).filter((p) =>
    p.slots?.includes(slot)
  );
  if (candidatos.length === 0) return null;

  // Rotación simple entre varios patrocinadores del mismo slot.
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

function LogoInline({
  patrocinador,
  alto,
  slot,
}: {
  patrocinador: PatrocinadorPublico;
  alto: number;
  slot: string;
}) {
  const img = (
    <Image
      src={patrocinador.logo_url}
      alt={patrocinador.nombre}
      width={alto * 2.4}
      height={alto}
      style={{ height: alto, width: "auto" }}
      className="inline-block object-contain align-middle"
    />
  );
  const contenido = patrocinador.link_url ? (
    <Link
      href={patrocinador.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block align-middle"
    >
      {img}
    </Link>
  ) : (
    img
  );

  return (
    <SponsorTracker
      sponsorId={patrocinador.id}
      sponsorNombre={patrocinador.nombre}
      nivel={patrocinador.nivel}
      slot={slot}
    >
      {contenido}
    </SponsorTracker>
  );
}

/**
 * Formato "presentado por" en bloque propio, ej. debajo de un título:
 * "Tabla de posiciones presentada por [logo]". No renderiza nada si el
 * slot no tiene patrocinador asignado — a diferencia de la caja grande,
 * un renglón de texto vacío sí se nota como hueco raro, así que acá se
 * prefiere simplemente omitirlo (el espacio se sigue vendiendo desde
 * /admin/patrocinadores y desde el banner del Home).
 */
export async function SponsorPresentadoPor({
  slot,
  etiqueta,
  className = "mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40",
}: {
  slot: string;
  etiqueta: string;
  className?: string;
}) {
  const patrocinador = await patrocinadorDelSlot(slot);
  if (!patrocinador) return null;

  return (
    <p className={className}>
      {etiqueta} <LogoInline patrocinador={patrocinador} alto={22} slot={slot} />
    </p>
  );
}

/**
 * Formato "presentado por" en línea, para insertar dentro de un texto ya
 * existente (ej. "⭐ MVP del partido{" "}<SponsorPresentadoPorInline .../>").
 * También devuelve `null` si no hay patrocinador — el texto que lo rodea
 * queda igual de bien sin el sufijo.
 */
export async function SponsorPresentadoPorInline({ slot }: { slot: string }) {
  const patrocinador = await patrocinadorDelSlot(slot);
  if (!patrocinador) return null;

  return (
    <>
      {" "}
      · presentado por <LogoInline patrocinador={patrocinador} alto={18} slot={slot} />
    </>
  );
}

/**
 * Formato "logo en caja" — para espacios con más presencia visual (perfil
 * de equipo, galería). A diferencia del "presentado por", acá SÍ se
 * muestra un placeholder "Tu marca va aquí" cuando el espacio está libre
 * (enlazado al WhatsApp del torneo): es una caja dedicada, dejarla vacía
 * se vería como un error, y de paso sigue funcionando como vitrina de
 * venta — mismo criterio que el banner de "Espacios disponibles" del Home.
 */
export async function SponsorSlotCaja({ slot, titulo }: { slot: string; titulo?: string }) {
  const patrocinador = await patrocinadorDelSlot(slot);
  const linkContacto = armarLinkWhatsApp(WHATSAPP_TORNEO, MENSAJE_CONTACTO);

  if (!patrocinador) {
    const contenido = (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition-colors hover:border-muneca-yellow/40">
        <p className="text-xs font-bold uppercase tracking-wide text-white/40">
          {titulo ?? "Espacio de patrocinio"}
        </p>
        <p className="font-display mt-2 text-lg text-white/30">Tu marca va aquí</p>
      </div>
    );
    return linkContacto ? (
      <Link href={linkContacto} target="_blank" rel="noopener noreferrer">
        {contenido}
      </Link>
    ) : (
      contenido
    );
  }

  const logo = (
    <Image
      src={patrocinador.logo_url}
      alt={patrocinador.nombre}
      width={200}
      height={200}
      className="h-full w-full object-contain"
    />
  );
  const contenidoLogo = patrocinador.link_url ? (
    <Link
      href={patrocinador.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className="h-full w-full"
    >
      {logo}
    </Link>
  ) : (
    logo
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-muneca-yellow">
        {titulo ?? "Patrocinador"}
      </p>
      <div className="mt-3 flex h-24 items-center justify-center rounded-xl bg-white/5 p-3 sm:h-28">
        <SponsorTracker
          sponsorId={patrocinador.id}
          sponsorNombre={patrocinador.nombre}
          nivel={patrocinador.nivel}
          slot={slot}
        >
          {contenidoLogo}
        </SponsorTracker>
      </div>
    </div>
  );
}
