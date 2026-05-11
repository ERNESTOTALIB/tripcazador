/**
 * airline_comparisons.test.ts — verifica integridad airline_comparisons.ts.
 */
import { describe, it, expect } from "vitest";
import {
  AIRLINE_COMPARISONS,
  getAirlineComparisonBySlug,
} from "../airline_comparisons";

describe("AIRLINE_COMPARISONS — estructura", () => {
  it("contiene al menos 30 comparativas", () => {
    expect(AIRLINE_COMPARISONS.length).toBeGreaterThanOrEqual(30);
  });

  it("todos los slugs son únicos", () => {
    const slugs = AIRLINE_COMPARISONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todas tienen 2 carriers válidos (a + b)", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.a).toBeDefined();
      expect(c.b).toBeDefined();
      expect(c.a.code).toMatch(/^[A-Z0-9]{2,3}$/);
      expect(c.b.code).toMatch(/^[A-Z0-9]{2,3}$/);
    });
  });

  it("a !== b (no comparar consigo mismo)", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.a.code).not.toBe(c.b.code);
    });
  });

  it("todas tienen title >= 20 chars", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.title.length).toBeGreaterThanOrEqual(20);
    });
  });

  it("todas tienen description >= 80 chars (SEO meta)", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.description.length).toBeGreaterThanOrEqual(80);
    });
  });

  it("todas tienen verdict no vacío", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.verdict.trim().length).toBeGreaterThan(20);
    });
  });

  it("todas tienen al menos 1 criterio", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.criteria.length).toBeGreaterThan(0);
    });
  });

  it("todos los criterios tienen winner válido", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      c.criteria.forEach((cr) => {
        expect(["a", "b", "tie"]).toContain(cr.winner);
      });
    });
  });

  it("scores de criterios en rango 1-10", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      c.criteria.forEach((cr) => {
        expect(cr.aScore).toBeGreaterThanOrEqual(1);
        expect(cr.aScore).toBeLessThanOrEqual(10);
        expect(cr.bScore).toBeGreaterThanOrEqual(1);
        expect(cr.bScore).toBeLessThanOrEqual(10);
      });
    });
  });

  it("todas tienen pickA + pickB no vacíos", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.pickA.length).toBeGreaterThan(0);
      expect(c.pickB.length).toBeGreaterThan(0);
    });
  });

  it("category válida para todos los carriers", () => {
    const valid = ["low-cost", "full-service", "luxury", "regional"];
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(valid).toContain(c.a.category);
      expect(valid).toContain(c.b.category);
    });
  });

  it("typicalPriceEur > 0 para ambos", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.a.typicalPriceEur).toBeGreaterThan(0);
      expect(c.b.typicalPriceEur).toBeGreaterThan(0);
    });
  });

  it("minErrorFareEur < typicalPriceEur (error es menor que típico)", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.a.minErrorFareEur).toBeLessThanOrEqual(c.a.typicalPriceEur);
      expect(c.b.minErrorFareEur).toBeLessThanOrEqual(c.b.typicalPriceEur);
    });
  });

  it("skytraxStars en 1-5", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.a.skytraxStars).toBeGreaterThanOrEqual(1);
      expect(c.a.skytraxStars).toBeLessThanOrEqual(5);
      expect(c.b.skytraxStars).toBeGreaterThanOrEqual(1);
      expect(c.b.skytraxStars).toBeLessThanOrEqual(5);
    });
  });

  it("mainHub es IATA de 3 letras", () => {
    AIRLINE_COMPARISONS.forEach((c) => {
      expect(c.a.mainHub).toMatch(/^[A-Z]{3}$/);
      expect(c.b.mainHub).toMatch(/^[A-Z]{3}$/);
    });
  });
});

describe("getAirlineComparisonBySlug", () => {
  it("encuentra iberia-vs-vueling", () => {
    const r = getAirlineComparisonBySlug("iberia-vs-vueling");
    expect(r).toBeDefined();
    expect(r?.a.name).toMatch(/Iberia/i);
  });

  it("slug no existente devuelve undefined", () => {
    const r = getAirlineComparisonBySlug("xx-vs-yy-fake");
    expect(r).toBeUndefined();
  });

  it("slug vacío devuelve undefined", () => {
    const r = getAirlineComparisonBySlug("");
    expect(r).toBeUndefined();
  });
});
