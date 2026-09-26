"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

export type PreguntaFrecuente = {
  pregunta: string;
  respuesta: string;
  linkHref?: string;
  linkTexto?: string;
};

function ItemAcordeon({
  item,
  abierta,
  onToggle,
}: {
  item: PreguntaFrecuente;
  abierta: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
      >
        <span className="font-display text-base text-white sm:text-lg">{item.pregunta}</span>
        <CaretDown
          size={18}
          weight="bold"
          className={`shrink-0 text-muneca-yellow transition-transform ${abierta ? "rotate-180" : ""}`}
        />
      </button>
      {abierta && (
        <div className="px-5 pb-5 text-sm leading-relaxed text-white/70 sm:px-6">
          <p>{item.respuesta}</p>
          {item.linkHref && (
            <a
              href={item.linkHref}
              className="mt-2 inline-block font-semibold text-muneca-yellow hover:underline"
            >
              {item.linkTexto ?? "Ver más →"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Acordeón de la sección "Preguntas frecuentes" del home — cliente porque
 * necesita abrir/cerrar cada pregunta. El contenido (con los montos y
 * fechas ya calculados) lo arma el server component `preguntas-frecuentes.tsx`
 * a partir de `torneo_config`, para que esta sección nunca quede
 * desactualizada si Fernando cambia el precio o la fecha del torneo.
 *
 * En dos columnas desde `sm:` (pedido por Fernando el 2026-09-26: la versión
 * de una sola columna ocupaba demasiado alto en el home). Cada pregunta se
 * abre/cierra de forma independiente (ya no es "una sola abierta a la vez"
 * en todo el bloque) para que abrir una en la columna izquierda no afecte a
 * la derecha. El primer ítem de cada columna arranca abierto.
 */
export function PreguntasAcordeon({ items }: { items: PreguntaFrecuente[] }) {
  const [abiertas, setAbiertas] = useState<Set<number>>(() => new Set([0, Math.ceil(items.length / 2)]));

  const toggle = (index: number) => {
    setAbiertas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(index)) siguiente.delete(index);
      else siguiente.add(index);
      return siguiente;
    });
  };

  const mitad = Math.ceil(items.length / 2);
  const columnaIzquierda = items.map((item, index) => ({ item, index })).slice(0, mitad);
  const columnaDerecha = items.map((item, index) => ({ item, index })).slice(mitad);

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
      {[columnaIzquierda, columnaDerecha].map((columna, columnaIndex) => (
        <div
          key={columnaIndex}
          className="h-fit divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
        >
          {columna.map(({ item, index }) => (
            <ItemAcordeon
              key={item.pregunta}
              item={item}
              abierta={abiertas.has(index)}
              onToggle={() => toggle(index)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
