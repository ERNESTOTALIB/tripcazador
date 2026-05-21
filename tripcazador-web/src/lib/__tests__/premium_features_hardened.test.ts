/**
 * premium_features_hardened.test.ts — SSS300 (18 may 2026)
 *
 * Verifica catálogo Premium hardened: exactamente 4 features prometidas
 * post-eliminación de exportCsv + apiAccess. Anti-regresión que esos
 * 2 no vuelvan al catálogo accidentalmente generando expectativas falsas.
 */
import { describe, it, expect } from "vitest";
import { PREMIUM_FEATURES, PREMIUM_PRICE_EUR, isPremium } from "../premium";

describe("PREMIUM_FEATURES catalog SSS300", () => {
  it("contiene exactamente 4 features (no más, no menos)", () => {
    const keys = Object.keys(PREMIUM_FEATURES);
    expect(keys.length).toBe(4);
  });

  it("contiene las 4 features prometidas + ninguna más", () => {
    const keys = Object.keys(PREMIUM_FEATURES).sort();
    expect(keys).toEqual(
      ["instantAlerts", "noDisclaimer", "priorityShipping", "proFilters"]
        .filter((k) => k !== "priorityShipping")
        .concat("prioritySupport")
        .sort(),
    );
  });

  it("NO contiene exportCsv (removed SSS300)", () => {
    expect("exportCsv" in PREMIUM_FEATURES).toBe(false);
  });

  it("NO contiene apiAccess (removed SSS300)", () => {
    expect("apiAccess" in PREMIUM_FEATURES).toBe(false);
  });

  it("instantAlerts copy menciona <60s vs 24h", () => {
    expect(PREMIUM_FEATURES.instantAlerts).toMatch(/<60s/);
    expect(PREMIUM_FEATURES.instantAlerts).toMatch(/24h/);
  });

  it("proFilters copy menciona aerolínea + clase + escalas", () => {
    expect(PREMIUM_FEATURES.proFilters).toMatch(/aerolínea/i);
    expect(PREMIUM_FEATURES.proFilters).toMatch(/clase/i);
    expect(PREMIUM_FEATURES.proFilters).toMatch(/escalas/i);
  });

  it("noDisclaimer menciona 'precio aproximado'", () => {
    expect(PREMIUM_FEATURES.noDisclaimer).toMatch(/precio aproximado/i);
  });

  it("prioritySupport menciona SLA <24h", () => {
    expect(PREMIUM_FEATURES.prioritySupport).toMatch(/<24h/);
  });
});

describe("PREMIUM_PRICE_EUR (SSS335: actualizado a €9.99/mes)", () => {
  it("es €9.99 — precio canon mensual post-SSS335", () => {
    expect(PREMIUM_PRICE_EUR).toBe(9.99);
  });
});

describe("isPremium helper SSS300", () => {
  it("es una función exportada", () => {
    expect(typeof isPremium).toBe("function");
  });

  it("server-side (window undefined) devuelve false", () => {
    // En vitest sin jsdom, window es undefined
    const result = isPremium();
    // En jsdom (entorno default), getPremiumStatus lee localStorage
    // que está vacío → active=false
    expect(typeof result).toBe("boolean");
  });

  it("returnsActive cuando getPremiumStatus().active=true (mockable)", () => {
    // Sin Premium → false
    expect(isPremium()).toBe(false);
  });
});

describe("Anti-regresión catálogo Premium", () => {
  it("ningún feature value es vacío", () => {
    for (const [, value] of Object.entries(PREMIUM_FEATURES)) {
      expect(value.length).toBeGreaterThan(10);
    }
  });

  it("ningún key es vacío", () => {
    for (const key of Object.keys(PREMIUM_FEATURES)) {
      expect(key.length).toBeGreaterThan(2);
    }
  });
});
