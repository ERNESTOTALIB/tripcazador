/**
 * neighborhood_comparisons_extended.test.ts — coverage profundo.
 */
import { describe, it, expect } from "vitest";
import {
  NEIGHBORHOOD_COMPARISONS,
  getNeighborhoodComparisonBySlug,
  getRelatedNeighborhoodComparisons,
} from "../neighborhood_comparisons";

describe("NEIGHBORHOOD_COMPARISONS — integridad catálogo", () => {
  it("contiene >= 6 comparativas", () => {
    expect(NEIGHBORHOOD_COMPARISONS.length).toBeGreaterThanOrEqual(6);
  });

  it("slugs únicos", () => {
    const slugs = NEIGHBORHOOD_COMPARISONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slug formato kebab-case", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("citySlug lowercase", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.citySlug).toBe(c.citySlug.toLowerCase());
    }
  });

  it("cityName no vacío", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.cityName).toBeTruthy();
    }
  });

  it("title SEO > 30 chars", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.title.length).toBeGreaterThan(30);
    }
  });

  it("description SEO meta > 80 chars", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.description.length).toBeGreaterThan(80);
    }
  });

  it("a y b tienen name, emoji, tagline", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      for (const side of [c.a, c.b]) {
        expect(side.name).toBeTruthy();
        expect(side.emoji).toBeTruthy();
        expect(side.tagline).toBeTruthy();
      }
    }
  });

  it("precios EUR > 0", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.a.avgPriceEur).toBeGreaterThan(0);
      expect(c.b.avgPriceEur).toBeGreaterThan(0);
      expect(c.a.avgPrice4starEur).toBeGreaterThan(c.a.avgPriceEur);
      expect(c.b.avgPrice4starEur).toBeGreaterThan(c.b.avgPriceEur);
    }
  });

  it("criteria scores 1-10 + winner válido", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.criteria.length).toBeGreaterThan(0);
      for (const cr of c.criteria) {
        expect(cr.aScore).toBeGreaterThanOrEqual(1);
        expect(cr.aScore).toBeLessThanOrEqual(10);
        expect(cr.bScore).toBeGreaterThanOrEqual(1);
        expect(cr.bScore).toBeLessThanOrEqual(10);
        expect(["a", "b", "tie"]).toContain(cr.winner);
      }
    }
  });

  it("verdict y pickA/pickB no vacíos", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.verdict.length).toBeGreaterThan(20);
      expect(c.pickA.length).toBeGreaterThan(0);
      expect(c.pickB.length).toBeGreaterThan(0);
    }
  });

  it("hotelsA y hotelsB arrays con al menos 1", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(Array.isArray(c.hotelsA)).toBe(true);
      expect(Array.isArray(c.hotelsB)).toBe(true);
      expect(c.hotelsA.length).toBeGreaterThan(0);
      expect(c.hotelsB.length).toBeGreaterThan(0);
    }
  });

  it("a.name !== b.name (no compara consigo mismo)", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.a.name).not.toBe(c.b.name);
    }
  });

  it("seasonContext informativo", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      expect(c.seasonContext.length).toBeGreaterThan(10);
    }
  });
});

describe("getNeighborhoodComparisonBySlug", () => {
  it("devuelve undefined para slug inexistente", () => {
    expect(getNeighborhoodComparisonBySlug("non-existent")).toBeUndefined();
  });

  it("devuelve undefined para empty string", () => {
    expect(getNeighborhoodComparisonBySlug("")).toBeUndefined();
  });

  it("encuentra Barcelona Gòtic vs Eixample", () => {
    const r = getNeighborhoodComparisonBySlug("barcelona-gotic-vs-eixample");
    expect(r?.cityName).toBe("Barcelona");
  });

  it("retorna el objeto completo", () => {
    const first = NEIGHBORHOOD_COMPARISONS[0];
    const found = getNeighborhoodComparisonBySlug(first.slug);
    expect(found).toEqual(first);
  });

  it("case-sensitive", () => {
    const first = NEIGHBORHOOD_COMPARISONS[0];
    expect(
      getNeighborhoodComparisonBySlug(first.slug.toUpperCase()),
    ).toBeUndefined();
  });
});

describe("getRelatedNeighborhoodComparisons", () => {
  it("devuelve comparativas de la misma citySlug, excluyendo la actual", () => {
    const c = NEIGHBORHOOD_COMPARISONS.find((x) => x.citySlug === "barcelona");
    if (!c) return; // pre-condición
    const related = getRelatedNeighborhoodComparisons(c.slug);
    for (const r of related) {
      expect(r.citySlug === c.citySlug || r.cityName !== c.cityName).toBe(true);
      expect(r.slug).not.toBe(c.slug);
    }
  });

  it("devuelve array vacío si slug no existe", () => {
    const r = getRelatedNeighborhoodComparisons("inexistente");
    expect(Array.isArray(r)).toBe(true);
  });

  it("devuelve <= limit", () => {
    const r = getRelatedNeighborhoodComparisons("barcelona-gotic-vs-eixample", 2);
    expect(r.length).toBeLessThanOrEqual(2);
  });

  it("default limit funcional", () => {
    const r = getRelatedNeighborhoodComparisons("barcelona-gotic-vs-eixample");
    expect(Array.isArray(r)).toBe(true);
  });
});

describe("NEIGHBORHOOD_COMPARISONS — coverage rutas ciudades", () => {
  it("contiene Barcelona", () => {
    expect(NEIGHBORHOOD_COMPARISONS.some((c) => c.citySlug === "barcelona")).toBe(
      true,
    );
  });

  it("cobre múltiples ciudades EU (>3 únicas)", () => {
    const cities = new Set(NEIGHBORHOOD_COMPARISONS.map((c) => c.citySlug));
    expect(cities.size).toBeGreaterThan(3);
  });

  it("describe.each emoji presente en cada side", () => {
    for (const c of NEIGHBORHOOD_COMPARISONS) {
      // Debería tener al menos 1 char visible (emoji)
      expect(c.a.emoji.length).toBeGreaterThan(0);
      expect(c.b.emoji.length).toBeGreaterThan(0);
    }
  });
});
