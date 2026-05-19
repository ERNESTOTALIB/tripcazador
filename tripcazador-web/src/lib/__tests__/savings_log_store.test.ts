/**
 * savings_log_store.test.ts — SSS315 (19 may 2026)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  logSavings,
  listSavingsByCustomer,
  summarize,
  _clearStore,
  type SavingsEntry,
} from "../savings_log_store";

const CUSTOMER = "cus_TEST00000001";

describe("savings_log_store SSS315 logSavings", () => {
  beforeEach(() => _clearStore());

  it("logSavings persiste entry redondeado a 2 decimales", async () => {
    const e = await logSavings({
      customerId: CUSTOMER,
      email: "x@y.com",
      deal_id: "d_1",
      origin: "BCN",
      destination: "JFK",
      savings_eur: 87.555,
      source: "alert",
    });
    expect(e).not.toBeNull();
    expect(e!.savings_eur).toBe(87.56);
    expect(e!.id).toMatch(/^sv_/);
  });

  it("rechaza savings <= 0 (silencioso → null)", async () => {
    expect(
      await logSavings({
        customerId: CUSTOMER,
        email: "x@y.com",
        deal_id: "d_1",
        savings_eur: 0,
        source: "alert",
      }),
    ).toBeNull();
    expect(
      await logSavings({
        customerId: CUSTOMER,
        email: "x@y.com",
        deal_id: "d_1",
        savings_eur: -10,
        source: "alert",
      }),
    ).toBeNull();
  });

  it("rechaza customerId vacío", async () => {
    const r = await logSavings({
      customerId: "",
      email: "x@y.com",
      deal_id: "d_1",
      savings_eur: 50,
      source: "alert",
    });
    expect(r).toBeNull();
  });

  it("listSavingsByCustomer filtra por customer", async () => {
    await logSavings({
      customerId: "cus_A",
      email: "a@y.com",
      deal_id: "d_1",
      savings_eur: 50,
      source: "alert",
    });
    await logSavings({
      customerId: "cus_B",
      email: "b@y.com",
      deal_id: "d_2",
      savings_eur: 75,
      source: "watch",
    });
    const aOnly = await listSavingsByCustomer("cus_A");
    expect(aOnly.length).toBe(1);
    expect(aOnly[0].savings_eur).toBe(50);
  });
});

describe("summarize SSS315", () => {
  const NOW = new Date("2026-05-19T12:00:00Z").getTime();

  function mkEntry(savings: number, daysAgo: number, source: "alert" | "watch" = "alert"): SavingsEntry {
    return {
      id: `sv_${Math.random()}`,
      customerId: "cus_X",
      email: "x@y.com",
      deal_id: "d",
      savings_eur: savings,
      source,
      ts: NOW - daysAgo * 86_400_000,
    };
  }

  it("vacío devuelve zeros", () => {
    const s = summarize([], NOW);
    expect(s.total_eur).toBe(0);
    expect(s.count).toBe(0);
    expect(s.first_trigger_at).toBeNull();
    expect(s.biggest_savings_eur).toBe(0);
  });

  it("suma total y descompone por source", () => {
    const entries = [
      mkEntry(100, 1, "alert"),
      mkEntry(50, 5, "alert"),
      mkEntry(80, 10, "watch"),
    ];
    const s = summarize(entries, NOW);
    expect(s.total_eur).toBe(230);
    expect(s.count).toBe(3);
    expect(s.by_source.alert).toBe(150);
    expect(s.by_source.watch).toBe(80);
    expect(s.avg_per_trigger_eur).toBeCloseTo(76.67, 1);
    expect(s.biggest_savings_eur).toBe(100);
  });

  it("filtra últimos 30d y 90d", () => {
    const entries = [
      mkEntry(50, 10, "alert"), // 30d ✓ 90d ✓
      mkEntry(80, 45, "alert"), // 30d ✗ 90d ✓
      mkEntry(120, 100, "watch"), // 30d ✗ 90d ✗
    ];
    const s = summarize(entries, NOW);
    expect(s.last_30d_eur).toBe(50);
    expect(s.last_30d_count).toBe(1);
    expect(s.last_90d_eur).toBe(130);
    expect(s.last_90d_count).toBe(2);
    expect(s.total_eur).toBe(250);
  });

  it("first_trigger_at = ts más antiguo", () => {
    const oldest = NOW - 200 * 86_400_000;
    const entries = [mkEntry(50, 10), mkEntry(75, 5), mkEntry(100, 200)];
    const s = summarize(entries, NOW);
    expect(s.first_trigger_at).toBe(oldest);
  });
});
