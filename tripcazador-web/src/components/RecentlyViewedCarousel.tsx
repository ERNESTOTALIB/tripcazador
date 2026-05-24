"use client";
/**
 * RecentlyViewedCarousel — AUDIT-FULL-2 (24 may 2026)
 *
 * Client widget que (1) trackea el deal actual via trackDealView en page load
 * y (2) renderiza los últimos N deals vistos como cards horizontales.
 *
 * Lib: src/lib/recently_viewed.ts (SSS473) — antes dead code, ahora wired.
 * Persistencia: localStorage navegador (cross-tab, no cross-device).
 *
 * Uso: `<RecentlyViewedCarousel currentDeal={{id, origin, destination, ...}} />`
 * en /deals/[id]. Excluye el deal actual del listado para evitar self-link.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRecentlyViewed,
  trackDealView,
  type RecentlyViewedItem,
} from "@/lib/recently_viewed";

interface CurrentDeal {
  id: string;
  origin: string;
  destination: string;
  cityTo: string;
  priceEur: number;
  airline?: string;
  dateOut?: string;
}

interface Props {
  currentDeal: CurrentDeal;
}

export function RecentlyViewedCarousel({ currentDeal }: Props) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  // En mount: track current deal + read list (excluido el actual)
  useEffect(() => {
    trackDealView(currentDeal);
    const all = getRecentlyViewed().filter((x) => x.id !== currentDeal.id);
    setItems(all);
  }, [currentDeal]);

  if (items.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        👀 Visto recientemente
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {items.map((d) => (
          <Link
            key={d.id}
            href={`/deals/${d.id}`}
            className="flex-shrink-0 w-44 rounded-lg border border-slate-700 bg-slate-800/40 p-3 transition-colors hover:border-amber-500/50"
          >
            <div className="text-xs font-mono text-slate-400">
              {d.origin} → {d.destination}
            </div>
            <div className="mt-1 text-sm font-bold text-white truncate">
              {d.cityTo}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-bold text-amber-300">
                €{d.priceEur}
              </span>
              {d.airline && (
                <span className="text-xs text-slate-500">{d.airline}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default RecentlyViewedCarousel;
