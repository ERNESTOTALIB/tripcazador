/**
 * loyalty_points.ts — SSS367 (21 may 2026)
 *
 * Sistema "Cazador Points" — gamificación que aumenta retention.
 *
 * Acciones que ganan puntos:
 *   - newsletter_signup: 50 pts
 *   - first_premium_signup: 200 pts
 *   - refer_friend_who_signed_up: 500 pts
 *   - daily_login: 5 pts
 *   - share_deal: 10 pts
 *   - watch_deal_added: 15 pts
 *   - alert_triggered_booked: 100 pts (genera revenue real)
 *   - review_submitted_approved: 100 pts
 *   - complete_profile: 25 pts
 *   - whatsapp_opt_in: 30 pts
 *
 * Canjes:
 *   - 500 pts → 1 mes Premium gratis
 *   - 1000 pts → 3 meses Premium gratis
 *   - 2500 pts → 1 año Premium + Concierge Express incluido
 *   - 5000 pts → Lifetime Premium
 */

export type PointsAction =
  | "newsletter_signup"
  | "first_premium_signup"
  | "refer_friend"
  | "daily_login"
  | "share_deal"
  | "watch_deal_added"
  | "alert_triggered_booked"
  | "review_submitted"
  | "complete_profile"
  | "whatsapp_opt_in";

export const POINTS_TABLE: Record<PointsAction, number> = {
  newsletter_signup: 50,
  first_premium_signup: 200,
  refer_friend: 500,
  daily_login: 5,
  share_deal: 10,
  watch_deal_added: 15,
  alert_triggered_booked: 100,
  review_submitted: 100,
  complete_profile: 25,
  whatsapp_opt_in: 30,
};

export interface RedeemTier {
  threshold: number;
  reward: string;
  perk: string;
  /** Stripe price ID o "manual" (admin grants) */
  reward_type: "premium_1mo" | "premium_3mo" | "premium_1y_plus_express" | "premium_lifetime";
}

export const REDEEM_TIERS: RedeemTier[] = [
  { threshold: 500, reward: "1 mes Premium gratis", perk: "🎁", reward_type: "premium_1mo" },
  { threshold: 1000, reward: "3 meses Premium gratis", perk: "🎁🎁", reward_type: "premium_3mo" },
  {
    threshold: 2500,
    reward: "1 año Premium + Concierge Express incluido",
    perk: "👑",
    reward_type: "premium_1y_plus_express",
  },
  { threshold: 5000, reward: "Premium de por vida", perk: "💎", reward_type: "premium_lifetime" },
];

export interface PointsEntry {
  customer_id: string;
  total_points: number;
  history: Array<{
    action: PointsAction;
    points: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>;
  redemptions: Array<{
    tier: RedeemTier["reward_type"];
    points_spent: number;
    redeemed_at: number;
  }>;
  last_login_date?: string; // YYYY-MM-DD for daily_login dedupe
  created_at: number;
}

const store: { entries: Map<string, PointsEntry> } = (
  globalThis as unknown as { __tc_loyalty?: { entries: Map<string, PointsEntry> } }
).__tc_loyalty ?? { entries: new Map() };
(globalThis as unknown as { __tc_loyalty: typeof store }).__tc_loyalty = store;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getOrCreate(customerId: string): PointsEntry {
  let entry = store.entries.get(customerId);
  if (!entry) {
    entry = {
      customer_id: customerId,
      total_points: 0,
      history: [],
      redemptions: [],
      created_at: Date.now(),
    };
    store.entries.set(customerId, entry);
  }
  return entry;
}

export function awardPoints(
  customerId: string,
  action: PointsAction,
  metadata?: Record<string, unknown>,
): { awarded: number; new_total: number; reason?: string } {
  const entry = getOrCreate(customerId);
  const points = POINTS_TABLE[action] ?? 0;

  // Dedupe daily_login (max 1/day)
  if (action === "daily_login") {
    if (entry.last_login_date === todayKey()) {
      return { awarded: 0, new_total: entry.total_points, reason: "already_today" };
    }
    entry.last_login_date = todayKey();
  }

  // Dedupe first_premium_signup
  if (action === "first_premium_signup") {
    if (entry.history.some((h) => h.action === "first_premium_signup")) {
      return { awarded: 0, new_total: entry.total_points, reason: "already_awarded" };
    }
  }

  entry.total_points += points;
  entry.history.push({ action, points, timestamp: Date.now(), metadata });
  return { awarded: points, new_total: entry.total_points };
}

export function getNextTier(currentPoints: number): RedeemTier | null {
  const next = REDEEM_TIERS.find((t) => t.threshold > currentPoints);
  return next ?? null;
}

export function getEligibleTiers(currentPoints: number): RedeemTier[] {
  return REDEEM_TIERS.filter((t) => t.threshold <= currentPoints);
}

export function redeem(
  customerId: string,
  tierType: RedeemTier["reward_type"],
): { ok: boolean; tier?: RedeemTier; new_total?: number; error?: string } {
  const entry = getOrCreate(customerId);
  const tier = REDEEM_TIERS.find((t) => t.reward_type === tierType);
  if (!tier) return { ok: false, error: "invalid_tier" };
  if (entry.total_points < tier.threshold) {
    return { ok: false, error: "insufficient_points" };
  }
  entry.total_points -= tier.threshold;
  entry.redemptions.push({
    tier: tierType,
    points_spent: tier.threshold,
    redeemed_at: Date.now(),
  });
  return { ok: true, tier, new_total: entry.total_points };
}

export function getEntry(customerId: string): PointsEntry | null {
  return store.entries.get(customerId) ?? null;
}

export function leaderboardTop(limit = 10): Array<{ customer_id: string; total_points: number }> {
  return Array.from(store.entries.values())
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit)
    .map((e) => ({ customer_id: e.customer_id, total_points: e.total_points }));
}
