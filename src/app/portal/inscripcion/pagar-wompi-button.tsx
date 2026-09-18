"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { iniciarPagoCuota, confirmarPagoWompi } from "./wompi-actions";

declare global {
  interface Window {
    WidgetCheckout?: new (datos: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      signature: { integrity: string };
      redirectUrl: string;
    }) => { open: (callback: (result: { transaction?: { id: string; status: string } }) => void) => void };
  }
}

/**
 * Botón "Pagar esta partida en línea" — abre el Widget de Wompi (cargado con
 * next/script) con una referencia y firma de integridad generadas en el
 * servidor para este intento (ver `iniciarPagoCuota`), y al cerrarse
 * confirma el pago contra la API de Wompi antes de refrescar la página (ver
 * `confirmarPagoWompi` — nunca se confía en el resultado que reporta el
 * propio widget en el navegador).
 */
export function PagarWompiButton({ cuotaId }: { cuotaId: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"idle" | "abriendo" | "confirmando">("idle");
  const [error, setError] = useState("");
  const [scriptListo, setScriptListo] = useState(false);

  async function pagar() {
    setError("");
    if (!scriptListo || !window.WidgetCheckout) {
      setError("El pago en línea está cargando, intenta de nuevo en unos segundos.");
      return;
    }

    setEstado("abriendo");
    const inicio = await iniciarPagoCuota(cuotaId);
    if (!inicio.success) {
      setEstado("idle");
      setError(inicio.error);
      return;
    }

    const checkout = new window.WidgetCheckout({
      currency: inicio.datos.currency,
      amountInCents: inicio.datos.amountInCents,
      reference: inicio.datos.reference,
      publicKey: inicio.datos.publicKey,
      signature: { integrity: inicio.datos.signature },
      redirectUrl: inicio.datos.redirectUrl,
    });

    checkout.open(async (result) => {
      const transactionId = result?.transaction?.id;
      if (!transactionId) {
        // El usuario cerró el widget sin completar el pago.
        setEstado("idle");
        return;
      }

      setEstado("confirmando");
      const confirmacion = await confirmarPagoWompi(cuotaId, transactionId);
      setEstado("idle");
      if (!confirmacion.success) {
        setError(confirmacion.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Script
        id="wompi-widget-script"
        src="https://checkout.wompi.co/widget.js"
        strategy="lazyOnload"
        onLoad={() => setScriptListo(true)}
      />
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={pagar}
          disabled={estado !== "idle"}
          className="shrink-0 rounded-md bg-muneca-yellow px-4 py-2 text-xs font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {estado === "abriendo" && "Abriendo pago..."}
          {estado === "confirmando" && "Confirmando..."}
          {estado === "idle" && "Pagar en línea"}
        </button>
        {error && <span className="max-w-[220px] text-right text-xs text-rose-600">{error}</span>}
      </div>
    </>
  );
}
