"use client";

import { useEffect, useRef, useState } from "react";

/**
 * StickyHeader — abr-2026l
 *
 * Wrapper que pega su contenido al `top-14` (debajo del navbar) cuando el
 * usuario hace scroll, añadiendo sombra y backdrop-blur sólo cuando
 * realmente está pegado. Esto evita que un sticky con `shadow-lg` siempre
 * visible robe atención visual desde el primer pintado.
 *
 * Implementación: IntersectionObserver con un sentinel 1px arriba. Coste
 * 0 cuando el sentinel está visible (no recalculamos nada en scroll).
 *
 * a11y: el wrapper preserva la semántica (role / aria-label) que reciba
 * por props — útil para `<nav>` o `<form>` interno.
 */
type Props = {
  children: React.ReactNode;
  /** Tailwind top offset class. Default: top-14 (= 3.5rem). */
  topClass?: string;
  /** Z-index Tailwind class. Default: z-40 (debajo de modales z-50). */
  zClass?: string;
  /** Aria label opcional para el contenedor. */
  ariaLabel?: string;
};

export function StickyHeader({
  children,
  topClass = "top-14",
  zClass = "z-40",
  ariaLabel,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <div
        role={ariaLabel ? "region" : undefined}
        aria-label={ariaLabel}
        className={[
          "sticky",
          topClass,
          zClass,
          "transition-shadow transition-colors duration-200",
          stuck
            ? "bg-gray-950/85 backdrop-blur-md border-b border-gray-800 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
      >
        {children}
      </div>
    </>
  );
}
