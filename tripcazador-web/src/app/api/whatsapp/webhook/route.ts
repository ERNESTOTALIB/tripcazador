/**
 * /api/whatsapp/webhook — SSS362 (21 may 2026)
 *
 * Endpoint para Meta WhatsApp Cloud API webhooks:
 *   - GET con hub.mode=subscribe&hub.verify_token=X&hub.challenge=Y → echo challenge
 *   - POST con payload de mensajes entrantes → parse + auto-reply + opt-in/out
 *
 * Setup en Meta for Developers:
 *   1. App → WhatsApp → Configuration → Webhook
 *   2. Callback URL: https://tripcazador.com/api/whatsapp/webhook
 *   3. Verify token: same as env WHATSAPP_VERIFY_TOKEN
 *   4. Subscribe to: messages
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookChallenge,
  parseWebhookPayload,
  sendTemplate,
  normalizePhone,
} from "@/lib/whatsapp_broadcaster";
import {
  upsertSubscriber,
  deactivateSubscriber,
} from "@/lib/whatsapp_subscribers_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode") || "";
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";

  const result = verifyWebhookChallenge(mode, token, challenge);
  if (!result) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
  }
  // WhatsApp espera el challenge como text/plain
  return new NextResponse(result, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // TODO: verificar X-Hub-Signature-256 HMAC con WHATSAPP_APP_SECRET
  // (Meta exige esto para mensajes producción)
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const messages = parseWebhookPayload(body);
  let optedIn = 0;
  let optedOut = 0;
  let autoReplies = 0;

  for (const msg of messages) {
    const phone = normalizePhone(msg.from);
    if (!phone) continue;
    const text = msg.text.trim().toUpperCase();

    if (text === "ALTA" || text === "SI" || text === "SÍ" || text === "YES") {
      upsertSubscriber(phone, "telegram_redirect");
      optedIn += 1;
      // Confirmación
      await sendTemplate({
        to: phone,
        templateName: "subscription_confirmed",
        languageCode: "es",
      }).catch(() => null);
      autoReplies += 1;
    } else if (text === "BAJA" || text === "STOP" || text === "UNSUBSCRIBE") {
      deactivateSubscriber(phone);
      optedOut += 1;
    } else if (text.startsWith("INFO") || text.startsWith("AYUDA")) {
      await sendTemplate({
        to: phone,
        templateName: "info_response",
        languageCode: "es",
      }).catch(() => null);
      autoReplies += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    received: messages.length,
    opted_in: optedIn,
    opted_out: optedOut,
    auto_replies: autoReplies,
  });
}
