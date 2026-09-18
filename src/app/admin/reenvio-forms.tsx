"use client";

import { useActionState } from "react";
import {
  reenviarCorreoRegistro,
  reenviarRecordatorioCuota,
  reenviarConfirmacionPago,
} from "@/app/admin/actions";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

/**
 * Formularios de "reenviar correo" para el panel admin — todos comparten el
 * mismo patrón: un botón pequeño y discreto (no compiten visualmente con la
 * acción principal de la fila, como "Marcar como pagada") que dispara un
 * correo ya existente sin cambiar ningún estado en la base de datos.
 */
function botonReenvioClase(base: string) {
  return `shrink-0 rounded-md border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${base}`;
}

export function ReenviarRegistroForm({ teamId }: { teamId: string }) {
  const accionConId = reenviarCorreoRegistro.bind(null, teamId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className={botonReenvioClase("border-muneca-purple/30 text-muneca-purple hover:bg-muneca-purple/10")}
      >
        {pending ? "Reenviando..." : "Reenviar bienvenida"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      {state.success && <span className="text-xs font-semibold text-emerald-600">Enviado ✓</span>}
    </form>
  );
}

export function ReenviarRecordatorioForm({ cuotaId }: { cuotaId: string }) {
  const accionConId = reenviarRecordatorioCuota.bind(null, cuotaId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className={botonReenvioClase("border-black/15 text-muneca-black/70 hover:border-muneca-purple/40 hover:text-muneca-purple")}
      >
        {pending ? "Enviando..." : "Reenviar recordatorio"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      {state.success && <span className="text-xs font-semibold text-emerald-600">Enviado ✓</span>}
    </form>
  );
}

export function ReenviarConfirmacionForm({ cuotaId }: { cuotaId: string }) {
  const accionConId = reenviarConfirmacionPago.bind(null, cuotaId);

  async function accion(): Promise<EstadoForm> {
    const result = await accionConId();
    if (result.success) return { success: true, error: "" };
    return { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className={botonReenvioClase("border-black/15 text-muneca-black/70 hover:border-muneca-purple/40 hover:text-muneca-purple")}
      >
        {pending ? "Enviando..." : "Reenviar confirmación"}
      </button>
      {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      {state.success && <span className="text-xs font-semibold text-emerald-600">Enviado ✓</span>}
    </form>
  );
}
