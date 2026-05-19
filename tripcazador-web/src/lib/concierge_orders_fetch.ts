/**
 * concierge_orders_fetch.ts — SSS328 (19 may 2026)
 *
 * Wrapper server-side para llamar al backend FastAPI
 * /api/admin/concierge/orders y filtrar por email para el customer
 * portal. Sanitiza los pedidos quitando campos internos antes de
 * devolverlos al cliente.
 *
 * Pure function side — depende solo de env vars (ADMIN_TOKEN,
 * NEXT_PUBLIC_API_URL) y fetch.
 */

import type { ConciergeTier } from "./concierge_tiers";

export interface BackendConciergeOrder {
  id: string;
  email: string;
  status: "pending" | "in_progress" | "delivered" | "refunded";
  createdAt: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to?: string;
  flex_days: number;
  budget: number;
  travelers: number;
  hotel_stars: number;
  notes?: string;
  amount_paid_eur: number;
  stripe_session_id?: string;
  delivered_at?: string;
  tier?: ConciergeTier;
  /** SSS328: contenido del plan entregado (cuando status=delivered) */
  deliverable_markdown?: string;
}

export interface CustomerVisibleOrder {
  id: string;
  status: BackendConciergeOrder["status"];
  status_label: string;
  createdAt: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to?: string;
  travelers: number;
  amount_paid_eur: number;
  tier?: ConciergeTier;
  delivered_at?: string;
  deliverable_markdown?: string;
}

const STATUS_LABEL: Record<BackendConciergeOrder["status"], string> = {
  pending: "Recibido — empezamos en breve",
  in_progress: "Buscando tu mejor opción",
  delivered: "Entregado — revisa tu email",
  refunded: "Reembolsado",
};

/**
 * Sanitiza un pedido backend a la forma "customer-visible".
 * No expose: email (el portal ya está protegido por token de ese email),
 * stripe_session_id, notes internas, hotel_stars + flex_days + budget
 * (porque son datos que el user ya conoce, no aportan nada listado).
 */
export function sanitizeForCustomer(o: BackendConciergeOrder): CustomerVisibleOrder {
  return {
    id: o.id,
    status: o.status,
    status_label: STATUS_LABEL[o.status] || o.status,
    createdAt: o.createdAt,
    origin: o.origin,
    destination: o.destination,
    date_from: o.date_from,
    date_to: o.date_to,
    travelers: o.travelers,
    amount_paid_eur: o.amount_paid_eur,
    tier: o.tier,
    delivered_at: o.delivered_at,
    deliverable_markdown: o.deliverable_markdown,
  };
}

export async function fetchOrdersByEmail(
  email: string,
): Promise<CustomerVisibleOrder[]> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const adminToken = process.env.ADMIN_TOKEN || "";
  if (!backendUrl || !adminToken) return [];
  if (!email) return [];

  const norm = email.trim().toLowerCase();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${backendUrl}/api/admin/concierge/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as
      | { orders?: BackendConciergeOrder[] }
      | BackendConciergeOrder[]
      | null;
    const arr = Array.isArray(data) ? data : data?.orders || [];
    return arr
      .filter((o) => (o.email || "").trim().toLowerCase() === norm)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .map(sanitizeForCustomer);
  } catch {
    return [];
  }
}

/**
 * Comprueba si existen pedidos para un email sin devolverlos
 * (para el endpoint request-access sin revelar la cuenta).
 */
export async function hasOrdersForEmail(email: string): Promise<boolean> {
  const list = await fetchOrdersByEmail(email);
  return list.length > 0;
}
