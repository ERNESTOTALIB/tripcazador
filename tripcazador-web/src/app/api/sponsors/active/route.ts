/**
 * /api/sponsors/active — SUPER-SPONSORS (25 may 2026)
 *
 * Public list of active sponsors (sin PII como contactEmail).
 * Permite a SponsorSlot SSR fetch sin acceder directamente a la KV
 * desde edge. Cached 5min en CDN.
 */
import { NextResponse } from "next/server";
import { getActiveSponsors, toSponsorPublic } from "@/lib/sponsors_catalog";

export const runtime = "nodejs";
export const revalidate = 300; // 5min CDN cache

export async function GET() {
  try {
    const sponsors = await getActiveSponsors();
    return NextResponse.json(
      { sponsors: sponsors.map(toSponsorPublic) },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    // Fail-safe: empty list, no 500 — para evitar bloquear surfaces que rendereen este JSON.
    return NextResponse.json({ sponsors: [] });
  }
}
