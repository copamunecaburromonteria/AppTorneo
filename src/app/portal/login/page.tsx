"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PortalLoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (signInError) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden bg-muneca-black px-4 pb-16 pt-32 sm:pt-28 lg:pt-24">
        {/* Fondo decorativo: mismo lenguaje visual que el resto del sitio. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(123,31,162,0.3),transparent)]" />
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-muneca-purple/25 blur-3xl" />
          <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-muneca-yellow/10 blur-3xl" />
          <div className="absolute right-16 top-0 h-40 w-1 rotate-[16deg] bg-muneca-yellow/20" />
          <div className="absolute right-28 top-0 h-28 w-1 rotate-[16deg] bg-muneca-purple/30" />
        </div>

        <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <Image
            src="/brand/mascota-badge.png"
            alt="Copa Muñeca e'Burro"
            width={1254}
            height={1254}
            className="mx-auto mb-6 h-16 w-16 object-contain"
          />
          <h1 className="font-display text-center text-2xl uppercase tracking-wide text-muneca-white">
            Portal de equipos
          </h1>
          <p className="mt-1 text-center text-sm text-white/60">
            Copa Muñeca e&apos;Burro
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="correo" className="mb-1 block text-sm font-medium text-white/80">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-muneca-yellow"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/80">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-muneca-yellow"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-md bg-muneca-yellow px-4 py-2 font-bold uppercase text-muneca-black shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {cargando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/40">
            Usa el correo y la contraseña que creaste al inscribir tu equipo.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
