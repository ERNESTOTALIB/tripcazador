/**
 * concierge_orders_kv.ts — AUDIT-WEB FIX-CQ-H2 (31 may 2026)
 *
 * Persistencia KV de pedidos /concierge para que el customer portal
 * /concierge/mis-pedidos pueda mostrar el histórico al cliente.
 *
 * Reemplaza la ruta vía backend FastAPI VPS (muerto desde 18 may). El
 * webhook de Stripe guarda aquí cuando `checkout.session.completed` con
 * tier concierge. El portal lee con `fetchOrdersByEmail`.
 *
 * KV con in-memory fallback (kv_store) — funciona Upstash configurado
 * o no. Sin Upstash, persiste solo dentro de la lambda warm (suficiente
 * para el patrón paga → email → click portal en <1h).
 */

import { createKV } from "./kv_store";
import type { ConciergeOrder } from "./concierge_store";

const kv = createKV("concierge_orders");

// Index: list of order IDs por email lowercased.
const emailIdx = createKV("concierge_orders_by_email");

function emailKey(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Persistir un nuevo order. Se llama desde el webhook Stripe.
 */
export async function saveConciergeOrderKv(
  order: ConciergeOrder,
): Promise<void> {
  await kv.set(order.id, order);

  // Mantener índice por email para lookups O(1).
  const ek = emailKey(order.email);
  const existing = (await emailIdx.get<string[]>(ek)) || [];
  if (!existing.includes(order.id)) {
    existing.unshift(order.id); // más reciente primero
    // Limita 200 orders por email para evitar growth ilimitado.
    await emailIdx.set(ek, existing.slice(0, 200));
  }
}

/**
 * Lookup orders por email (lowercased, trim).
 */
export async function fetchConciergeOrdersByEmailKv(
  email: string,
): Promise<ConciergeOrder[]> {
  if (!email) return [];
  const ek = emailKey(email);
  const ids = (await emailIdx.get<string[]>(ek)) || [];
  if (!ids.length) return [];

  const orders: ConciergeOrder[] = [];
  for (const id of ids) {
    const o = await kv.get<ConciergeOrder>(id);
    if (o) orders.push(o);
  }
  return orders.sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""),
  );
}

/**
 * Marcar un order como delivered (admin tool). Actualiza el record en KV.
 */
export async function markConciergeOrderDeliveredKv(
  orderId: string,
  deliverable_markdown?: string,
): Promise<boolean> {
  const o = await kv.get<ConciergeOrder>(orderId);
  if (!o) return false;
  const updated: ConciergeOrder & { deliverable_markdown?: string } = {
    ...o,
    status: "delivered",
    delivered_at: new Date().toISOString(),
    ...(deliverable_markdown ? { deliverable_markdown } : {}),
  };
  await kv.set(orderId, updated);
  return true;
}

/**
 * Test helper — limpia el namespace. NO usar en producción.
 */
export async function __clearConciergeOrdersKvForTests(): Promise<void> {
  const ids = await kv.scan("");
  for (const id of ids) await kv.del(id);
  const ekeys = await emailIdx.scan("");
  for (const k of ekeys) await emailIdx.del(k);
}
