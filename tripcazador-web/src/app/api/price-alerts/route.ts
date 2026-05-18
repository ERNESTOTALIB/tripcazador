/**
 * /api/price-alerts — fase ss-SS3 (closes #165)
 *
 * Endpoint para crear alertas de precio. PriceAlertModal lo llama desde
 * /deals/[id] con email + max_price + (opcional) origin/destination/cabin.
 *
 * Sin SMTP el alert se persiste pero no envía notificación. Cuando el
 * cron /api/price-alerts/match-cron detecta match, llama a /api/notify-alert
 * que es el que dispara Resend.
 *
 * POST /api/price-alerts
 *   { email, max_price, origin?, destination?, cabin?, date_min?, date_max?, hp? }
 * → 201 { ok: true, id }
 *
 * Rate-limit muy básico por IP (10 alertas/h). HMAC token compartido futuro.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAlert, QuotaExceededError, FREE_TIER_ALERT_QUOTA } from "@/lib/price_alerts_store";
import { trackEvent } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

function isIATA(s: unknown): boolean {
  return typeof s === "string" && /^[A-Z]{3}$/.test(s.toUpperCase());
}

// Rate-limit muy básico
const rate: Map<string, { count: number; window: number }> = (
  globalThis as unknown as { __pa_rate?: Map<string, { count: number; window: number }> }
).__pa_rate ?? new Map();
(globalThis as unknown as { __pa_rate: typeof rate }).__pa_rate = rate;

const RATE_WINDOW_MS = 3_600_000; // 1h
const RATE_LIMIT = 10;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const slot = rate.get(ip);
  if (!slot || now - slot.window > RATE_WINDOW_MS) {
    rate.set(ip, { count: 1, window: now });
    return true;
  }
  if (slot.count >= RATE_LIMIT) return false;
  slot.count += 1;
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate_limit" },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (body.hp) {
    // honeypot
    return NextResponse.json({ ok: true, id: "ignored" }, { status: 201 });
  }

  const email = String(body.email || "").trim();
  const maxPrice = Number(body.max_price);
  const origin = body.origin ? String(body.origin).toUpperCase() : undefined;
  const destination = body.destination ? String(body.destination).toUpperCase() : undefined;
  const cabinIn = String(body.cabin || "");
  const cabin = (["economy", "business", "first"] as const).find((c) => c === cabinIn);
  const dateMin = body.date_min ? String(body.date_min) : undefined;
  const dateMax = body.date_max ? String(body.date_max) : undefined;

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }
  if (!Number.isFinite(maxPrice) || maxPrice <= 0 || maxPrice > 50000) {
    return NextResponse.json({ ok: false, error: "max_price_invalid" }, { status: 400 });
  }
  if (origin && !isIATA(origin)) {
    return NextResponse.json({ ok: false, error: "origin_invalid" }, { status: 400 });
  }
  if (destination && !isIATA(destination)) {
    return NextResponse.json({ ok: false, error: "destination_invalid" }, { status: 400 });
  }

  let alert;
  try {
    alert = await createAlert({
      email,
      origin,
      destination,
      max_price: maxPrice,
      cabin,
      date_min: dateMin,
      date_max: dateMax,
      // SSS302: este endpoint público SIEMPRE crea alertas tier="free".
      // Premium debe usar /api/premium/alerts con customerId validado.
      tier: "free",
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          ok: false,
          error: "quota_exceeded",
          limit: FREE_TIER_ALERT_QUOTA,
          current: err.currentCount,
          upgrade_url: "/premium?utm_source=alert_quota",
          message: `Plan gratis máximo ${FREE_TIER_ALERT_QUOTA} alertas. Hazte Premium para ilimitadas.`,
        },
        { status: 402 },
      );
    }
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }

  try {
    trackEvent({
      ts: Date.now(),
      type: "alert_created",
      visitor_id: "price-alert-endpoint",
      meta: {
        origin: origin || "any",
        destination: destination || "any",
        max_price: maxPrice,
        cabin: cabin || "any",
        tier: "free",
      },
    });
  } catch {
    /* no-op */
  }

  return NextResponse.json({ ok: true, id: alert.id, tier: alert.tier }, { status: 201 });
}
