import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { WizardStepperSidebar, WizardStepperMobile } from "./wizard-stepper";
import { TeamPreviewCard } from "./team-preview-card";

type UserChip = {
  nombre: string;
  rol: string;
  equipo?: string;
};

type TeamPreviewData = {
  nombreEquipo: string;
  escudoUrl?: string | null;
  delegadoNombre?: string;
  delegadoContacto?: string;
  delegadoDocumento?: string;
};

export function WizardShell({
  pasoActual,
  titulo,
  subtitulo,
  userChip,
  team,
  breadcrumbItems,
  children,
}: {
  pasoActual: number;
  titulo: string;
  subtitulo?: string;
  userChip?: UserChip;
  team?: TeamPreviewData;
  breadcrumbItems?: Crumb[];
  children: ReactNode;
}) {
  const breadcrumbs: Crumb[] = breadcrumbItems ?? [
    { label: "Inicio", href: "/" },
    { label: "Portal de equipos", href: "/portal" },
    { label: "Inscripción" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader userChip={userChip} />
      <main className="flex-1 bg-muneca-white">
        <section className="relative overflow-hidden bg-muneca-black pb-8 pt-36 text-muneca-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(123,31,162,0.35),transparent)]" />
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-muneca-purple/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Breadcrumbs items={breadcrumbs} tone="light" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muneca-yellow">
              Más que un torneo, es el parche
            </p>
            <h1 className="font-display mt-1 text-4xl sm:text-5xl">{titulo}</h1>
            {subtitulo && <p className="mt-2 max-w-xl text-white/75">{subtitulo}</p>}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6">
            <WizardStepperMobile pasoActual={pasoActual} />
          </div>

          <div className="grid gap-8 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_260px]">
            <WizardStepperSidebar pasoActual={pasoActual} />
            <div className="min-w-0">{children}</div>
            {team && <TeamPreviewCard team={team} />}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
