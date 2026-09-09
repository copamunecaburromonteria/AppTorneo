import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesionEquipo } from "@/app/portal/actions";

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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muneca-black px-4 text-center text-white">
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
    );
  }

  const { data: team } = await supabase
    .from("teams")
    .select("nombre_equipo")
    .eq("id", profile.team_id)
    .single();

  return (
    <div className="min-h-screen bg-muneca-black text-muneca-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/mascota-badge.png"
            alt="Copa Muñeca e'Burro"
            width={1254}
            height={1254}
            className="h-9 w-9 object-contain"
          />
          <span className="font-display uppercase tracking-wide">
            {team?.nombre_equipo ?? "Portal de equipos"}
          </span>
        </div>
        <form action={cerrarSesionEquipo}>
          <button
            type="submit"
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/20"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
