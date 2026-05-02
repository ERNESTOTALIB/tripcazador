/**
 * subscribers_store.ts — fase ss-SS2
 *
 * Store en memoria + opcionalmente persistente (filesystem en dev / KV
 * en prod via env SUBSCRIBERS_STORE_URL) para tracking del drip newsletter
 * sin requerir Postgres directo desde Vercel Edge.
 *
 * En prod (Vercel), usamos un endpoint del backend FastAPI cuando
 * SUBSCRIBERS_STORE_URL está configurado. Si no está, fallback in-memory
 * por proceso (suficiente para tracking de drip mientras no haya volumen).
 *
 * Modelo:
 *   Subscriber {
 *     email: string (PK normalized lowercase)
 *     created_at: number (epoch ms)
 *     drip_stage: 0..5 (0 = welcome pendiente, 5 = drip completo)
 *     last_sent_at: number | null
 *     unsubscribed_at: number | null
 *     consent_ts: number
 *     source: "home" | "blog" | "lead-magnet" | etc.
 *     locale: "es" | "en"
 *   }
 */

export interface Subscriber {
  email: string;
  created_at: number;
  drip_stage: number;
  last_sent_at: number | null;
  unsubscribed_at: number | null;
  consent_ts: number;
  source: string;
  locale: string;
}

// In-memory fallback. Vercel reinicia procesos pero esto sirve durante la
// vida del proceso para tests + dev. El Source of Truth real va via API
// remoto cuando SUBSCRIBERS_STORE_URL está set.
const memoryStore: Map<string, Subscriber> = new Map();

const REMOTE_URL = process.env.SUBSCRIBERS_STORE_URL || "";
const REMOTE_TOKEN = process.env.SUBSCRIBERS_STORE_TOKEN || "";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function remotePost(path: string, body: unknown): Promise<Response | null> {
  if (!REMOTE_URL || !REMOTE_TOKEN) return null;
  try {
    return await fetch(`${REMOTE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REMOTE_TOKEN}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

async function remoteGet(path: string): Promise<Response | null> {
  if (!REMOTE_URL || !REMOTE_TOKEN) return null;
  try {
    return await fetch(`${REMOTE_URL}${path}`, {
      headers: { Authorization: `Bearer ${REMOTE_TOKEN}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function addSubscriber(input: {
  email: string;
  source?: string;
  locale?: string;
}): Promise<{ ok: boolean; created: boolean; subscriber: Subscriber }> {
  const email = normalizeEmail(input.email);
  const now = Date.now();
  const sub: Subscriber = {
    email,
    created_at: now,
    drip_stage: 0,
    last_sent_at: null,
    unsubscribed_at: null,
    consent_ts: now,
    source: input.source || "unknown",
    locale: input.locale || "es",
  };

  // Intento remoto primero
  const remote = await remotePost("/subscribers", sub);
  if (remote && remote.ok) {
    const data = (await remote.json().catch(() => ({}))) as Partial<{
      created: boolean;
      subscriber: Subscriber;
    }>;
    return {
      ok: true,
      created: data.created ?? true,
      subscriber: data.subscriber ?? sub,
    };
  }

  // Fallback memory
  const existing = memoryStore.get(email);
  if (existing) {
    return { ok: true, created: false, subscriber: existing };
  }
  memoryStore.set(email, sub);
  return { ok: true, created: true, subscriber: sub };
}

export async function listPendingDrip(now: number = Date.now()): Promise<Subscriber[]> {
  const remote = await remoteGet("/subscribers/pending-drip");
  if (remote && remote.ok) {
    return (await remote.json().catch(() => [])) as Subscriber[];
  }

  const STAGE_DAYS = [0, 1, 3, 5, 7];
  return Array.from(memoryStore.values()).filter((s) => {
    if (s.unsubscribed_at) return false;
    if (s.drip_stage >= 5) return false;
    const ageDays = (now - s.created_at) / 86_400_000;
    return ageDays >= STAGE_DAYS[s.drip_stage];
  });
}

export async function bumpStage(email: string): Promise<void> {
  const remote = await remotePost("/subscribers/bump-stage", { email });
  if (remote && remote.ok) return;

  const sub = memoryStore.get(normalizeEmail(email));
  if (sub) {
    sub.drip_stage += 1;
    sub.last_sent_at = Date.now();
  }
}

export async function unsubscribe(email: string): Promise<void> {
  const remote = await remotePost("/subscribers/unsubscribe", { email });
  if (remote && remote.ok) return;

  const sub = memoryStore.get(normalizeEmail(email));
  if (sub) sub.unsubscribed_at = Date.now();
}

// Util test-only: limpia el store en memoria.
export function _clearStore(): void {
  memoryStore.clear();
}
