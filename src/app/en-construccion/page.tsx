import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Copa Muñeca e'Burro — Muy pronto",
  description: "Estamos construyendo la Copa Muñeca e'Burro. Vuelve pronto.",
  robots: { index: false, follow: false },
};

export default function EnConstruccionPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-muneca-black px-4 py-16 text-center text-muneca-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(123,31,162,0.35),transparent)]" />
        <div className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-muneca-purple/25 blur-3xl" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-muneca-purple/20 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center">
        <Image
          src="/brand/mascota-badge.png"
          alt="Copa Muñeca e'Burro"
          width={1254}
          height={1254}
          priority
          className="h-28 w-28 object-contain sm:h-36 sm:w-36"
        />

        <Image
          src="/brand/logo-full.png"
          alt="Copa Muñeca e'Burro"
          width={1983}
          height={793}
          priority
          className="mt-6 h-auto w-72 object-contain sm:w-96"
        />

        <p className="font-display mt-8 text-3xl uppercase leading-tight text-muneca-yellow sm:text-4xl">
          Algo grande está por llegar
        </p>

        <p className="mt-4 max-w-md text-base text-muneca-white/75 sm:text-lg">
          Estamos afinando los últimos detalles de la Copa. Más que un torneo, es el
          parche — y ya viene en camino.
        </p>

        <p className="mt-8 text-sm uppercase tracking-[0.2em] text-donkey-gray">
          Montería, Córdoba
        </p>
      </div>
    </main>
  );
}
