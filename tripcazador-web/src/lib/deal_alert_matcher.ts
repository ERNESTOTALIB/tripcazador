/**
 * deal_alert_matcher.ts — SSS312 fix (19 may 2026)
 *
 * Extraído de /api/price-alerts/match-cron-premium/route.ts porque
 * Next.js no permite exports custom desde route.ts (solo HTTP methods +
 * runtime/dynamic). Tener `export function dealMatchesAlert` allí
 * rompía el build de Vercel SILENCIOSAMENTE.
 */

import type { PriceAlert } from "@/lib/price_alerts_store";

export interface DealForAlertMatch {
  origin?: string;
  destination?: string;
  price_eur?: number;
  cabin?: string;
  date_out?: string;
  airline_name?: string;
  headline?: string;
  booking_url?: string;
  savings_pct?: number;
  date_ret?: string;
}

export function dealMatchesAlert(
  deal: DealForAlertMatch,
  alert: Pick<
    PriceAlert,
    "origin" | "destination" | "max_price" | "cabin" | "date_min" | "date_max" | "origins"
  >,
): boolean {
  if (!deal.price_eur || deal.price_eur > alert.max_price) return false;
  // SSS303: origins[] (Premium) prevalece sobre origin singular
  if (alert.origins && alert.origins.length > 0) {
    if (!deal.origin || !alert.origins.includes(deal.origin)) return false;
  } else if (alert.origin && deal.origin !== alert.origin) {
    return false;
  }
  if (alert.destination && deal.destination !== alert.destination) return false;
  if (alert.cabin && deal.cabin !== alert.cabin) return false;
  if (alert.date_min && deal.date_out && deal.date_out < alert.date_min) return false;
  if (alert.date_max && deal.date_out && deal.date_out > alert.date_max) return false;
  return true;
}
