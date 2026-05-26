/**
 * sponsors_catalog.ts — SUPER-SPONSORS (25 may 2026)
 *
 * Catalog de tiers de patrocinio self-serve + KV-backed estado de
 * sponsors activos. Reemplaza el flow mailto puro de /sponsor con
 * Stripe Checkout one-shot por slot.
 *
 * Tiers:
 *  - INLINE €199/mes — banner inline en 5 posts blog
 *  - NEWSLETTER €499/edición — slot dedicado newsletter
 *  - DEAL_WEEK €899/semana — header sticky home + push Premium
 *
 * Variables de entorno:
 *  - STRIPE_PRICE_SPONSOR_INLINE       price_... one-off €199
 *  - STRIPE_PRICE_SPONSOR_NEWSLETTER   price_... one-off €499
 *  - STRIPE_PRICE_SPONSOR_DEAL_WEEK    price_... one-off €899
 *
 * Si los price IDs no están set, el flow degrada a mailto (legacy).
 *
 * Storage:
 *  - KV namespace "sponsors" con keys "active:{slug}" → SponsorActive
 *  - KV namespace "sponsors" con keys "click:{slug}" → counter
 */

import { createKV } from "@/lib/kv_store";

export type SponsorTierSlug = "inline" | "newsletter" | "deal_week";

export interface SponsorTier {
  slug: SponsorTierSlug;
  name: string;
  priceEur: number;
  period: string; // "mes" | "edición" | "semana"
  description: string;
  features: string[];
  envPriceId: string;
  /** Días que dura la activación una vez pagado */
  durationDays: number;
  highlighted?: boolean;
}

export const SPONSOR_TIERS: SponsorTier[] = [
  {
    slug: "inline",
    name: "Inline",
    priceEur: 199,
    period: "mes",
    description: "Banner inline en 5 posts blog top-traffic durante 30 días",
    features: [
      "Slot dedicado dentro de 5 artículos seleccionados",
      "~6.000 impresiones/mes",
      "Link nofollow + utm_source tracking",
      "Reporte mensual de impresiones + clicks",
      "Activación automática post-pago",
    ],
    envPriceId: "STRIPE_PRICE_SPONSOR_INLINE",
    durationDays: 30,
  },
  {
    slug: "newsletter",
    name: "Newsletter",
    priceEur: 499,
    period: "edición",
    description: "Patrocinio newsletter semanal — 12.500 inboxes",
    features: [
      "Sección dedicada en newsletter semanal domingo",
      "12.500+ suscriptores activos verificados",
      "Logo + 80 palabras + CTA enlazado",
      "Reporte de opens (Resend) + clicks",
      "Tasa apertura histórica 38%",
    ],
    envPriceId: "STRIPE_PRICE_SPONSOR_NEWSLETTER",
    durationDays: 7,
    highlighted: true,
  },
  {
    slug: "deal_week",
    name: "Deal of the Week",
    priceEur: 899,
    period: "semana",
    description: "Header sticky home + alerta push Premium + Telegram",
    features: [
      "Banner header sticky home (top of fold)",
      "1× push notification a 5.000+ Premium subscribers",
      "1× post Telegram canal (8.000+ miembros)",
      "Co-branded landing /deals/sponsor-{slug}",
      "Setup + creatives gratis",
    ],
    envPriceId: "STRIPE_PRICE_SPONSOR_DEAL_WEEK",
    durationDays: 7,
  },
];

export const SPONSOR_TIER_SLUGS: SponsorTierSlug[] = SPONSOR_TIERS.map(
  (t) => t.slug,
);

export function getSponsorTier(slug: string): SponsorTier | undefined {
  return SPONSOR_TIERS.find((t) => t.slug === slug);
}

// ──────────────────────────────────────────────────────────────
// ACTIVE SPONSOR RECORDS (KV-backed)

export interface SponsorActive {
  /** Stripe checkout session id (idempotency key) */
  sessionId: string;
  tier: SponsorTierSlug;
  /** Brand name shown in slot (set por admin post-pago, default email) */
  brand: string;
  /** URL del sponsor destination */
  url: string;
  /** Logo URL pública (opcional, set via admin) */
  logoUrl?: string;
  /** 1-line tagline mostrado en slot */
  tagline?: string;
  /** Email del contact del sponsor (PII — NO se expone en /api/sponsors/active) */
  contactEmail: string;
  /** ISO timestamp activado (post-payment_intent.succeeded) */
  activatedAt: string;
  /** ISO timestamp cuándo expira */
  expiresAt: string;
  /** "pending_review" | "active" | "expired" — pending hasta admin lo aprueba */
  status: "pending_review" | "active" | "expired";
}

const SPONSOR_KV_NS = "sponsors";

function kv() {
  return createKV(SPONSOR_KV_NS);
}

function activeKey(sessionId: string): string {
  return `active:${sessionId}`;
}

function clickKey(sessionId: string): string {
  return `click:${sessionId}`;
}

function impressionKey(sessionId: string): string {
  return `impr:${sessionId}`;
}

export async function recordSponsorActivation(
  record: SponsorActive,
): Promise<boolean> {
  return await kv().set(activeKey(record.sessionId), record);
}

export async function getActiveSponsors(): Promise<SponsorActive[]> {
  const keys = await kv().scan("active:", 100);
  const out: SponsorActive[] = [];
  const now = Date.now();
  for (const k of keys) {
    const rec = await kv().get<SponsorActive>(k);
    if (!rec) continue;
    if (rec.status !== "active") continue;
    if (new Date(rec.expiresAt).getTime() < now) continue;
    out.push(rec);
  }
  return out;
}

export async function getSponsorBySessionId(
  sessionId: string,
): Promise<SponsorActive | null> {
  return await kv().get<SponsorActive>(activeKey(sessionId));
}

export async function updateSponsorStatus(
  sessionId: string,
  status: SponsorActive["status"],
  patch?: Partial<Pick<SponsorActive, "brand" | "url" | "logoUrl" | "tagline">>,
): Promise<boolean> {
  const cur = await getSponsorBySessionId(sessionId);
  if (!cur) return false;
  const next: SponsorActive = { ...cur, ...patch, status };
  return await kv().set(activeKey(sessionId), next);
}

export async function deleteSponsor(sessionId: string): Promise<boolean> {
  return await kv().del(activeKey(sessionId));
}

export async function incrementSponsorClicks(sessionId: string): Promise<number> {
  return await kv().incr(clickKey(sessionId));
}

export async function incrementSponsorImpressions(
  sessionId: string,
): Promise<number> {
  return await kv().incr(impressionKey(sessionId));
}

export async function getSponsorStats(
  sessionId: string,
): Promise<{ clicks: number; impressions: number }> {
  const clicks = (await kv().get<number>(clickKey(sessionId))) ?? 0;
  const impressions = (await kv().get<number>(impressionKey(sessionId))) ?? 0;
  return { clicks, impressions };
}

/**
 * Pick a sponsor to display in a rotating slot.
 * Deterministic round-robin basado en hash del page identifier.
 */
export function pickSponsorForSlot(
  sponsors: SponsorActive[],
  slotId: string,
): SponsorActive | null {
  if (!sponsors.length) return null;
  let hash = 0;
  for (let i = 0; i < slotId.length; i++) {
    hash = (hash * 31 + slotId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % sponsors.length;
  return sponsors[idx] ?? null;
}

/**
 * Public-facing sponsor (sin PII como contactEmail).
 */
export type SponsorPublic = Omit<SponsorActive, "contactEmail">;

export function toSponsorPublic(s: SponsorActive): SponsorPublic {
  const { contactEmail: _drop, ...pub } = s;
  void _drop;
  return pub;
}
