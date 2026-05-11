/**
 * months.test.ts — integridad MONTHS calendar.
 */
import { describe, it, expect } from "vitest";
import { MONTHS, getMonthBySlug } from "../months";

describe("MONTHS — estructura", () => {
  it("contiene 12 meses", () => {
    expect(MONTHS.length).toBe(12);
  });

  it("todos los slugs son únicos", () => {
    const slugs = MONTHS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todos tienen number 1-12 sin huecos", () => {
    const numbers = MONTHS.map((m) => m.number).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("todos tienen monthEs no vacío", () => {
    MONTHS.forEach((m) => {
      expect(m.monthEs.length).toBeGreaterThan(0);
    });
  });

  it("todos tienen monthEn no vacío", () => {
    MONTHS.forEach((m) => {
      expect(m.monthEn.length).toBeGreaterThan(0);
    });
  });

  it("todos tienen description >= 60 chars", () => {
    MONTHS.forEach((m) => {
      expect(m.description.length).toBeGreaterThanOrEqual(60);
    });
  });

  it("todos tienen al menos 3 topDestinations", () => {
    MONTHS.forEach((m) => {
      expect(m.topDestinations.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("topDestinations tienen iata válido (3 letras o multi separado por /)", () => {
    MONTHS.forEach((m) => {
      m.topDestinations.forEach((d) => {
        // Permite "MAD", "CDG/FCO" (multi-airport), o "MAD,CDG"
        expect(d.iata).toMatch(/^[A-Z]{3}([\/,][A-Z]{3})*$/);
      });
    });
  });

  it("topDestinations tienen price positivo", () => {
    MONTHS.forEach((m) => {
      m.topDestinations.forEach((d) => {
        expect(d.price).toBeGreaterThan(0);
      });
    });
  });

  it("todos tienen tips no vacíos", () => {
    MONTHS.forEach((m) => {
      expect(m.tips.length).toBeGreaterThan(0);
    });
  });

  it("emoji presente en todos", () => {
    MONTHS.forEach((m) => {
      expect(m.emoji.length).toBeGreaterThan(0);
    });
  });
});

describe("getMonthBySlug", () => {
  it("'enero' → number 1", () => {
    expect(getMonthBySlug("enero")?.number).toBe(1);
  });

  it("'febrero' → number 2", () => {
    expect(getMonthBySlug("febrero")?.number).toBe(2);
  });

  it("'diciembre' → number 12", () => {
    expect(getMonthBySlug("diciembre")?.number).toBe(12);
  });

  it("slug no existente → null", () => {
    expect(getMonthBySlug("xx-not-a-month")).toBeNull();
  });

  it("vacío → null", () => {
    expect(getMonthBySlug("")).toBeNull();
  });
});
