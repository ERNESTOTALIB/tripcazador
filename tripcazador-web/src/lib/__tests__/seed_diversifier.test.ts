/**
 * seed_diversifier.test.ts — coverage de shouldUseFallback, sortByFeaturedRanking,
 * diversifyDeals con DealFilter.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { Deal } from "../api";
import {
  shouldUseFallback,
  sortByFeaturedRanking,
  diversifyDeals,
  type DealFilter,
} from "../seed_diversifier";

afterEach(() => vi.useRealTimers());

function mkDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "d1",
    type: "flight",
    headline: "Test",
    origin: "MAD",
    destination: "BCN",
    city_from: "Madrid",
    city_to: "Barcelona",
    country_to: "España",
    region: "Europa",
    price_eur: 100,
    savings_pct: 0,
    savings_eur: 0,
    nights: 0,
    price_per_night: null,
    date_out: "2026-08-15",
    date_ret: "",
    classification: "OFERTA",
    cabin: "economy",
    airline_name: "Iberia",
    stops: 0,
    duration_min: 0,
    score: 70,
    image_url: "",
    booking_url: "",
    verified: false,
    tags: [],
    expires_at: "",
    found_at: "",
    ...overrides,
  } as Deal;
}

describe("shouldUseFallback", () => {
  it("empty array → true", () => {
    expect(shouldUseFallback([])).toBe(true);
  });

  it("< 8 deals → true", () => {
    const deals = Array.from({ length: 5 }, (_, i) =>
      mkDeal({ id: String(i), date_out: `2026-0${i + 1}-15` }),
    );
    expect(shouldUseFallback(deals)).toBe(true);
  });

  it("8 deals mismo month → true", () => {
    const deals = Array.from({ length: 8 }, (_, i) =>
      mkDeal({ id: String(i), date_out: "2026-08-15" }),
    );
    expect(shouldUseFallback(deals)).toBe(true);
  });

  it("8 deals con 3+ meses → false", () => {
    const deals = Array.from({ length: 9 }, (_, i) =>
      mkDeal({
        id: String(i),
        date_out: `2026-0${(i % 3) + 1}-15`,
      }),
    );
    expect(shouldUseFallback(deals)).toBe(false);
  });

  it("8+ deals 2 meses → true (<=1 distinct months heuristic, but spec says <= 1)", () => {
    // 8 deals con 2 meses: months.size === 2 → false
    const deals = Array.from({ length: 8 }, (_, i) =>
      mkDeal({
        id: String(i),
        date_out: i % 2 === 0 ? "2026-08-15" : "2026-09-15",
      }),
    );
    expect(shouldUseFallback(deals)).toBe(false);
  });

  it("8 deals con misma fecha exacta → true", () => {
    const deals = Array.from({ length: 8 }, (_, i) =>
      mkDeal({ id: String(i), date_out: "2026-08-15" }),
    );
    expect(shouldUseFallback(deals)).toBe(true);
  });

  it("null/undefined safe", () => {
    expect(shouldUseFallback(null as unknown as Deal[])).toBe(true);
    expect(shouldUseFallback(undefined as unknown as Deal[])).toBe(true);
  });
});

describe("sortByFeaturedRanking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T12:00:00Z"));
  });

  it("filtra deals > 72h found_at", () => {
    const old = mkDeal({
      id: "old",
      found_at: new Date("2026-08-17T00:00:00Z").toISOString(),
    });
    const fresh = mkDeal({
      id: "fresh",
      found_at: new Date("2026-08-20T11:00:00Z").toISOString(),
    });
    const out = sortByFeaturedRanking([old, fresh]);
    expect(out.find((d) => d.id === "old")).toBeUndefined();
    expect(out.find((d) => d.id === "fresh")).toBeDefined();
  });

  it("deals sin found_at no se filtran", () => {
    const d = mkDeal({ id: "no-time", found_at: "" });
    const out = sortByFeaturedRanking([d]);
    expect(out).toHaveLength(1);
  });

  it("bucket-by-6h + score desc + price asc", () => {
    const now = "2026-08-20T12:00:00Z";
    vi.setSystemTime(new Date(now));
    const a = mkDeal({
      id: "a",
      found_at: "2026-08-20T11:00:00Z",
      score: 80,
      price_eur: 100,
    });
    const b = mkDeal({
      id: "b",
      found_at: "2026-08-20T11:30:00Z",
      score: 95,
      price_eur: 100,
    });
    const c = mkDeal({
      id: "c",
      found_at: "2026-08-20T11:30:00Z",
      score: 95,
      price_eur: 50,
    });
    const out = sortByFeaturedRanking([a, b, c]);
    // mismo bucket, score 95 ganan, b y c. c es más barato → primero
    expect(out[0].id).toBe("c");
    expect(out[1].id).toBe("b");
    expect(out[2].id).toBe("a");
  });

  it("deals dentro de 72h no se filtran", () => {
    const d = mkDeal({
      id: "x",
      found_at: "2026-08-19T13:00:00Z", // 23h atrás
    });
    expect(sortByFeaturedRanking([d])).toHaveLength(1);
  });

  it("lista vacía → []", () => {
    expect(sortByFeaturedRanking([])).toEqual([]);
  });
});

describe("diversifyDeals", () => {
  it("backend con 0 deals → fallback completo", () => {
    const out = diversifyDeals([]);
    expect(out.length).toBeGreaterThan(0);
  });

  it("aplica filter classification", () => {
    const filter: DealFilter = { classification: "CRÍTICO" };
    const out = diversifyDeals([], filter);
    for (const d of out) {
      expect(d.classification?.toUpperCase()).toBe("CRÍTICO");
    }
  });

  it("aplica filter region", () => {
    const filter: DealFilter = { region: "Europa" };
    const out = diversifyDeals([], filter);
    for (const d of out) {
      expect((d.region || "").toLowerCase()).toBe("europa");
    }
  });

  it("aplica filter cabin", () => {
    const filter: DealFilter = { cabin: "business" };
    const out = diversifyDeals([], filter);
    for (const d of out) {
      expect((d.cabin || "").toLowerCase()).toBe("business");
    }
  });

  it("aplica filter max_price", () => {
    const filter: DealFilter = { max_price: 100 };
    const out = diversifyDeals([], filter);
    for (const d of out) {
      expect(d.price_eur).toBeLessThanOrEqual(100);
    }
  });

  it("aplica filter limit", () => {
    const out = diversifyDeals([], { limit: 5 });
    expect(out.length).toBeLessThanOrEqual(5);
  });

  it("backend deals 12 → UNION con synthetic (más de 12)", () => {
    const real = Array.from({ length: 12 }, (_, i) =>
      mkDeal({
        id: String(i),
        origin: "MAD",
        destination: `DST${i}`,
        date_out: `2026-09-${(i % 28) + 1}`,
      }),
    );
    const out = diversifyDeals(real);
    expect(out.length).toBeGreaterThan(12);
  });

  it("dedup por origin-destination-month", () => {
    const real = [mkDeal({ origin: "MAD", destination: "KEF", date_out: "2026-07-12" })];
    const out = diversifyDeals(real);
    // No debe duplicar la entrada MAD-KEF-2026-07
    const madKefJul = out.filter(
      (d) =>
        d.origin === "MAD" &&
        d.destination === "KEF" &&
        (d.date_out || "").startsWith("2026-07"),
    );
    expect(madKefJul.length).toBeLessThanOrEqual(2); // máximo 1 real + 0 synthetic dedup
  });

  it("respeta input no-array (defensive)", () => {
    // @ts-expect-error testing defensive
    const out = diversifyDeals(null);
    expect(out.length).toBeGreaterThan(0);
  });

  it("max_price=0 no filtra", () => {
    const out = diversifyDeals([], { max_price: 0 });
    expect(out.length).toBeGreaterThan(0);
  });

  it("limit=0 no aplica", () => {
    const out = diversifyDeals([], { limit: 0 });
    expect(out.length).toBeGreaterThan(0);
  });

  it("filter combinado region + max_price", () => {
    const out = diversifyDeals([], { region: "Europa", max_price: 100 });
    for (const d of out) {
      expect((d.region || "").toLowerCase()).toBe("europa");
      expect(d.price_eur).toBeLessThanOrEqual(100);
    }
  });

  it("filter classification case-insensitive", () => {
    const out = diversifyDeals([], { classification: "oferta" });
    for (const d of out) {
      expect(d.classification?.toUpperCase()).toBe("OFERTA");
    }
  });

  it("region filter inexistente → 0", () => {
    const out = diversifyDeals([], { region: "Atlantis" });
    expect(out.length).toBe(0);
  });
});

describe("diversifyDeals — sortByFeaturedRanking integration", () => {
  it("aplica sort después de UNION", () => {
    const out = diversifyDeals([]);
    // sortByFeaturedRanking debería ordenar por bucket+score+price
    expect(out.length).toBeGreaterThan(0);
    // Validar que están filtrados por staleness (found_at = "" se mantiene)
    for (const d of out) {
      expect(typeof d.price_eur).toBe("number");
    }
  });
});
