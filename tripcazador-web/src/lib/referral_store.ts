/**
 * referral_store.ts — SSS320 (19 may 2026)
 *
 * Programa de referral Premium "trae amigo → 1 mes gratis ambos".
 *
 * Cada Premium tiene un código único derivable de su customerId
 * (no random — así sigue siendo determinista incluso si reseteamos
 * memoria). El amigo entra con ?ref=CODE → cuando se suscribe Premium
 * registramos la pareja (referrer, referred) y ambos quedan
 * elegibles para 30 días de extensión gratis.
 *
 * La extensión efectiva en Stripe la hacemos manualmente vía portal/
 * coupon — esto es operacional. Aquí solo tracker el referral.
 *
 * Anti-fraud:
 *  - Un customerId no puede ser referido más de 1 vez.
 *  - Un customerId no puede referirse a sí mismo.
 *  - Cap 20 referrals válidos por customerId (no spam viral).
 *  - Referral entry idempotente: si ya existe (referrer+referred) no
 *    duplicamos.
 */

import { isValidStripeOwnerId } from "./stripe_id";

export interface Referral {
  id: string;
  referrer_customer_id: string; // quién compartió
  referred_customer_id: string; // quién se suscribió usando el code
  code: string; // ref code usado
  ts: number;
  rewarded_at: number | null; // cuando se procesó la extensión Stripe
}

export class ReferralError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "ReferralError";
  }
}

export const REFERRAL_CAP_PER_CUSTOMER = 20;

const memoryStore: Map<string, Referral> = new Map();
const REMOTE_URL = process.env.REFERRAL_STORE_URL || "";
const REMOTE_TOKEN = process.env.REFERRAL_STORE_TOKEN || "";

/**
 * Deriva un código corto y memorable a partir del customerId Stripe.
 * No es reversible — solo es un hash determinista, suficiente para
 * la URL (`?ref=TC-XXXXXX`). El backend hace la búsqueda reversa via
 * customerIdFromCode().
 *
 * Convención: 8 chars alfanuméricos en mayúscula prefijados con "TC-".
 */
export function deriveCodeFromCustomer(customerId: string): string {
  if (!isValidStripeOwnerId(customerId)) {
    throw new ReferralError("customer_id_invalid");
  }
  // Simple djb2 hash → base36 → padded a 8 chars
  let h = 5381;
  for (let i = 0; i < customerId.length; i++) {
    h = ((h << 5) + h + customerId.charCodeAt(i)) & 0xffffffff;
  }
  const positive = h < 0 ? h + 0x100000000 : h;
  const base = positive.toString(36).toUpperCase().padStart(8, "0").slice(-8);
  return `TC-${base}`;
}

/**
 * Reverse lookup: dado un código, devuelve el customerId que lo generó.
 * Si no encuentra match (código pirata / no existe en nuestros records),
 * devuelve null.
 *
 * Nota: en v1 los códigos no se persisten en sí mismos — confiamos en
 * la derivación determinista. El customerId del referrer debe pasarse
 * separadamente al redeem() porque el frontend lo conoce.
 */
export function isValidCodeFormat(code: string): boolean {
  return /^TC-[0-9A-Z]{8}$/.test(code);
}

async function remote(
  method: "POST" | "GET",
  path: string,
  body?: unknown,
): Promise<Response | null> {
  if (!REMOTE_URL || !REMOTE_TOKEN) return null;
  try {
    return await fetch(`${REMOTE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REMOTE_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

function genId(): string {
  return `rf_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface RedeemReferralInput {
  referrer_customer_id: string;
  referred_customer_id: string;
  code: string;
}

export async function redeemReferral(
  input: RedeemReferralInput,
): Promise<Referral> {
  if (!isValidStripeOwnerId(input.referrer_customer_id)) {
    throw new ReferralError("referrer_invalid");
  }
  if (!isValidStripeOwnerId(input.referred_customer_id)) {
    throw new ReferralError("referred_invalid");
  }
  if (!isValidCodeFormat(input.code)) {
    throw new ReferralError("code_invalid");
  }
  if (input.referrer_customer_id === input.referred_customer_id) {
    throw new ReferralError("self_referral_forbidden");
  }
  // Verificar que el código coincide con el referrer
  const expected = deriveCodeFromCustomer(input.referrer_customer_id);
  if (expected !== input.code) {
    throw new ReferralError("code_mismatch");
  }

  // Anti-fraud: 1 customer no puede ser referido más de 1 vez
  const existing = await listReferralsByReferred(input.referred_customer_id);
  if (existing.length > 0) {
    throw new ReferralError("referred_already_used");
  }

  // Anti-fraud: cap por referrer
  const referrerRefs = await listReferralsByReferrer(input.referrer_customer_id);
  if (referrerRefs.length >= REFERRAL_CAP_PER_CUSTOMER) {
    throw new ReferralError("referrer_cap_reached");
  }

  const entry: Referral = {
    id: genId(),
    referrer_customer_id: input.referrer_customer_id,
    referred_customer_id: input.referred_customer_id,
    code: input.code,
    ts: Date.now(),
    rewarded_at: null,
  };

  const r = await remote("POST", "/referrals", entry);
  if (r && r.ok) {
    return ((await r.json().catch(() => entry)) as Referral) || entry;
  }
  memoryStore.set(entry.id, entry);
  return entry;
}

export async function listReferralsByReferrer(customerId: string): Promise<Referral[]> {
  if (!customerId) return [];
  const r = await remote("GET", `/referrals/by-referrer/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as Referral[];
  }
  return Array.from(memoryStore.values()).filter(
    (x) => x.referrer_customer_id === customerId,
  );
}

export async function listReferralsByReferred(customerId: string): Promise<Referral[]> {
  if (!customerId) return [];
  const r = await remote("GET", `/referrals/by-referred/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as Referral[];
  }
  return Array.from(memoryStore.values()).filter(
    (x) => x.referred_customer_id === customerId,
  );
}

export function _clearStore(): void {
  memoryStore.clear();
}
