import Link from "next/link";
import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { TeamCrest } from "@/components/team-crest";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";

type Equipo = { id: string; nombre_equipo: string; escudo_url: string | null };

/**
 * Índice público de equipos — fondo oscuro (2026-09-14), igual que
 * /partidos y /equipos/[equipo], parte del rediseño completo de la
 * plataforma a un solo tema oscuro que pidió Fernando.
 */
export default async function EquiposPage() {
  const supabase = await createClient();

  const [{ data: equiposRaw }, { data: config }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, nombre_equipo, escudo_url")
      .eq("estado_inscripcion", "validado")
      .order("orden_inscripcion", { ascending: true }),
    supabase.from("torneo_config").select("numero_equipos_torneo").eq("id", 1).maybeSingle(),
  ]);

  const equipos: Equipo[] = equiposRaw ?? [];
  const cupo = config?.numero_equipos_torneo ?? equipos.length;

  const breadcrumbs: Crumb[] = [{ label: "Inicio", href: "/" }, { label: "Equipos" }];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-black">
        <section className="relative isolate overflow-hidden pb-10 pt-36 text-white">
          <ParallaxSectionBackground src="/brand/hero-stadium.jpg" priority />
          <div aria-hidden className="absolute inset-0 bg-muneca-black/75" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />
            <h1 className="font-display mt-3 text-4xl sm:text-5xl">Equipos</h1>
            <p className="mt-2 max-w-xl text-white/70">
              Talento, pasión y buena gente en una sola cancha — conoce a todos los equipos que hacen
              parte de la Copa.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <UsersThree size={22} weight="regular" className="text-muneca-yellow" aria-hidden="true" />
              <p className="text-sm font-bold uppercase tracking-wide text-white/80">
                {equipos.length} / {cupo} equipos confirmados
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {equipos.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center sm:py-24">
              <p className="font-display text-4xl leading-none text-white sm:text-6xl">
                TE ESTAMOS ESPERANDO
              </p>
              <p className="mt-4 max-w-md text-sm text-white/60 sm:text-base">
                Todavía no hay equipos confirmados — sé de los primeros en hacer parte de la Copa.
              </p>
              <Link
                href="/preinscripcion"
                className="mt-7 rounded-md bg-muneca-yellow px-8 py-3.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.03]"
              >
                Preinscribe tu equipo →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {equipos.map((equipo) => (
                <Link
                  key={equipo.id}
                  href={`/equipos/${equipo.id}`}
                  title={equipo.nombre_equipo}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4 transition-transform hover:scale-[1.03] hover:border-muneca-yellow/40"
                >
                  <TeamCrest url={equipo.escudo_url} size="lg" />
                  <span className="line-clamp-2 text-center text-xs font-semibold leading-tight text-white/70">
                    {equipo.nombre_equipo}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
