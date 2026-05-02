import { NextRequest, NextResponse } from "next/server";

/**
 * /api/push/subscribe — fase ww WW4
 *
 * Recibe una PushSubscription del cliente y la reenvía al backend FastAPI
 * para guardarla. Cuando un price-alert matchee, el backend itera estas
 * subscripciones y envía web-push notifications via web-push library +
 * VAPID keys.
 *
 * Best-effort: si falla el backend, devolvemos 202 igualmente para que el
 * usuario vea confirmación. Periodicamente el backend purga subs caducadas.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.subscription) {
      return NextResponse.json({ error: "missing_subscription" }, { status: 400 });
    }

    if (BACKEND_URL && ADMIN_TOKEN) {
      try {
        await fetch(`${BACKEND_URL}/api/push/subscriptions?token=${encodeURIComponent(ADMIN_TOKEN)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        });
      } catch {
        /* best effort */
      }
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
}
