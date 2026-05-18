/**
 * stripe_id.ts — SSS304 (18 may 2026)
 *
 * Validación centralizada de Stripe identifiers para los endpoints Premium.
 *
 * BUG FIX SSS304: SSS302-303 validaba customer_id con
 * /^cs_(test|live)_[A-Za-z0-9]{8,}$/ — pero /api/premium/activate (SSS301)
 * devuelve `customerId = session.customer` que es realmente `cus_xxx`
 * (Stripe Customer ID), NO el Checkout Session ID `cs_xxx`. Resultado:
 * todos los endpoints Premium devolvían 400 customer_id_invalid para
 * usuarios reales con customerId guardado en localStorage.
 *
 * Stripe ID formats reales:
 *  - Customer ID:        cus_<8+ alfanum>   (cus_OdLMNOPQrstuv...)
 *  - Checkout Session:   cs_test_<id> o cs_live_<id>
 *  - Payment Intent:     pi_<8+ alfanum>
 *  - Subscription:       sub_<8+ alfanum>
 *
 * Este módulo es la fuente única de verdad. Validar SIEMPRE con
 * isValidStripeCustomerId() en endpoints que reciben customer_id.
 */

const CUSTOMER_ID_RE = /^cus_[A-Za-z0-9]{8,}$/;
const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;
// Para endpoints que aceptan AMBOS (ej. portal puede tomar session OR customer)
const ANY_STRIPE_OWNER_RE = /^(cus|cs_test|cs_live)_[A-Za-z0-9]{8,}$/;

export function isValidStripeCustomerId(s: unknown): s is string {
  return typeof s === "string" && CUSTOMER_ID_RE.test(s);
}

export function isValidStripeSessionId(s: unknown): s is string {
  return typeof s === "string" && SESSION_ID_RE.test(s);
}

/**
 * SSS304: para tolerar tanto el customer_id como el session_id en endpoints
 * que solo necesitan identificar al dueño (alerts/searches/stats/promo).
 * El frontend puede pasar lo que tenga en localStorage.
 */
export function isValidStripeOwnerId(s: unknown): s is string {
  return typeof s === "string" && ANY_STRIPE_OWNER_RE.test(s);
}

/** Para los regex helpers que necesitan el pattern crudo */
export const STRIPE_OWNER_RE = ANY_STRIPE_OWNER_RE;
export const STRIPE_CUSTOMER_RE = CUSTOMER_ID_RE;
export const STRIPE_SESSION_RE = SESSION_ID_RE;
