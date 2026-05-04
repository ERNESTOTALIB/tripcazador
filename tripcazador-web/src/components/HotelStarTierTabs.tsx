"use client";

/**
 * HotelStarTierTabs — fase SSS63 (May 2026)
 *
 * Tabs por categoría de estrellas que muestran los TOP-N hoteles ordenados
 * por valueScore (rating × stars / price ratio) usando groupByStarTier
 * (lib/hotel_helpers.ts SSS59a).
 *
 * UX:
 *  - 3 tabs: 5★ Premium · 4★ Recomendado · 3★ Económico
 *  - Muestra contador junto al label
 *  - Tab activo: amber bg + black text; inactivos: gray
 *  - Top 6 cards por tier (basta para inspirar conversion)
 *
 * Se monta arriba de HotelFilters → orienta visualmente al usuario hacia
 * los mejores hoteles de cada categoría sin tener que aplicar filtros.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { groupByStarTier } from "@/lib/hotel_helpers";
import type { Deal } from "@/lib/api";

type Tier = "five" | "four" | "three";

const TIER_LABEL: Record<Tier, string> = {
  five: "5★ Premium",
  four: "4★ Recomendado",
  three: "3★ Económico",
};

const TIER_DESC: Record<Tier, string> = {
  five: "Lo mejor en lujo: spa, infinity pools, suites únicas. Ranking por mejor relación rating/precio.",
  four: "Balance perfecto entre confort y precio. Top picks 4★ ordenados por valor.",
  three: "Hoteles cómodos con la mejor relación calidad-precio del mercado.",
};

export function HotelStarTierTabs({ hotels }: { hotels: Deal[] }) {
  const grouped = useMemo(() => groupByStarTier(hotels), [hotels]);
  const tiers = useMemo(
    () =>
      (["five", "four", "three"] as Tier[]).filter(
        (t) => grouped[t].length > 0,
      ),
    [grouped],
  );
  const [active, setActive] = useState<Tier>(tiers[0] || "five");

  if (tiers.length === 0) return null;

  const items = grouped[active].slice(0, 6);

  return (
    <section
      aria-label="Hoteles agrupados por categoría de estrellas"
      className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-6 space-y-4"
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Top hoteles por categoría
        </h2>
        <p className="text-xs text-gray-400">
          Ranking por valor (rating · estrellas / precio)
        </p>
      </div>

      {/* TABS */}
      <div role="tablist" aria-label="Categoría estrellas" className="flex flex-wrap gap-2">
        {tiers.map((t) => {
          const isActive = t === active;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tier-panel-${t}`}
              onClick={() => setActive(t)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[40px] ${
                isActive
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              {TIER_LABEL[t]}
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded ${
                  isActive ? "bg-black/20" : "bg-gray-900/60"
                }`}
              >
                {grouped[t].length}
              </span>
            </button>
          );
        })}
      </div>

      <p
        id={`tier-panel-${active}-desc`}
        className="text-xs sm:text-sm text-gray-400"
      >
        {TIER_DESC[active]}
      </p>

      {/* GRID */}
      <div
        id={`tier-panel-${active}`}
        role="tabpanel"
        aria-describedby={`tier-panel-${active}-desc`}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {items.map((h) => {
          const ppn = (h as Deal & { price_per_night?: number }).price_per_night ?? h.price_eur;
          // @ts-expect-error custom hotel fields
          const reviewScore: number | undefined = h.review_score;
          // @ts-expect-error custom hotel fields
          const reviewCount: number | undefined = h.review_count;
          const slug = (h as Deal & { booking_url?: string }).booking_url;
          const detailHref = `/hoteles/${encodeURIComponent(String(h.id))}`;
          return (
            <Link
              key={h.id}
              href={detailHref}
              className="group rounded-xl border border-gray-800 bg-gray-900/60 hover:border-amber-500/50 hover:bg-gray-900/80 p-4 transition-all flex flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                  {h.city_to}
                </span>
                {reviewScore != null && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {reviewScore.toFixed(1)}/10
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-amber-300 transition-colors">
                {h.airline_name || h.headline}
              </h3>
              <div className="flex items-baseline gap-1 mt-auto pt-2">
                <span className="text-2xl font-bold text-white">€{Math.round(ppn)}</span>
                <span className="text-xs text-gray-500">/ noche</span>
              </div>
              {reviewCount != null && reviewCount > 0 && (
                <p className="text-[11px] text-gray-500">
                  {reviewCount} opiniones
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
