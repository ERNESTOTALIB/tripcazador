/**
 * ab.test.ts — A/B testing framework.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { EXPERIMENTS, getVariant, trackConversion } from "../ab";

describe("EXPERIMENTS — registro", () => {
  it("contiene telegram_cta_v2", () => {
    expect(EXPERIMENTS.telegram_cta_v2).toBeDefined();
  });

  it("contiene hero_subtitle_v1", () => {
    expect(EXPERIMENTS.hero_subtitle_v1).toBeDefined();
  });

  it("contiene booking_router_v1", () => {
    expect(EXPERIMENTS.booking_router_v1).toBeDefined();
  });

  it("todos los experimentos tienen bWeight 0-100", () => {
    Object.values(EXPERIMENTS).forEach((exp) => {
      expect(exp.bWeight).toBeGreaterThanOrEqual(0);
      expect(exp.bWeight).toBeLessThanOrEqual(100);
    });
  });

  it("todos los experimentos tienen defaultVariant válida", () => {
    Object.values(EXPERIMENTS).forEach((exp) => {
      expect(["A", "B"]).toContain(exp.defaultVariant);
    });
  });

  it("ids matchean keys", () => {
    Object.entries(EXPERIMENTS).forEach(([k, exp]) => {
      expect(exp.id).toBe(k);
    });
  });
});

describe("getVariant — sin consent (SSS179: asigna igual por hash)", () => {
  beforeEach(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { /* swallow */ }
  });

  it("sin consent asigna por hash (no devuelve siempre defaultVariant)", () => {
    // SSS179: previo era "sin consent → defaultVariant"; ahora asigna por
    // hash determinístico igualmente (visitor_id es UUID anonymous local,
    // no PII, no requiere consent). Lo que sí requiere consent es la
    // emisión a GA4 (que sigue gated dentro de trackExposure).
    const r = getVariant("telegram_cta_v2");
    expect(["A", "B"]).toContain(r);
    // Y debe haber generado un visitor_id en localStorage
    expect(localStorage.getItem("cv_visitor_id")).toBeTruthy();
  });

  it("sin consent: misma variante para el mismo visitor (determinístico)", () => {
    const r1 = getVariant("telegram_cta_v2");
    const r2 = getVariant("telegram_cta_v2");
    expect(r1).toBe(r2);
  });

  it("experimento con bWeight=100 sin consent → B siempre", () => {
    // booking_router_v1: bWeight=100, defaultVariant=B (SSS177). Sin consent
    // debe seguir devolviendo B porque la asignación por hash con bWeight=100
    // siempre cae en B.
    const r = getVariant("booking_router_v1");
    expect(r).toBe("B");
  });

  it("experimento desconocido → 'A'", () => {
    const r = getVariant("nonexistent_xx");
    expect(r).toBe("A");
  });
});

describe("getVariant — con consent", () => {
  beforeEach(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("cv_consent_v1", JSON.stringify({ analytics: true }));
    } catch { /* swallow */ }
  });

  it("devuelve A o B determinísticamente", () => {
    const r1 = getVariant("telegram_cta_v2");
    const r2 = getVariant("telegram_cta_v2");
    expect(r1).toBe(r2); // mismo visitor, misma variante siempre
    expect(["A", "B"]).toContain(r1);
  });

  it("genera cv_visitor_id en localStorage", () => {
    getVariant("telegram_cta_v2");
    const id = localStorage.getItem("cv_visitor_id");
    expect(id).toBeTruthy();
    expect(id?.length).toBeGreaterThan(0);
  });

  it("diferentes experimentos pueden dar diferentes variantes (independientes)", () => {
    // Determinístico por (visitor, exp). Solo verificamos que no crashee.
    const r1 = getVariant("telegram_cta_v2");
    const r2 = getVariant("hero_subtitle_v1");
    expect(["A", "B"]).toContain(r1);
    expect(["A", "B"]).toContain(r2);
  });
});

describe("trackConversion", () => {
  beforeEach(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { /* swallow */ }
  });

  it("sin consent no crashea", () => {
    expect(() => trackConversion("telegram_cta_v2")).not.toThrow();
  });

  it("con consent no crashea", () => {
    localStorage.setItem("cv_consent_v1", JSON.stringify({ analytics: true }));
    getVariant("telegram_cta_v2"); // poblar sessionStorage exposure
    expect(() => trackConversion("telegram_cta_v2", 5)).not.toThrow();
  });

  it("value default 1", () => {
    localStorage.setItem("cv_consent_v1", JSON.stringify({ analytics: true }));
    expect(() => trackConversion("hero_subtitle_v1")).not.toThrow();
  });
});
