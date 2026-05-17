"use client";

/**
 * ConciergeInlineCTA — SSS281 (17 may 2026)
 *
 * Compact CTA inline para promover el servicio Concierge €19-99 desde
 * surfaces high-traffic (blog, deal detail, home). Mismo patrón que
 * PremiumInlineCTA (SSS276) pero dirige a `/concierge`.
 *
 * Concierge tiene Stripe Checkout LIVE funcionando (verified SSS280)
 * pero solo se promociona en `/concierge` page directa — visitors
 * en blog/deals nunca lo veían.
 *
 * Eventos tracking:
 *  - concierge_inline_view (IntersectionObserver, 1× per source)
 *  - concierge_inline_click
 */
import { useEffect, useRef } from "react";
import { tcTrack, tcTrackOnce } from "@/lib/track_client";

interface Props {
  source: string;
  variant?: "card" | "banner" | "minimal";
  title?: string;
  subtitle?: string;
  /** Tier a destacar — afecta copy y el ?tier= param. Default standard €19. */
  highlightTier?: "express" | "standard" | "premium" | "pro";
}

const TIER_LABELS = {
  express: { name: "Express", price: 9, hours: 24 },
  standard: { name: "Standard", price: 19, hours: 48 },
  premium: { name: "Premium", price: 49, hours: 72 },
  pro: { name: "Pro", price: 99, hours: 120 },
} as const;

export function ConciergeInlineCTA({
  source,
  variant = "card",
  title,
  subtitle,
  highlightTier = "standard",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const tier = TIER_LABELS[highlightTier];

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            tcTrackOnce("concierge_inline_view", `concierge_inline_${source}`, {
              source,
              variant,
              tier: highlightTier,
            });
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [source, variant, highlightTier]);

  function handleClick() {
    tcTrack("concierge_inline_click", {
      source,
      variant,
      tier: highlightTier,
    });
    window.location.href = `/concierge?tier=${highlightTier}&utm_source=${encodeURIComponent(source)}`;
  }

  if (variant === "minimal") {
    return (
      <div ref={ref} className="text-sm text-fuchsia-400">
        <button
          onClick={handleClick}
          className="underline hover:text-fuchsia-300"
        >
          {title || `Te lo busco yo · €${tier.price} ${tier.name} →`}
        </button>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        ref={ref}
        className="my-6 px-5 py-4 bg-gradient-to-r from-fuchsia-500/15 to-purple-600/10 border border-fuchsia-500/40 rounded-xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
      >
        <div className="flex-1 min-w-0">
          <div className="font-bold text-fuchsia-300 text-sm">
            {title || `🧳 ¿No tienes tiempo? Te lo busco yo · €${tier.price}`}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {subtitle ||
              `Servicio Concierge: te entrego ${tier.name === "Standard" ? "5 opciones + hotel sugerido" : "el plan completo"} en ${tier.hours}h. Garantía €100+ ahorro o reembolso.`}
          </div>
        </div>
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-semibold text-sm rounded-lg whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
        >
          Ver Concierge €{tier.price}
        </button>
      </div>
    );
  }

  // variant === "card" (default)
  return (
    <div
      ref={ref}
      className="my-8 p-6 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/5 border border-fuchsia-500/30 rounded-2xl"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">🧳</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg">
            {title || `Te busco vuelos + hotel por €${tier.price}`}
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            {subtitle ||
              `Servicio Concierge ${tier.name}: 5 opciones rankeadas + hotel sugerido + tips del destino, entregado en ${tier.hours}h por email. Garantía €100+ de ahorro o reembolso.`}
          </p>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleClick}
              className="px-5 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold text-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
            >
              Pedir Concierge {tier.name} · €{tier.price}
            </button>
            <a
              href="/concierge"
              className="text-xs text-fuchsia-300 hover:text-fuchsia-200 underline"
            >
              Comparar todos los planes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
