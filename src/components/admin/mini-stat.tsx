const DOT_CLASSES: Record<string, string> = {
  purple: "bg-muneca-purple",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  red: "bg-rose-500",
  blue: "bg-sky-500",
  gray: "bg-black/30",
};

/**
 * Mini-tarjeta de conteo con puntico de color — fila de resumen rápido
 * debajo del encabezado de una tabla (ej. "0 Equipos inscritos", "0 Pago
 * pendiente"). Más liviana que `StatCard` (sin ícono), calcada de la
 * captura de referencia que le gustó a Fernando (2026-09-21).
 */
export function MiniStat({
  color,
  valor,
  label,
}: {
  color: keyof typeof DOT_CLASSES;
  valor: number | string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASSES[color]}`} />
      <div className="min-w-0">
        <p className="font-display text-lg text-muneca-black">{valor}</p>
        <p className="truncate text-xs text-black/40">{label}</p>
      </div>
    </div>
  );
}
