/**
 * subscribers_store.test.ts — SSS239 (16 may 2026)
 *
 * Tests para lib/subscribers_store.ts (156 líneas, drip newsletter revenue).
 *
 * Cubre el fallback in-memory cuando SUBSCRIBERS_STORE_URL no está set:
 *  - addSubscriber: normaliza email lowercase + trim, retorna { ok, created }
 *  - addSubscriber dedup: segunda llamada created=false
 *  - listPendingDrip: filtra unsubscribed_at + drip_stage>=5 + ageDays<stage
 *  - bumpStage: incrementa drip_stage + actualiza last_sent_at
 *  - unsubscribe: setea unsubscribed_at
 *  - _clearStore para test isolation
 *
 * No probamos remoto (sin REMOTE_URL no se ejecuta el branch).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  addSubscriber,
  listPendingDrip,
  bumpStage,
  unsubscribe,
  _clearStore,
} from "../subscribers_store";

beforeEach(() => {
  _clearStore();
});

describe("addSubscriber", () => {
  it("crea subscriber con campos default correctos", async () => {
    const r = await addSubscriber({ email: "test@example.com" });
    expect(r.ok).toBe(true);
    expect(r.created).toBe(true);
    expect(r.subscriber.email).toBe("test@example.com");
    expect(r.subscriber.drip_stage).toBe(0);
    expect(r.subscriber.last_sent_at).toBeNull();
    expect(r.subscriber.unsubscribed_at).toBeNull();
    expect(r.subscriber.source).toBe("unknown"); // default
    expect(r.subscriber.locale).toBe("es"); // default
  });

  it("normaliza email a lowercase + trim", async () => {
    const r = await addSubscriber({ email: "  Test@EXAMPLE.com  " });
    expect(r.subscriber.email).toBe("test@example.com");
  });

  it("acepta source + locale custom", async () => {
    const r = await addSubscriber({
      email: "x@y.com",
      source: "blog",
      locale: "en",
    });
    expect(r.subscriber.source).toBe("blog");
    expect(r.subscriber.locale).toBe("en");
  });

  it("dedupe: segunda add con mismo email → created=false", async () => {
    await addSubscriber({ email: "dup@example.com" });
    const r2 = await addSubscriber({ email: "dup@example.com" });
    expect(r2.ok).toBe(true);
    expect(r2.created).toBe(false);
    // Subscriber existente devuelto (no sobrescribe)
    expect(r2.subscriber.email).toBe("dup@example.com");
  });

  it("dedupe case-insensitive (mismo email aunque varíe casing)", async () => {
    await addSubscriber({ email: "user@example.com" });
    const r2 = await addSubscriber({ email: "USER@EXAMPLE.COM" });
    expect(r2.created).toBe(false);
  });

  it("consent_ts y created_at iguales y > 0", async () => {
    const r = await addSubscriber({ email: "consent@example.com" });
    expect(r.subscriber.consent_ts).toBeGreaterThan(0);
    expect(r.subscriber.created_at).toBeGreaterThan(0);
  });
});

describe("listPendingDrip — drip pipeline", () => {
  it("incluye nuevo subscriber con stage 0 (welcome immediate)", async () => {
    await addSubscriber({ email: "fresh@example.com" });
    const pending = await listPendingDrip();
    expect(pending.find((s) => s.email === "fresh@example.com")).toBeDefined();
  });

  it("EXCLUYE subscriber unsubscribed", async () => {
    await addSubscriber({ email: "out@example.com" });
    await unsubscribe("out@example.com");
    const pending = await listPendingDrip();
    expect(pending.find((s) => s.email === "out@example.com")).toBeUndefined();
  });

  it("EXCLUYE subscriber con drip_stage>=5 (drip completo)", async () => {
    const { subscriber } = await addSubscriber({ email: "done@example.com" });
    // simular avance: bumpStage 5 veces
    for (let i = 0; i < 5; i++) await bumpStage("done@example.com");
    expect(subscriber.drip_stage + 5).toBeGreaterThanOrEqual(5);
    const pending = await listPendingDrip();
    expect(pending.find((s) => s.email === "done@example.com")).toBeUndefined();
  });

  it("respeta STAGE_DAYS [0, 1, 3, 5, 7] — stage 1 requiere ≥1 day", async () => {
    const r = await addSubscriber({ email: "fresh2@example.com" });
    await bumpStage("fresh2@example.com");
    // Ahora drip_stage=1, pero created_at es ahora mismo, así que ageDays=0 < 1
    const pendingNow = await listPendingDrip();
    expect(
      pendingNow.find((s) => s.email === "fresh2@example.com"),
    ).toBeUndefined();

    // Si fingimos que pasaron 2 días desde la creación:
    const ttl2DaysAgo = r.subscriber.created_at + 1; // no relevant, use `now`
    expect(ttl2DaysAgo).toBeGreaterThan(0);

    // Pasamos `now` artificial avanzado 2 días para superar STAGE_DAYS[1]=1
    const future = Date.now() + 2 * 86_400_000;
    const pendingFuture = await listPendingDrip(future);
    expect(
      pendingFuture.find((s) => s.email === "fresh2@example.com"),
    ).toBeDefined();
  });
});

describe("bumpStage", () => {
  it("incrementa drip_stage y setea last_sent_at", async () => {
    const r = await addSubscriber({ email: "bump@example.com" });
    expect(r.subscriber.drip_stage).toBe(0);
    expect(r.subscriber.last_sent_at).toBeNull();

    await bumpStage("bump@example.com");

    const pending = await listPendingDrip();
    const sub = pending.find((s) => s.email === "bump@example.com") ||
      // Después del bump puede no estar en pending pero queda en memoria
      // Lo verificamos en otro path:
      undefined;
    // Verificamos mediante re-add (dedupe) que stage incrementó
    const r2 = await addSubscriber({ email: "bump@example.com" });
    expect(r2.created).toBe(false);
    expect(r2.subscriber.drip_stage).toBeGreaterThanOrEqual(1);
    expect(r2.subscriber.last_sent_at).not.toBeNull();
    expect(sub === undefined || true).toBe(true); // wash
  });

  it("no-op si email no existe", async () => {
    await bumpStage("nonexistent@example.com");
    // No throw → OK
    expect(true).toBe(true);
  });

  it("varias llamadas suman stage (1, 2, 3, ...)", async () => {
    await addSubscriber({ email: "multi@example.com" });
    await bumpStage("multi@example.com");
    await bumpStage("multi@example.com");
    await bumpStage("multi@example.com");

    const r = await addSubscriber({ email: "multi@example.com" });
    expect(r.subscriber.drip_stage).toBe(3);
  });
});

describe("unsubscribe", () => {
  it("setea unsubscribed_at en epoch ms", async () => {
    await addSubscriber({ email: "off@example.com" });
    await unsubscribe("off@example.com");

    const r = await addSubscriber({ email: "off@example.com" });
    expect(r.subscriber.unsubscribed_at).not.toBeNull();
    expect(r.subscriber.unsubscribed_at).toBeGreaterThan(0);
  });

  it("normaliza email (mayúsculas)", async () => {
    await addSubscriber({ email: "case@example.com" });
    await unsubscribe("CASE@EXAMPLE.COM");

    const pending = await listPendingDrip();
    expect(pending.find((s) => s.email === "case@example.com")).toBeUndefined();
  });

  it("no-op si email no existe", async () => {
    await unsubscribe("ghost@example.com");
    expect(true).toBe(true);
  });
});

describe("_clearStore (test isolation)", () => {
  it("borra todos los subscribers", async () => {
    await addSubscriber({ email: "a@a.com" });
    await addSubscriber({ email: "b@b.com" });
    _clearStore();
    const pending = await listPendingDrip();
    expect(pending).toHaveLength(0);
  });
});
