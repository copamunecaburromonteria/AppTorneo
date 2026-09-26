import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/home/hero";
import { CampeonBanner } from "@/components/home/campeon-banner";
import { StatsBar } from "@/components/home/stats-bar";
import { TorneoIntro } from "@/components/home/torneo-intro";
import { Numeros } from "@/components/home/numeros";
import { ProximosPartidos } from "@/components/home/proximos-partidos";
import { PartidosEnVivo } from "@/components/home/partidos-en-vivo";
import { AppPromo } from "@/components/home/app-promo";
import { EstadisticasDestacadas } from "@/components/home/estadisticas-destacadas";
import { Equipos } from "@/components/home/equipos";
import { Galeria } from "@/components/home/galeria";
import { Patrocinadores } from "@/components/home/patrocinadores";
import { PreguntasFrecuentes } from "@/components/home/preguntas-frecuentes";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <CampeonBanner />
        <StatsBar />
        <TorneoIntro />
        <Numeros />
        <ProximosPartidos />
        <PartidosEnVivo />
        <AppPromo />
        <EstadisticasDestacadas />
        <Equipos />
        <Galeria />
        <Patrocinadores />
        <PreguntasFrecuentes />
      </main>
      <SiteFooter />
    </div>
  );
}
