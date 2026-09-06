import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/home/hero";
import { StatsBar } from "@/components/home/stats-bar";
import { TorneoIntro } from "@/components/home/torneo-intro";
import { Numeros } from "@/components/home/numeros";
import { ProximosPartidos } from "@/components/home/proximos-partidos";
import { TablaPosiciones } from "@/components/home/tabla-posiciones";
import { AppPromo } from "@/components/home/app-promo";
import { EstadisticasDestacadas } from "@/components/home/estadisticas-destacadas";
import { Equipos } from "@/components/home/equipos";
import { Galeria } from "@/components/home/galeria";
import { Patrocinadores } from "@/components/home/patrocinadores";
import { CtaInscripcion } from "@/components/home/cta-inscripcion";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <TorneoIntro />
        <Numeros />
        <ProximosPartidos />
        <TablaPosiciones />
        <AppPromo />
        <EstadisticasDestacadas />
        <Equipos />
        <Galeria />
        <Patrocinadores />
        <CtaInscripcion />
      </main>
      <SiteFooter />
    </div>
  );
}
