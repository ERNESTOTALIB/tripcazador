/**
 * /api/scoring/auto-feedback-cron — SSS393 (21 may 2026)
 *
 * Cron diario que infiere outcomes para `deal_scoring_v3` sin necesidad
 * de input manual del admin. Heurística:
 *
 *   - Si un deal tiene >=1 `booking_redirect` en event_store → "booked"
 *     (asumimos click → conversión; proxy de éxito).
 *   - Si un deal es viejo (>14 días) sin clicks → "expired_no_takers".
 *   - Si un deal tiene >5 deal_clicks pero 0 booking_redirects → señal
 *     ambigua, no marcar.
 *
 * Idempotente: marca cada deal_id solo una vez (track en KV propio).
 *
 * Auth: GET ?token=PRICE_ALERT_CRON_TOKEN_PREMIUM.
 *
 * Esta cron desbloquea el ML v3 sin trabajo manual del operator.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getRecentEvents } from "@/lib/event_store";
import {
  recordOutcome,
  hydrateOutcomesFromKV,
  buildRouteKey,
  type DealOutcome,
} from "@/lib/deal_scoring_v3";
import { createKV } from "@/lib/kv_store";
import { verifyCronToken } from "@/lib/cron_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const kv = createKV("scoring_v3_auto");
const PROCESSED_KEY = "processed_deals";

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

interface DealEventMeta {
  deal_id?: string;
  origin?: string;
  destination?: string;
  airline_code?: string;
  airline?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token") || "";
  // AUDIT-FULL-3: token específico CRON_TOKEN_SCORING_FEEDBACK preferido
  if (!verifyCronToken("scoring-feedback", token)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";

  // 1. Hidrata outcomes existentes + listado de procesados.
  await hydrateOutcomesFromKV();
  const processed = (await kv.get<string[]>(PROCESSED_KEY)) || [];
  const processedSet = new Set<string>(processed);

  // 2. Recorre eventos recientes (ventana ~7 días en event_store) y
  //    agrupa por deal_id.
  const events = getRecentEvents();
  const dealStats = new Map<
    string,
    { clicks: number; bookings: number; meta: DealEventMeta; latestTs: number }
  >();

  for (const e of events) {
    if (!e.meta?.deal_id) continue;
    const id = String(e.meta.deal_id);
    if (processedSet.has(id)) continue;

    const cur =
      dealStats.get(id) ??
      ({ clicks: 0, bookings: 0, meta: e.meta as DealEventMeta, latestTs: 0 } as {
        clicks: number;
        bookings: number;
        meta: DealEventMeta;
        latestTs: number;
      });
    if (e.type === "deal_click") cur.clicks += 1;
    if (e.type === "booking_redirect") cur.bookings += 1;
    if (e.ts > cur.latestTs) cur.latestTs = e.ts;
    // Mantener meta más rica
    if (!cur.meta.airline_code && e.meta.airline) {
      cur.meta = { ...cur.meta, ...e.meta } as DealEventMeta;
    }
    dealStats.set(id, cur);
  }

  // 3. Aplicar reglas heurísticas.
  const summary = {
    candidates: dealStats.size,
    booked: 0,
    expired: 0,
    skipped_ambiguous: 0,
    skipped_no_route: 0,
  };

  const now = Date.now();
  const newProcessed = new Set<string>(processedSet);

  for (const [dealId, s] of Array.from(dealStats.entries())) {
    const ageDays = (now - s.latestTs) / (24 * 3600_000);

    // Necesitamos route info para route_key
    if (!s.meta.origin || !s.meta.destination) {
      summary.skipped_no_route += 1;
      continue;
    }
    const routeKey = buildRouteKey({
      origin: s.meta.origin,
      destination: s.meta.destination,
      airline_code: s.meta.airline_code || s.meta.airline,
      price_eur: 0,
    });

    let outcome: DealOutcome | null = null;
    if (s.bookings >= 1) {
      outcome = "booked";
      summary.booked += 1;
    } else if (ageDays >= 14 && s.clicks === 0) {
      outcome = "expired_no_takers";
      summary.expired += 1;
    } else if (s.clicks >= 5 && s.bookings === 0) {
      // Señal ambigua — clicks sí, conversión no
      summary.skipped_ambiguous += 1;
      continue;
    } else {
      // Deal aún fresco o sin signal suficiente
      continue;
    }

    if (!dry) {
      recordOutcome(dealId, routeKey, outcome);
      newProcessed.add(dealId);
    }
  }

  if (!dry) {
    void kv.set(PROCESSED_KEY, Array.from(newProcessed)).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    dry,
    summary,
    processed_total: newProcessed.size,
  });
}
