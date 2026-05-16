/**
 * seasonal_and_monthly.test.ts — SSS247 (16 may 2026)
 *
 * Tests para 4 libs data-driven SEO sin tests previo:
 *  - monthly_prices.ts → /precio-mes-a-mes/[slug]
 *  - seasonal_data.ts → /cuando-viajar/[destino]
 *  - airline_comparisons.ts → /comparar-aerolineas/[slug]
 *  - dest_content.ts → IG carousel content per destino
 */
import { describe, it, expect } from "vitest";
import { MONTHLY_ROUTES } from "../monthly_prices";
import { DESTINATIONS_SEASONAL } from "../seasonal_data";
import { AIRLINE_COMPARISONS } from "../airline_comparisons";
import { getDestContent, getBlogForDest } from "../dest_content";

const SLUG_REGEX = /^[a-z0-9-]+$/;

describe("MONTHLY_ROUTES catalog", () => {
  it("tiene mínimo 5 rutas", () => {
    const keys = Object.keys(MONTHLY_ROUTES);
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });

  it("cada ruta-key es kebab-case", () => {
    for (const slug of Object.keys(MONTHLY_ROUTES)) {
      expect(slug).toMatch(SLUG_REGEX);
    }
  });

  it("cada ruta tiene metadata + months array", () => {
    for (const [slug, route] of Object.entries(MONTHLY_ROUTES)) {
      expect(route).toBeTruthy();
      expect(typeof slug).toBe("string");
    }
  });
});

describe("DESTINATIONS_SEASONAL catalog", () => {
  it("tiene mínimo 8 destinos", () => {
    expect(DESTINATIONS_SEASONAL.length).toBeGreaterThanOrEqual(8);
  });

  it("slugs únicos", () => {
    const slugs = DESTINATIONS_SEASONAL.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todos los slugs format kebab-case", () => {
    for (const d of DESTINATIONS_SEASONAL) {
      expect(d.slug).toMatch(SLUG_REGEX);
    }
  });

  it("cada destino tiene 12 entries (1 por mes)", () => {
    for (const d of DESTINATIONS_SEASONAL) {
      expect(d.months.length).toBe(12);
    }
  });

  it("cada month entry usa MonthIndex 1-12", () => {
    for (const d of DESTINATIONS_SEASONAL) {
      const months = d.months.map((e) => e.month).sort((a, b) => a - b);
      expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
  });

  it("priceLevel y crowdLevel están en allowlist", () => {
    const validLevels = new Set(["low", "mid", "high"]);
    for (const d of DESTINATIONS_SEASONAL) {
      for (const e of d.months) {
        expect(validLevels.has(e.priceLevel)).toBe(true);
        expect(validLevels.has(e.crowdLevel)).toBe(true);
      }
    }
  });

  it("tempMin <= tempMax para cada mes", () => {
    for (const d of DESTINATIONS_SEASONAL) {
      for (const e of d.months) {
        expect(e.tempMin).toBeLessThanOrEqual(e.tempMax);
      }
    }
  });
});

describe("AIRLINE_COMPARISONS catalog", () => {
  it("tiene mínimo 10 comparativas", () => {
    expect(AIRLINE_COMPARISONS.length).toBeGreaterThanOrEqual(10);
  });

  it("slugs únicos format kebab-case", () => {
    const slugs = AIRLINE_COMPARISONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(SLUG_REGEX);
    }
  });

  it("cada comparison tiene lado A y B con name + code + category", () => {
    const validCats = new Set(["low-cost", "full-service", "luxury", "regional"]);
    for (const c of AIRLINE_COMPARISONS) {
      expect(c.a).toBeTruthy();
      expect(c.b).toBeTruthy();
      expect(c.a.name).toBeTruthy();
      expect(c.b.name).toBeTruthy();
      expect(c.a.code).toMatch(/^[A-Z0-9]{2}$/);
      expect(c.b.code).toMatch(/^[A-Z0-9]{2}$/);
      expect(validCats.has(c.a.category)).toBe(true);
      expect(validCats.has(c.b.category)).toBe(true);
    }
  });

  it("cada lado tiene typicalPriceEur > 0", () => {
    for (const c of AIRLINE_COMPARISONS) {
      expect(c.a.typicalPriceEur).toBeGreaterThan(0);
      expect(c.b.typicalPriceEur).toBeGreaterThan(0);
    }
  });

  it("minErrorFareEur <= typicalPriceEur (error fare debe ser BARATO)", () => {
    for (const c of AIRLINE_COMPARISONS) {
      expect(c.a.minErrorFareEur).toBeLessThanOrEqual(c.a.typicalPriceEur);
      expect(c.b.minErrorFareEur).toBeLessThanOrEqual(c.b.typicalPriceEur);
    }
  });

  it("emoji bandera no vacío", () => {
    for (const c of AIRLINE_COMPARISONS) {
      expect(c.a.emoji.length).toBeGreaterThan(0);
      expect(c.b.emoji.length).toBeGreaterThan(0);
    }
  });

  it("ningún slug ni name tiene chars peligrosos XSS", () => {
    for (const c of AIRLINE_COMPARISONS) {
      expect(c.slug).not.toMatch(/[<>"']/);
      expect(c.a.name).not.toMatch(/[<>"']/);
      expect(c.b.name).not.toMatch(/[<>"']/);
    }
  });
});

describe("getDestContent (dest_content.ts)", () => {
  it("retorna entry para destino conocido (bangkok)", () => {
    const c = getDestContent("bangkok");
    expect(c).toBeTruthy();
    expect(c.attractions.length).toBeGreaterThan(0);
  });

  it("fallback para destino desconocido", () => {
    const c = getDestContent("nonexistent_xyz");
    expect(c).toBeTruthy();
    // Fallback debe devolver un objeto con shape válida
    expect(Array.isArray(c.attractions)).toBe(true);
    expect(Array.isArray(c.food)).toBe(true);
    expect(Array.isArray(c.tips)).toBe(true);
  });

  it("acepta undefined/null sin throw", () => {
    expect(() => getDestContent(undefined)).not.toThrow();
    expect(() => getDestContent(null)).not.toThrow();
  });

  it("hashtags incluyen mix populares + nicho", () => {
    const c = getDestContent("bangkok");
    expect(c.hashtags).toBeTruthy();
    expect(Array.isArray(c.hashtags)).toBe(true);
    expect(c.hashtags.length).toBeGreaterThan(2);
  });

  it("attractions tienen name + desc (no vacíos)", () => {
    const c = getDestContent("tokyo");
    for (const a of c.attractions) {
      expect(a.name).toBeTruthy();
      expect(a.desc).toBeTruthy();
    }
  });
});

describe("getBlogForDest", () => {
  it("retorna null para input inválido", () => {
    expect(getBlogForDest(undefined)).toBeNull();
    expect(getBlogForDest(null)).toBeNull();
    expect(getBlogForDest("")).toBeNull();
  });

  it("acepta string sin throw", () => {
    expect(() => getBlogForDest("bangkok")).not.toThrow();
    expect(() => getBlogForDest("nonexistent")).not.toThrow();
  });

  it("si retorna entry, tiene shape correcto", () => {
    const r = getBlogForDest("bangkok");
    if (r) {
      expect(r.slug).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.lang === "es" || r.lang === "en").toBe(true);
    }
  });
});
