/**
 * /api/sponsors/click — SUPER-SPONSORS (25 may 2026)
 *
 * Tracking de clicks en sponsor slots. Recibe POST { session_id }
 * y redirige al sponsor URL si está activo. Si no está activo
 * (expired/deleted/pending) devuelve 404 — el front debe fallback a
 * /patrocinadores.
 *
 * Response:
 *  - 302 redirect a sponsor URL si activo
 *  - 404 si session_id no encontrado o expirado
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getSponsorBySessionId,
  incrementSponsorClicks,
} from "@/lib/sponsors_catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedUrl(target: string): boolean {
  try {
    const u = new URL(target);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    // Reject javascript: file: ftp: and any embedded credentials/CRLF
    if (target.includes("\r") || target.includes("\n")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid");
  if (!sid || sid.length > 200 || !/^[a-zA-Z0-9_]+$/.test(sid)) {
    return NextResponse.json({ error: "invalid_sid" }, { status: 400 });
  }

  const sponsor = await getSponsorBySessionId(sid);
  if (!sponsor || sponsor.status !== "active") {
    return NextResponse.json({ error: "sponsor_not_active" }, { status: 404 });
  }
  if (new Date(sponsor.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "sponsor_expired" }, { status: 404 });
  }
  if (!isAllowedUrl(sponsor.url)) {
    return NextResponse.json({ error: "sponsor_url_blocked" }, { status: 400 });
  }

  // Fire-and-forget counter
  void incrementSponsorClicks(sid).catch(() => {});

  return NextResponse.redirect(sponsor.url, 302);
}
