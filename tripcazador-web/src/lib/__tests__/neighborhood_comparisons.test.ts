/**
 * neighborhood_comparisons.test.ts — verifica integridad LLLL01-04.
 */
import { describe, it, expect } from "vitest";
import {
  NEIGHBORHOOD_COMPARISONS,
  getNeighborhoodComparisonBySlug,
  getRelatedNeighborhoodComparisons,
} from "../neighborhood_comparisons";

describe("NEIGHBORHOOD_COMPARISONS — estructura", () => {
  it("contiene al menos 12 comparativas", () => {
    expect(NEIGHBORHOOD_COMPARISONS.length).toBeGreaterThanOrEqual(12);
  });

  it("todos los slugs son únicos", () => {
    const slugs = NEIGHBORHOOD_COMPARISONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todas tienen title no vacío", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.title.trim().length).toBeGreaterThan(0);
    });
  });

  it("todas tienen description >= 80 chars (meta SEO)", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.description.length).toBeGreaterThanOrEqual(80);
    });
  });

  it("todas tienen citySlug no vacío", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.citySlug.trim().length).toBeGreaterThan(0);
    });
  });

  it("todas tienen 7 criterios", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.criteria.length).toBe(7);
    });
  });

  it("todos los criterios tienen winner válido (a|b|tie)", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      c.criteria.forEach((cr) => {
        expect(["a", "b", "tie"]).toContain(cr.winner);
      });
    });
  });

  it("todos los scores criterios están en rango 1-10", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      c.criteria.forEach((cr) => {
        expect(cr.aScore).toBeGreaterThanOrEqual(1);
        expect(cr.aScore).toBeLessThanOrEqual(10);
        expect(cr.bScore).toBeGreaterThanOrEqual(1);
        expect(cr.bScore).toBeLessThanOrEqual(10);
      });
    });
  });

  it("todas tienen verdict no vacío", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.verdict.length).toBeGreaterThan(10);
    });
  });

  it("todas tienen pickA + pickB no vacíos", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.pickA.length).toBeGreaterThan(0);
      expect(c.pickB.length).toBeGreaterThan(0);
    });
  });

  it("todas tienen hotelsA con al menos 3 hoteles", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.hotelsA.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("todas tienen hotelsB con al menos 3 hoteles", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.hotelsB.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("side a/b tienen avgPriceEur > 0", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.a.avgPriceEur).toBeGreaterThan(0);
      expect(c.b.avgPriceEur).toBeGreaterThan(0);
    });
  });

  it("side a/b tienen avgPrice4starEur > avgPriceEur (4★ caro)", () => {
    NEIGHBORHOOD_COMPARISONS.forEach((c) => {
      expect(c.a.avgPrice4starEur).toBeGreaterThanOrEqual(c.a.avgPriceEur);
      expect(c.b.avgPrice4starEur).toBeGreaterThanOrEqual(c.b.avgPriceEur);
    });
  });
});

describe("NEIGHBORHOOD_COMPARISONS — cobertura ciudades", () => {
  it("incluye Barcelona", () => {
    expect(NEIGHBORHOOD_COMPARISONS.some((c) => c.citySlug === "barcelona")).toBe(true);
  });

  it("incluye Madrid", () => {
    expect(NEIGHBORHOOD_COMPARISONS.some((c) => c.citySlug === "madrid")).toBe(true);
  });

  it("incluye Roma", () => {
    expect(NEIGHBORHOOD_COMPARISONS.some((c) => c.citySlug === "roma")).toBe(true);
  });

  it("incluye Lisboa", () => {
    expect(NEIGHBORHOOD_COMPARISONS.some((c) => c.citySlug === "lisboa")).toBe(true);
  });
});

describe("getNeighborhoodComparisonBySlug", () => {
  it("encuentra barcelona-gotic-vs-eixample", () => {
    const r = getNeighborhoodComparisonBySlug("barcelona-gotic-vs-eixample");
    expect(r).toBeDefined();
    expect(r?.citySlug).toBe("barcelona");
  });

  it("slug no existente devuelve undefined", () => {
    const r = getNeighborhoodComparisonBySlug("not-a-real-slug-zzz");
    expect(r).toBeUndefined();
  });

  it("slug vacío devuelve undefined", () => {
    const r = getNeighborhoodComparisonBySlug("");
    expect(r).toBeUndefined();
  });
});

describe("getRelatedNeighborhoodComparisons", () => {
  it("devuelve hasta 4 por defecto", () => {
    const r = getRelatedNeighborhoodComparisons("barcelona-gotic-vs-eixample");
    expect(r.length).toBeLessThanOrEqual(4);
  });

  it("nunca incluye el slug actual", () => {
    const slug = "barcelona-gotic-vs-eixample";
    const r = getRelatedNeighborhoodComparisons(slug);
    expect(r.find((c) => c.slug === slug)).toBeUndefined();
  });

  it("limit personalizado respetado", () => {
    const r = getRelatedNeighborhoodComparisons("barcelona-gotic-vs-eixample", 2);
    expect(r.length).toBeLessThanOrEqual(2);
  });

  it("slug no existente devuelve primeros N", () => {
    const r = getRelatedNeighborhoodComparisons("not-a-slug", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});
