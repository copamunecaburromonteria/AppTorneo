import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

export type Crumb = { label: string; href?: string };

type Tone = "light" | "dark";

/**
 * Rastro de navegación (Inicio > Sección > Página actual). `tone="light"`
 * es para usarlo sobre fondos oscuros (héroes, banners); `tone="dark"`
 * (por defecto) es para el resto de la página, sobre fondo claro.
 */
export function Breadcrumbs({ items, tone = "dark" }: { items: Crumb[]; tone?: Tone }) {
  const mutedClass = tone === "light" ? "text-white/55" : "text-black/45";
  const separatorClass = tone === "light" ? "text-white/30" : "text-black/25";
  const linkHoverClass = tone === "light" ? "hover:text-muneca-yellow" : "hover:text-muneca-purple";
  const currentClass = tone === "light" ? "text-white" : "text-muneca-purple";

  return (
    <nav
      aria-label="Miga de pan"
      className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${mutedClass}`}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && (
              <CaretRight size={10} weight="bold" className={separatorClass} aria-hidden="true" />
            )}
            {item.href && !isLast ? (
              <Link href={item.href} className={`transition-colors ${linkHoverClass}`}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? currentClass : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
