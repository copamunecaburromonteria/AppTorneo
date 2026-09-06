import Image from "next/image";
import { inclusiones } from "@/lib/mock-data";

export function TorneoIntro() {
  return (
    <section id="torneo" className="bg-muneca-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-10 lg:flex-row">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-bold uppercase tracking-widest text-muneca-purple">
              — El torneo
            </p>
            <h2 className="font-display mt-2 text-4xl leading-tight sm:text-5xl">
              UNA NUEVA FORMA DE VIVIR EL FÚTBOL EN MONTERÍA.
            </h2>
            <p className="mt-4 max-w-xl text-base text-muneca-black/70 mx-auto lg:mx-0">
              La Copa Muñeca e&apos;Burro nace para reunir equipos, personas e
              historias alrededor del fútbol aficionado. Una competencia
              organizada, con su propia plataforma digital, premiación
              atractiva y una comunidad que cree en el talento local.
            </p>
            <a
              href="#partidos"
              className="mt-6 inline-block rounded-md bg-muneca-purple px-6 py-3 text-sm font-bold uppercase text-muneca-white transition-transform hover:scale-[1.03]"
            >
              Conoce más
            </a>
          </div>

          <div className="flex flex-1 justify-center">
            <Image
              src="/brand/mascota-02.png"
              alt="Mascota Copa Muñeca e'Burro"
              width={360}
              height={360}
              className="h-auto w-56 object-contain sm:w-72"
            />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {inclusiones.map((item) => (
            <div
              key={item}
              className="flex flex-col items-center gap-2 rounded-lg border border-black/10 bg-black/[0.02] px-2 py-4 text-center"
            >
              <span className="text-2xl" aria-hidden>
                ⚽
              </span>
              <span className="text-xs font-semibold text-muneca-black/70">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
