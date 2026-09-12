"use client";

import { useActionState } from "react";
import Image from "next/image";
import { iniciarSesionOperador } from "./actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await iniciarSesionOperador({ success: false, error: "" }, formData);
  // Si tuvo éxito, iniciarSesionOperador ya redirigió — esto solo se alcanza
  // en caso de error.
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

export default function OperadorLoginPage() {
  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muneca-black px-4 py-16">
      <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
        <Image
          src="/brand/mascota-badge.png"
          alt="Copa Muñeca e'Burro"
          width={1254}
          height={1254}
          className="mx-auto mb-6 h-16 w-16 object-contain"
        />
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-white">
          Consola de operador
        </h1>
        <p className="mt-1 text-sm text-white/60">Ingresa tu PIN para empezar</p>

        <form action={formAction} className="mt-8 space-y-4">
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4,6}"
            maxLength={6}
            required
            autoFocus
            placeholder="••••"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-muneca-yellow"
          />

          {state.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-muneca-yellow px-4 py-3 font-bold uppercase text-muneca-black shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
