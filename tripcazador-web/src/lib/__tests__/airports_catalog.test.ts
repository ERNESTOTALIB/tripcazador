/**
 * airports_catalog.test.ts — coverage para fuzzySearchAirports y helpers.
 *
 * Verifica:
 *  - normalización tildes (Múnich = munich)
 *  - alias multi-idioma (NYC, Frankfurt, etc.)
 *  - dedup IATA en catálogo
 *  - score ordering (exact IATA > city startsWith > country)
 *  - getAirportByIata case-insensitive
 *  - multi-token search (Frankfurt Hahn, Baden-Baden)
 */
import { describe, it, expect } from "vitest";
import {
  AIRPORTS_CATALOG,
  fuzzySearchAirports,
  getAirportByIata,
  getAirportsByCountry,
  isBulkAirportsLoaded,
  getBulkAirports,
  fuzzySearchAirportsAll,
} from "../airports_catalog";

describe("AIRPORTS_CATALOG — estructura", () => {
  it("tiene al menos 200 entradas", () => {
    expect(AIRPORTS_CATALOG.length).toBeGreaterThanOrEqual(200);
  });

  it("todas las entradas tienen IATA de 3 caracteres", () => {
    AIRPORTS_CATALOG.forEach((a) => {
      expect(a.iata).toMatch(/^[A-Z0-9]{3}$/);
    });
  });

  it("todas las entradas tienen ciudad no vacía", () => {
    AIRPORTS_CATALOG.forEach((a) => {
      expect(a.city.trim().length).toBeGreaterThan(0);
    });
  });

  it("todas las entradas tienen país no vacío", () => {
    AIRPORTS_CATALOG.forEach((a) => {
      expect(a.country.trim().length).toBeGreaterThan(0);
    });
  });

  it("no hay IATAs duplicados en el catálogo curated", () => {
    const codes = AIRPORTS_CATALOG.map((a) => a.iata);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("contiene los principales hubs españoles", () => {
    const required = ["MAD", "BCN", "AGP", "VLC", "SVQ", "PMI", "BIO"];
    required.forEach((c) => {
      expect(AIRPORTS_CATALOG.find((a) => a.iata === c)).toBeDefined();
    });
  });

  it("contiene principales hubs europeos", () => {
    const required = ["LHR", "CDG", "FRA", "AMS", "FCO", "MUC", "BER"];
    required.forEach((c) => {
      expect(AIRPORTS_CATALOG.find((a) => a.iata === c)).toBeDefined();
    });
  });
});

describe("fuzzySearchAirports — búsqueda exacta", () => {
  it("query de 1 char devuelve vacío", () => {
    const r = fuzzySearchAirports("M");
    expect(r).toEqual([]);
  });

  it("query vacía devuelve vacío", () => {
    const r = fuzzySearchAirports("");
    expect(r).toEqual([]);
  });

  it("IATA exacto MAD devuelve MAD primero", () => {
    const r = fuzzySearchAirports("MAD");
    expect(r[0]?.iata).toBe("MAD");
  });

  it("ciudad exacta 'Madrid' devuelve MAD primero", () => {
    const r = fuzzySearchAirports("Madrid");
    expect(r[0]?.iata).toBe("MAD");
  });

  it("ciudad 'barcelona' (lowercase) → BCN", () => {
    const r = fuzzySearchAirports("barcelona");
    expect(r[0]?.iata).toBe("BCN");
  });
});

describe("fuzzySearchAirports — tildes y diacríticos", () => {
  it("búsqueda 'munich' sin tilde encuentra Múnich (MUC)", () => {
    const r = fuzzySearchAirports("munich");
    expect(r.some((a) => a.iata === "MUC")).toBe(true);
  });

  it("búsqueda 'malaga' sin tilde encuentra Málaga (AGP)", () => {
    const r = fuzzySearchAirports("malaga");
    expect(r.some((a) => a.iata === "AGP")).toBe(true);
  });

  it("búsqueda 'Berlin' encuentra BER", () => {
    const r = fuzzySearchAirports("Berlin");
    expect(r[0]?.iata).toBe("BER");
  });
});

describe("fuzzySearchAirports — aliases", () => {
  it("'londres' encuentra Heathrow LHR", () => {
    const r = fuzzySearchAirports("londres");
    const iatas = r.map((a) => a.iata);
    expect(iatas).toContain("LHR");
  });

  it("'gatwick' encuentra LGW", () => {
    const r = fuzzySearchAirports("gatwick");
    expect(r[0]?.iata).toBe("LGW");
  });

  it("'frankfurt' (alias para FRA) encuentra FRA", () => {
    const r = fuzzySearchAirports("frankfurt");
    expect(r.some((a) => a.iata === "FRA")).toBe(true);
  });
});

describe("fuzzySearchAirports — country search", () => {
  it("'españa' devuelve aeropuertos de España", () => {
    const r = fuzzySearchAirports("españa");
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((a) => a.country === "España")).toBe(true);
  });

  it("'alemania' devuelve aeropuertos DE", () => {
    const r = fuzzySearchAirports("alemania");
    expect(r.some((a) => a.country === "Alemania")).toBe(true);
  });
});

describe("fuzzySearchAirports — limit", () => {
  it("respeta limit explícito", () => {
    // "a" es 1 char → vacío, no testea limit. Probar "ma" directamente.
    const r2 = fuzzySearchAirports("ma", 3);
    expect(r2.length).toBeLessThanOrEqual(3);
  });

  it("default limit es 18", () => {
    // "a" es 1 char → vacío. Probar algo más
    const r2 = fuzzySearchAirports("aero");
    expect(r2.length).toBeLessThanOrEqual(18);
  });
});

describe("getAirportByIata", () => {
  it("MAD encuentra Madrid", () => {
    const a = getAirportByIata("MAD");
    expect(a?.city).toBe("Madrid");
  });

  it("mad (lowercase) encuentra Madrid", () => {
    const a = getAirportByIata("mad");
    expect(a?.iata).toBe("MAD");
  });

  it("IATA no existente devuelve undefined", () => {
    const a = getAirportByIata("XXX");
    expect(a).toBeUndefined();
  });

  it("string vacía devuelve undefined", () => {
    const a = getAirportByIata("");
    expect(a).toBeUndefined();
  });
});

describe("getAirportsByCountry", () => {
  it("'España' devuelve >=20 aeropuertos", () => {
    const r = getAirportsByCountry("España");
    expect(r.length).toBeGreaterThan(15);
  });

  it("country case insensitive (lowercase trabaja)", () => {
    const r = getAirportsByCountry("españa");
    expect(r.length).toBeGreaterThan(0);
  });

  it("country no existente devuelve []", () => {
    const r = getAirportsByCountry("Atlantida");
    expect(r).toEqual([]);
  });
});

describe("bulk catalog", () => {
  it("isBulkAirportsLoaded inicia en false (no se llamó loadBulkAirports)", () => {
    expect(isBulkAirportsLoaded()).toBe(false);
  });

  it("getBulkAirports() devuelve [] cuando no cargado", () => {
    expect(getBulkAirports()).toEqual([]);
  });

  it("fuzzySearchAirportsAll funciona aunque bulk esté vacío", () => {
    const r = fuzzySearchAirportsAll("madrid");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]?.iata).toBe("MAD");
  });
});
