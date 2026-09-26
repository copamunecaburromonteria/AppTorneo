"use client";

import { useState, type FormEvent, type ReactNode } from "react";

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export type ReportarResult = { success: boolean; error?: string };

type Props = {
  /** Monto real (sin recargo) — lo que se paga por transferencia. */
  montoBase: number;
  /** Monto que efectivamente cobra Wompi (con el recargo de procesamiento ya
   * sumado) — nunca se presenta como si ese fuera el precio de la Copa. */
  montoWompi: number;
  llave: string;
  qrSrc: string;
  /** "Repórtalo antes del ..." — ya calculado por el llamador. */
  deadlineTexto: string;
  /** Si ya se reportó un pago por transferencia para esto (viene de la
   * base de datos — persiste entre recargas de página). */
  yaReportado: { at: string; aTiempo: boolean } | null;
  onReportar: (formData: FormData) => Promise<ReportarResult>;
  /** El botón/flujo de Wompi de cada superficie (cada una ya tiene su propia
   * integración con el Widget) — se muestra dentro de esta tarjeta. */
  wompiBoton: ReactNode;
};

/**
 * Las dos formas de pago de la Copa (2026-09-26, decisión de Fernando):
 * transferencia por QR/Llave Nu (sin recargo, aprobación manual del admin) o
 * Wompi (con recargo de procesamiento, confirmación automática). Se usa tal
 * cual en el portal (cuotas de inscripción y cargos de tarjetas) y en
 * /pagos-tarjetas (pago público por cédula) — cada superficie solo aporta su
 * propio botón de Wompi y su propia acción de reporte.
 */
export function OpcionesPago({
  montoBase,
  montoWompi,
  llave,
  qrSrc,
  deadlineTexto,
  yaReportado,
  onReportar,
  wompiBoton,
}: Props) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [reportadoLocal, setReportadoLocal] = useState<{ at: string; aTiempo: boolean } | null>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const formData = new FormData(e.currentTarget);
    const res = await onReportar(formData);
    setEnviando(false);
    if (!res.success) {
      setError(res.error ?? "No se pudo reportar el pago.");
      return;
    }
    setReportadoLocal({ at: new Date().toISOString(), aTiempo: true });
  }

  const reportado = yaReportado ?? reportadoLocal;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Opción 1 — Transferencia */}
      <div className="rounded-2xl border border-muneca-purple/25 bg-muneca-purple/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muneca-purple">💜 Transferencia</p>
        <p className="font-display mt-1 text-2xl text-muneca-black">{formatCOP(montoBase)}</p>
        <p className="text-[11px] text-black/40">Sin recargo — QR o Llave Nu</p>

        <div className="mt-3 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="Código QR para pagar por transferencia (Bre-B / Nu)"
            className="h-56 w-56 rounded-lg border border-black/10 bg-white object-contain p-1 sm:h-64 sm:w-64"
          />
        </div>
        <p className="mt-2 text-center text-xs text-black/60">
          Llave Nu: <span className="font-bold text-muneca-black">{llave}</span>
        </p>
        <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-center text-[11px] leading-relaxed text-black/60">
          <p>
            Llave Bre-B Bancolombia: <span className="font-bold text-muneca-black">7368940</span>
          </p>
          <p className="font-semibold text-muneca-black/80">Bancolombia</p>
          <p>Ahorros: 35372731034</p>
          <p>A nombre de Fernando Javier González Contreras</p>
        </div>

        {reportado ? (
          <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-xs font-semibold text-emerald-700">
            ✅ Reportaste tu pago{" "}
            {new Date(reportado.at).toLocaleString("es-CO", { timeZone: "America/Bogota" })} — lo confirmaremos
            pronto.
            {!reportado.aTiempo && (
              <span className="mt-1 block font-semibold text-amber-600">
                ⚠️ Se reportó fuera del plazo de notificación.
              </span>
            )}
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-3 space-y-2">
            <input
              type="file"
              name="comprobante"
              accept="image/*,.pdf"
              className="w-full text-[11px] text-black/50 file:mr-2 file:rounded-md file:border-0 file:bg-black/5 file:px-2 file:py-1 file:text-[11px] file:font-semibold"
            />
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-md bg-muneca-purple px-3 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Ya pagué, reportar transferencia"}
            </button>
            <p className="text-center text-[11px] text-black/40">{deadlineTexto}</p>
            {error && <p className="text-center text-xs text-rose-600">{error}</p>}
          </form>
        )}
      </div>

      {/* Opción 2 — Wompi */}
      <div className="rounded-2xl border border-muneca-yellow/40 bg-muneca-yellow/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-black/60">💳 Wompi (tarjeta / PSE)</p>
        <p className="font-display mt-1 text-2xl text-muneca-black">{formatCOP(montoWompi)}</p>
        <p className="text-[11px] text-black/40">Incluye el costo de procesamiento del medio de pago</p>
        <div className="mt-4 flex justify-center">{wompiBoton}</div>
        <p className="mt-3 text-center text-[11px] text-black/40">Confirmación automática, al instante.</p>
      </div>
    </div>
  );
}
