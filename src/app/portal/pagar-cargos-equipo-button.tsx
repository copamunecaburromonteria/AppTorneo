"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { iniciarPagoCargosEquipo, confirmarPagoCargosEquipo } from "./cargos-wompi-actions";

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
 * Botón "Pagar todo el equipo" — paga en una sola transacción de Wompi todos
 * los cargos de tarjetas pendientes del equipo con sesión activa. Mismo
 * patrón que `PagarWompiButton` (`portal/inscripcion/pagar-wompi-button.tsx`),
 * adaptado a un lote en vez de una sola cuota.
 */
export function PagarCargosEquipoButton() {
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
    const inicio = await iniciarPagoCargosEquipo();
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
        setEstado("idle");
        return;
      }

      setEstado("confirmando");
      const confirmacion = await confirmarPagoCargosEquipo(inicio.loteId, transactionId);
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
          className="shrink-0 rounded-md bg-muneca-yellow px-4 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {estado === "abriendo" && "Abriendo pago..."}
          {estado === "confirmando" && "Confirmando..."}
          {estado === "idle" && "Pagar por Wompi"}
        </button>
        {error && <span className="max-w-[260px] text-right text-xs text-rose-600">{error}</span>}
      </div>
    </>
  );
}
