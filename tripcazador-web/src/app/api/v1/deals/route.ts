/**
 * Public API v1 — B10 (May 2026)
 *
 * GET /api/v1/deals
 *
 * Auth: Bearer API key (TC-XXXX-XXXX format).
 *   - Free tier: 100 req/día por API key
 *   - Paid tier (futuro): bypass rate limit
 *
 * Query params:
 *   - origin (IATA): filter
 *   - destination (IATA): filter
 *   - max_price (EUR): filter
 *   - limit (max 100, default 30)
 *
 * Response: { deals, count, generated_at, attribution }
 *
 * Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 */
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_SECRET = process.env.PUBLIC_API_SECRET || "tripcazador-api-secret-may-2026";
const FREE_DAILY = 100;
const counter = new Map<string, { count: number; reset: number }>();

function verifyApiKey(key: string): { valid: boolean; tier: "free" | "paid"; client_id?: string } {
  // Format: TC-API-{client_id}-{HMAC8}-{tier}
  const m = key.match(/^TC-API-([A-Za-z0-9_-]{4,32})-([0-9a-f]{8})-(free|paid)$/);
  if (!m) return { valid: false, tier: "free" };
  const [, clientId, sig, tier] = m;
  const expected = createHmac("sha256", API_SECRET).update(`${clientId}:${tier}`).digest("hex").slice(0, 8);
  try {
    if (sig.length !== expected.length) return { valid: false, tier: "free" };
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return { valid: false, tier: "free" };
    return { valid: true, tier: tier as "free" | "paid", client_id: clientId };
  } catch {
    return { valid: false, tier: "free" };
  }
}

function checkRateLimit(clientId: string, tier: "free" | "paid"): { ok: boolean; remaining: number; reset: number } {
  if (tier === "paid") return { ok: true, remaining: 99999, reset: Date.now() + 86400000 };
  const now = Date.now();
  const entry = counter.get(clientId);
  if (!entry || entry.reset < now) {
    const fresh = { count: 1, reset: now + 86400000 };
    counter.set(clientId, fresh);
    return { ok: true, remaining: FREE_DAILY - 1, reset: fresh.reset };
  }
  if (entry.count >= FREE_DAILY) return { ok: false, remaining: 0, reset: entry.reset };
  entry.count++;
  return { ok: true, remaining: FREE_DAILY - entry.count, reset: entry.reset };
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const key = auth.replace(/^Bearer\s+/i, "").trim();
  if (!key) {
    return NextResponse.json(
      {
        error: "Missing Authorization header",
        docs: "https://tripcazador.com/api",
        signup: "https://tripcazador.com/api/signup",
      },
      { status: 401 },
    );
  }
  const verified = verifyApiKey(key);
  if (!verified.valid || !verified.client_id) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
  }
  const rl = checkRateLimit(verified.client_id, verified.tier);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", reset_at: new Date(rl.reset).toISOString() },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(FREE_DAILY),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(rl.reset / 1000)),
        },
      },
    );
  }

  const url = new URL(req.url);
  const params = new URLSearchParams();
  for (const k of ["origin", "destination", "max_price", "limit"]) {
    const v = url.searchParams.get(k);
    if (v) params.set(k, v);
  }
  if (!params.has("limit")) params.set("limit", "30");

  // Proxy to internal /api/deals (public) — same data, different headers/format
  try {
    const internal = await fetch(`${url.origin}/api/deals?${params.toString()}`, {
      headers: { "User-Agent": "TripCazador-API-v1/1.0" },
    });
    const data = await internal.json();
    return NextResponse.json(
      {
        deals: data?.deals || [],
        count: (data?.deals || []).length,
        generated_at: new Date().toISOString(),
        attribution: "Powered by TripCazador.com — link required when using data publicly",
        license: "CC-BY-4.0",
      },
      {
        headers: {
          "X-RateLimit-Limit": String(verified.tier === "paid" ? 99999 : FREE_DAILY),
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-RateLimit-Reset": String(Math.floor(rl.reset / 1000)),
          "Cache-Control": "private, max-age=60",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (e) {
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
