import type { LucideIcon } from "lucide-react";

const COLOR_CLASSES: Record<string, string> = {
  purple: "bg-muneca-purple/10 text-muneca-purple",
  yellow: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  blue: "bg-sky-100 text-sky-700",
};

export type StatCardColor = keyof typeof COLOR_CLASSES;

/**
 * Tarjeta de estadística del panel admin con ícono en caja de color —
 * reemplaza la tarjeta de solo texto que había antes (2026-09-21, a partir
 * de una captura de referencia que le gustó a Fernando: "más colorido").
 */
export function StatCard({
  icon: Icon,
  color,
  label,
  valor,
  detalle,
}: {
  icon: LucideIcon;
  color: StatCardColor;
  label: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${COLOR_CLASSES[color]}`}>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">{label}</p>
        <p className="font-display mt-0.5 truncate text-xl text-muneca-black sm:text-2xl">{valor}</p>
        <p className="truncate text-xs text-black/40">{detalle}</p>
      </div>
    </div>
  );
}
