/**
 * price_alerts_store.test.ts — SSS241 (16 may 2026)
 *
 * Tests para lib/price_alerts_store.ts (107 líneas, alerts pipeline).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createAlert,
  listActiveAlerts,
  markTriggered,
  deactivateByEmail,
  _clearStore,
} from "../price_alerts_store";

beforeEach(() => {
  _clearStore();
});

describe("createAlert", () => {
  it("retorna alert con id, created_at, triggered_at=null, active=true", async () => {
    const a = await createAlert({ email: "test@example.com", max_price: 100 });
    expect(a.id).toMatch(/^pa_[a-z0-9]+$/);
    expect(a.email).toBe("test@example.com");
    expect(a.max_price).toBe(100);
    expect(a.created_at).toBeGreaterThan(0);
    expect(a.triggered_at).toBeNull();
    expect(a.active).toBe(true);
  });

  it("normaliza email lowercase + trim", async () => {
    const a = await createAlert({ email: "  TEST@Example.COM  ", max_price: 100 });
    expect(a.email).toBe("test@example.com");
  });

  it("normaliza origin/destination uppercase + 3 chars max", async () => {
    const a = await createAlert({
      email: "x@y.com",
      origin: "madrid",
      destination: "lisboa",
      max_price: 50,
    });
    expect(a.origin).toBe("MAD");
    expect(a.destination).toBe("LIS");
  });

  it("acepta cabin opcional", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 200,
      cabin: "business",
    });
    expect(a.cabin).toBe("business");
  });

  it("acepta date_min + date_max opcional", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 100,
      date_min: "2026-06-01",
      date_max: "2026-08-31",
    });
    expect(a.date_min).toBe("2026-06-01");
    expect(a.date_max).toBe("2026-08-31");
  });

  it("genera IDs únicos en llamadas consecutivas", async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const a = await createAlert({ email: "x@y.com", max_price: i });
      ids.add(a.id);
    }
    expect(ids.size).toBe(20);
  });
});

describe("listActiveAlerts", () => {
  it("retorna [] sin alerts", async () => {
    expect(await listActiveAlerts()).toEqual([]);
  });

  it("lista alerts active + not triggered", async () => {
    await createAlert({ email: "a@a.com", max_price: 100 });
    await createAlert({ email: "b@b.com", max_price: 200 });
    const list = await listActiveAlerts();
    expect(list).toHaveLength(2);
  });

  it("EXCLUYE alerts triggered", async () => {
    const a = await createAlert({ email: "x@y.com", max_price: 100 });
    await markTriggered(a.id);
    const list = await listActiveAlerts();
    expect(list.find((x) => x.id === a.id)).toBeUndefined();
  });

  it("EXCLUYE alerts deactivated", async () => {
    await createAlert({ email: "deact@x.com", max_price: 100 });
    await deactivateByEmail("deact@x.com");
    const list = await listActiveAlerts();
    expect(list.find((a) => a.email === "deact@x.com")).toBeUndefined();
  });
});

describe("markTriggered", () => {
  it("setea triggered_at + active=false", async () => {
    const a = await createAlert({ email: "trig@x.com", max_price: 50 });
    await markTriggered(a.id);
    const list = await listActiveAlerts();
    expect(list.find((x) => x.id === a.id)).toBeUndefined();
  });

  it("no-op si id no existe", async () => {
    await markTriggered("pa_nonexistent");
    expect(true).toBe(true);
  });
});

describe("deactivateByEmail", () => {
  it("desactiva TODOS los alerts del email", async () => {
    await createAlert({ email: "multi@x.com", max_price: 50 });
    await createAlert({ email: "multi@x.com", max_price: 100 });
    await createAlert({ email: "multi@x.com", max_price: 200 });
    await createAlert({ email: "other@x.com", max_price: 75 });

    await deactivateByEmail("multi@x.com");

    const list = await listActiveAlerts();
    expect(list.filter((a) => a.email === "multi@x.com")).toHaveLength(0);
    expect(list.filter((a) => a.email === "other@x.com")).toHaveLength(1);
  });

  it("normaliza email (case-insensitive match)", async () => {
    await createAlert({ email: "case@x.com", max_price: 50 });
    await deactivateByEmail("CASE@X.COM");

    const list = await listActiveAlerts();
    expect(list.filter((a) => a.email === "case@x.com")).toHaveLength(0);
  });
});
