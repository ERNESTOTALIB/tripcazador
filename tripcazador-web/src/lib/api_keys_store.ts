/**
 * api_keys_store.ts — SSS363 (21 may 2026)
 *
 * Store de API keys para clientes que pagan acceso a /api/v1/*.
 *
 * Key format: `tck_live_xxxxxxxxxxxxxxxx` (24 chars random base32).
 * Almacenado HASHED (sha-256) — el plain key solo se muestra una vez al crear.
 *
 * Tiers:
 *   - free: 100 req/día, deals last 24h only
 *   - starter (€99/mo): 1000 req/día, deals last 7d
 *   - pro (€299/mo): 10000 req/día, deals last 30d + filters
 *   - enterprise (€999/mo): 100000 req/día, all data + webhook push
 */

import crypto from "crypto";

export type ApiKeyTier = "free" | "starter" | "pro" | "enterprise";

export interface ApiKey {
  id: string;
  key_hash: string;
  key_prefix: string; // "tck_live_abcd1234" (primeros 16 chars para display)
  owner_email: string;
  tier: ApiKeyTier;
  active: boolean;
  created_at: number;
  last_used_at?: number;
  total_requests: number;
  stripe_subscription_id?: string;
}

const RATE_LIMITS: Record<ApiKeyTier, { reqPerDay: number; deals_lookback_hours: number }> = {
  free: { reqPerDay: 100, deals_lookback_hours: 24 },
  starter: { reqPerDay: 1000, deals_lookback_hours: 24 * 7 },
  pro: { reqPerDay: 10_000, deals_lookback_hours: 24 * 30 },
  enterprise: { reqPerDay: 100_000, deals_lookback_hours: 365 * 24 },
};

export function getTierLimits(tier: ApiKeyTier) {
  return RATE_LIMITS[tier];
}

const store: { keys: ApiKey[] } = (
  globalThis as unknown as { __tc_api_keys?: { keys: ApiKey[] } }
).__tc_api_keys ?? { keys: [] };
(globalThis as unknown as { __tc_api_keys: typeof store }).__tc_api_keys = store;

// Counter rate per key
const rateCounters: Map<string, { day: string; count: number }> = (
  globalThis as unknown as {
    __tc_api_rate?: Map<string, { day: string; count: number }>;
  }
).__tc_api_rate ?? new Map();
(globalThis as unknown as {
  __tc_api_rate: Map<string, { day: string; count: number }>;
}).__tc_api_rate = rateCounters;

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Genera nueva API key. Devuelve el plain key UNA VEZ — luego solo hash.
 */
export function createApiKey(opts: {
  owner_email: string;
  tier: ApiKeyTier;
  stripe_subscription_id?: string;
}): { id: string; plain_key: string; prefix: string } {
  const rand = crypto.randomBytes(18).toString("base64url").slice(0, 24);
  const plainKey = `tck_live_${rand}`;
  const hash = hashKey(plainKey);
  const prefix = plainKey.slice(0, 16);
  const id = crypto.randomBytes(8).toString("hex");

  store.keys.push({
    id,
    key_hash: hash,
    key_prefix: prefix,
    owner_email: opts.owner_email,
    tier: opts.tier,
    active: true,
    created_at: Date.now(),
    total_requests: 0,
    stripe_subscription_id: opts.stripe_subscription_id,
  });

  return { id, plain_key: plainKey, prefix };
}

export function verifyApiKey(plainKey: string): ApiKey | null {
  if (!plainKey.startsWith("tck_")) return null;
  const hash = hashKey(plainKey);
  const found = store.keys.find((k) => k.key_hash === hash && k.active);
  return found ?? null;
}

export function checkRateLimit(keyId: string, tier: ApiKeyTier): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const limits = RATE_LIMITS[tier];
  const day = todayKey();
  const counter = rateCounters.get(keyId);
  if (!counter || counter.day !== day) {
    rateCounters.set(keyId, { day, count: 1 });
    return { allowed: true, remaining: limits.reqPerDay - 1, limit: limits.reqPerDay };
  }
  if (counter.count >= limits.reqPerDay) {
    return { allowed: false, remaining: 0, limit: limits.reqPerDay };
  }
  counter.count += 1;
  return {
    allowed: true,
    remaining: limits.reqPerDay - counter.count,
    limit: limits.reqPerDay,
  };
}

export function listKeysByOwner(ownerEmail: string): ApiKey[] {
  return store.keys
    .filter((k) => k.owner_email === ownerEmail)
    .map((k) => ({ ...k })); // shallow clone
}

export function revokeKey(id: string): boolean {
  const key = store.keys.find((k) => k.id === id);
  if (!key) return false;
  key.active = false;
  return true;
}

export function recordUse(keyId: string): void {
  const key = store.keys.find((k) => k.id === keyId);
  if (key) {
    key.total_requests += 1;
    key.last_used_at = Date.now();
  }
}

export function _clearStore(): void {
  store.keys.length = 0;
  rateCounters.clear();
}
