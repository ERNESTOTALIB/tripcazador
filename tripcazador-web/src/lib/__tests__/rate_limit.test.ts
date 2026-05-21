/**
 * rate_limit.test.ts — SSS412
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  isRateLimited,
  checkMultiRateLimit,
  __resetRateLimitsForTests,
} from "../rate_limit";

beforeEach(() => __resetRateLimitsForTests());

describe("checkRateLimit", () => {
  it("permite hits dentro del max", () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit({ namespace: "test", key: "k1", max: 5, windowMs: 60_000 });
      expect(r.limited).toBe(false);
      expect(r.current).toBe(i + 1);
    }
  });

  it("limita cuando se excede max", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit({ namespace: "test", key: "k1", max: 5, windowMs: 60_000 });
    }
    const sixth = checkRateLimit({ namespace: "test", key: "k1", max: 5, windowMs: 60_000 });
    expect(sixth.limited).toBe(true);
    expect(sixth.current).toBe(6);
  });

  it("keys distintas tienen buckets independientes", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit({ namespace: "test", key: "alice", max: 5, windowMs: 60_000 });
    }
    const bob = checkRateLimit({ namespace: "test", key: "bob", max: 5, windowMs: 60_000 });
    expect(bob.limited).toBe(false);
    expect(bob.current).toBe(1);
  });

  it("namespaces distintos no se mezclan", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit({ namespace: "endpoint_a", key: "k", max: 5, windowMs: 60_000 });
    }
    const r = checkRateLimit({ namespace: "endpoint_b", key: "k", max: 5, windowMs: 60_000 });
    expect(r.current).toBe(1);
    expect(r.limited).toBe(false);
  });

  it("resetAt es timestamp futuro válido", () => {
    const now = Date.now();
    const r = checkRateLimit({ namespace: "test", key: "k", max: 5, windowMs: 60_000 });
    expect(r.resetAt).toBeGreaterThanOrEqual(now);
    expect(r.resetAt).toBeLessThanOrEqual(now + 60_000 + 100);
  });
});

describe("isRateLimited shortcut", () => {
  it("devuelve bool", () => {
    expect(isRateLimited({ namespace: "x", key: "k", max: 1, windowMs: 60_000 })).toBe(false);
    expect(isRateLimited({ namespace: "x", key: "k", max: 1, windowMs: 60_000 })).toBe(true);
  });
});

describe("checkMultiRateLimit", () => {
  it("devuelve el primero que limita con tripped namespace", () => {
    // Saturar email bucket
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ namespace: "email", key: "x@x", max: 3, windowMs: 60_000 });
    }
    const r = checkMultiRateLimit([
      { namespace: "email", key: "x@x", max: 3, windowMs: 60_000 },
      { namespace: "ip", key: "1.2.3.4", max: 10, windowMs: 60_000 },
    ]);
    expect(r.limited).toBe(true);
    expect(r.tripped).toBe("email");
  });

  it("limited=false cuando ninguno excede", () => {
    const r = checkMultiRateLimit([
      { namespace: "email", key: "x@x", max: 3, windowMs: 60_000 },
      { namespace: "ip", key: "1.2.3.4", max: 10, windowMs: 60_000 },
    ]);
    expect(r.limited).toBe(false);
  });
});
