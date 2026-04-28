import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { trackEvent, EventType } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES: EventType[] = [
  "page_view",
  "deal_click",
  "search_submitted",
  "booking_redirect",
  "newsletter_signup",
  "alert_created",
];

// Rate limit muy básico — cada IP máx 200 events/min
const rate = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 200;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function visitorId(req: NextRequest): string {
  const ip = getIp(req);
  const ua = req.headers.get("user-agent") || "";
  return crypto.createHash("sha256").update(ip + ua).digest("hex").slice(0, 16);
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

  let body: { type?: string; meta?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const type = body.type as EventType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  // Sanitizar meta: solo strings/numbers/booleans, max 20 keys, cada string max 200 chars
  const sanitized: Record<string, string | number | boolean> = {};
  let count = 0;
  for (const [k, v] of Object.entries(meta)) {
    if (count >= 20) break;
    if (typeof v === "string" && v.length <= 200) sanitized[k] = v;
    else if (typeof v === "number" && Number.isFinite(v)) sanitized[k] = v;
    else if (typeof v === "boolean") sanitized[k] = v;
    count++;
  }

  trackEvent({
    ts: now,
    type,
    visitor_id: visitorId(req),
    meta: sanitized,
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
