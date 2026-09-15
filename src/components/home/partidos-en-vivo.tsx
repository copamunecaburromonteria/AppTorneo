import { obtenerEstadoEnVivoHome } from "@/lib/home/en-vivo";
import { PartidosEnVivoClient } from "./partidos-en-vivo-client";

/**
 * "Partidos en vivo" + "Tablas de posiciones" del Home — reemplaza el
 * antiguo `<TablaPosiciones />` (que seguía usando datos de ejemplo fijos
 * de `mock-data.ts`, ver nota en el plan del proyecto). Primer render por
 * servidor con datos reales (sin parpadeo); el componente cliente
 * (`PartidosEnVivoClient`) toma el relevo y sondea `/api/home/en-vivo`
 * cada 15s para reflejar lo que registra el operador de cancha.
 */
export async function PartidosEnVivo() {
  const inicial = await obtenerEstadoEnVivoHome();
  return <PartidosEnVivoClient inicial={inicial} />;
}
