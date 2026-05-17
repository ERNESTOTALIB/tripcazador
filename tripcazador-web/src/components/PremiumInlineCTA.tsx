"use client";

/**
 * PremiumInlineCTA — SSS276 (17 may 2026)
 *
 * Compact upgrade CTA para embed inline en home/blog/deals.
 * Diferente de PremiumUpgradeButton (full-page hero) — más bajo perfil
 * pero presente en surfaces con mucho tráfico.
 *
 * Goal: promover Premium €9.99/mes desde surfaces que actualmente NO
 * mencionan Premium (home, blog posts, listings de deals).
 *
 * Eventos tracking:
 *  - premium_inline_view (IntersectionObserver, 1× per source)
 *  - premium_inline_click (al pulsar CTA)
 *
 * Variantes opcionales por surface:
 *  - variant="card" (default): tarjeta amarilla compacta
 *  - variant="banner": full-width banner inline
 *  - variant="minimal": link discreto
 */
import { useEffect, useRef, useState } from "react";
import { getPremiumStatus } from "@/lib/premium";
import { tcTrack, tcTrackOnce } from "@/lib/track_client";

interface Props {
  /** Identificador del surface (home/blog/deal_card/...). Para analytics. */
  source: string;
  variant?: "card" | "banner" | "minimal";
  /** Override del título. Default según variant. */
  title?: string;
  /** Override del subtitle. Default según variant. */
  subtitle?: string;
}

export function PremiumInlineCTA({
  source,
  variant = "card",
  title,
  subtitle,
}: Props) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActive(getPremiumStatus().active);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            tcTrackOnce("premium_inline_view", `premium_inline_${source}`, {
              source,
              variant,
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
  }, [source, variant]);

  // No renderizar si ya es Premium (no spam al usuario actual)
  if (active) return null;

  async function handleClick() {
    setLoading(true);
    tcTrack("premium_inline_click", { source, variant });
    try {
      const res = await fetch("/api/premium/checkout", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      /* fallback to /premium */
    }
    // Fallback: navega a /premium full page
    window.location.href = "/premium";
  }

  if (variant === "minimal") {
    return (
      <div ref={ref} className="text-sm text-amber-400">
        <button
          onClick={handleClick}
          disabled={loading}
          className="underline hover:text-amber-300 disabled:opacity-60"
        >
          {title || "Hazte Premium €9.99/mes →"}
        </button>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        ref={ref}
        className="my-6 px-5 py-4 bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
      >
        <div className="flex-1 min-w-0">
          <div className="font-bold text-amber-400 text-sm">
            {title || "🎯 Premium · Alertas SMS + Deep Search"}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {subtitle ||
              "Recibe error fares antes que nadie · €9.99/mes · 7 días gratis"}
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={loading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-semibold text-sm rounded-lg whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {loading ? "..." : "Probar 7 días gratis"}
        </button>
      </div>
    );
  }

  // variant === "card" (default)
  return (
    <div
      ref={ref}
      className="my-8 p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">🎯</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg">
            {title || "Premium · Alertas instantáneas SMS"}
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            {subtitle ||
              "Recibe error fares al móvil antes de que se agoten · Deep search ilimitado · Sin anuncios."}
          </p>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleClick}
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {loading ? "Procesando..." : "Empezar prueba 7 días"}
            </button>
            <span className="text-xs text-gray-400">
              €9.99/mes · cancela cuando quieras
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
