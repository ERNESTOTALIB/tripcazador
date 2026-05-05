import { NextRequest, NextResponse } from "next/server";
import { pushSample } from "@/lib/vitals_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/web-vitals — fase SSS64 (May 2026)
 *
 * Recibe Core Web Vitals desde el cliente (WebVitalsReporter) y los
 * persiste en un ring buffer in-memory (igual que event_store) para que
 * /api/admin/vitals agregue p75 por página sin depender de GA4 API.
 *
 * Acepta sendBeacon → POST con JSON:
 *   { name, value, rating, page_path, navigation_type, id }
 *
 * Rate limit: 50 reqs/min/IP (más permisivo que /api/track porque cada
 * pageview emite 5+ métricas).
 *
 * SSS73 (May 2026): el store y getVitalsSamples se movieron a
 * `lib/vitals_store.ts` porque Next.js 14 no permite exports adicionales
 * en archivos route.ts (solo HTTP verbs + segment config como `runtime`).
 */

const VALID_NAMES = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);
const RATE_LIMIT = 50;
const RATE_WINDOW_MS = 60_000;
const rate = new Map<string, { count: number; windowStart: number }>();

function getIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();
  const r = rate.get(ip);
  if (r && now - r.windowStart < RATE_WINDOW_MS) {
    if (r.count >= RATE_LIMIT) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429 });
    }
    r.count++;
  } else {
    rate.set(ip, { count: 1, windowStart: now });
  }

  let body: { name?: string; value?: number; rating?: string; page_path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const name = String(body.name || "");
  if (!VALID_NAMES.has(name)) {
    return NextResponse.json({ error: "invalid metric" }, { status: 400 });
  }
  const value = typeof body.value === "number" ? body.value : NaN;
  if (!Number.isFinite(value) || value < 0) {
    return NextResponse.json({ error: "invalid value" }, { status: 400 });
  }
  // Path: sólo pathname, max 200 chars, sin query
  let path = String(body.page_path || "/").slice(0, 200);
  if (path.includes("?")) path = path.split("?")[0];
  const rating = String(body.rating || "unknown").slice(0, 32);

  // Hash anónimo IP+UA para deduplicar samples por sesión
  const ua = req.headers.get("user-agent") || "";
  const visitorHash = await hash16(ip + ua);

  pushSample({
    ts: now,
    name,
    value,
    rating,
    page_path: path,
    visitor_hash: visitorHash,
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}

async function hash16(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
