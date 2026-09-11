import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/admin/actions";

export default async function AdminDashboardLayout({
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muneca-black px-4 text-center text-white">
        <p>Esta cuenta no tiene permisos de administrador.</p>
        <form action={cerrarSesion}>
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
            Panel administrativo
          </span>
        </div>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/20"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <nav className="flex items-center gap-1 border-b border-white/10 px-4 py-2 sm:px-6">
        <Link
          href="/admin"
          className="rounded-md px-3 py-1.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Equipos y pagos
        </Link>
        <Link
          href="/admin/arbitros"
          className="rounded-md px-3 py-1.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Árbitros
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
