/**
 * trigger_worker_ratelimit.test.ts — SSS238 (16 may 2026)
 *
 * Tests para lib/trigger_worker_ratelimit.ts (32 líneas, abuse defense).
 *
 * Cubre: getLastTrigger, setLastTrigger, resetRateLimitForTests,
 * comportamiento del Map (multi-user separation).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  RATELIMIT_WINDOW_MS,
  getLastTrigger,
  setLastTrigger,
  resetRateLimitForTests,
} from "../trigger_worker_ratelimit";

beforeEach(() => {
  resetRateLimitForTests();
});

describe("RATELIMIT_WINDOW_MS", () => {
  it("son 10 minutos (10 * 60 * 1000 ms)", () => {
    expect(RATELIMIT_WINDOW_MS).toBe(10 * 60 * 1000);
    expect(RATELIMIT_WINDOW_MS).toBe(600000);
  });
});

describe("getLastTrigger / setLastTrigger", () => {
  it("retorna 0 si user nunca llamó (default)", () => {
    expect(getLastTrigger("ewtalib")).toBe(0);
    expect(getLastTrigger("any-user")).toBe(0);
  });

  it("retorna timestamp guardado tras setLastTrigger", () => {
    const ts = Date.now();
    setLastTrigger("ewtalib", ts);
    expect(getLastTrigger("ewtalib")).toBe(ts);
  });

  it("sobrescribe timestamp en llamada subsecuente", () => {
    setLastTrigger("ewtalib", 1000);
    expect(getLastTrigger("ewtalib")).toBe(1000);

    setLastTrigger("ewtalib", 2000);
    expect(getLastTrigger("ewtalib")).toBe(2000);
  });

  it("aísla usuarios (multi-user Map separation)", () => {
    setLastTrigger("user1", 5000);
    setLastTrigger("user2", 9000);
    expect(getLastTrigger("user1")).toBe(5000);
    expect(getLastTrigger("user2")).toBe(9000);
  });
});

describe("resetRateLimitForTests", () => {
  it("limpia todos los timestamps", () => {
    setLastTrigger("a", 1);
    setLastTrigger("b", 2);
    setLastTrigger("c", 3);

    resetRateLimitForTests();

    expect(getLastTrigger("a")).toBe(0);
    expect(getLastTrigger("b")).toBe(0);
    expect(getLastTrigger("c")).toBe(0);
  });

  it("idempotente — varios resets seguidos OK", () => {
    setLastTrigger("a", 999);
    resetRateLimitForTests();
    resetRateLimitForTests();
    resetRateLimitForTests();
    expect(getLastTrigger("a")).toBe(0);
  });
});

describe("ratelimit semantics (integration)", () => {
  it("permite calcular si dentro de ventana 10min", () => {
    const now = Date.now();
    setLastTrigger("user1", now);

    // Pasados 5 minutos — todavía dentro de ventana
    const fiveMinLater = now + 5 * 60 * 1000;
    expect(fiveMinLater - getLastTrigger("user1")).toBeLessThan(
      RATELIMIT_WINDOW_MS,
    );

    // Pasados 11 minutos — fuera de ventana
    const elevenMinLater = now + 11 * 60 * 1000;
    expect(elevenMinLater - getLastTrigger("user1")).toBeGreaterThan(
      RATELIMIT_WINDOW_MS,
    );
  });
});
