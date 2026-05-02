/**
 * SectionHero — fase vv VV4
 *
 * Mini-hero sky gradient para páginas no-home (deals/destinos/hoteles/blog).
 * Más corto que el SkyHero (no searchbar/floating cards) — solo h1 + subtitle
 * sobre el gradient azul→naranja. Mantiene la consistencia visual con la home.
 *
 * Full-bleed (escapa del max-w-7xl del MainShell) usando 100vw + margin-left
 * negativo. Pinta el badge live opcional (si pasa `badge`).
 */
import type { ReactNode } from "react";

interface SectionHeroProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: string;
  /** Altura del hero — "compact" para listings (≈260px), "tall" para landing pages (≈340px) */
  size?: "compact" | "tall";
  children?: ReactNode;
}

export function SectionHero({
  title,
  subtitle,
  badge,
  size = "compact",
  children,
}: SectionHeroProps) {
  return (
    <div className={`section-hero section-hero--${size}`}>
      <div className="section-hero-clouds" aria-hidden="true" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center text-white">
        {badge && (
          <span className="sky-badge">
            <span className="sky-badge-dot" aria-hidden="true" />
            {badge}
          </span>
        )}
        <h1 className="section-hero-h1">{title}</h1>
        {subtitle && <p className="section-hero-lead">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
