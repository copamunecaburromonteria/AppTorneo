import { WIZARD_STEPS, TOTAL_PASOS } from "./wizard-steps";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sidebar del wizard — visible desde md hacia arriba. */
export function WizardStepperSidebar({ pasoActual }: { pasoActual: number }) {
  return (
    <nav aria-label="Progreso de la inscripción" className="hidden lg:block">
      <ol className="space-y-0">
        {WIZARD_STEPS.map((step, index) => {
          const completado = step.id < pasoActual;
          const activo = step.id === pasoActual;
          const esUltimo = index === WIZARD_STEPS.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
              {!esUltimo && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 ${
                    completado ? "bg-muneca-purple" : "bg-black/10"
                  }`}
                />
              )}
              <span
                className={`font-display relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                  completado
                    ? "bg-muneca-purple text-white"
                    : activo
                      ? "bg-muneca-purple text-white ring-4 ring-muneca-purple/20"
                      : "bg-black/5 text-black/40"
                }`}
              >
                {completado ? <CheckIcon /> : step.id}
              </span>
              <div className="pt-0.5">
                <p
                  className={`text-sm font-semibold ${
                    activo ? "text-muneca-black" : completado ? "text-muneca-black/80" : "text-black/40"
                  }`}
                >
                  {step.label}
                </p>
                <p className={`text-xs ${activo ? "text-black/60" : "text-black/35"}`}>
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Barra de progreso compacta — visible solo debajo de lg, reemplaza el sidebar. */
export function WizardStepperMobile({ pasoActual }: { pasoActual: number }) {
  const step = WIZARD_STEPS.find((s) => s.id === pasoActual) ?? WIZARD_STEPS[0];
  const progreso = Math.round((pasoActual / TOTAL_PASOS) * 100);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muneca-black">
          {pasoActual}. {step.label}
        </p>
        <p className="text-xs text-black/50">
          Paso {pasoActual} de {TOTAL_PASOS}
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-muneca-purple transition-all"
          style={{ width: `${progreso}%` }}
        />
      </div>
    </div>
  );
}
