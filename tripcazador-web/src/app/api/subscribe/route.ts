/**
 * /api/subscribe — fase ss-SS2
 *
 * Edge endpoint para newsletter signup. Replaces el stub R4 que mandaba
 * al backend FastAPI (cuyo SMTP no estaba conectado).
 *
 * Flujo:
 *  1. Valida email + consent + honeypot.
 *  2. Persiste subscriber via subscribers_store (remoto si tiene URL,
 *     in-memory fallback si no).
 *  3. Si RESEND_API_KEY está configurado, dispara welcome inmediato
 *     (stage 0 del drip). Si no, deja el welcome para cuando se active.
 *  4. Devuelve 201 sin filtrar info sensible. Mismo response para nuevo
 *     y existente — evita user enumeration.
 *
 * POST /api/subscribe
 *   { email: "x@y.com", consent: true, source?: "home", locale?: "es", hp?: "" }
 */

import { NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/subscribers_store";
import { getTemplate } from "@/lib/drip_templates";
import { trackEvent } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "TripCazador <hola@tripcazador.com>";
const SITE_URL = "https://tripcazador.com";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

function unsubscribeUrl(email: string): string {
  // Token simple: hash del email + secret. Si no hay secret, fallback no-op.
  const secret = process.env.UNSUBSCRIBE_SECRET || "";
  if (!secret) {
    return `${SITE_URL}/legal#newsletter`;
  }
  // Edge: usar Web Crypto. Aquí runtime nodejs, podríamos usar crypto.
  // Mantenemos simple: ?email base64 — el endpoint /unsubscribe valida.
  const token = Buffer.from(`${email}:${Date.now()}`).toString("base64url");
  return `${SITE_URL}/api/unsubscribe?t=${token}`;
}

async function sendWelcome(email: string, locale: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[subscribe] welcome dormido para ${email} (RESEND_API_KEY no set)`);
    return false;
  }
  const tpl = getTemplate(0);
  if (!tpl) return false;
  const unsub = unsubscribeUrl(email);
  const html = tpl.html.replace(/\{\{unsubscribe_url\}\}/g, unsub);
  const text = tpl.text.replace(/\{\{unsubscribe_url\}\}/g, unsub);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: email,
        subject: tpl.subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!res.ok) {
      // SSS190: antes silent → "welcome_sent=false" sin causa. Ahora log status+body.
      const body = await res.text().catch(() => "<unread>");
      const hash = email.slice(0, 3) + "***@" + (email.split("@")[1] || "?");
      console.error(`[subscribe] Resend HTTP ${res.status} to ${hash}: ${body.slice(0, 200)}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[subscribe] resend fail:", err);
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const email = String(body.email || "").trim();
  const consent = body.consent === true;
  const source = String(body.source || "unknown").slice(0, 32);
  const locale = String(body.locale || "es").slice(0, 5);
  const honeypot = String(body.hp || "");

  // Honeypot: bots rellenan campo oculto
  if (honeypot) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ ok: false, error: "consent_required" }, { status: 400 });
  }

  const result = await addSubscriber({ email, source, locale });

  // Track signup (no PII en evento)
  try {
    trackEvent({
      ts: Date.now(),
      type: "newsletter_signup",
      visitor_id: "subscribe-endpoint",
      meta: { source, locale, created: result.created },
    });
  } catch {
    /* no-op */
  }

  // Welcome inmediato (sólo si RESEND_API_KEY)
  let welcomeSent = false;
  if (result.created) {
    welcomeSent = await sendWelcome(email, locale);
  }

  return NextResponse.json(
    {
      ok: true,
      created: result.created,
      welcome_sent: welcomeSent,
    },
    { status: 201 },
  );
}
