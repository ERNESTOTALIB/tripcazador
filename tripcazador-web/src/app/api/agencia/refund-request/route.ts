/**
 * /api/agencia/refund-request — SSS305 (18 may 2026)
 *
 * El cliente reclama la garantía de mejor precio. Sube la prueba (URL del
 * vuelo/hotel más barato) + ticket_id. El endpoint:
 *  1. Valida el ticket existe y pertenece al email (case-insensitive).
 *  2. Comprueba que está dentro del periodo de garantía (7 días).
 *  3. Marca ticket como "refunded" con la proof_url.
 *  4. Notifica vía Telegram/email a Ernesto para que procese refund + activa
 *     Premium 30 días manualmente en Stripe.
 *
 * NO ejecuta el refund Stripe automáticamente — defensa anti-fraud (Ernesto
 * revisa la proof_url antes). El status "refunded" se aplica para que el
 * cliente vea su solicitud registrada.
 *
 * POST { ticket_id, email, proof_url }
 *   → 200 { ok:true, status:"submitted" }
 */

import { NextRequest, NextResponse } from "next/server";
import { getTicket, markRefunded, AGENCIA_GUARANTEE_DAYS } from "@/lib/agencia_store";
import { trackEvent } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TICKET_ID_RE = /^agt_[A-Za-z0-9]{8,}$/;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
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

  const ticketId = String(body.ticket_id || "");
  if (!TICKET_ID_RE.test(ticketId)) {
    return NextResponse.json({ ok: false, error: "ticket_id_invalid" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  const proofUrl = String(body.proof_url || "").trim();
  if (!isValidUrl(proofUrl) || proofUrl.length > 2000) {
    return NextResponse.json({ ok: false, error: "proof_url_invalid" }, { status: 400 });
  }

  const ticket = await getTicket(ticketId);
  if (!ticket) {
    return NextResponse.json({ ok: false, error: "ticket_not_found" }, { status: 404 });
  }
  if (ticket.email !== email) {
    return NextResponse.json({ ok: false, error: "email_mismatch" }, { status: 403 });
  }
  if (ticket.status === "refunded") {
    return NextResponse.json(
      { ok: false, error: "already_refunded", refunded_at: ticket.refunded_at },
      { status: 409 },
    );
  }

  // Validar ventana de garantía
  const daysSince = (Date.now() - ticket.created_at) / 86400_000;
  if (daysSince > AGENCIA_GUARANTEE_DAYS) {
    return NextResponse.json(
      {
        ok: false,
        error: "guarantee_expired",
        days_since: Math.round(daysSince),
        guarantee_days: AGENCIA_GUARANTEE_DAYS,
      },
      { status: 410 },
    );
  }

  const ok = await markRefunded(ticketId, proofUrl);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 500 });
  }

  try {
    trackEvent({
      ts: Date.now(),
      type: "agencia_refund_request",
      visitor_id: `agencia:${ticketId}`,
      meta: { ticket_id: ticketId, tipo: ticket.tipo, days_since: Math.round(daysSince) },
    });
  } catch {
    /* no-op */
  }

  // Best-effort notify a Ernesto vía Telegram (fire-and-forget OK aquí —
  // si falla el ticket ya está marked refunded en el store).
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    const msg = `🎁 Agencia refund request:\nticket: ${ticketId}\nemail: ${email}\ntipo: ${ticket.tipo}\nproof: ${proofUrl}\n\nProcesa refund Stripe + activa Premium 30d`;
    fetch(
      `https://api.telegram.org/bot${tgToken}/sendMessage?chat_id=${tgChat}&text=${encodeURIComponent(msg)}`,
    ).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    status: "submitted",
    message:
      "Hemos registrado tu solicitud. En 24-48h revisaremos la prueba y procesaremos " +
      "el reembolso + activaremos 1 mes Premium gratis si todo cuadra.",
  });
}
