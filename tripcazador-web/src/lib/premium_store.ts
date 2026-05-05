/**
 * premium_store.ts — fase SSS73 (May 2026)
 *
 * Store in-memory para suscripciones premium (Stripe webhook). Extraído del
 * route handler `/api/premium/webhook/route.ts` porque Next.js 14 no permite
 * exports adicionales en archivos route.ts (solo HTTP verbs + segment config),
 * lo que rompía el build con:
 *   "getPremiumByEmail" is not a valid Route export field.
 *
 * Persistencia: in-memory + globalThis para sobrevivir hot reloads en dev.
 * En prod (multi-instancia) cada lambda tendrá su propio store; aceptable
 * mientras el volumen sea bajo. Próximo paso: persistir a JSONL backend.
 */

export interface PremiumStateEntry {
  email: string;
  customer_id: string;
  subscription_id?: string;
  active: boolean;
  expires_at?: number;
  source: "stripe";
  updated_at: number;
}

const store: { entries: PremiumStateEntry[] } = (
  globalThis as unknown as { __tc_premium_store?: { entries: PremiumStateEntry[] } }
).__tc_premium_store ?? { entries: [] };

(globalThis as unknown as { __tc_premium_store: typeof store }).__tc_premium_store = store;

export function upsertPremium(entry: PremiumStateEntry): void {
  const idx = store.entries.findIndex(
    (e) => e.email === entry.email || e.customer_id === entry.customer_id,
  );
  if (idx >= 0) {
    store.entries[idx] = { ...store.entries[idx], ...entry };
  } else {
    store.entries.push(entry);
  }
}

export function deactivateByCustomerId(customerId: string): void {
  const idx = store.entries.findIndex((e) => e.customer_id === customerId);
  if (idx >= 0) {
    store.entries[idx] = { ...store.entries[idx], active: false, updated_at: Date.now() };
  }
}

export function getPremiumByEmail(email: string): PremiumStateEntry | null {
  return store.entries.find((e) => e.email === email && e.active) ?? null;
}
