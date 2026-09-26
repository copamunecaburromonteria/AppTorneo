"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { InscripcionWizard } from "./inscripcion-wizard";
import { verificarInvitacion, type InvitacionEncontrada } from "./actions";

type Pricing = {
  montoInscripcion: number;
  numeroCuotas: number;
  diasPlazoSaldo: number;
  diasPrevioTorneoUltimaCuota: number;
  fechaInicioTorneo: string | null;
};

const inputClass =
  "mt-1.5 w-full rounded-md border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-muneca-yellow focus:outline-none focus:ring-2 focus:ring-muneca-yellow/20";

/**
 * Puerta de entrada a `/inscripcion` (2026-09-17, ver
 * `claude/plan-fases-tareas.md`): ya no es de acceso libre — solo puede
 * completarla el equipo que el admin invitó explícitamente desde
 * `/admin/preinscripciones`. Como se manda el mismo link de `/inscripcion` a
 * todos (no un link único por equipo — decisión de Fernando), reconocemos al
 * equipo por el correo que ya usó al preinscribirse (`verificarInvitacion`
 * en `actions.ts`). Si el correo tiene invitación activa, se muestra el
 * wizard de pago ya prellenado con los datos de la preinscripción.
 */
export function InscripcionGate({ pricing }: { pricing: Pricing }) {
  const [correo, setCorreo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitacion, setInvitacion] = useState<InvitacionEncontrada | null>(null);

  async function buscar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!correo.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }

    setBuscando(true);
    const res = await verificarInvitacion(correo);
    setBuscando(false);

    if (!res.found) {
      setError("No encontramos una invitación activa a la inscripción oficial con ese correo.");
      return;
    }

    setInvitacion(res.data);
  }

  if (invitacion) {
    return <InscripcionWizard pricing={pricing} preinscripcion={invitacion} />;
  }

  return (
    <WizardShell
      pasoActual={1}
      titulo="INSCRIBE TU EQUIPO"
      subtitulo="Copa Muñeca e'Burro · Categoría Libre · Montería, Córdoba"
      breadcrumbItems={[{ label: "Inicio", href: "/" }, { label: "Inscripción" }]}
    >
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-2xl border border-muneca-purple/30 bg-muneca-purple/10 p-5 text-sm text-white/80 sm:p-6">
          <p className="font-display text-lg text-white sm:text-xl">
            La inscripción oficial es por invitación
          </p>
          <p className="mt-1.5">
            Primero pasas por la preinscripción para hacer fila — cuando te toque completar la
            inscripción oficial y el pago, te avisamos por WhatsApp o correo. Si ya te invitamos,
            ingresa el mismo correo que usaste al preinscribirte.
          </p>
        </div>

        <form
          onSubmit={buscar}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
        >
          <label className="block">
            <span className="block text-sm font-semibold text-white">Correo electrónico</span>
            <input
              required
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={inputClass}
              placeholder="delegado@correo.com"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-md bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={buscando}
              className="rounded-md bg-muneca-yellow px-6 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
            >
              {buscando ? "Verificando..." : "Continuar →"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-white/60">
          ¿Todavía no te has preinscrito?{" "}
          <Link href="/preinscripcion" className="font-semibold text-muneca-yellow hover:underline">
            Preinscribe tu equipo
          </Link>
        </p>
      </div>
    </WizardShell>
  );
}
