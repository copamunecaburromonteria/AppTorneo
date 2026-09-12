"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV = [
  { href: "/admin", label: "Equipos y pagos" },
  { href: "/admin/arbitros", label: "Árbitros" },
  { href: "/admin/operadores", label: "Operadores" },
];

/**
 * Navegación entre las secciones del panel administrativo. Es un componente
 * cliente solo para poder resaltar la sección activa con `usePathname` — el
 * layout que la usa (`admin/(claro)/layout.tsx`) sigue siendo un Server
 * Component.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto">
      {ADMIN_NAV.map((item) => {
        const activo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${
              activo
                ? "bg-muneca-purple text-white"
                : "text-muneca-black/60 hover:bg-black/5 hover:text-muneca-black"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
