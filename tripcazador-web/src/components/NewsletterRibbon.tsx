"use client";

/**
 * NewsletterRibbon — SSS256 (16 may 2026)
 *
 * Variante B del A/B newsletter_widget_v1: ribbon CTA en lugar de form
 * embed inline. Hipótesis: menor fricción visual en contexto mid-blog →
 * más conversión vs ver un form mientras lees.
 *
 * UX:
 *  - Barra única horizontal con headline + emoji + CTA button.
 *  - Click → navega a /alertas (form completo) con context tracking.
 *  - Event newsletter_ribbon_click tras click (correlación post-deploy).
 *  - Aria-label completo (accessibility).
 */
import Link from "next/link";
import { tcTrack } from "@/lib/track_client";

interface Props {
  /** Contexto que se envía al backend para attribution (ej. "blog-post-marrakech"). */
  context?: string;
}

export function NewsletterRibbon({ context = "site" }: Props) {
  function handleClick() {
    try {
      tcTrack("newsletter_ribbon_click", { context });
    } catch {
      /* no-op */
    }
  }

  return (
    <aside
      aria-label="Newsletter signup"
      className="my-8 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">
            ✉️
          </span>
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
              ¿Quieres recibir los TOP 5 chollos cada lunes?
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Newsletter gratuito · 100% sin spam · cancela cuando quieras
            </p>
          </div>
        </div>
        <Link
          href="/alertas"
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm sm:text-base whitespace-nowrap shadow-lg transition-colors"
        >
          Suscribirme →
        </Link>
      </div>
    </aside>
  );
}
