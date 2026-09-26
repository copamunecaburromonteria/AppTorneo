"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, SignIn } from "@phosphor-icons/react";

type Acceso = { href: string; label: string; hint: string };

const ACCESOS: Acceso[] = [
  { href: "/portal/login", label: "Equipos", hint: "Correo y contraseña" },
  { href: "/lider-arbitros/login", label: "Líder de árbitros", hint: "Correo y contraseña" },
  { href: "/operador/login", label: "Operador de cancha", hint: "PIN" },
  { href: "/admin/login", label: "Administración", hint: "Correo y contraseña" },
];

type Tone = "light" | "dark";

/**
 * Acceso directo a los 4 paneles de la plataforma (Equipos, Líder de
 * árbitros, Operador de cancha, Administración), pedido por Fernando el
 * 2026-09-26: hoy ninguno de los 4 logins está enlazado desde el sitio
 * público — solo se llega escribiendo la URL de memoria o si algo te
 * redirige ahí (por ejemplo, al cerrar sesión). El único lugar donde
 * estaban listados los 4 era `/admin/accesos`, pero esa página vive adentro
 * del panel admin — protegida por su propio login, solo la ve Fernando.
 *
 * "Árbitros" se etiqueta como "Líder de árbitros" (decisión de Fernando):
 * el árbitro individual no tiene login propio, es solo un registro de
 * planilla — el único acceso real de ese mundo es el de quien administra la
 * planilla y asigna árbitros por partido.
 *
 * Deliberadamente discreto (dropdown chico, sin tarjetas grandes ni
 * imágenes) — decisión de Fernando: el home es para el público general
 * (aficionados, patrocinadores), y estos 4 accesos los usa un grupo muy
 * chico de personas (24 delegados, un puñado de árbitros/operadores, él
 * mismo). Mismo patrón de interacción que `NavDropdown`, pero con una
 * segunda línea de texto por ítem (qué te va a pedir: correo o PIN) — por
 * eso no se reutilizó ese componente tal cual.
 */
export function SiteHeaderAccesos({ tone = "dark" }: { tone?: Tone }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
          tone === "light"
            ? "text-white/80 hover:bg-white/10 hover:text-white"
            : "text-muneca-black/60 hover:bg-black/5 hover:text-muneca-black"
        }`}
      >
        <SignIn size={15} weight="bold" aria-hidden="true" />
        <span className="hidden sm:inline">Acceder</span>
        <CaretDown
          size={11}
          weight="bold"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg border border-black/10 bg-muneca-white py-1.5 text-left shadow-lg"
        >
          {ACCESOS.map((acceso) => (
            <a
              key={acceso.href}
              href={acceso.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 transition-colors hover:bg-muneca-purple/10"
            >
              <span className="block text-sm font-semibold text-muneca-black">{acceso.label}</span>
              <span className="block text-xs text-muneca-black/50">{acceso.hint}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
