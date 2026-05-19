/**
 * /api/admin/referral/mark-rewarded — SSS321 (19 may 2026)
 *
 * Admin-only: marca un referral como rewarded_at=now cuando ops aplica
 * la extensión de 30 días en Stripe (manual via coupon en Dashboard).
 *
 * POST { id } con Bearer ADMIN_TOKEN o cookie tc_panel_session
 *   → 200 { ok, id }
 *   → 401 si auth falla
 *   → 404 si el id no existe
 *
 * Audit trail queda en el rewarded_at timestamp del referral entry —
 * el dashboard /api/premium/referral/me lo expone como rewarded_count.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { markReferralRewarded } from "@/lib/referral_store";
import { COOKIE_KEY, verifyToken } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_RE = /^rf_[A-Za-z0-9]+$/;

async function isAuthed(req: NextRequest): Promise<boolean> {
  // Cookie panel admin
  const ck = await cookies();
  const session = verifyToken(ck.get(COOKIE_KEY)?.value);
  if (session) return true;

  // Bearer ADMIN_TOKEN para uso server-to-server / scripts ops
  const auth = req.headers.get("authorization") || "";
  const adminToken = process.env.ADMIN_TOKEN || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!adminToken) return false; // si no hay env, no permitir bearer
  // SSS329 M4: constant-time compare para evitar timing oracle
  if (provided.length !== adminToken.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "utf8"),
      Buffer.from(adminToken, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const id = String(body.id || "");
  if (!ID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: "id_invalid" }, { status: 400 });
  }

  const ok = await markReferralRewarded(id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id });
}
