"use client";

import { useState, type FormEvent } from "react";
import Script from "next/script";
import {
  buscarCargosPorCedula,
  iniciarPagoCargosJugador,
  confirmarPagoCargosJugador,
  type ResultadoBusquedaCargos,
} from "@/app/pagos-tarjetas/actions";

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

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2.5 text-sm text-muneca-black outline-none transition-colors focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20";

/**
 * Búsqueda + pago público de tarjetas por cédula (sin login) — ver
 * `pagos-tarjetas/actions.ts`. Dos pasos en el mismo componente: 1) cédula +
 * nombre completo, 2) desglose de tarjetas pendientes con el botón de pago
 * de Wompi (mismo patrón que `PagarWompiButton` del portal, adaptado a un
 * lote de varios cargos en vez de una sola cuota).
 */
export function BuscadorCargos() {
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [resultado, setResultado] = useState<ResultadoBusquedaCargos | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [pagando, setPagando] = useState<"idle" | "abriendo" | "confirmando">("idle");
  const [scriptListo, setScriptListo] = useState(false);
  const [pagado, setPagado] = useState(false);

  async function buscar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBuscando(true);
    const r = await buscarCargosPorCedula(cedula, nombre);
    setBuscando(false);
    if (!r.success) {
      setError(r.error);
      setResultado(null);
      return;
    }
    setResultado(r);
    setPagado(false);
  }

  async function pagar() {
    setError("");
    if (!scriptListo || !window.WidgetCheckout) {
      setError("El pago en línea está cargando, intenta de nuevo en unos segundos.");
      return;
    }

    setPagando("abriendo");
    const inicio = await iniciarPagoCargosJugador(cedula, nombre);
    if (!inicio.success) {
      setPagando("idle");
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
        setPagando("idle");
        return;
      }

      setPagando("confirmando");
      const confirmacion = await confirmarPagoCargosJugador(inicio.loteId, transactionId);
      setPagando("idle");
      if (!confirmacion.success) {
        setError(confirmacion.error);
        return;
      }
      setPagado(true);
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

      <form onSubmit={buscar} className="space-y-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <label className="mb-1 block text-sm font-semibold text-muneca-black/70">Cédula</label>
          <input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            inputMode="numeric"
            placeholder="N° de documento"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-muneca-black/70">Nombre completo</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Como quedó en la inscripción"
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={buscando}
          className="w-full rounded-md bg-muneca-purple px-4 py-3 text-sm font-bold uppercase text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {buscando ? "Buscando..." : "Consultar mis tarjetas"}
        </button>
      </form>

      {resultado && resultado.success && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">
            {resultado.jugadorNombre} · {resultado.equipoNombre}
          </p>

          {resultado.items.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-black/50">
              No tienes tarjetas pendientes por pagar. 🎉
            </p>
          ) : pagado ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm font-semibold text-emerald-700">
              ✅ Pago confirmado. Ya quedaste habilitado para jugar.
            </p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-black/5 rounded-xl bg-black/[0.02]">
                {resultado.items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="text-black/70">
                      {i.tipo} · vs {i.rival}
                    </span>
                    <span className="font-semibold text-muneca-black">{formatCOP(i.monto)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-muneca-purple/5 px-4 py-3">
                <span className="text-sm font-semibold text-muneca-black">Total a pagar</span>
                <span className="font-display text-xl text-muneca-purple">{formatCOP(resultado.total)}</span>
              </div>
              <button
                type="button"
                onClick={pagar}
                disabled={pagando !== "idle"}
                className="mt-4 w-full rounded-md bg-muneca-yellow px-4 py-3 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {pagando === "abriendo" && "Abriendo pago..."}
                {pagando === "confirmando" && "Confirmando..."}
                {pagando === "idle" && `Pagar ${formatCOP(resultado.total)}`}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
