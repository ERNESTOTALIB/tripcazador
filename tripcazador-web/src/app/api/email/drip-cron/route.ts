/**
 * /api/email/drip-cron — fase ss-SS2
 *
 * Cron endpoint que envía stages 1-4 del drip a subscribers que estén
 * en ventana (stage_age_days >= STAGE_DAYS[stage]).
 *
 * Trigger: GitHub Actions cron diario o cada 12h. Token Bearer compartido.
 *
 * GET /api/email/drip-cron?token=DRIP_CRON_TOKEN
 *
 * Response:
 *   { ok: true, processed: N, sent: M, errors: K }
 *
 * Env vars:
 *   - DRIP_CRON_TOKEN — secret para auth
 *   - RESEND_API_KEY  — opcional. Si no está, log "dormido"
 *   - RESEND_FROM     — From header
 *   - UNSUBSCRIBE_SECRET — para construir links de unsubscribe
 *
 * Si RESEND_API_KEY no está, devuelve 200 con sent=0 y log de los pendientes.
 * Esto permite verificar la lógica antes de tener Resend conectado.
 */

import { NextRequest, NextResponse } from "next/server";
import { listPendingDrip, bumpStage, type Subscriber } from "@/lib/subscribers_store";
import { getTemplate } from "@/lib/drip_templates";
import { emitUnsubscribeToken } from "@/lib/unsubscribe_token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "TripCazador <hola@tripcazador.com>";
const SITE_URL = "https://tripcazador.com";

function unsubscribeUrl(email: string): string {
  // AUDIT-FULL FIX-SEC-1: token con HMAC verificable
  return `${SITE_URL}/api/unsubscribe?t=${emitUnsubscribeToken(email)}`;
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

async function sendStage(sub: Subscriber): Promise<boolean> {
  const tpl = getTemplate(sub.drip_stage);
  if (!tpl) return false;
  if (!RESEND_API_KEY) {
    console.log(
      `[drip] dormido stage=${sub.drip_stage} email=${sub.email} subject="${tpl.subject}"`,
    );
    return false;
  }
  const unsub = unsubscribeUrl(sub.email);
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
        to: sub.email,
        subject: tpl.subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[drip] resend fail:", err);
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.DRIP_CRON_TOKEN || "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!constantTimeEq(token, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const pending = await listPendingDrip();
  let sent = 0;
  let errors = 0;
  for (const sub of pending) {
    const ok = await sendStage(sub);
    if (ok) {
      await bumpStage(sub.email);
      sent += 1;
    } else if (RESEND_API_KEY) {
      errors += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: pending.length,
    sent,
    errors,
    resend_active: Boolean(RESEND_API_KEY),
  });
}
