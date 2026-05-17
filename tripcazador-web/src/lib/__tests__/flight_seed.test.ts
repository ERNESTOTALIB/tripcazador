/**
 * flight_seed.test.ts — verifica la integridad del catálogo FLIGHT_SEED + helpers.
 */
import { describe, it, expect } from "vitest";
import {
  FLIGHT_SEED,
  getFlightSeedFallback,
  getFlightEntries,
  getFlightsByOrigin,
  getFlightsByDestination,
  getTopFlightDeals,
} from "../flight_seed";

describe("FLIGHT_SEED — integridad", () => {
  it("contiene al menos 100 vuelos", () => {
    expect(FLIGHT_SEED.length).toBeGreaterThanOrEqual(100);
  });

  it("todos los vuelos tienen id distintos", () => {
    const ids = FLIGHT_SEED.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos los vuelos son type=flight", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.type).toBe("flight");
    });
  });

  it("todos los vuelos tienen origin IATA (3 letras)", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.origin).toMatch(/^[A-Z]{3}$/);
    });
  });

  it("todos los vuelos tienen destination IATA (3 letras)", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.destination).toMatch(/^[A-Z]{3}$/);
    });
  });

  it("todos los vuelos tienen price_eur > 0", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.price_eur).toBeGreaterThan(0);
    });
  });

  it("todos los vuelos tienen savings_pct entre 0 y 100", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.savings_pct).toBeGreaterThan(0);
      expect(d.savings_pct).toBeLessThanOrEqual(100);
    });
  });

  it("todos los vuelos tienen cabin economy o business", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(["economy", "business"]).toContain(d.cabin);
    });
  });

  it("todos los vuelos tienen airline_name no vacío", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.airline_name?.length).toBeGreaterThan(0);
    });
  });

  it("todos los vuelos tienen booking_url con kiwi.com", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.booking_url).toContain("kiwi.com");
    });
  });

  it("todos tienen classification válida", () => {
    const valid = ["CRITICO", "ERROR", "ANOMALIA", "OFERTA"];
    FLIGHT_SEED.forEach((d) => {
      expect(valid).toContain(d.classification);
    });
  });

  it("todos tienen date_out en formato YYYY-MM-DD", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(d.date_out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("date_ret es posterior a date_out", () => {
    FLIGHT_SEED.forEach((d) => {
      expect(new Date(d.date_ret!).getTime()).toBeGreaterThan(
        new Date(d.date_out!).getTime()
      );
    });
  });

  it("hay al menos 10 deals business class", () => {
    const biz = FLIGHT_SEED.filter((d) => d.cabin === "business");
    expect(biz.length).toBeGreaterThanOrEqual(10);
  });

  it("hay deals de al menos 5 aerolíneas distintas", () => {
    const airlines = new Set(FLIGHT_SEED.map((d) => d.airline));
    expect(airlines.size).toBeGreaterThanOrEqual(5);
  });

  it("hay deals desde al menos 5 orígenes distintos", () => {
    const origins = new Set(FLIGHT_SEED.map((d) => d.origin));
    expect(origins.size).toBeGreaterThanOrEqual(5);
  });

  it("cubre rutas short, medium y long", () => {
    const dists = new Set(FLIGHT_SEED.map((d) => d.distance_category));
    expect(dists.has("short")).toBe(true);
    expect(dists.has("medium")).toBe(true);
    expect(dists.has("long")).toBe(true);
  });
});

describe("getFlightSeedFallback — filtros", () => {
  it("limita resultados con limit", () => {
    const deals = getFlightSeedFallback({ limit: 5 });
    expect(deals.length).toBeLessThanOrEqual(5);
  });

  it("filtra por cabin=business", () => {
    const deals = getFlightSeedFallback({ cabin: "business" });
    deals.forEach((d) => expect(d.cabin).toBe("business"));
  });

  it("filtra por maxPrice", () => {
    const deals = getFlightSeedFallback({ maxPrice: 50 });
    deals.forEach((d) => expect(d.price_eur).toBeLessThanOrEqual(50));
  });

  it("filtra por classification", () => {
    const deals = getFlightSeedFallback({ classification: "CRITICO" });
    deals.forEach((d) => expect(d.classification).toBe("CRITICO"));
  });

  it("filtra por distanceCategory", () => {
    const deals = getFlightSeedFallback({ distanceCategory: "long" });
    deals.forEach((d) => expect(d.distance_category).toBe("long"));
  });

  it("filtra por origin", () => {
    const deals = getFlightSeedFallback({ origin: "MAD" });
    deals.forEach((d) => expect(d.origin).toBe("MAD"));
  });

  it("devuelve ordenado por score descendente", () => {
    const deals = getFlightSeedFallback({ limit: 20 });
    for (let i = 1; i < deals.length; i++) {
      expect(deals[i - 1].score!).toBeGreaterThanOrEqual(deals[i].score!);
    }
  });
});

describe("getFlightEntries", () => {
  it("devuelve array con al menos 100 entries", () => {
    expect(getFlightEntries().length).toBeGreaterThanOrEqual(100);
  });
});

describe("getFlightsByOrigin", () => {
  it("devuelve vuelos solo desde MAD", () => {
    const deals = getFlightsByOrigin("MAD");
    expect(deals.length).toBeGreaterThan(0);
    deals.forEach((d) => expect(d.origin).toBe("MAD"));
  });

  it("case insensitive", () => {
    const deals = getFlightsByOrigin("mad");
    expect(deals.length).toBeGreaterThan(0);
  });
});

describe("getFlightsByDestination", () => {
  it("devuelve vuelos solo hacia JFK", () => {
    const deals = getFlightsByDestination("JFK");
    expect(deals.length).toBeGreaterThan(0);
    deals.forEach((d) => expect(d.destination).toBe("JFK"));
  });
});

describe("getTopFlightDeals", () => {
  it("devuelve los N mejores deals por score", () => {
    const top = getTopFlightDeals(5);
    expect(top.length).toBe(5);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].score!).toBeGreaterThanOrEqual(top[i].score!);
    }
  });
});
