"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

type SubLink = { href: string; label: string };
type Tone = "light" | "dark";

export function NavDropdown({
  label,
  items,
  tone = "dark",
}: {
  label: string;
  items: SubLink[];
  tone?: Tone;
}) {
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
      {/* Los <button> resetean text-transform vía Tailwind preflight, por eso
          "uppercase" se declara explícito aquí (no basta con heredarlo del <nav>). */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`font-display flex items-center gap-1 pb-1 uppercase tracking-wider transition-colors hover:text-muneca-yellow ${
          tone === "light" ? "text-white/90" : "text-muneca-black/70"
        }`}
      >
        {label}
        <CaretDown
          size={13}
          weight="bold"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="font-sans absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg border border-black/10 bg-muneca-white py-2 text-left normal-case shadow-lg"
        >
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm font-medium tracking-normal text-muneca-black/80 hover:bg-muneca-purple/10 hover:text-muneca-purple"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
