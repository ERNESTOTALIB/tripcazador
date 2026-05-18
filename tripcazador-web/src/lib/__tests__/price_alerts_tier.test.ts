/**
 * price_alerts_tier.test.ts — SSS302 (18 may 2026)
 *
 * Tests para tier-awareness + quota enforcement en price_alerts_store.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createAlert,
  listActiveAlerts,
  listActiveAlertsByTier,
  listAlertsByCustomer,
  countActiveByEmail,
  deleteAlert,
  QuotaExceededError,
  FREE_TIER_ALERT_QUOTA,
  _clearStore,
} from "../price_alerts_store";

describe("price_alerts_store SSS302 tier", () => {
  beforeEach(() => _clearStore());

  it("createAlert default tier = free", async () => {
    const a = await createAlert({ email: "x@y.com", max_price: 100 });
    expect(a.tier).toBe("free");
    expect(a.customerId).toBeUndefined();
  });

  it("createAlert tier=premium + customerId persiste", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_abc123",
    });
    expect(a.tier).toBe("premium");
    expect(a.customerId).toBe("cs_live_abc123");
  });

  it(`free tier quota enforced at ${FREE_TIER_ALERT_QUOTA} alertas`, async () => {
    for (let i = 0; i < FREE_TIER_ALERT_QUOTA; i++) {
      await createAlert({ email: "limit@y.com", max_price: 100 + i });
    }
    await expect(
      createAlert({ email: "limit@y.com", max_price: 999 }),
    ).rejects.toThrow(QuotaExceededError);
  });

  it("Premium NO está sujeto al quota gratis", async () => {
    for (let i = 0; i < FREE_TIER_ALERT_QUOTA + 5; i++) {
      await createAlert({
        email: "premium@y.com",
        max_price: 100 + i,
        tier: "premium",
        customerId: "cs_live_premium",
      });
    }
    const alerts = await listAlertsByCustomer("cs_live_premium");
    expect(alerts.length).toBe(FREE_TIER_ALERT_QUOTA + 5);
  });

  it("countActiveByEmail solo cuenta activas + no triggered", async () => {
    await createAlert({ email: "count@y.com", max_price: 100 });
    await createAlert({ email: "count@y.com", max_price: 200 });
    expect(await countActiveByEmail("count@y.com")).toBe(2);
  });

  it("countActiveByEmail es case-insensitive", async () => {
    await createAlert({ email: "Mixed@Y.com", max_price: 100 });
    expect(await countActiveByEmail("MIXED@y.com")).toBe(1);
  });

  it("listActiveAlertsByTier free/premium separados", async () => {
    await createAlert({ email: "f@y.com", max_price: 100 });
    await createAlert({
      email: "p@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_p1",
    });
    const free = await listActiveAlertsByTier("free");
    const prem = await listActiveAlertsByTier("premium");
    expect(free.length).toBe(1);
    expect(prem.length).toBe(1);
    expect(free[0].tier).toBe("free");
    expect(prem[0].tier).toBe("premium");
  });

  it("listAlertsByCustomer filtra por customerId", async () => {
    await createAlert({
      email: "a@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_a",
    });
    await createAlert({
      email: "b@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_b",
    });
    const a = await listAlertsByCustomer("cs_live_a");
    const b = await listAlertsByCustomer("cs_live_b");
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
    expect(a[0].email).toBe("a@y.com");
    expect(b[0].email).toBe("b@y.com");
  });

  it("listAlertsByCustomer con customerId vacío devuelve []", async () => {
    const r = await listAlertsByCustomer("");
    expect(r).toEqual([]);
  });

  it("deleteAlert sin customerId desactiva (compat gratis)", async () => {
    const a = await createAlert({ email: "x@y.com", max_price: 100 });
    const ok = await deleteAlert(a.id);
    expect(ok).toBe(true);
    expect((await listActiveAlerts()).length).toBe(0);
  });

  it("deleteAlert exige customerId match para Premium", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_owner",
    });
    // Customer wrong → no borra
    const failed = await deleteAlert(a.id, "cs_live_intruder");
    expect(failed).toBe(false);
    // Customer correcto → borra
    const ok = await deleteAlert(a.id, "cs_live_owner");
    expect(ok).toBe(true);
  });

  it("deleteAlert id inexistente devuelve false", async () => {
    const ok = await deleteAlert("pa_doesnotexist");
    expect(ok).toBe(false);
  });

  it("createAlert tier=premium IGNORA customerId si tier !== premium", async () => {
    // @ts-expect-error testing edge: tier explícito free pero customerId pasado
    const a = await createAlert({
      email: "x@y.com",
      max_price: 100,
      tier: "free",
      customerId: "cs_live_should_be_ignored",
    });
    expect(a.tier).toBe("free");
    expect(a.customerId).toBeUndefined();
  });

  it("QuotaExceededError trae limit + currentCount", async () => {
    for (let i = 0; i < FREE_TIER_ALERT_QUOTA; i++) {
      await createAlert({ email: "e@y.com", max_price: 100 + i });
    }
    try {
      await createAlert({ email: "e@y.com", max_price: 500 });
      expect.fail("should throw");
    } catch (err) {
      expect(err).toBeInstanceOf(QuotaExceededError);
      const e = err as QuotaExceededError;
      expect(e.limit).toBe(FREE_TIER_ALERT_QUOTA);
      expect(e.currentCount).toBe(FREE_TIER_ALERT_QUOTA);
    }
  });
});
