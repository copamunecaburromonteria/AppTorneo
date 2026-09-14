import Link from "next/link";

type Acceso = {
  nombre: string;
  ruta: string;
  descripcion: string;
  ingreso: string;
};

const ACCESOS: Acceso[] = [
  {
    nombre: "Panel administrativo (Equipos y pagos, Partidos, Árbitros, Operadores)",
    ruta: "/admin",
    descripcion: "El panel donde ya estás ahora — administra equipos, pagos, el calendario, la planilla de árbitros y los operadores de cancha.",
    ingreso: "Correo y contraseña de admin (Supabase Auth) — cuenta: copamunecaburromonteria@gmail.com.",
  },
  {
    nombre: "Portal de equipos",
    ruta: "/portal",
    descripcion: "Donde cada delegado de equipo gestiona su plantilla, cuerpo técnico, colores y ve su plan de pagos.",
    ingreso: "Correo y contraseña que el delegado creó al inscribir su equipo (uno por equipo).",
  },
  {
    nombre: "Líder de Árbitros",
    ruta: "/lider-arbitros",
    descripcion: "Calendario tipo Google Calendar para asignar árbitros a cada partido y confirmarlos.",
    ingreso: "Correo y contraseña propios — cuenta de prueba actual: hakunnando@gmail.com.",
  },
  {
    nombre: "Operador de cancha",
    ruta: "/operador",
    descripcion: "Consola móvil para registrar el partido en vivo (inicio/fin, goles, tarjetas) desde la cancha.",
    ingreso: "PIN individual, sin correo — se crea desde Admin → Operadores.",
  },
];

/**
 * Acceso directo a todos los paneles administrativos de la plataforma, para
 * que el super admin (Fernando) tenga todo bajo control en un solo lugar y
 * no tenga que recordar cada URL. Pedido explícito de Fernando (2026-09-14).
 * No está enlazada desde el menú público (header/footer) — solo se llega
 * por URL directa, y queda protegida por el mismo layout de
 * `admin/(claro)/layout.tsx` (login + rol admin), como el resto del panel.
 */
export default function AccesosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">Accesos</h1>
        <p className="mt-1 text-sm text-black/60">
          Todas las puertas de entrada de la plataforma, en un solo lugar. Esta página no aparece en
          ningún menú público — solo tú la ves.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ACCESOS.map((acceso) => (
          <div
            key={acceso.ruta}
            className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
          >
            <div>
              <p className="font-display text-base uppercase tracking-wide text-muneca-black">
                {acceso.nombre}
              </p>
              <p className="mt-1 text-sm text-black/60">{acceso.descripcion}</p>
            </div>
            <p className="text-xs text-black/40">{acceso.ingreso}</p>
            <Link
              href={acceso.ruta}
              className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-md bg-muneca-purple px-3.5 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02]"
            >
              Ir a {acceso.ruta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
