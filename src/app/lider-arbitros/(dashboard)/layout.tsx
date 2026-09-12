import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesionLiderArbitros } from "@/app/lider-arbitros/actions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default async function LiderArbitrosDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/lider-arbitros/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (profile?.rol !== "lider_arbitros") {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col bg-muneca-white px-4 pt-32 text-muneca-black sm:px-6 sm:pt-28 lg:pt-24">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Líder de Árbitros" }]} />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
            <p>Esta cuenta no tiene acceso al panel de árbitros.</p>
            <form action={cerrarSesionLiderArbitros}>
              <button
                type="submit"
                className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
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
          <div className="mx-auto max-w-6xl">
            <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Líder de Árbitros" }]} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-2xl uppercase tracking-wide text-muneca-black">
                Panel de Líder de Árbitros
              </p>
              <form action={cerrarSesionLiderArbitros}>
                <button
                  type="submit"
                  className="shrink-0 rounded-md border border-black/15 px-3.5 py-2 text-sm font-semibold text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
            <nav className="mt-5 flex gap-2 text-sm font-semibold">
              <Link
                href="/lider-arbitros"
                className="rounded-full border border-black/15 px-4 py-1.5 text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple"
              >
                Calendario
              </Link>
              <Link
                href="/lider-arbitros/arbitros"
                className="rounded-full border border-black/15 px-4 py-1.5 text-muneca-black transition-colors hover:border-muneca-purple/50 hover:text-muneca-purple"
              >
                Árbitros
              </Link>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
