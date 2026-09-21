import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/admin/actions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminHeaderStats } from "@/components/admin/admin-header-stats";

/**
 * Layout claro (mismo lenguaje visual de /inscripcion y /portal: SiteHeader +
 * SiteFooter, hero de página con breadcrumb) para las secciones del panel
 * administrativo que no son la tabla principal de equipos y pagos (esa
 * sigue con su layout propio en `admin/(dashboard)/layout.tsx` por ahora).
 * Hace la misma verificación de sesión + rol admin que ese otro layout.
 */
export default async function AdminClaroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (profile?.rol !== "admin") {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader forceSolid />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-muneca-white px-4 pt-36 text-center text-muneca-black sm:pt-32 lg:pt-32">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Panel administrativo" }]} />
          <p>Esta cuenta no tiene permisos de administrador.</p>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple"
            >
              Cerrar sesión
            </button>
          </form>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const [
    { count: equiposCount },
    { count: preinscritosCount },
    { count: partidosCount },
    { count: arbitrosCount },
    { count: operadoresCount },
    { count: cargosCount },
    { count: patrocinadoresCount },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .neq("estado_inscripcion", "lista_espera")
      .neq("estado_inscripcion", "preinscrito")
      .neq("estado_inscripcion", "invitado"),
    supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .in("estado_inscripcion", ["preinscrito", "invitado"]),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("arbitros").select("*", { count: "exact", head: true }),
    supabase.from("operadores").select("*", { count: "exact", head: true }),
    supabase
      .from("cargos_tarjetas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    supabase.from("patrocinadores").select("*", { count: "exact", head: true }),
  ]);

  const navCounts = {
    equipos: equiposCount ?? 0,
    preinscritos: preinscritosCount ?? 0,
    partidos: partidosCount ?? 0,
    arbitros: arbitrosCount ?? 0,
    operadores: operadoresCount ?? 0,
    cargos: cargosCount ?? 0,
    patrocinadores: patrocinadoresCount ?? 0,
  };

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader forceSolid />
      <main className="flex-1 bg-muneca-white">
        <div className="border-b border-black/10 bg-black/[0.02] px-4 pb-5 pt-36 sm:px-6 sm:pt-32 lg:pt-32">
          <div className="mx-auto max-w-5xl">
            <Breadcrumbs
              items={[{ label: "Inicio", href: "/" }, { label: "Panel administrativo", href: "/admin" }]}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="font-display text-2xl uppercase tracking-wide text-muneca-black">
                  Panel administrativo
                </p>
                {/* Texto fijo por ahora — no hay todavía un dato de "temporada" ni
                    de estado del torneo en la base de datos (ver conversación con
                    Fernando: se deja fijo mientras no exista esa fuente real). */}
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  ● Torneo activo
                </span>
                <span className="rounded-full bg-muneca-purple/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muneca-purple">
                  Temporada 2026
                </span>
              </div>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="shrink-0 rounded-md border border-black/15 px-3.5 py-2 text-sm font-semibold text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>

            <AdminHeaderStats />

            <AdminNav counts={navCounts} />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
