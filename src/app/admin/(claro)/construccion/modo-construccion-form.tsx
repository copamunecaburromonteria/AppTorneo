"use client";

import { useState, useTransition } from "react";
import { actualizarModoConstruccion } from "@/app/admin/config/actions";

/** "YYYY-MM-DDTHH:mm" (valor de un <input type="datetime-local">) en hora de Bogotá → ISO UTC. */
function inputBogotaAIso(valor: string): string | null {
  if (!valor) return null;
  return new Date(`${valor}:00-05:00`).toISOString();
}

/** ISO UTC → "YYYY-MM-DDTHH:mm" en hora de Bogotá, para precargar el input. */
function isoAInputBogota(iso: string | null): string {
  if (!iso) return "";
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const partes = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}

/**
 * Switch + fecha meta del modo construcción. Guarda con
 * `actualizarModoConstruccion` (`torneo_config.modo_construccion_activo` /
 * `modo_construccion_fecha_meta`) — ver docstring de esa acción.
 */
export function ModoConstruccionForm({
  activoInicial,
  fechaMetaInicialIso,
}: {
  activoInicial: boolean;
  fechaMetaInicialIso: string | null;
}) {
  const [activo, setActivo] = useState(activoInicial);
  const [fechaInput, setFechaInput] = useState(isoAInputBogota(fechaMetaInicialIso));
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardado, setGuardado] = useState({ activo: activoInicial, fechaInput: isoAInputBogota(fechaMetaInicialIso) });

  const hayCambios = activo !== guardado.activo || fechaInput !== guardado.fechaInput;

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await actualizarModoConstruccion({
        activo,
        fechaMetaIso: inputBogotaAIso(fechaInput),
      });
      if (res.success) {
        setGuardado({ activo, fechaInput });
        setMensaje({
          tipo: "ok",
          texto: activo
            ? "Guardado — el público ya está viendo la página \"en construcción\"."
            : "Guardado — el sitio real ya es visible para el público.",
        });
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    });
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div
        className={`flex items-center justify-between gap-4 rounded-lg px-4 py-3 ${
          guardado.activo ? "bg-amber-50" : "bg-emerald-50"
        }`}
      >
        <div>
          <p className={`text-sm font-bold ${guardado.activo ? "text-amber-700" : "text-emerald-700"}`}>
            {guardado.activo ? "● Modo construcción ACTIVO" : "● Sitio real visible para el público"}
          </p>
          <p className="mt-0.5 text-xs text-muneca-black/50">
            {guardado.activo
              ? "El público ve /en-construccion. Tú ves el sitio real con normalidad."
              : "Cualquier visitante ve el sitio tal cual está hoy."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          onClick={() => setActivo((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            activo ? "bg-muneca-purple" : "bg-black/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              activo ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mt-4">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-black/50">
          Fecha meta del contador (hora Montería/Bogotá)
          <input
            type="datetime-local"
            value={fechaInput}
            onChange={(e) => setFechaInput(e.target.value)}
            className="w-fit rounded-md border border-black/15 px-3 py-2 text-sm font-semibold text-muneca-black"
          />
        </label>
        <p className="mt-1.5 text-xs text-muneca-black/50">
          Déjala vacía si todavía no la tienes definida — la página muestra un mensaje genérico en vez
          de un contador roto.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !hayCambios}
          className="rounded-md bg-muneca-purple px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <a
          href="/en-construccion"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-muneca-purple underline underline-offset-2"
        >
          Ver /en-construccion →
        </a>
      </div>

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
