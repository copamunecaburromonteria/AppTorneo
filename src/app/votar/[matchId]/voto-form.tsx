"use client";

import { useState, useTransition } from "react";
import { Star, CheckCircle } from "@phosphor-icons/react";
import { registrarVoto } from "./actions";

export type JugadorVotable = {
  id: string;
  teamId: string;
  nombre: string;
  numero: number | null;
};

type EquipoRef = { id: string; nombre: string };

function ListaJugadores({
  equipo,
  jugadores,
  seleccionado,
  onSeleccionar,
}: {
  equipo: EquipoRef;
  jugadores: JugadorVotable[];
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">
        {equipo.nombre}
      </p>
      {jugadores.length === 0 ? (
        <p className="text-sm text-white/40">Sin jugadores cargados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {jugadores.map((j) => {
            const activo = seleccionado === j.id;
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => onSeleccionar(j.id)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  activo
                    ? "border-muneca-yellow bg-muneca-yellow/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/25"
                }`}
              >
                <span className="block truncate font-semibold">{j.nombre}</span>
                {j.numero != null && (
                  <span className="text-xs text-white/40">#{j.numero}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VotoForm({
  matchId,
  equipoLocal,
  equipoVisitante,
  jugadores,
}: {
  matchId: string;
  equipoLocal: EquipoRef;
  equipoVisitante: EquipoRef;
  jugadores: JugadorVotable[];
}) {
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [estrellasHover, setEstrellasHover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [pending, startTransition] = useTransition();

  const jugadoresLocal = jugadores.filter((j) => j.teamId === equipoLocal.id);
  const jugadoresVisitante = jugadores.filter((j) => j.teamId === equipoVisitante.id);

  function enviar() {
    setError(null);
    if (!jugadorId) {
      setError("Elige el MVP del partido.");
      return;
    }
    if (estrellas < 1) {
      setError("Califica el arbitraje de 1 a 5 estrellas.");
      return;
    }
    startTransition(async () => {
      const resultado = await registrarVoto(matchId, jugadorId, estrellas);
      if (!resultado.success) {
        setError(resultado.error);
        return;
      }
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-14 text-center">
        <CheckCircle size={44} weight="fill" className="text-emerald-400" aria-hidden="true" />
        <p className="font-display mt-4 text-2xl sm:text-3xl">¡Voto registrado!</p>
        <p className="mt-2 text-sm text-white/60">Gracias por participar en la Copa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          ⭐ MVP del partido
        </p>
        <p className="mb-4 text-xs text-white/50">Elige un jugador de cualquiera de los dos equipos.</p>
        <div className="space-y-5">
          <ListaJugadores
            equipo={equipoLocal}
            jugadores={jugadoresLocal}
            seleccionado={jugadorId}
            onSeleccionar={setJugadorId}
          />
          <ListaJugadores
            equipo={equipoVisitante}
            jugadores={jugadoresVisitante}
            seleccionado={jugadorId}
            onSeleccionar={setJugadorId}
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          Calificación al arbitraje
        </p>
        <p className="mb-3 text-xs text-white/50">
          Califica al equipo arbitral de este partido, de 1 a 5 estrellas.
        </p>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((valor) => {
            const activo = (estrellasHover || estrellas) >= valor;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={estrellas === valor}
                aria-label={`${valor} estrella${valor > 1 ? "s" : ""}`}
                onClick={() => setEstrellas(valor)}
                onMouseEnter={() => setEstrellasHover(valor)}
                onMouseLeave={() => setEstrellasHover(0)}
                className="p-1"
              >
                <Star
                  size={32}
                  weight={activo ? "fill" : "regular"}
                  className={activo ? "text-muneca-yellow" : "text-white/25"}
                />
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={pending}
        className="w-full rounded-md bg-muneca-yellow px-6 py-4 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar mi voto"}
      </button>
    </div>
  );
}
