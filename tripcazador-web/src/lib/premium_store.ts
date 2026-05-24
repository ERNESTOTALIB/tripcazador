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
  /** SSS324: marca cuando el user pulsó "cancelar" en Stripe portal — sub
   *  sigue activa hasta cancel_at, después se llamará al webhook
   *  subscription.deleted. Útil para winback "antes de que te vayas". */
  cancel_at?: number;
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

/**
 * SSS324: marca el customer como "cancelará al final del periodo" sin
 * desactivarlo todavía. El user sigue siendo Premium hasta cancel_at.
 * Cuando llegue el momento Stripe emitirá subscription.deleted y el
 * webhook llamará deactivateByCustomerId.
 *
 * SSS329 M2: devuelve boolean indicando si modificó algo. El webhook
 * usa esto para distinguir customers known/unknown y evitar mutar
 * subscriptions ajenas si la Stripe key se reusa con otro producto.
 */
export function markCancelScheduled(customerId: string, cancelAt: number | undefined): boolean {
  const idx = store.entries.findIndex((e) => e.customer_id === customerId);
  if (idx < 0) return false;
  store.entries[idx] = {
    ...store.entries[idx],
    cancel_at: cancelAt,
    updated_at: Date.now(),
  };
  return true;
}

/**
 * SSS324: cuando el user reactiva la sub via portal Stripe
 * (cancel_at_period_end=false), limpiamos cancel_at del store local.
 *
 * SSS329 M2: solo limpia si previamente había cancel_at programado.
 * Esto evita race conditions con eventos subscription.updated benignos
 * (price change, payment method change) que no son reactivaciones reales.
 * Devuelve true si efectivamente limpió un cancel programado.
 */
export function clearCancelScheduled(customerId: string): boolean {
  const idx = store.entries.findIndex((e) => e.customer_id === customerId);
  if (idx < 0) return false;
  const entry = store.entries[idx];
  if (entry.cancel_at === undefined) return false;
  const updated = { ...entry, updated_at: Date.now() } as PremiumStateEntry;
  delete updated.cancel_at;
  store.entries[idx] = updated;
  return true;
}

/** Test-only helper. */
export function _clearStore(): void {
  store.entries.length = 0;
}

export function getPremiumByEmail(email: string): PremiumStateEntry | null {
  return store.entries.find((e) => e.email === email && e.active) ?? null;
}

// AUDIT-FULL-2 (24 may 2026): lookup por customer_id para verificación
// de email en /api/premium/portal (MEDIUM SEC fix).
export function getPremiumByCustomerId(customerId: string): PremiumStateEntry | null {
  return store.entries.find((e) => e.customer_id === customerId && e.active) ?? null;
}

/**
 * SSS340: lista todos los Premium activos — usado por crons de lifecycle
 * (milestone, anniversary, annual upsell). Devuelve snapshot inmutable.
 */
export function listActivePremium(): PremiumStateEntry[] {
  return store.entries.filter((e) => e.active).map((e) => ({ ...e }));
}
