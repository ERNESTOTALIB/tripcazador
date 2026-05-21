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
import crypto from "node:crypto";
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

const APP_SECRET = process.env.WHATSAPP_APP_SECRET || "";

/**
 * SSS383 HMAC verification — Meta firma cada POST con
 * X-Hub-Signature-256: sha256=<hex(HMAC_SHA256(APP_SECRET, raw_body))>
 *
 * Sin WHATSAPP_APP_SECRET configurado, el webhook acepta sin verificar (modo
 * dev). En prod operator DEBE set WHATSAPP_APP_SECRET o cualquiera puede
 * forjar mensajes hacia el endpoint.
 */
function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!APP_SECRET) return true; // dev mode — sin secret, accept
  if (!signatureHeader) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  if (signatureHeader.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

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
  // SSS383 — leer raw body para verificar HMAC antes de parsear JSON
  const rawBody = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, sig)) {
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 401 },
    );
  }

  let body: unknown = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
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
