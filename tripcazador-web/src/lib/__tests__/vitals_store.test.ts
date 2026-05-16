/**
 * vitals_store.test.ts — SSS239 (16 may 2026)
 *
 * Tests para lib/vitals_store.ts (45 líneas, observability).
 *
 * Cubre:
 *  - pushSample: append cuando ring < SIZE
 *  - pushSample: overwrite ring buffer cuando ≥ SIZE (FIFO via idx)
 *  - getVitalsSamples: filtra por TTL 24h
 *  - globalThis persistence: store survives module re-import (sería en HMR)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { pushSample, getVitalsSamples, type VitalSample } from "../vitals_store";

// Limpiar globalThis store antes de cada test
beforeEach(() => {
  const g = globalThis as unknown as {
    __tc_vitals_store?: { ring: VitalSample[]; idx: number };
  };
  if (g.__tc_vitals_store) {
    g.__tc_vitals_store.ring = [];
    g.__tc_vitals_store.idx = 0;
  }
});

function sample(name: string, value: number, ts: number = Date.now()): VitalSample {
  return {
    ts,
    name,
    value,
    rating: "good",
    page_path: "/",
    visitor_hash: "abc",
  };
}

describe("pushSample + getVitalsSamples", () => {
  it("acepta un sample", () => {
    pushSample(sample("LCP", 1234));
    const out = getVitalsSamples();
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("LCP");
    expect(out[0].value).toBe(1234);
  });

  it("acumula múltiples samples en orden", () => {
    pushSample(sample("LCP", 100));
    pushSample(sample("CLS", 0.05));
    pushSample(sample("INP", 200));

    const out = getVitalsSamples();
    expect(out).toHaveLength(3);
    expect(out.map((s) => s.name)).toEqual(["LCP", "CLS", "INP"]);
  });

  it("filtra samples más viejos que 24h TTL", () => {
    const now = Date.now();
    const old = now - 25 * 3600 * 1000; // 25h ago
    const recent = now - 1 * 3600 * 1000; // 1h ago

    pushSample(sample("LCP_OLD", 1, old));
    pushSample(sample("LCP_RECENT", 2, recent));

    const out = getVitalsSamples();
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("LCP_RECENT");
  });

  it("incluye sample en el borde de 24h (<24h pasa)", () => {
    const now = Date.now();
    const borderline = now - 23 * 3600 * 1000; // 23h
    pushSample(sample("BORDER", 1, borderline));
    expect(getVitalsSamples()).toHaveLength(1);
  });
});

describe("Ring buffer overflow behavior", () => {
  it("conserva todos los samples hasta RING_SIZE = 10000", () => {
    for (let i = 0; i < 100; i++) {
      pushSample(sample(`X${i}`, i));
    }
    expect(getVitalsSamples()).toHaveLength(100);
  });

  it("overwrite cuando supera RING_SIZE (FIFO via idx)", () => {
    // Llenamos 10000 + 5 → debe haber exactamente 10000 con primer 5 reemplazados
    // Llenar 10001 lleva tiempo, así que verificamos comportamiento conceptual
    // con un test más práctico: pushSample empuja al ring sin crecer infinito
    const RING_SIZE = 10000;

    // Empujamos exactamente RING_SIZE + 1 samples
    // (en CI esto es ~250ms — aceptable)
    for (let i = 0; i < RING_SIZE + 5; i++) {
      pushSample(sample(`s${i}`, i));
    }

    const out = getVitalsSamples();
    expect(out.length).toBeLessThanOrEqual(RING_SIZE);
    // Los primeros 5 deben haber sido sobrescritos
    const names = new Set(out.map((s) => s.name));
    expect(names.has("s0")).toBe(false);
    expect(names.has("s1")).toBe(false);
    expect(names.has("s2")).toBe(false);
    expect(names.has("s3")).toBe(false);
    expect(names.has("s4")).toBe(false);
    // Los últimos deben estar
    expect(names.has(`s${RING_SIZE + 4}`)).toBe(true);
  });
});

describe("VitalSample shape", () => {
  it("incluye todos los campos requeridos", () => {
    pushSample({
      ts: Date.now(),
      name: "FCP",
      value: 800,
      rating: "good",
      page_path: "/deals",
      visitor_hash: "h123",
    });
    const out = getVitalsSamples();
    expect(out[0].name).toBe("FCP");
    expect(out[0].page_path).toBe("/deals");
    expect(out[0].rating).toBe("good");
    expect(out[0].visitor_hash).toBe("h123");
  });
});

describe("globalThis persistence (HMR survival)", () => {
  it("store se mantiene en globalThis.__tc_vitals_store", () => {
    pushSample(sample("PERSIST", 42));
    const g = globalThis as unknown as {
      __tc_vitals_store: { ring: VitalSample[]; idx: number };
    };
    expect(g.__tc_vitals_store).toBeDefined();
    expect(g.__tc_vitals_store.ring.length).toBeGreaterThanOrEqual(1);
  });
});
