"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";

const inputClass =
  "mt-1.5 w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-sm text-muneca-black placeholder:text-black/35 focus:border-muneca-purple focus:outline-none focus:ring-2 focus:ring-muneca-purple/20";

const labelClass = "block text-sm font-semibold text-muneca-black";

export default function LiderArbitrosLoginPage() {
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

    router.push("/lider-arbitros");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-white">
        <section className="relative overflow-hidden bg-muneca-black pb-14 pt-32 text-center text-muneca-white sm:pt-28 lg:pt-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-md px-4 sm:px-6">
            <div className="mb-6 text-left">
              <Breadcrumbs
                tone="light"
                items={[{ label: "Inicio", href: "/" }, { label: "Líder de Árbitros" }]}
              />
            </div>
            <Image
              src="/brand/mascota-badge.png"
              alt="Copa Muñeca e'Burro"
              width={1254}
              height={1254}
              priority
              className="mx-auto mb-5 h-16 w-16 object-contain"
            />
            <h1 className="font-display text-4xl uppercase sm:text-5xl">Líder de árbitros</h1>
            <p className="mt-2 text-white/70">Copa Muñeca e&apos;Burro</p>
          </div>
        </section>

        <section className="mx-auto max-w-sm px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className={labelClass}>Correo</span>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Contraseña</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </label>

              {error && (
                <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-md bg-muneca-yellow px-4 py-2.5 text-sm font-bold uppercase text-muneca-black shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {cargando ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-black/40">
              Acceso exclusivo del Líder de Árbitros del torneo.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
