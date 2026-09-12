import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/admin/actions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminNav } from "@/components/admin/admin-nav";

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
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-muneca-white px-4 pt-32 text-center text-muneca-black sm:pt-28 lg:pt-24">
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

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-white">
        <div className="border-b border-black/10 bg-black/[0.02] px-4 pb-5 pt-32 sm:px-6 sm:pt-28 lg:pt-24">
          <div className="mx-auto max-w-5xl">
            <Breadcrumbs
              items={[{ label: "Inicio", href: "/" }, { label: "Panel administrativo", href: "/admin" }]}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-2xl uppercase tracking-wide text-muneca-black">
                Panel administrativo
              </p>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="shrink-0 rounded-md border border-black/15 px-3.5 py-2 text-sm font-semibold text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
            <AdminNav />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
