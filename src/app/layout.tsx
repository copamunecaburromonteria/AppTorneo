import type { Metadata } from "next";
import { Bebas_Neue, Montserrat, Permanent_Marker } from "next/font/google";
import "./globals.css";

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
    "Más que un torneo, es el parche. Copa Muñeca e'Burro — 32 equipos, categoría libre, Montería, Córdoba.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bebas.variable} ${montserrat.variable} ${accentScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muneca-white text-muneca-black">
        {children}
      </body>
    </html>
  );
}
