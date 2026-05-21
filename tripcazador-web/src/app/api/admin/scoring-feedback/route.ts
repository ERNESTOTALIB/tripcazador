/**
 * /api/admin/scoring-feedback — SSS389 (21 may 2026)
 *
 * Auth: panel cookie (verifyToken). Sólo admin.
 *
 * POST { deal_id, route_key, outcome }
 *   → recordOutcome del scoring v3.
 *
 * GET ?route_key=MAD-NRT-NH
 *   → stats agregadas + últimas 10 muestras de esa ruta.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import {
  recordOutcome,
  lookupRouteHistory,
  hydrateOutcomesFromKV,
  type DealOutcome,
} from "@/lib/deal_scoring_v3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_OUTCOMES: DealOutcome[] = [
  "booked",
  "expired_no_takers",
  "false_positive",
  "regular_sale",
];

async function isAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token) return false;
  return verifyToken(token) !== null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const dealId = String(body.deal_id || "").trim();
  const routeKey = String(body.route_key || "").trim().toUpperCase();
  const outcome = String(body.outcome || "").trim() as DealOutcome;

  if (!dealId || !routeKey) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", required: ["deal_id", "route_key"] },
      { status: 400 },
    );
  }
  if (!VALID_OUTCOMES.includes(outcome)) {
    return NextResponse.json(
      { ok: false, error: "invalid_outcome", valid: VALID_OUTCOMES },
      { status: 400 },
    );
  }
  // Validar formato route_key: ORIGIN-DEST-AIRLINE (3 partes, IATAs)
  const parts = routeKey.split("-");
  if (parts.length !== 3 || !parts.every((p) => /^[A-Z0-9]{2,4}$/.test(p))) {
    return NextResponse.json(
      { ok: false, error: "invalid_route_key", expected: "ORIGIN-DEST-AIRLINE" },
      { status: 400 },
    );
  }

  // SSS391 — hidrata KV antes de stats lookup para asegurar consistencia
  // post-cold-container.
  await hydrateOutcomesFromKV();
  recordOutcome(dealId, routeKey, outcome);
  const stats = lookupRouteHistory(routeKey);
  return NextResponse.json({ ok: true, stats });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const routeKey = new URL(req.url).searchParams.get("route_key");
  if (!routeKey) {
    return NextResponse.json({ ok: false, error: "missing_route_key" }, { status: 400 });
  }
  await hydrateOutcomesFromKV();
  const stats = lookupRouteHistory(routeKey.toUpperCase());
  return NextResponse.json({ ok: true, stats });
}
