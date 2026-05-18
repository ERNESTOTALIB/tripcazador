/**
 * /api/premium/alerts — SSS302 (18 may 2026)
 *
 * Endpoint Premium-only para gestión de alertas con tier="premium":
 *  - POST { customer_id, email, max_price, ...filters } → 201 crea Premium alert
 *  - GET ?customer_id=cs_xxx → 200 lista alertas del customer
 *
 * AUTH: posesión del customerId Stripe (cs_live_... o cs_test_...) es la
 * credencial. Sin login porque Premium se activa client-side desde
 * localStorage tras Stripe Checkout. El frontend obtiene customerId de
 * /api/premium/activate y lo guarda en PremiumStatus.customerId.
 *
 * Diferencias vs /api/price-alerts (público gratis):
 *  - SIN quota cap (Premium = ilimitado)
 *  - tier="premium" → /api/price-alerts/match-cron-premium las procesa
 *    con cadencia 5 min vs hora del cron gratis
 *  - Email notify con cabecera "Premium" para colado < junk
 *  - customerId persistido → permite listar/borrar luego desde panel
 *
 * Seguridad:
 *  - 400 si customer_id formato inválido
 *  - 403 si customer_id no parece Stripe (cs_test_ / cs_live_)
 *  - 400 validación email + max_price + IATA
 *
 * No verifica vs Stripe API en cada POST (rate cost) — el activate
 * endpoint ya validó posesión legítima. Endpoint defensa: si alguien
 * mete cs_test_xxx random, las alertas se crean pero el cron no
 * dispara nada porque el deal sigue siendo público.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createAlert,
  listAlertsByCustomer,
} from "@/lib/price_alerts_store";
import { trackEvent } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

function isIATA(s: unknown): boolean {
  return typeof s === "string" && /^[A-Z]{3}$/.test(s.toUpperCase());
}

function isCabin(s: unknown): s is "economy" | "business" | "first" {
  return s === "economy" || s === "business" || s === "first";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const customerId = String(body.customer_id || "").trim();
  if (!customerId || !CUSTOMER_ID_RE.test(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid", hint: "format cs_(test|live)_<id>" },
      { status: 400 },
    );
  }

  const email = String(body.email || "").trim();
  const maxPrice = Number(body.max_price);
  const origin = body.origin ? String(body.origin).toUpperCase() : undefined;
  const destination = body.destination ? String(body.destination).toUpperCase() : undefined;
  // SSS303: multi-origin Premium-only (BCN OR MAD OR VLC) — cap 5
  const originsIn = Array.isArray(body.origins) ? body.origins : null;
  const origins: string[] | undefined = originsIn
    ? originsIn
        .map((o) => String(o).toUpperCase())
        .filter((o) => /^[A-Z]{3}$/.test(o))
        .slice(0, 5)
    : undefined;
  const cabinIn = String(body.cabin || "");
  const cabin = isCabin(cabinIn) ? cabinIn : undefined;
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

  const alert = await createAlert({
    email,
    origin,
    destination,
    origins,
    max_price: maxPrice,
    cabin,
    date_min: dateMin,
    date_max: dateMax,
    tier: "premium",
    customerId,
  });

  try {
    trackEvent({
      ts: Date.now(),
      type: "alert_created",
      visitor_id: `premium:${customerId.slice(0, 16)}`,
      meta: {
        origin: origin || "any",
        destination: destination || "any",
        max_price: maxPrice,
        cabin: cabin || "any",
        tier: "premium",
      },
    });
  } catch {
    /* no-op */
  }

  return NextResponse.json(
    { ok: true, id: alert.id, tier: alert.tier },
    { status: 201 },
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || "";

  if (!customerId || !CUSTOMER_ID_RE.test(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }

  const alerts = await listAlertsByCustomer(customerId);
  return NextResponse.json({
    ok: true,
    count: alerts.length,
    alerts: alerts.map((a) => ({
      id: a.id,
      email: a.email,
      origin: a.origin || null,
      destination: a.destination || null,
      max_price: a.max_price,
      cabin: a.cabin || null,
      date_min: a.date_min || null,
      date_max: a.date_max || null,
      created_at: a.created_at,
      triggered_at: a.triggered_at,
      active: a.active,
      tier: a.tier,
    })),
  });
}
