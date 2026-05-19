/**
 * watchlist_store.test.ts — SSS314 (19 may 2026)
 *
 * Tests para el store in-memory de Premium Watch this deal.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createWatch,
  listActiveWatches,
  listWatchesByCustomer,
  deleteWatch,
  recordPriceCheck,
  markWatchTriggered,
  shouldTrigger,
  clampDropPct,
  WatchlistQuotaError,
  WATCHLIST_QUOTA,
  DEFAULT_DROP_PCT,
  MIN_DROP_PCT,
  MAX_DROP_PCT,
  _clearStore,
} from "../watchlist_store";

const SAMPLE = {
  customerId: "cus_TEST00000001",
  email: "x@y.com",
  deal_id: "deal_abc",
  origin: "BCN",
  destination: "JFK",
  price_when_added: 400,
};

describe("watchlist_store SSS314", () => {
  beforeEach(() => _clearStore());

  it("createWatch persiste defaults + normaliza email + IATA upper", async () => {
    const w = await createWatch({
      ...SAMPLE,
      email: "  USer@Mail.COM  ",
      origin: "bcn",
      destination: "jfk",
    });
    expect(w.id).toMatch(/^wl_/);
    expect(w.email).toBe("user@mail.com");
    expect(w.origin).toBe("BCN");
    expect(w.destination).toBe("JFK");
    expect(w.target_drop_pct).toBe(DEFAULT_DROP_PCT);
    expect(w.active).toBe(true);
    expect(w.triggered_at).toBeNull();
    expect(w.last_checked_at).toBeNull();
  });

  it("createWatch dedupe: misma deal_id activa devuelve la existente", async () => {
    const a = await createWatch(SAMPLE);
    const b = await createWatch(SAMPLE);
    expect(a.id).toBe(b.id);
  });

  it("createWatch falla con quota excedida", async () => {
    for (let i = 0; i < WATCHLIST_QUOTA; i++) {
      await createWatch({ ...SAMPLE, deal_id: `deal_${i}` });
    }
    await expect(
      createWatch({ ...SAMPLE, deal_id: "deal_overflow" }),
    ).rejects.toBeInstanceOf(WatchlistQuotaError);
  });

  it("createWatch sin customerId rechaza", async () => {
    await expect(
      createWatch({ ...SAMPLE, customerId: "" }),
    ).rejects.toThrow("customerId_required");
  });

  it("listWatchesByCustomer filtra por customerId", async () => {
    await createWatch({ ...SAMPLE, customerId: "cus_AAAA0000" });
    await createWatch({
      ...SAMPLE,
      customerId: "cus_BBBB0000",
      deal_id: "deal_b",
    });
    const a = await listWatchesByCustomer("cus_AAAA0000");
    expect(a.length).toBe(1);
    expect(a[0].customerId).toBe("cus_AAAA0000");
  });

  it("listActiveWatches excluye triggered + inactive", async () => {
    const a = await createWatch(SAMPLE);
    const b = await createWatch({ ...SAMPLE, deal_id: "deal_b" });
    await markWatchTriggered(a.id, 300);
    const active = await listActiveWatches();
    expect(active.length).toBe(1);
    expect(active[0].id).toBe(b.id);
  });

  it("deleteWatch requiere customerId match", async () => {
    const w = await createWatch(SAMPLE);
    const wrong = await deleteWatch(w.id, "cus_WRONGOWN0");
    expect(wrong).toBe(false);
    const right = await deleteWatch(w.id, SAMPLE.customerId);
    expect(right).toBe(true);
    // Tras delete debería ser inactive (no listable como active)
    const active = await listActiveWatches();
    expect(active.find((x) => x.id === w.id)).toBeUndefined();
  });

  it("recordPriceCheck actualiza last_checked_at + last_seen_price", async () => {
    const w = await createWatch(SAMPLE);
    await recordPriceCheck(w.id, 350.5);
    const list = await listWatchesByCustomer(SAMPLE.customerId);
    expect(list[0].last_seen_price).toBe(350.5);
    expect(list[0].last_checked_at).toBeTypeOf("number");
  });

  it("markWatchTriggered desactiva entry + sets triggered_price", async () => {
    const w = await createWatch(SAMPLE);
    await markWatchTriggered(w.id, 320);
    const list = await listWatchesByCustomer(SAMPLE.customerId);
    expect(list[0].active).toBe(false);
    expect(list[0].triggered_at).toBeTypeOf("number");
    expect(list[0].triggered_price).toBe(320);
  });
});

describe("shouldTrigger SSS314", () => {
  const baseEntry = {
    id: "wl_x",
    customerId: "cus_X",
    email: "x@y.com",
    deal_id: "d_1",
    origin: "BCN",
    destination: "JFK",
    price_when_added: 400,
    target_drop_pct: 10,
    created_at: 0,
    last_checked_at: null,
    last_seen_price: null,
    triggered_at: null,
    active: true,
  };

  it("dispara si precio bajó exactamente el threshold", () => {
    // 10% de 400 = 360
    expect(shouldTrigger(baseEntry, 360)).toBe(true);
    expect(shouldTrigger(baseEntry, 359.99)).toBe(true);
  });

  it("no dispara si bajada < threshold", () => {
    // 5% < 10%
    expect(shouldTrigger(baseEntry, 380)).toBe(false);
  });

  it("no dispara si precio sube", () => {
    expect(shouldTrigger(baseEntry, 500)).toBe(false);
  });

  it("no dispara si watch ya triggered", () => {
    expect(
      shouldTrigger({ ...baseEntry, triggered_at: Date.now() }, 200),
    ).toBe(false);
  });

  it("no dispara si watch inactive", () => {
    expect(shouldTrigger({ ...baseEntry, active: false }, 200)).toBe(false);
  });

  it("no dispara con precio observado <= 0 (datos basura)", () => {
    expect(shouldTrigger(baseEntry, 0)).toBe(false);
    expect(shouldTrigger(baseEntry, -50)).toBe(false);
    expect(shouldTrigger(baseEntry, NaN)).toBe(false);
  });

  it("no dispara con price_when_added <= 0 (defense edge case)", () => {
    expect(shouldTrigger({ ...baseEntry, price_when_added: 0 }, 100)).toBe(false);
  });

  it("threshold custom 30% solo dispara en grandes drops", () => {
    const big = { ...baseEntry, target_drop_pct: 30 };
    expect(shouldTrigger(big, 320)).toBe(false); // -20%
    expect(shouldTrigger(big, 280)).toBe(true); // -30%
  });
});

describe("clampDropPct SSS314", () => {
  it("clampa a min", () => {
    expect(clampDropPct(1)).toBe(MIN_DROP_PCT);
    expect(clampDropPct(-50)).toBe(MIN_DROP_PCT);
  });
  it("clampa a max", () => {
    expect(clampDropPct(200)).toBe(MAX_DROP_PCT);
  });
  it("redondea", () => {
    expect(clampDropPct(10.4)).toBe(10);
    expect(clampDropPct(10.6)).toBe(11);
  });
  it("NaN → default", () => {
    expect(clampDropPct(NaN)).toBe(DEFAULT_DROP_PCT);
  });
});
