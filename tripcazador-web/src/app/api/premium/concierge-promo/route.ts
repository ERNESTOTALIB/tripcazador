/**
 * /api/premium/concierge-promo — SSS303
 *
 * Reclama el "1 consulta concierge gratis/mes" del Premium.
 *
 * POST { customer_id, message?, email? } → 201 si OK, 402 si ya usado este mes
 *
 * NO incluye lógica completa de concierge (que es por Stripe). Solo
 * registra el uso del promo y devuelve un ticket_id sintético para
 * que el cliente envíe email a contacto@tripcazador.com con ese ID
 * mencionando que es un promo Premium.
 */

import { NextRequest, NextResponse } from "next/server";
import { hasUsedPromoThisMonth, markPromoUsed } from "@/lib/premium_concierge_promo";
import { trackEvent } from "@/lib/event_store";
import { isValidStripeOwnerId } from "@/lib/stripe_id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const customerId = String(body.customer_id || "");
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }

  const used = await hasUsedPromoThisMonth(customerId);
  if (used) {
    return NextResponse.json(
      {
        ok: false,
        error: "promo_used_this_month",
        message: "Ya has usado tu consulta concierge gratis este mes. Se renueva el día 1.",
      },
      { status: 402 },
    );
  }

  await markPromoUsed(customerId);

  const ticketId = `cp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  try {
    trackEvent({
      ts: Date.now(),
      type: "concierge_promo_claimed",
      visitor_id: `premium:${customerId.slice(0, 16)}`,
      meta: { ticketId, month: new Date().toISOString().slice(0, 7) },
    });
  } catch {
    /* no-op */
  }

  return NextResponse.json(
    {
      ok: true,
      ticket_id: ticketId,
      next_step:
        "Envía un email a contacto@tripcazador.com con asunto 'Promo Premium " +
        ticketId +
        "' y los detalles de tu consulta. Responderemos en <24h laborables.",
    },
    { status: 201 },
  );
}
