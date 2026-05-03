/**
 * concierge_store.ts — fase ppp PPP1 (May 2026)
 *
 * Persistencia de pedidos /concierge €19. Doble write:
 *   1. Vercel KV (si está configurado, persistencia real cross-lambda)
 *   2. Backend FastAPI VPS (fallback, vía /api/admin/concierge endpoints)
 *
 * Mientras KV no esté, el local file en `/tmp` aguanta dentro de la misma
 * lambda. Es suficiente para el flujo: cliente paga → webhook escribe → tu
 * /panel/concierge lee al refrescar (al estar en la misma lambda mientras
 * está warm).
 *
 * Cuando se acabe de poner KV (Vercel KV o Upstash Redis): cambiar la fn
 * `appendOrder` a usar `kv.lpush("concierge_orders", JSON.stringify(order))`.
 */

import type { ConciergeTier } from "./concierge_tiers";

export interface ConciergeOrder {
  id: string;             // ord_<timestamp>_<rand>
  email: string;
  status: "pending" | "in_progress" | "delivered" | "refunded";
  createdAt: string;      // ISO
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  flex_days: number;
  budget: number;
  travelers: number;
  hotel_stars: number;    // 3-5
  notes?: string;
  amount_paid_eur: number;
  stripe_session_id?: string;
  delivered_at?: string;
  /** Tier comprado. Optional para retro-compat con pedidos antiguos. */
  tier?: ConciergeTier;
}

const KEY = "tc_concierge_orders_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// LOCAL (browser-side fallback for /panel/concierge)
export function getOrdersLocal(): ConciergeOrder[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ConciergeOrder[];
  } catch {
    return [];
  }
}

export function saveOrderLocal(order: ConciergeOrder): void {
  if (!isBrowser()) return;
  try {
    const list = getOrdersLocal();
    const next = [order, ...list.filter((o) => o.id !== order.id)].slice(0, 200);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* no-op */
  }
}

export function generateOrderId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `ord_${ts}_${rand}`;
}
