/**
 * /api/voice/hotline — SSS372 (21 may 2026)
 *
 * POST { customer_id, user_text, context? } → { reply_text, reply_audio_url?, deals[] }
 *
 * Rate limit: 5 llamadas/15min/customer_id (Premium).
 *
 * Sin OpenAI/ElevenLabs env vars → canned fallback determinístico.
 */

import { NextRequest, NextResponse } from "next/server";
import { processHotline } from "@/lib/voice_hotline";
import { isValidStripeCustomerId } from "@/lib/stripe_id";
import { getPremiumByCustomerId } from "@/lib/premium_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateMap: Map<string, number[]> = (
  globalThis as unknown as { __tc_voice_rate?: Map<string, number[]> }
).__tc_voice_rate ?? new Map();
(globalThis as unknown as { __tc_voice_rate: Map<string, number[]> }).__tc_voice_rate = rateMap;

function isRateLimited(customerId: string): boolean {
  const now = Date.now();
  const window = 15 * 60_000;
  const hits = (rateMap.get(customerId) || []).filter((t) => now - t < window);
  hits.push(now);
  rateMap.set(customerId, hits);
  return hits.length > 5;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const customerId = String(body.customer_id || "").trim();
  const userText = String(body.user_text || "").trim();
  const context = (body.context as Record<string, string> | undefined) || undefined;

  if (!customerId || !userText) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", required: ["customer_id", "user_text"] },
      { status: 400 },
    );
  }

  // AUDIT-WEB FIX-SEC-H3 (31 may 2026): gate auth Premium. Antes cualquier
  // POST con string arbitrario pasaba — rotando customer_id se bypaseaba
  // rate-limit y, con OPENAI_API_KEY activa, gastaba tokens pagados sin
  // ningún Premium activo. Ahora: formato Stripe customer_id + Premium
  // record activo o se rechaza 401/403.
  if (!isValidStripeCustomerId(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 401 },
    );
  }
  const premium = getPremiumByCustomerId(customerId);
  if (!premium || !premium.active) {
    return NextResponse.json(
      { ok: false, error: "premium_required" },
      { status: 403 },
    );
  }

  if (isRateLimited(customerId)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const result = await processHotline({
    customer_id: customerId,
    user_text: userText,
    context,
  });

  const status = result.ok ? 200 : 400;
  return NextResponse.json(result, { status });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    enabled: (process.env.VOICE_HOTLINE_ENABLED || "0") === "1",
    has_openai: !!process.env.OPENAI_API_KEY,
    has_elevenlabs: !!process.env.ELEVENLABS_API_KEY,
  });
}
