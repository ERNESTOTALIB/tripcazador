/**
 * /api/agency-partner/apply — SSS375 (21 may 2026)
 *
 * POST { company_name, contact_email, website?, audience_size_estimate?, niche? }
 *   → { ok, slug, ref_code, status }
 *
 * Rate limit: 3 applications / hour / IP (anti-abuse).
 */

import { NextRequest, NextResponse } from "next/server";
import { registerPartner } from "@/lib/agency_partner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rateMap: Map<string, number[]> = (
  globalThis as unknown as { __tc_partner_apply_rate?: Map<string, number[]> }
).__tc_partner_apply_rate ?? new Map();
(globalThis as unknown as { __tc_partner_apply_rate: Map<string, number[]> }).__tc_partner_apply_rate = rateMap;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 60_000;
  const hits = (rateMap.get(ip) || []).filter((t) => now - t < window);
  hits.push(now);
  rateMap.set(ip, hits);
  return hits.length > 3;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const company_name = String(body.company_name || "").trim().slice(0, 120);
  const contact_email = String(body.contact_email || "").trim().toLowerCase().slice(0, 120);
  const website = body.website ? String(body.website).trim().slice(0, 200) : undefined;
  const niche = body.niche ? String(body.niche).trim().slice(0, 60) : undefined;
  const audience_size_estimate = body.audience_size_estimate
    ? Math.max(0, Math.min(10_000_000, Number(body.audience_size_estimate)))
    : undefined;

  if (!company_name || company_name.length < 2) {
    return NextResponse.json({ ok: false, error: "missing_company" }, { status: 400 });
  }
  if (!EMAIL_RE.test(contact_email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  const partner = registerPartner({
    company_name,
    contact_email,
    website,
    niche,
    audience_size_estimate,
  });

  return NextResponse.json({
    ok: true,
    slug: partner.slug,
    ref_code: partner.ref_code,
    status: partner.status,
    message: "Aplicación recibida. Te confirmaremos en 24-48h por email.",
  });
}
