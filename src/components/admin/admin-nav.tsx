"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavCounts = {
  equipos?: number;
  preinscritos?: number;
  partidos?: number;
  arbitros?: number;
  operadores?: number;
  cargos?: number;
  patrocinadores?: number;
};

const ADMIN_NAV: {
  href: string;
  label: string;
  contador?: keyof AdminNavCounts;
}[] = [
  { href: "/admin", label: "Equipos y pagos", contador: "equipos" },
  { href: "/admin/preinscripciones", label: "Preinscripciones", contador: "preinscritos" },
  { href: "/admin/partidos", label: "Partidos", contador: "partidos" },
  { href: "/admin/cargos-tarjetas", label: "Cargos por tarjeta", contador: "cargos" },
  { href: "/admin/patrocinadores", label: "Patrocinadores", contador: "patrocinadores" },
  { href: "/admin/arbitros", label: "Árbitros", contador: "arbitros" },
  { href: "/admin/operadores", label: "Operadores", contador: "operadores" },
  { href: "/admin/accesos", label: "Accesos" },
];

/**
 * Navegación entre las secciones del panel administrativo. Es un componente
 * cliente solo para poder resaltar la sección activa con `usePathname` — el
 * layout que la usa (`admin/(claro)/layout.tsx`) sigue siendo un Server
 * Component, que es quien consulta los contadores y se los pasa por props.
 */
export function AdminNav({ counts }: { counts?: AdminNavCounts }) {
  const pathname = usePathname();

  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto">
      {ADMIN_NAV.map((item) => {
        const activo = pathname === item.href;
        const contador = item.contador ? counts?.[item.contador] : undefined;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${
              activo
                ? "bg-muneca-purple text-white"
                : "text-muneca-black/60 hover:bg-black/5 hover:text-muneca-black"
            }`}
          >
            {item.label}
            {contador != null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  activo ? "bg-white/20 text-white" : "bg-black/5 text-black/50"
                }`}
              >
                {contador}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
