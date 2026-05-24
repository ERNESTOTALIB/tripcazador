/**
 * /api/email/newsletter-weekly — fase SSS152 (refactored SSS155 build fix)
 *
 * Endpoint cron-triggered (domingos 18:00 UTC via GH Actions) que envía la
 * newsletter semanal con los 5 chollos top (CRÍTICO/ERROR, España-first)
 * a todos los suscriptores activos vía Resend.
 *
 * Auth: ?token=ADMIN_TOKEN en query (compatible con curl simple).
 *
 * Rate-limit: 1 invocación cada 6h por proceso (in-memory).
 *
 * Si RESEND_API_KEY no está set, devuelve 200 con sent=0 y log "dormido"
 * para que el cron no falle mientras se configura Resend.
 *
 * GET /api/email/newsletter-weekly?token=$ADMIN_TOKEN
 * → { ok: true, sent: N, skipped: M, deals_in_email: 5 }
 *
 * SSS155 fix: helpers movidos a @/lib/newsletter_weekly_helpers porque
 * Next.js 14 NO permite exports custom desde route.ts. Antes el build
 * fallaba con: "pickTopFiveDeals" is not a valid Route export field.
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { listPendingDrip } from "@/lib/subscribers_store";
import { emitUnsubscribeToken } from "@/lib/unsubscribe_token";
import type { Deal } from "@/lib/api";
import {
  RATE_WINDOW_MS,
  pickTopFiveDeals,
  renderNewsletterHtml,
  getLastNewsletterTs,
  setLastNewsletterTs,
} from "@/lib/newsletter_weekly_helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

interface DealsFile {
  deals: Deal[];
  generated_at?: string;
  total_deals?: number;
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

async function loadDeals(): Promise<Deal[]> {
  // Try a few likely paths because Vercel bundles `public/` separately.
  const candidates = [
    path.join(process.cwd(), "public", "deals-latest.json"),
    path.join(process.cwd(), "tripcazador-web", "public", "deals-latest.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf-8");
      const json = JSON.parse(raw) as DealsFile;
      if (Array.isArray(json.deals)) return json.deals;
    } catch {
      /* try next */
    }
  }
  // Last resort: fetch from the deployed site
  try {
    const res = await fetch(`${SITE}/deals-latest.json`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as DealsFile;
      if (Array.isArray(json.deals)) return json.deals;
    }
  } catch {
    /* swallow */
  }
  return [];
}

function unsubscribeUrl(email: string): string {
  // AUDIT-FULL FIX-SEC-1: token con HMAC verificable
  return `${SITE}/api/unsubscribe?t=${emitUnsubscribeToken(email)}`;
}

async function sendOne(
  resendKey: string,
  from: string,
  email: string,
  subject: string,
  html: string,
  unsub: string,
): Promise<boolean> {
  // SSS190 (15 may 2026): antes silent return false → al cron no se sabía
  // POR QUÉ skipped count subía (401 key inválida? 429 rate-limit? domain
  // not verified? Resend down?). Newsletter llevaba semanas sin enviarse
  // sin log explicativo. Ahora console.error con status + body snippet.
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<unread>");
      // Email hash para RGPD (no log full address en producción)
      const hash = email.slice(0, 3) + "***@" + (email.split("@")[1] || "?");
      console.error(
        `[newsletter-weekly] Resend HTTP ${res.status} to ${hash}: ${body.slice(0, 200)}`,
      );
    }
    return res.ok;
  } catch (err) {
    const hash = email.slice(0, 3) + "***@" + (email.split("@")[1] || "?");
    console.error(
      `[newsletter-weekly] Resend network error to ${hash}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!constantTimeEq(token, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Rate-limit
  const now = Date.now();
  const lastTs = getLastNewsletterTs();
  if (now - lastTs < RATE_WINDOW_MS) {
    const wait = Math.ceil((RATE_WINDOW_MS - (now - lastTs)) / 60_000);
    return NextResponse.json(
      { ok: false, error: "rate_limited", retry_in_minutes: wait },
      { status: 429 },
    );
  }
  setLastNewsletterTs(now);

  const deals = await loadDeals();
  const top5 = pickTopFiveDeals(deals);

  if (top5.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: 0,
      deals_in_email: 0,
      reason: "no_deals",
    });
  }

  // Subscribers: usar listPendingDrip con horizonte futuro = todos los activos
  let subs: string[] = [];
  try {
    const all = await listPendingDrip(Date.now() + 1000 * 365 * 24 * 3600);
    subs = all.filter((s) => !s.unsubscribed_at).map((s) => s.email);
  } catch (err) {
    // SSS190: antes silent → "no_subscribers" como reason aunque la causa real
    // fuese el backend caído. Ahora log para distinguir lista vacía vs error.
    console.error(
      `[newsletter-weekly] listPendingDrip failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    subs = [];
  }

  if (subs.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: 0,
      deals_in_email: top5.length,
      reason: "no_subscribers",
    });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  const RESEND_FROM = process.env.RESEND_FROM || "TripCazador <newsletter@tripcazador.com>";

  if (!RESEND_API_KEY) {
    console.log(
      `[newsletter-weekly] dormido — RESEND_API_KEY no set. ${subs.length} subs estaban listos.`,
    );
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: subs.length,
      deals_in_email: top5.length,
      reason: "resend_not_configured",
    });
  }

  const subject = `📬 Tu radar semanal · ${top5.length} chollos top (${new Date().toLocaleDateString("es-ES")})`;

  // SSS210 (15 may 2026): antes secuencial `await sendOne` por suscriptor →
  // 1s/email × 200 subs = 200s, cerca del Vercel lambda max 300s. Con >250
  // subs lambda timeout antes de terminar → mitad no recibe email.
  //
  // Fix: batches concurrentes. Resend free tier acepta 10 req/s; usamos
  // batches de 10 + 1.1s entre batches para no romper rate-limit (timestamp
  // sliding window). Para 1000 subs: 100 batches × 1.1s = 110s total.
  //
  // Promise.allSettled para que un fallo de Resend (5xx, network) no aborte
  // el batch entero — cada email es independiente.
  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 1100;
  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const batch = subs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((email) => {
        const unsub = unsubscribeUrl(email);
        const html = renderNewsletterHtml(top5, unsub, SITE);
        return sendOne(RESEND_API_KEY, RESEND_FROM, email, subject, html, unsub);
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) sent += 1;
      else skipped += 1;
    }
    // Rate-limit pause solo entre batches (no después del último)
    if (i + BATCH_SIZE < subs.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    deals_in_email: top5.length,
  });
}
