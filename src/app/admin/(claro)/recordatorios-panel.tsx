"use client";

import { useState, useTransition } from "react";
import { enviarRecordatoriosAhora } from "@/app/admin/config/actions";

/**
 * Panel de la acción rápida "Enviar recordatorios". Dispara ahora mismo el
 * mismo envío que corre solo una vez al día por cron — pensado para cuando
 * el admin quiere adelantar el aviso antes de una jornada, sin esperar al
 * ciclo automático. Es idempotente: una cuota que ya recibió su
 * recordatorio no recibe otro (lo controla el propio server action).
 */
export function RecordatoriosPanel() {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ revisadas: number; enviados: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function enviar() {
    setError(null);
    startTransition(async () => {
      const res = await enviarRecordatoriosAhora();
      if (res.success) {
        setResultado({ revisadas: res.revisadas, enviados: res.enviados });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.015] p-4">
      <p className="text-sm text-muneca-black/70">
        Revisa las partidas de pago próximas a vencer (según la ventana de aviso configurada) que
        todavía no recibieron recordatorio, y les envía uno por correo. No se repite: una partida que
        ya recibió su recordatorio no recibe otro.
      </p>

      {resultado && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {resultado.enviados} recordatorio(s) enviado(s) de {resultado.revisadas} partida(s)
          revisada(s).
        </p>
      )}

      {error && <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <button
        type="button"
        onClick={enviar}
        disabled={pending}
        className="mt-4 rounded-md bg-muneca-purple px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar recordatorios ahora"}
      </button>
    </div>
  );
}
