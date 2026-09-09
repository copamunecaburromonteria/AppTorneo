import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesionEquipo } from "@/app/portal/actions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, team_id")
    .eq("id", user.id)
    .single();

  if (profile?.rol !== "equipo" || !profile.team_id) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-muneca-black px-4 pt-32 text-center text-white sm:pt-28 lg:pt-24">
          <p>Esta cuenta no tiene un equipo asociado.</p>
          <form action={cerrarSesionEquipo}>
            <button
              type="submit"
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Cerrar sesión
            </button>
          </form>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { data: team } = await supabase
    .from("teams")
    .select("nombre_equipo")
    .eq("id", profile.team_id)
    .single();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden bg-muneca-black text-muneca-white">
        {/* Fondo decorativo: mismo lenguaje visual que el resto del sitio (footer/hero). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(123,31,162,0.22),transparent)]" />
          <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-muneca-purple/20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-muneca-yellow/10 blur-3xl" />
        </div>

        <div className="relative border-b border-white/10 px-4 pb-4 pt-32 sm:px-6 sm:pt-28 lg:pt-24">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/mascota-badge.png"
                alt="Copa Muñeca e'Burro"
                width={1254}
                height={1254}
                className="h-9 w-9 shrink-0 object-contain"
              />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/50">
                  Portal de equipos
                </p>
                <p className="font-display uppercase tracking-wide">
                  {team?.nombre_equipo ?? "Mi equipo"}
                </p>
              </div>
            </div>
            <form action={cerrarSesionEquipo}>
              <button
                type="submit"
                className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/20"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
