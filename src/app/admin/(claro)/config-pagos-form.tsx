"use client";

import { useState, useTransition } from "react";
import {
  actualizarConfiguracionPagos,
  type ConfiguracionPagos,
} from "@/app/admin/config/actions";

const CAMPOS: { key: keyof ConfiguracionPagos; label: string; sufijo?: string }[] = [
  { key: "monto_inscripcion", label: "Inscripción por equipo (todo incluido)", sufijo: "COP" },
  { key: "precio_uniforme", label: "Costo interno del uniforme (por jugador)", sufijo: "COP" },
  { key: "porcentaje_abono_minimo", label: "Abono mínimo", sufijo: "%" },
  { key: "numero_cuotas_sin_uniforme", label: "Número de cuotas" },
  { key: "dias_previo_torneo_ultima_cuota", label: "Última cuota vence N días antes del torneo" },
  { key: "dias_plazo_saldo", label: "Días de plazo para el saldo (respaldo si no hay fecha de inicio)" },
  { key: "dias_aviso_previo_cuota", label: "Días de aviso antes de vencer" },
  { key: "recargo_wompi_pct", label: "Recargo por pagar con Wompi", sufijo: "%" },
  {
    key: "horas_plazo_notificacion_transferencia",
    label: "Plazo para reportar una transferencia",
    sufijo: "horas",
  },
];

/**
 * Panel de la acción rápida "Configuración de pagos": edita
 * `torneo_config`. Solo afecta inscripciones nuevas — el monto que ya debe
 * cada equipo inscrito queda congelado desde el momento en que se inscribió
 * (`payments.monto_total`), así que cambiar esto no le mueve el piso a
 * nadie que ya esté adentro.
 */
export function ConfigPagosForm({ inicial }: { inicial: ConfiguracionPagos }) {
  const [valores, setValores] = useState<ConfiguracionPagos>(inicial);
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function actualizar(key: keyof ConfiguracionPagos, texto: string) {
    setValores((prev) => ({ ...prev, [key]: Number(texto) }));
  }

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await actualizarConfiguracionPagos(valores);
      setMensaje(
        res.success
          ? { tipo: "ok", texto: "Configuración de pagos actualizada." }
          : { tipo: "error", texto: res.error }
      );
    });
  }

  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.015] p-4">
      <p className="text-sm text-muneca-black/70">
        Solo aplica a equipos que se inscriban de ahora en adelante — no cambia lo que ya debe pagar
        un equipo ya inscrito.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CAMPOS.map(({ key, label, sufijo }) => (
          <label key={key} className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-black/50">
            {label}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={valores[key]}
                onChange={(e) => actualizar(key, e.target.value)}
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm font-semibold text-muneca-black"
              />
              {sufijo && <span className="shrink-0 text-[11px] text-black/40">{sufijo}</span>}
            </div>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={guardar}
        disabled={pending}
        className="mt-4 rounded-md bg-muneca-purple px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar configuración"}
      </button>

      {mensaje && (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
          }`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
