/**
 * premium_filters.test.ts — SSS301 (18 may 2026)
 *
 * Tests para filterDealsByPremiumFilters — la pure function que aplica
 * los 4 filtros pro Premium a un array de deals.
 */
import { describe, it, expect } from "vitest";
import { filterDealsByPremiumFilters } from "../../components/PremiumFiltersBar";

const SAMPLE_DEALS = [
  { id: "1", airline: "FR", cabin: "economy", stops: 0, date_out: "2026-08-15T07:00:00" },
  { id: "2", airline: "IB", cabin: "business", stops: 1, date_out: "2026-08-15T14:00:00" },
  { id: "3", airline: "VY", cabin: "economy", stops: 0, date_out: "2026-08-15T20:00:00" },
  { id: "4", airline: "FR", cabin: "economy", stops: 2, date_out: "2026-08-15T03:00:00" },
  { id: "5", airline: "BA", cabin: "premium_economy", stops: 1, date_out: "2026-08-15T11:00:00" },
];

describe("filterDealsByPremiumFilters", () => {
  it("any filters = devuelve todos", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "any",
      timeBand: "any",
    });
    expect(res.length).toBe(5);
  });

  it("filter por aerolínea FR", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: ["FR"],
      cabin: "any",
      stops: "any",
      timeBand: "any",
    });
    expect(res.length).toBe(2);
    expect(res.every((d) => d.airline === "FR")).toBe(true);
  });

  it("filter múltiple aerolínea FR+IB", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: ["FR", "IB"],
      cabin: "any",
      stops: "any",
      timeBand: "any",
    });
    expect(res.length).toBe(3);
  });

  it("filter cabin = business", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "business",
      stops: "any",
      timeBand: "any",
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("2");
  });

  it("filter cabin = premium_economy", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "premium_economy",
      stops: "any",
      timeBand: "any",
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("5");
  });

  it("filter stops = 0 (directos)", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "0",
      timeBand: "any",
    });
    expect(res.length).toBe(2);
    expect(res.every((d) => d.stops === 0)).toBe(true);
  });

  it("filter stops = 1 escala", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "1",
      timeBand: "any",
    });
    expect(res.length).toBe(2);
    expect(res.every((d) => d.stops === 1)).toBe(true);
  });

  it("filter stops = 2+", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "2plus",
      timeBand: "any",
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("4");
  });

  it("filter time band morning (06-12)", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "any",
      timeBand: "morning",
    });
    expect(res.length).toBe(2);
    const ids = res.map((d) => d.id).sort();
    expect(ids).toEqual(["1", "5"]);
  });

  it("filter time band early (00-06)", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "any",
      timeBand: "early",
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("4");
  });

  it("filter time band afternoon (12-18)", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "any",
      timeBand: "afternoon",
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("2");
  });

  it("filter time band evening (18-24)", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: [],
      cabin: "any",
      stops: "any",
      timeBand: "evening",
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("3");
  });

  it("filters combinados (FR + economy + 0 stops)", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: ["FR"],
      cabin: "economy",
      stops: "0",
      timeBand: "any",
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("1");
  });

  it("filters sin match devuelve array vacío", () => {
    const res = filterDealsByPremiumFilters(SAMPLE_DEALS, {
      airlines: ["XX"],
      cabin: "any",
      stops: "any",
      timeBand: "any",
    });
    expect(res.length).toBe(0);
  });

  it("date_out inválido no filtra (pass-through)", () => {
    const deals = [{ id: "x", airline: "FR", date_out: "invalid-date" }];
    const res = filterDealsByPremiumFilters(deals, {
      airlines: [],
      cabin: "any",
      stops: "any",
      timeBand: "morning",
    });
    expect(res.length).toBe(1);
  });

  it("airline missing → no match en filtro aerolínea", () => {
    const deals = [{ id: "x", cabin: "economy" }];
    const res = filterDealsByPremiumFilters(deals, {
      airlines: ["FR"],
      cabin: "any",
      stops: "any",
      timeBand: "any",
    });
    expect(res.length).toBe(0);
  });
});
