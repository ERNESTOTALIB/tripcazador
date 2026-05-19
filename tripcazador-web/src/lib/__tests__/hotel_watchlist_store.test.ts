/**
 * hotel_watchlist_store.test.ts — SSS323
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createHotelWatch,
  listHotelWatchesByCustomer,
  listActiveHotelWatches,
  deleteHotelWatch,
  markHotelWatchTriggered,
  recordHotelPriceCheck,
  shouldTriggerHotel,
  clampHotelDropPct,
  HotelWatchQuotaError,
  HOTEL_WATCH_QUOTA,
  HOTEL_DEFAULT_DROP_PCT,
  HOTEL_MIN_DROP_PCT,
  HOTEL_MAX_DROP_PCT,
  _clearStore,
} from "../hotel_watchlist_store";

const SAMPLE = {
  customerId: "cus_TEST00000001",
  email: "x@y.com",
  city: "LIS",
  date_in: "2026-08-15",
  date_out: "2026-08-17",
  price_per_night_baseline: 80,
};

describe("hotel_watchlist_store SSS323", () => {
  beforeEach(() => _clearStore());

  it("createHotelWatch persiste defaults + normaliza city/email", async () => {
    const w = await createHotelWatch({
      ...SAMPLE,
      email: "  USER@Mail.COM  ",
      city: "lis",
    });
    expect(w.id).toMatch(/^hw_/);
    expect(w.email).toBe("user@mail.com");
    expect(w.city).toBe("LIS");
    expect(w.target_drop_pct).toBe(HOTEL_DEFAULT_DROP_PCT);
    expect(w.active).toBe(true);
  });

  it("dedupe city + fechas activo devuelve mismo entry", async () => {
    const a = await createHotelWatch(SAMPLE);
    const b = await createHotelWatch(SAMPLE);
    expect(a.id).toBe(b.id);
  });

  it("rechaza fechas invertidas", async () => {
    await expect(
      createHotelWatch({ ...SAMPLE, date_in: "2026-08-17", date_out: "2026-08-15" }),
    ).rejects.toThrow(/date_range_invalid/);
  });

  it("quota excedida tira HotelWatchQuotaError", async () => {
    for (let i = 0; i < HOTEL_WATCH_QUOTA; i++) {
      await createHotelWatch({
        ...SAMPLE,
        city: `C${String(i).padStart(2, "0")}`.toUpperCase(),
      });
    }
    await expect(
      createHotelWatch({ ...SAMPLE, city: "OVR" }),
    ).rejects.toBeInstanceOf(HotelWatchQuotaError);
  });

  it("listActiveHotelWatches excluye triggered + inactive", async () => {
    const a = await createHotelWatch(SAMPLE);
    const b = await createHotelWatch({ ...SAMPLE, city: "BCN" });
    await markHotelWatchTriggered(a.id, 50);
    const active = await listActiveHotelWatches();
    expect(active.map((x) => x.id)).toContain(b.id);
    expect(active.map((x) => x.id)).not.toContain(a.id);
  });

  it("deleteHotelWatch auth match", async () => {
    const w = await createHotelWatch(SAMPLE);
    expect(await deleteHotelWatch(w.id, "cus_WRONG000001")).toBe(false);
    expect(await deleteHotelWatch(w.id, SAMPLE.customerId)).toBe(true);
  });

  it("recordHotelPriceCheck setea last_seen_ppn + last_checked_at", async () => {
    const w = await createHotelWatch(SAMPLE);
    await recordHotelPriceCheck(w.id, 65.5);
    const list = await listHotelWatchesByCustomer(SAMPLE.customerId);
    expect(list[0].last_seen_ppn).toBe(65.5);
    expect(list[0].last_checked_at).toBeTypeOf("number");
  });
});

describe("shouldTriggerHotel SSS323", () => {
  const base = {
    id: "hw_x",
    customerId: "cus_X",
    email: "x@y.com",
    city: "LIS",
    date_in: "2026-08-15",
    date_out: "2026-08-17",
    price_per_night_baseline: 80,
    target_drop_pct: 10,
    created_at: 0,
    last_checked_at: null,
    last_seen_ppn: null,
    triggered_at: null,
    active: true,
  };

  it("dispara cuando bajada >= threshold", () => {
    expect(shouldTriggerHotel(base, 72)).toBe(true); // exact 10%
    expect(shouldTriggerHotel(base, 60)).toBe(true); // 25%
  });

  it("no dispara con bajada < threshold", () => {
    expect(shouldTriggerHotel(base, 75)).toBe(false); // 6.25%
  });

  it("no dispara si triggered", () => {
    expect(shouldTriggerHotel({ ...base, triggered_at: 1 }, 50)).toBe(false);
  });

  it("no dispara si inactive", () => {
    expect(shouldTriggerHotel({ ...base, active: false }, 50)).toBe(false);
  });

  it("no dispara con observedPpn <= 0", () => {
    expect(shouldTriggerHotel(base, 0)).toBe(false);
    expect(shouldTriggerHotel(base, -5)).toBe(false);
  });
});

describe("clampHotelDropPct SSS323", () => {
  it("clampa a min/max", () => {
    expect(clampHotelDropPct(1)).toBe(HOTEL_MIN_DROP_PCT);
    expect(clampHotelDropPct(99)).toBe(HOTEL_MAX_DROP_PCT);
  });
  it("redondea", () => {
    expect(clampHotelDropPct(10.4)).toBe(10);
  });
  it("NaN → default", () => {
    expect(clampHotelDropPct(NaN)).toBe(HOTEL_DEFAULT_DROP_PCT);
  });
});
