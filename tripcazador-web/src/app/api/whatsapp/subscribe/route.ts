/**
 * /api/whatsapp/subscribe — SSS362
 *
 * Alta de subscriber WhatsApp via UI (formulario en blog post o premium signup).
 * Body: { phone, source?, premium_customer_id? }
 */
import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/whatsapp_broadcaster";
import { upsertSubscriber } from "@/lib/whatsapp_subscribers_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit por IP — 5 req / 10 min
const rateMap: Map<string, number[]> = (
  globalThis as unknown as { __tc_wa_subscribe_rate?: Map<string, number[]> }
).__tc_wa_subscribe_rate ?? new Map();
(globalThis as unknown as { __tc_wa_subscribe_rate: Map<string, number[]> }).__tc_wa_subscribe_rate = rateMap;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 10 * 60_000;
  const hits = (rateMap.get(ip) || []).filter((t) => now - t < window);
  hits.push(now);
  rateMap.set(ip, hits);
  return hits.length > 5;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const phone = normalizePhone(String(body.phone || ""));
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "invalid_phone", hint: "Use formato E.164 sin espacios, ej: +34611223344" },
      { status: 400 },
    );
  }

  const sourceRaw = String(body.source || "blog_cta");
  const source =
    sourceRaw === "premium_signup" || sourceRaw === "blog_cta" ||
    sourceRaw === "telegram_redirect" || sourceRaw === "manual"
      ? sourceRaw
      : "blog_cta";
  const premiumCustomerId = body.premium_customer_id
    ? String(body.premium_customer_id)
    : undefined;

  const sub = upsertSubscriber(phone, source, premiumCustomerId);

  return NextResponse.json({
    ok: true,
    created: sub.total_messages_received === 0,
    phone_last_4: phone.slice(-4),
  });
}
