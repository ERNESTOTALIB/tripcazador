/**
 * /api/admin/sponsors — SUPER-SPONSORS (25 may 2026)
 *
 * Admin endpoints (cookie-gated) para aprobar/borrar sponsors:
 *  - POST ?sid=...&action=approve  → status="active"
 *  - POST ?sid=...&action=delete   → deleteSponsor
 *
 * Redirige a /panel/admin/sponsors al completar.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import {
  updateSponsorStatus,
  deleteSponsor,
} from "@/lib/sponsors_catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthorized(): Promise<boolean> {
  const c = cookies();
  const tok = c.get(COOKIE_KEY)?.value;
  if (!tok) return false;
  try {
    const session = verifyToken(tok);
    return !!session;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sid = req.nextUrl.searchParams.get("sid");
  const action = req.nextUrl.searchParams.get("action");

  if (!sid || sid.length > 200) {
    return NextResponse.json({ error: "invalid_sid" }, { status: 400 });
  }
  if (!action || !["approve", "delete"].includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  if (action === "approve") {
    const ok = await updateSponsorStatus(sid, "active");
    if (!ok) {
      return NextResponse.json({ error: "sponsor_not_found" }, { status: 404 });
    }
  } else if (action === "delete") {
    await deleteSponsor(sid);
  }

  // Redirect post-form
  return NextResponse.redirect(
    new URL("/panel/admin/sponsors", req.url),
    303,
  );
}
