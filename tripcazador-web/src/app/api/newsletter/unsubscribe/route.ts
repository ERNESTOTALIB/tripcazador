/**
 * /api/newsletter/unsubscribe — SSS430 (23 may 2026)
 *
 * Endpoint POST estructurado para baja por formulario en
 * /newsletter/unsubscribe (UX-first, complementario a /api/unsubscribe
 * one-click token-based para enlaces de emails).
 *
 * Acepta: { email, reason?, hp? }
 * Responde: 200 idempotente (mismo body para email registrado o no —
 * evita user enumeration).
 *
 * Privacy: trackea reason vía event_store anónimo (sin email asociado)
 * para entender churn — no para retargeting.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { unsubscribe } from "@/lib/subscribers_store";
import { trackEvent } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  email?: string;
  reason?: string;
  hp?: string; // honeypot
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

const ALLOWED_REASONS = new Set([
  "too_many_emails",
  "not_relevant",
  "expensive",
  "switching",
  "other",
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot — si está rellenado es un bot
  if (body.hp && body.hp.trim().length > 0) {
    return NextResponse.json({ ok: true }); // silent ignore
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const reason = body.reason && ALLOWED_REASONS.has(body.reason) ? body.reason : "unspecified";

  try {
    await unsubscribe(email);
  } catch (e) {
    // Best-effort — el user no debe ver detalles del backend
    console.warn("[newsletter/unsubscribe] unsubscribe failed:", e);
  }

  // Track anonimizado del reason (sin email)
  try {
    trackEvent({
      type: "newsletter_unsubscribe",
      ts: Date.now(),
      visitor_id: hashEmail(email),
      meta: { reason },
    });
  } catch {
    // silent
  }

  return NextResponse.json({ ok: true });
}

/**
 * FIX-SEC-2: Hash HMAC-SHA256 con secret env-based. El hash polinomial
 * anterior (32-bit, no salt) era trivialmente reversible — un atacante
 * con dump de event_store podía enumerar emails comunes para des-
 * anonimizar suscriptores + razones de baja (GDPR Art 4(5) failure).
 *
 * Con HMAC keyed con UNSUBSCRIBE_HASH_KEY, el hash no es reversible sin
 * el secret. Si la env var no está set, devolvemos string vacío (no
 * persistimos pseudo-identificador débil — falla privacidad-safe).
 */
function hashEmail(email: string): string {
  const key = process.env.UNSUBSCRIBE_HASH_KEY || "";
  if (!key) return "";
  return createHmac("sha256", key).update(email).digest("hex").slice(0, 16);
}
