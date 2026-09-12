"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarEvento } from "@/app/operador/actions";

type Jugador = { id: string; nombre: string; numero_camiseta: number | null };

type EstadoForm = { success: boolean; error: string };
const estadoInicial: EstadoForm = { success: false, error: "" };

const TIPOS = [
  { value: "gol", label: "⚽ Gol" },
  { value: "autogol", label: "⚽ Autogol" },
  { value: "tarjeta_amarilla", label: "🟨 Tarjeta amarilla" },
  { value: "tarjeta_roja", label: "🟥 Tarjeta roja" },
  { value: "cambio", label: "🔁 Cambio (entra)" },
];

export function FormularioEvento({
  matchId,
  equipoLocalId,
  equipoLocalNombre,
  jugadoresLocal,
  equipoVisitanteId,
  equipoVisitanteNombre,
  jugadoresVisitante,
}: {
  matchId: string;
  equipoLocalId: string;
  equipoLocalNombre: string;
  jugadoresLocal: Jugador[];
  equipoVisitanteId: string;
  equipoVisitanteNombre: string;
  jugadoresVisitante: Jugador[];
}) {
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(equipoLocalId);
  const [formKey, setFormKey] = useState(0);

  async function accion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
    const result = await registrarEvento(matchId, { success: false, error: "" }, formData);
    if (result.success) setFormKey((k) => k + 1);
    return result.success ? { success: true, error: "" } : { success: false, error: result.error };
  }

  const [state, formAction, pending] = useActionState(accion, estadoInicial);

  const jugadores = useMemo(
    () => (equipoSeleccionado === equipoLocalId ? jugadoresLocal : jugadoresVisitante),
    [equipoSeleccionado, equipoLocalId, jugadoresLocal, jugadoresVisitante]
  );

  return (
    <form
      key={formKey}
      action={formAction}
      className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Registrar evento</p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEquipoSeleccionado(equipoLocalId)}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            equipoSeleccionado === equipoLocalId
              ? "bg-muneca-yellow text-muneca-black"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          {equipoLocalNombre}
        </button>
        <button
          type="button"
          onClick={() => setEquipoSeleccionado(equipoVisitanteId)}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            equipoSeleccionado === equipoVisitanteId
              ? "bg-muneca-yellow text-muneca-black"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          {equipoVisitanteNombre}
        </button>
      </div>
      <input type="hidden" name="equipo_id" value={equipoSeleccionado} />

      <select
        name="jugador_id"
        required
        defaultValue=""
        className="w-full rounded-md border border-white/15 bg-muneca-black px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
      >
        <option value="" disabled>
          Selecciona jugador
        </option>
        {jugadores.map((j) => (
          <option key={j.id} value={j.id}>
            {j.numero_camiseta != null ? `#${j.numero_camiseta} ` : ""}
            {j.nombre}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <select
          name="tipo"
          required
          defaultValue="gol"
          className="rounded-md border border-white/15 bg-muneca-black px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          name="minuto"
          type="number"
          min={0}
          max={120}
          required
          placeholder="Minuto"
          className="rounded-md border border-white/15 bg-muneca-black px-3 py-2 text-sm text-white outline-none focus:border-muneca-yellow"
        />
      </div>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-muneca-yellow px-4 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Guardando..." : "Registrar evento"}
      </button>
    </form>
  );
}
