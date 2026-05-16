/**
 * remaining_libs.test.ts — SSS253+254 (16 may 2026)
 *
 * Tests batch para 6 libs:
 *  - country_hubs.ts (284 líneas)
 *  - hotels_vs_airbnb.ts
 *  - hunter_quality.ts
 *  - airport_clusters.ts
 *  - destinations_i18n.ts
 *  - route_groups.ts
 */
import { describe, it, expect } from "vitest";
import { COUNTRY_HUBS, getCountryBySlug } from "../country_hubs";
import { HOTELS_VS_AIRBNB, getCityComparison } from "../hotels_vs_airbnb";
import {
  calculateQualityScore,
  autoCategorizeDeal,
  filterByQuality,
  rankByQuality,
} from "../hunter_quality";
import {
  AIRPORT_CLUSTERS,
  resolveCluster,
  expandCluster,
  generatePairs,
} from "../airport_clusters";
import {
  DESTINATIONS_I18N,
  UI_STRINGS,
  I18N_LOCALES,
} from "../destinations_i18n";
import { ROUTE_GROUPS, getGroupBySlug } from "../route_groups";

const SLUG_REGEX = /^[a-z0-9-]+$/;

// ============ country_hubs ============

describe("COUNTRY_HUBS catalog", () => {
  it("tiene mínimo 10 países", () => {
    expect(COUNTRY_HUBS.length).toBeGreaterThanOrEqual(10);
  });

  it("slugs únicos format kebab", () => {
    const slugs = COUNTRY_HUBS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s).toMatch(SLUG_REGEX);
    }
  });

  it("cada country tiene name, emoji, region, capital", () => {
    for (const c of COUNTRY_HUBS) {
      expect(c.name).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.region).toBeTruthy();
      expect(c.capital).toBeTruthy();
    }
  });

  it("name no contiene chars XSS", () => {
    for (const c of COUNTRY_HUBS) {
      expect(c.name).not.toMatch(/[<>]/);
    }
  });
});

describe("getCountryBySlug", () => {
  it("retorna country para slug válido", () => {
    const first = COUNTRY_HUBS[0];
    expect(getCountryBySlug(first.slug)).toBeDefined();
  });

  it("undefined para slug desconocido", () => {
    expect(getCountryBySlug("nonexistent-xyz")).toBeUndefined();
  });
});

// ============ hotels_vs_airbnb ============

describe("HOTELS_VS_AIRBNB catalog", () => {
  it("tiene mínimo 3 city comparisons", () => {
    expect(HOTELS_VS_AIRBNB.length).toBeGreaterThanOrEqual(3);
  });

  it("slugs únicos kebab", () => {
    const slugs = HOTELS_VS_AIRBNB.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s).toMatch(SLUG_REGEX);
    }
  });

  it("cada comparison tiene city, country, intro", () => {
    for (const c of HOTELS_VS_AIRBNB) {
      expect(c.city).toBeTruthy();
      expect(c.country).toBeTruthy();
      expect(c.intro).toBeTruthy();
      expect(c.intro.length).toBeGreaterThan(20);
    }
  });

  it("ningún campo tiene chars XSS peligrosos", () => {
    for (const c of HOTELS_VS_AIRBNB) {
      expect(c.city).not.toMatch(/[<>]/);
      expect(c.intro).not.toMatch(/<script/i);
    }
  });
});

describe("getCityComparison", () => {
  it("retorna para slug válido", () => {
    const first = HOTELS_VS_AIRBNB[0];
    expect(getCityComparison(first.slug)).toBeDefined();
  });

  it("undefined para slug desconocido", () => {
    expect(getCityComparison("ghost-city")).toBeUndefined();
  });
});

// ============ hunter_quality ============

interface MockDeal {
  id: string;
  city_from: string;
  city_to: string;
  price_eur: number;
  found_at: string;
  cabin?: string;
  source?: string;
  is_error_fare?: boolean;
  stops?: number;
  airline_code?: string;
}

function mockDeal(overrides: Partial<MockDeal> = {}): MockDeal {
  return {
    id: "deal_1",
    city_from: "MAD",
    city_to: "LIS",
    price_eur: 50,
    found_at: new Date().toISOString(),
    cabin: "economy",
    source: "ryanair",
    is_error_fare: false,
    stops: 0,
    airline_code: "FR",
    ...overrides,
  };
}

describe("hunter_quality", () => {
  it("calculateQualityScore retorna número en rango 0-100", () => {
    // @ts-expect-error - mock deal compatible suficiente
    const score = calculateQualityScore(mockDeal());
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("error fares tienen score >= regular fares (heurístico)", () => {
    // @ts-expect-error - mock
    const regular = calculateQualityScore(mockDeal({ price_eur: 100 }));
    // @ts-expect-error - mock
    const errorFare = calculateQualityScore(
      mockDeal({ price_eur: 30, is_error_fare: true }),
    );
    expect(errorFare).toBeGreaterThanOrEqual(regular);
  });

  it("autoCategorizeDeal retorna array de categorías", () => {
    // @ts-expect-error - mock
    const cats = autoCategorizeDeal(mockDeal());
    expect(Array.isArray(cats)).toBe(true);
  });

  it("filterByQuality respeta minScore", () => {
    const deals = [
      mockDeal({ id: "a" }),
      mockDeal({ id: "b", price_eur: 1000 }),
      mockDeal({ id: "c", is_error_fare: true, price_eur: 20 }),
    ];
    // @ts-expect-error - mocks
    const high = filterByQuality(deals, 90);
    // @ts-expect-error - mocks
    const low = filterByQuality(deals, 0);
    expect(low.length).toBeGreaterThanOrEqual(high.length);
  });

  it("rankByQuality ordena descending por score", () => {
    const deals = [
      mockDeal({ id: "regular" }),
      mockDeal({ id: "error", is_error_fare: true, price_eur: 20 }),
    ];
    // @ts-expect-error - mocks
    const ranked = rankByQuality(deals);
    expect(ranked).toHaveLength(2);
    // @ts-expect-error - mocks
    const ranked0Score = calculateQualityScore(ranked[0]);
    // @ts-expect-error - mocks
    const ranked1Score = calculateQualityScore(ranked[1]);
    expect(ranked0Score).toBeGreaterThanOrEqual(ranked1Score);
  });
});

// ============ airport_clusters ============

describe("AIRPORT_CLUSTERS catalog", () => {
  it("tiene mínimo 5 clusters", () => {
    expect(Object.keys(AIRPORT_CLUSTERS).length).toBeGreaterThanOrEqual(5);
  });

  it("cada cluster tiene city, primary IATA, secondary array", () => {
    for (const [key, cluster] of Object.entries(AIRPORT_CLUSTERS)) {
      expect(cluster.city).toBeTruthy();
      expect(cluster.primary).toMatch(/^[A-Z]{3}$/);
      expect(Array.isArray(cluster.secondary)).toBe(true);
      // key should match primary or alias
      expect(key.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("secondary IATAs son 3-char uppercase", () => {
    for (const cluster of Object.values(AIRPORT_CLUSTERS)) {
      for (const iata of cluster.secondary) {
        expect(iata).toMatch(/^[A-Z]{3}$/);
      }
    }
  });
});

describe("resolveCluster", () => {
  it("resuelve por primary IATA", () => {
    const firstKey = Object.keys(AIRPORT_CLUSTERS)[0];
    const cluster = AIRPORT_CLUSTERS[firstKey];
    expect(resolveCluster(cluster.primary)).not.toBeNull();
  });

  it("null para IATA desconocido", () => {
    expect(resolveCluster("ZZZ")).toBeNull();
  });
});

describe("expandCluster", () => {
  it("retorna array con primary + secondary", () => {
    const cluster = Object.values(AIRPORT_CLUSTERS)[0];
    const expanded = expandCluster(cluster);
    expect(expanded).toContain(cluster.primary);
    expect(expanded.length).toBeGreaterThanOrEqual(1 + cluster.secondary.length);
  });

  it("sin duplicados", () => {
    for (const cluster of Object.values(AIRPORT_CLUSTERS)) {
      const expanded = expandCluster(cluster);
      expect(new Set(expanded).size).toBe(expanded.length);
    }
  });
});

describe("generatePairs", () => {
  it("retorna pares no vacíos para 2 clusters", () => {
    const clusters = Object.values(AIRPORT_CLUSTERS).slice(0, 2);
    if (clusters.length >= 2) {
      const pairs = generatePairs(clusters[0], clusters[1]);
      expect(Array.isArray(pairs)).toBe(true);
      expect(pairs.length).toBeGreaterThan(0);
    }
  });
});

// ============ destinations_i18n ============

describe("DESTINATIONS_I18N catalog", () => {
  it("tiene mínimo 6 destinos", () => {
    expect(Object.keys(DESTINATIONS_I18N).length).toBeGreaterThanOrEqual(6);
  });

  it("cada entry tiene slug + esSlug + iata array", () => {
    for (const [key, entry] of Object.entries(DESTINATIONS_I18N)) {
      expect(entry.slug).toBeTruthy();
      expect(entry.esSlug).toBeTruthy();
      expect(Array.isArray(entry.iata)).toBe(true);
      expect(key).toBeTruthy();
    }
  });

  it("cada IATA es 3-char uppercase", () => {
    for (const entry of Object.values(DESTINATIONS_I18N)) {
      for (const iata of entry.iata) {
        expect(iata).toMatch(/^[A-Z]{3}$/);
      }
    }
  });
});

describe("I18N_LOCALES", () => {
  it("contiene it, de, fr", () => {
    expect(I18N_LOCALES).toContain("it");
    expect(I18N_LOCALES).toContain("de");
    expect(I18N_LOCALES).toContain("fr");
  });
});

describe("UI_STRINGS", () => {
  it("tiene strings para los 3 locales", () => {
    const ui = UI_STRINGS as Record<string, unknown>;
    expect(ui.it).toBeTruthy();
    expect(ui.de).toBeTruthy();
    expect(ui.fr).toBeTruthy();
  });
});

// ============ route_groups ============

describe("ROUTE_GROUPS catalog", () => {
  it("tiene mínimo 3 groups", () => {
    expect(ROUTE_GROUPS.length).toBeGreaterThanOrEqual(3);
  });

  it("IDs únicos", () => {
    const ids = ROUTE_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada group tiene label + emoji + description + filter fn", () => {
    for (const g of ROUTE_GROUPS) {
      expect(g.label).toBeTruthy();
      expect(g.emoji).toBeTruthy();
      expect(g.description).toBeTruthy();
      expect(typeof g.filter).toBe("function");
    }
  });
});

describe("getGroupBySlug", () => {
  it("retorna group por id válido", () => {
    const first = ROUTE_GROUPS[0];
    expect(getGroupBySlug(first.id as string)).not.toBeNull();
  });

  it("null para id desconocido", () => {
    expect(getGroupBySlug("nonexistent-group-xyz")).toBeNull();
  });
});
