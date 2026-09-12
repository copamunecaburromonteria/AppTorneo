type Size = "xs" | "sm" | "md" | "lg" | "xl";

const BOX_CLASSES: Record<Size, string> = {
  xs: "h-4 w-4",
  sm: "h-8 w-8",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
};

const ICON_CLASSES: Record<Size, string> = {
  xs: "h-2.5 w-2.5",
  sm: "h-4 w-4",
  md: "h-7 w-7",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
};

/**
 * Escudo del equipo. Mientras los equipos no suban su escudo real
 * (`teams.escudo_url` sigue null para todo el dataset), se muestra un
 * escudo genérico consistente en toda la plataforma — mismo patrón que el
 * usado en el wizard de inscripción (`team-preview-card.tsx`).
 */
export function TeamCrest({
  url,
  size = "md",
  className,
}: {
  url?: string | null;
  size?: Size;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={`${BOX_CLASSES[size]} rounded-xl object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-muneca-purple/10 text-muneca-purple ${BOX_CLASSES[size]} ${className ?? ""}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASSES[size]} aria-hidden="true">
        <path
          d="M12 2 4 5v6c0 5 3.4 8.7 8 9.9 4.6-1.2 8-4.9 8-9.9V5l-8-3Z"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
