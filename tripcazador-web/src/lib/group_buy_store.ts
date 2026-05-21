/**
 * group_buy_store.ts — SSS370 (21 may 2026)
 *
 * "Compra grupal" feature: si 10+ Premium subs muestran interés en mismo deal,
 * Concierge negocia descuento bulk con la aerolínea.
 *
 * Flow:
 *   1. User clica "Interesado" en deal detail → joinGroupBuy()
 *   2. Cuando un deal acumula 10+ interesados → trigger Concierge alert
 *   3. Concierge contacta aerolínea (manual) → si aceptan descuento, manda
 *      email/push a todos los interesados con discount code
 *   4. Cada user reserva con el code dentro de 48h
 *
 * Stake: viral signature feature único. Convierte deals individuales en
 * comunidad. Aumenta retention Premium.
 */

export interface GroupBuyInterest {
  customer_id: string;
  deal_id: string;
  joined_at: number;
  email?: string;
  notes?: string;
  travelers?: number;
}

export interface GroupBuySnapshot {
  deal_id: string;
  total_interested: number;
  total_travelers: number;
  threshold: number;
  status: "open" | "triggered" | "negotiating" | "completed" | "expired";
  triggered_at?: number;
  discount_pct?: number;
  discount_code?: string;
  expires_at?: number;
}

const THRESHOLD = 10;

const interestStore: { entries: GroupBuyInterest[] } = (
  globalThis as unknown as { __tc_group_buy?: { entries: GroupBuyInterest[] } }
).__tc_group_buy ?? { entries: [] };
(globalThis as unknown as { __tc_group_buy: typeof interestStore }).__tc_group_buy = interestStore;

const snapshotStore: { snapshots: Map<string, GroupBuySnapshot> } = (
  globalThis as unknown as { __tc_group_buy_snap?: { snapshots: Map<string, GroupBuySnapshot> } }
).__tc_group_buy_snap ?? { snapshots: new Map() };
(globalThis as unknown as { __tc_group_buy_snap: typeof snapshotStore }).__tc_group_buy_snap =
  snapshotStore;

export function joinGroupBuy(opts: {
  customer_id: string;
  deal_id: string;
  email?: string;
  travelers?: number;
  notes?: string;
}): { joined: boolean; snapshot: GroupBuySnapshot } {
  // Dedupe — un customer solo puede estar 1 vez por deal
  const existing = interestStore.entries.find(
    (e) => e.customer_id === opts.customer_id && e.deal_id === opts.deal_id,
  );
  if (!existing) {
    interestStore.entries.push({
      customer_id: opts.customer_id,
      deal_id: opts.deal_id,
      joined_at: Date.now(),
      email: opts.email,
      travelers: opts.travelers ?? 1,
      notes: opts.notes,
    });
  }
  return { joined: !existing, snapshot: getSnapshot(opts.deal_id) };
}

export function leaveGroupBuy(customerId: string, dealId: string): boolean {
  const idx = interestStore.entries.findIndex(
    (e) => e.customer_id === customerId && e.deal_id === dealId,
  );
  if (idx < 0) return false;
  interestStore.entries.splice(idx, 1);
  return true;
}

export function getSnapshot(dealId: string): GroupBuySnapshot {
  const entries = interestStore.entries.filter((e) => e.deal_id === dealId);
  const totalInterested = entries.length;
  const totalTravelers = entries.reduce((acc, e) => acc + (e.travelers || 1), 0);

  let snapshot = snapshotStore.snapshots.get(dealId);
  if (!snapshot) {
    snapshot = {
      deal_id: dealId,
      total_interested: 0,
      total_travelers: 0,
      threshold: THRESHOLD,
      status: "open",
    };
    snapshotStore.snapshots.set(dealId, snapshot);
  }

  snapshot.total_interested = totalInterested;
  snapshot.total_travelers = totalTravelers;

  // Auto-trigger cuando cruzamos threshold
  if (
    snapshot.status === "open" &&
    totalInterested >= THRESHOLD &&
    !snapshot.triggered_at
  ) {
    snapshot.status = "triggered";
    snapshot.triggered_at = Date.now();
  }

  return snapshot;
}

export function markNegotiating(dealId: string): boolean {
  const snap = snapshotStore.snapshots.get(dealId);
  if (!snap || snap.status !== "triggered") return false;
  snap.status = "negotiating";
  return true;
}

export function completeWithDiscount(
  dealId: string,
  discountPct: number,
  discountCode: string,
  expiresAtMs: number,
): boolean {
  const snap = snapshotStore.snapshots.get(dealId);
  if (!snap) return false;
  snap.status = "completed";
  snap.discount_pct = discountPct;
  snap.discount_code = discountCode;
  snap.expires_at = expiresAtMs;
  return true;
}

export function listOpenBuysCloseToTrigger(minInterested = 7): GroupBuySnapshot[] {
  return Array.from(snapshotStore.snapshots.values())
    .filter((s) => s.status === "open" && s.total_interested >= minInterested)
    .sort((a, b) => b.total_interested - a.total_interested);
}

export function getInterestForCustomer(customerId: string): GroupBuyInterest[] {
  return interestStore.entries.filter((e) => e.customer_id === customerId);
}
