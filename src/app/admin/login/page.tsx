"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
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

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muneca-black px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <Image
          src="/brand/mascota-badge.png"
          alt="Copa Muñeca e'Burro"
          width={1254}
          height={1254}
          className="mx-auto mb-6 h-16 w-16 object-contain"
        />
        <h1 className="font-display text-center text-2xl uppercase tracking-wide text-muneca-white">
          Panel administrativo
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
      </div>
    </main>
  );
}
