import type { Metadata } from "next";
import { Bebas_Neue, Montserrat, Permanent_Marker } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

// ID de medición de Google Analytics 4 (Fernando, 2026-09-21) — público por
// naturaleza (viaja en el HTML de cualquier sitio con GA), no es secreto,
// por eso NEXT_PUBLIC_GA_MEASUREMENT_ID viene con valor real en
// .env.local.example en vez de vacío, mismo criterio que
// NEXT_PUBLIC_SUPABASE_URL.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

// Sustituto temporal de "Another Danger" (fuente de marca) mientras se confirma
// disponibilidad/licencia del archivo real.
const accentScript = Permanent_Marker({
  variable: "--font-accent-script",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Copa Muñeca e'Burro | Montería",
  description:
    "Más que un torneo, es el parche. Copa Muñeca e'Burro — 24 equipos, categoría libre, Montería, Córdoba.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bebas.variable} ${montserrat.variable} ${accentScript.variable} h-full antialiased`}
    >
      {/* Toda la plataforma pasó a fondo oscuro (2026-09-14, a petición de
          Fernando) — el body queda oscuro por defecto para que no haya
          "destello" claro en los bordes/rebote de scroll de ninguna página. */}
      <body className="min-h-full flex flex-col bg-muneca-black text-muneca-white">
        {children}
      </body>
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}
