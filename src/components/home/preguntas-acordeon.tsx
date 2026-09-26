"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

export type PreguntaFrecuente = {
  pregunta: string;
  respuesta: string;
  linkHref?: string;
  linkTexto?: string;
};

/**
 * Acordeón de la sección "Preguntas frecuentes" del home — cliente porque
 * necesita abrir/cerrar cada pregunta. El contenido (con los montos y
 * fechas ya calculados) lo arma el server component `preguntas-frecuentes.tsx`
 * a partir de `torneo_config`, para que esta sección nunca quede
 * desactualizada si Fernando cambia el precio o la fecha del torneo.
 */
export function PreguntasAcordeon({ items }: { items: PreguntaFrecuente[] }) {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <div className="mt-8 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      {items.map((item, index) => {
        const estaAbierta = abierta === index;
        return (
          <div key={item.pregunta}>
            <button
              type="button"
              onClick={() => setAbierta(estaAbierta ? null : index)}
              aria-expanded={estaAbierta}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
            >
              <span className="font-display text-base text-white sm:text-lg">{item.pregunta}</span>
              <CaretDown
                size={18}
                weight="bold"
                className={`shrink-0 text-muneca-yellow transition-transform ${estaAbierta ? "rotate-180" : ""}`}
              />
            </button>
            {estaAbierta && (
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
      })}
    </div>
  );
}
