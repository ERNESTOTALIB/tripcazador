import crypto from "node:crypto";

/**
 * agency_partner.ts — SSS375 (21 may 2026)
 *
 * Programa B2B "TripCazador Partners" — agencias de viajes y bloggers
 * de nicho que revenden Premium/Concierge a sus customers. Revshare via
 * código de referido único (slug humano + ref_code interno).
 *
 * Modelo económico:
 *  - Premium mensual €9.99 → partner cobra 20% recurring = €2/mes
 *  - Premium anual €99 → partner cobra 25% one-time = €24.75
 *  - Premium gift €9.99 → partner cobra 20% one-time = €2
 *  - Concierge €19/49/99 → partner cobra 15% one-time
 *
 * Stripe Connect integration (futuro): cuando el partner activa Connect,
 * los splits se pagan automáticos. Mientras tanto: tracking + payouts
 * mensuales manuales via Wise/SEPA.
 */

export type PartnerStatus = "pending" | "approved" | "rejected" | "active" | "paused";

export interface AgencyPartner {
  slug: string; // url-safe único (ej. "viajes-marisol")
  ref_code: string; // tracking code (ej. "TC-AGY-A8K3")
  company_name: string;
  contact_email: string;
  website?: string;
  audience_size_estimate?: number;
  niche?: string;
  status: PartnerStatus;
  payout_method?: "wise" | "sepa" | "paypal";
  payout_handle?: string;
  // stripe_connect_account_id?: string; // futuro
  created_at: number;
  approved_at?: number;
  total_referrals: number;
  total_revenue_eur: number; // revenue generated PARA TripCazador
  total_payout_eur: number; // owed AL partner
}

interface PartnerStore {
  byCode: Map<string, AgencyPartner>;
  bySlug: Map<string, AgencyPartner>;
}

const store: PartnerStore = (
  globalThis as unknown as { __tc_agency_partners?: PartnerStore }
).__tc_agency_partners ?? {
  byCode: new Map(),
  bySlug: new Map(),
};
(globalThis as unknown as { __tc_agency_partners: PartnerStore }).__tc_agency_partners =
  store;

export const COMMISSION_RATES = {
  premium_monthly_recurring: 0.20,
  premium_annual_oneoff: 0.25,
  premium_gift_oneoff: 0.20,
  concierge_oneoff: 0.15,
} as const;

export type CommissionEvent =
  | { product: "premium_monthly"; amount_eur: number }
  | { product: "premium_annual"; amount_eur: number }
  | { product: "premium_gift"; amount_eur: number }
  | { product: "concierge"; amount_eur: number };

export function calculatePayout(evt: CommissionEvent): number {
  const rate = (() => {
    switch (evt.product) {
      case "premium_monthly":
        return COMMISSION_RATES.premium_monthly_recurring;
      case "premium_annual":
        return COMMISSION_RATES.premium_annual_oneoff;
      case "premium_gift":
        return COMMISSION_RATES.premium_gift_oneoff;
      case "concierge":
        return COMMISSION_RATES.concierge_oneoff;
      default:
        return 0;
    }
  })();
  return Math.round(evt.amount_eur * rate * 100) / 100;
}

function generateRefCode(): string {
  // SSS382 hardening: 8 chars cryptographically random (32^8 ≈ 10^12 combos —
  // infeasible to brute-force vs old 4 chars que era enumerable en ~5min con
  // 1M req. crypto.randomBytes vs Math.random porque exponemos stats agregadas
  // en /panel/partner/[ref_code] y el ref_code es de facto un bearer token.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let out = "TC-AGY-";
  for (let i = 0; i < 8; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export interface RegisterPartnerInput {
  company_name: string;
  contact_email: string;
  website?: string;
  audience_size_estimate?: number;
  niche?: string;
}

export function registerPartner(input: RegisterPartnerInput): AgencyPartner {
  let slug = slugify(input.company_name);
  if (!slug) slug = `agency-${Date.now().toString(36)}`;
  // Asegurar unicidad
  let candidate = slug;
  let n = 2;
  while (store.bySlug.has(candidate)) {
    candidate = `${slug}-${n++}`;
  }
  slug = candidate;

  const partner: AgencyPartner = {
    slug,
    ref_code: generateRefCode(),
    company_name: input.company_name.trim(),
    contact_email: input.contact_email.trim().toLowerCase(),
    website: input.website?.trim(),
    audience_size_estimate: input.audience_size_estimate,
    niche: input.niche?.trim(),
    status: "pending",
    created_at: Date.now(),
    total_referrals: 0,
    total_revenue_eur: 0,
    total_payout_eur: 0,
  };
  store.byCode.set(partner.ref_code, partner);
  store.bySlug.set(partner.slug, partner);
  return partner;
}

export function getPartnerByCode(ref_code: string): AgencyPartner | undefined {
  return store.byCode.get(ref_code);
}

export function getPartnerBySlug(slug: string): AgencyPartner | undefined {
  return store.bySlug.get(slug);
}

export function recordReferralConversion(
  ref_code: string,
  evt: CommissionEvent,
): { ok: boolean; payout_eur: number; reason?: string } {
  const partner = store.byCode.get(ref_code);
  if (!partner) return { ok: false, payout_eur: 0, reason: "unknown_partner" };
  if (partner.status !== "active") {
    return { ok: false, payout_eur: 0, reason: `partner_not_active_${partner.status}` };
  }
  const payout = calculatePayout(evt);
  partner.total_referrals += 1;
  partner.total_revenue_eur =
    Math.round((partner.total_revenue_eur + evt.amount_eur) * 100) / 100;
  partner.total_payout_eur =
    Math.round((partner.total_payout_eur + payout) * 100) / 100;
  return { ok: true, payout_eur: payout };
}

export function approvePartner(ref_code: string): boolean {
  const p = store.byCode.get(ref_code);
  if (!p) return false;
  p.status = "active";
  p.approved_at = Date.now();
  return true;
}

export function rejectPartner(ref_code: string): boolean {
  const p = store.byCode.get(ref_code);
  if (!p) return false;
  p.status = "rejected";
  return true;
}

export function listPartners(filter?: { status?: PartnerStatus }): AgencyPartner[] {
  const all = Array.from(store.byCode.values());
  if (filter?.status) return all.filter((p) => p.status === filter.status);
  return all;
}

export function __resetForTests(): void {
  store.byCode.clear();
  store.bySlug.clear();
}
