/**
 * kv_store.ts — SSS388 (21 may 2026)
 *
 * Abstracción persistencia clave-valor con fallback gradiente:
 *  1) Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *  2) Vercel KV (KV_REST_API_URL + KV_REST_API_TOKEN — alias Upstash)
 *  3) In-memory Map (warm container persist sólo)
 *
 * Resuelve OPS-1 HIGH del audit SSS383: stores in-memory pierden data
 * al deploy. Cuando el operator añade env vars Upstash, los stores
 * persisten cross-deploy automáticamente sin cambiar callers.
 *
 * API:
 *   const store = createKV("namespace");
 *   await store.set("key", value, ttlSeconds?);
 *   const v = await store.get<T>("key");
 *   await store.del("key");
 *   await store.incr("counter");
 *   const items = await store.scan("prefix*", limit?);
 *
 * Pure subset compatible con Upstash REST + in-mem fallback. Tipos
 * narrow (no Pipeline, no transactions) — extender si lo necesitas.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export type KVValue = string | number | boolean | object | null;

export interface KVStore {
  namespace: string;
  isPersistent: boolean;
  get<T = KVValue>(key: string): Promise<T | null>;
  set(key: string, value: KVValue, ttlSeconds?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  incr(key: string, by?: number): Promise<number>;
  scan(prefix: string, limit?: number): Promise<string[]>;
  size(): Promise<number>;
}

// ──────────────────────────────────────────────────────────────
// IN-MEMORY FALLBACK (globalThis persistence cross-request warm container)

interface MemEntry {
  value: KVValue;
  expiresAt?: number;
}

const memStores: Map<string, Map<string, MemEntry>> = (
  globalThis as unknown as { __tc_kv_stores?: Map<string, Map<string, MemEntry>> }
).__tc_kv_stores ?? new Map();
(globalThis as unknown as { __tc_kv_stores: Map<string, Map<string, MemEntry>> }).__tc_kv_stores =
  memStores;

function getMemStore(ns: string): Map<string, MemEntry> {
  let m = memStores.get(ns);
  if (!m) {
    m = new Map();
    memStores.set(ns, m);
  }
  return m;
}

class InMemoryKV implements KVStore {
  namespace: string;
  isPersistent = false;
  private store: Map<string, MemEntry>;

  constructor(ns: string) {
    this.namespace = ns;
    this.store = getMemStore(ns);
  }

  private isExpired(entry: MemEntry): boolean {
    return !!entry.expiresAt && entry.expiresAt < Date.now();
  }

  async get<T = KVValue>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: KVValue, ttlSeconds?: number): Promise<boolean> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async incr(key: string, by = 1): Promise<number> {
    const cur = await this.get<number>(key);
    const next = (typeof cur === "number" ? cur : 0) + by;
    await this.set(key, next);
    return next;
  }

  async scan(prefix: string, limit = 100): Promise<string[]> {
    const out: string[] = [];
    const cleanPrefix = prefix.replace(/\*$/, "");
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(cleanPrefix)) {
        const entry = this.store.get(key)!;
        if (!this.isExpired(entry)) {
          out.push(key);
          if (out.length >= limit) break;
        } else {
          this.store.delete(key);
        }
      }
    }
    return out;
  }

  async size(): Promise<number> {
    return this.store.size;
  }
}

// ──────────────────────────────────────────────────────────────
// UPSTASH REST CLIENT (Vercel KV alias)

async function upstashCall(
  command: string[],
  expectError = false,
): Promise<unknown> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error("upstash_not_configured");
  }
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok && !expectError) {
    throw new Error(`upstash_${res.status}`);
  }
  const data = await res.json();
  return data?.result ?? null;
}

class UpstashKV implements KVStore {
  namespace: string;
  isPersistent = true;

  constructor(ns: string) {
    this.namespace = ns;
  }

  private k(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T = KVValue>(key: string): Promise<T | null> {
    try {
      const raw = (await upstashCall(["GET", this.k(key)])) as string | null;
      if (raw === null || raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return null;
    }
  }

  async set(key: string, value: KVValue, ttlSeconds?: number): Promise<boolean> {
    try {
      const payload = JSON.stringify(value);
      const cmd = ttlSeconds
        ? ["SET", this.k(key), payload, "EX", String(ttlSeconds)]
        : ["SET", this.k(key), payload];
      const r = (await upstashCall(cmd)) as string | null;
      return r === "OK";
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const r = (await upstashCall(["DEL", this.k(key)])) as number;
      return r > 0;
    } catch {
      return false;
    }
  }

  async incr(key: string, by = 1): Promise<number> {
    try {
      const r = (await upstashCall(["INCRBY", this.k(key), String(by)])) as number;
      return r;
    } catch {
      return 0;
    }
  }

  async scan(prefix: string, limit = 100): Promise<string[]> {
    try {
      const pattern = `${this.k(prefix)}*`.replace(/\*+$/, "*");
      const r = (await upstashCall([
        "SCAN",
        "0",
        "MATCH",
        pattern,
        "COUNT",
        String(limit),
      ])) as [string, string[]];
      // Strip namespace prefix
      return (r?.[1] || []).map((k) => k.replace(`${this.namespace}:`, ""));
    } catch {
      return [];
    }
  }

  async size(): Promise<number> {
    const keys = await this.scan("", 10000);
    return keys.length;
  }
}

// ──────────────────────────────────────────────────────────────
// FACTORY

const cache = new Map<string, KVStore>();

export function createKV(namespace: string): KVStore {
  if (cache.has(namespace)) return cache.get(namespace)!;
  const useUpstash = !!UPSTASH_URL && !!UPSTASH_TOKEN;
  const store = useUpstash ? new UpstashKV(namespace) : new InMemoryKV(namespace);
  cache.set(namespace, store);
  return store;
}

/** Test-only reset */
export function __resetKVForTests(): void {
  cache.clear();
  memStores.clear();
}

export const __kv_internal = {
  isUpstashConfigured: () => !!UPSTASH_URL && !!UPSTASH_TOKEN,
};
