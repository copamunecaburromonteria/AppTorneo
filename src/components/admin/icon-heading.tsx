import type { LucideIcon } from "lucide-react";

const COLOR_CLASSES: Record<string, string> = {
  purple: "bg-muneca-purple/10 text-muneca-purple",
  yellow: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  blue: "bg-sky-100 text-sky-700",
};

/**
 * Encabezado de sección con ícono en círculo de color — el mismo patrón
 * visual repetido en cada bloque del panel admin (2026-09-21, rediseño
 * "más colorido" pedido por Fernando a partir de una captura de
 * referencia): "🤝 Patrocinadores", "👤 Equipos y pagos", etc.
 */
export function IconHeading({
  icon: Icon,
  color = "purple",
  children,
  size = "md",
}: {
  icon: LucideIcon;
  color?: keyof typeof COLOR_CLASSES;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const caja = size === "lg" ? "h-11 w-11" : "h-8 w-8";
  const icono = size === "lg" ? 20 : 16;
  const texto = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex ${caja} shrink-0 items-center justify-center rounded-xl ${COLOR_CLASSES[color]}`}>
        <Icon size={icono} strokeWidth={2.25} />
      </span>
      <h2 className={`font-display ${texto} uppercase tracking-wide text-muneca-black`}>{children}</h2>
    </div>
  );
}
