"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Fondo de foto con efecto de scroll parallax liviano — mismo patrón que el
 * héroe del home (`components/home/hero.tsx`), extraído acá para poder
 * reutilizarlo en otras secciones (por ahora: encabezado de la página de
 * partido). Requiere que la `<section>` que lo envuelve tenga
 * `position: relative` (o `isolate`) y `overflow-hidden`. Respeta "prefiere
 * menos movimiento".
 */
export function ParallaxSectionBackground({
  src,
  alt = "",
  objectPosition = "object-center",
  priority = false,
}: {
  src: string;
  alt?: string;
  objectPosition?: string;
  priority?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Respeta si la persona prefiere menos movimiento en pantalla.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    function actualizar() {
      const rect = el!.getBoundingClientRect();
      // Solo se mueve mientras la sección está cerca del viewport — evita
      // trabajo de más cuando ya se hizo scroll mucho más abajo.
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const offset = Math.min(window.scrollY * 0.15, 200);
        el!.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(actualizar);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="absolute -top-[220px] -bottom-[220px] left-0 right-0 will-change-transform"
    >
      <Image
        src={src}
        alt={alt}
        aria-hidden="true"
        fill
        priority={priority}
        sizes="100vw"
        className={`object-cover ${objectPosition}`}
      />
    </div>
  );
}
