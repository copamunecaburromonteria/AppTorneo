import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { ParallaxSectionBackground } from "@/components/parallax-section-background";
import { BuscadorCargos } from "@/app/pagos-tarjetas/buscador-cargos";

/**
 * Consulta y pago público de cargos por tarjeta — sin login, porque los
 * jugadores no tienen cuenta propia (ver `claude/reglamento.md` punto 12 y
 * `pagos-tarjetas/actions.ts`). El delegado también puede pagar todas las
 * tarjetas del equipo de una vez desde `/portal`.
 */
export default function PagosTarjetasPage() {
  const breadcrumbs: Crumb[] = [{ label: "Inicio", href: "/" }, { label: "Pagar tarjetas" }];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muneca-white">
        <section className="relative isolate overflow-hidden pb-10 pt-36 text-white">
          <ParallaxSectionBackground src="/brand/hero-stadium.jpg" priority />
          <div aria-hidden className="absolute inset-0 bg-muneca-black/75" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_0%,rgba(123,31,162,0.35),transparent)]" />
          </div>
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <Breadcrumbs tone="light" items={breadcrumbs} />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muneca-yellow">
              Reglamento — cargos por tarjeta
            </p>
            <h1 className="font-display mt-1 text-4xl sm:text-5xl">Pagar tarjetas</h1>
            <p className="mt-2 text-white/70">
              Consulta si tienes tarjetas con cargo económico pendientes y págalas en línea. Escribe tu
              cédula y tu nombre completo, igual que quedaron en la inscripción.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <BuscadorCargos />
          <p className="mt-6 text-center text-xs text-black/40">
            ¿Eres el delegado del equipo? Puedes pagar las tarjetas de todos tus jugadores de una sola
            vez desde{" "}
            <a href="/portal" className="font-semibold text-muneca-purple underline">
              tu portal
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
