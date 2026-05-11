/**
 * iata_city.test.ts — AAAA01 mapping + enrichDealLocations helpers.
 */
import { describe, it, expect } from "vitest";
import {
  IATA_CITY_FALLBACK,
  EU_ORIGINS,
  ES_ORIGINS,
  enrichDealLocations,
  hasEuOrigin,
  hasSpainOrigin,
} from "../iata_city";

describe("IATA_CITY_FALLBACK — mapping data", () => {
  it("contiene IATAs LATAM principales", () => {
    const expected = ["GRU", "EZE", "BOG", "LIM", "MEX", "SCL", "HAV"];
    expected.forEach((iata) => {
      expect(IATA_CITY_FALLBACK[iata]).toBeDefined();
    });
  });

  it("contiene IATAs España principales", () => {
    const expected = ["MAD", "BCN", "AGP", "PMI", "VLC", "SVQ"];
    expected.forEach((iata) => {
      expect(IATA_CITY_FALLBACK[iata]).toBeDefined();
    });
  });

  it("todos los IATAs son uppercase 3 chars", () => {
    Object.keys(IATA_CITY_FALLBACK).forEach((iata) => {
      expect(iata).toMatch(/^[A-Z]{3}$/);
    });
  });

  it("todas las entradas tienen city/country/region", () => {
    Object.values(IATA_CITY_FALLBACK).forEach((info) => {
      expect(info.city.length).toBeGreaterThan(0);
      expect(info.country.length).toBeGreaterThan(0);
      expect(info.region.length).toBeGreaterThan(0);
    });
  });

  it("MAD mapea a Madrid / España / Europa", () => {
    const info = IATA_CITY_FALLBACK.MAD;
    expect(info.city).toBe("Madrid");
    expect(info.country).toBe("España");
    expect(info.region).toBe("Europa");
  });

  it("GRU mapea a São Paulo / Brasil / América Sur", () => {
    const info = IATA_CITY_FALLBACK.GRU;
    expect(info.country).toBe("Brasil");
    expect(info.region).toBe("América Sur");
  });
});

describe("EU_ORIGINS Set", () => {
  it("contiene principales hubs España", () => {
    ["MAD", "BCN", "AGP", "PMI"].forEach((c) => {
      expect(EU_ORIGINS.has(c)).toBe(true);
    });
  });

  it("contiene principales hubs UK", () => {
    ["LHR", "LGW", "STN", "LTN"].forEach((c) => {
      expect(EU_ORIGINS.has(c)).toBe(true);
    });
  });

  it("contiene Francia, Italia, Alemania", () => {
    ["CDG", "FCO", "FRA"].forEach((c) => {
      expect(EU_ORIGINS.has(c)).toBe(true);
    });
  });

  it("NO contiene IATAs LATAM puros", () => {
    ["GRU", "EZE", "BOG", "LIM"].forEach((c) => {
      expect(EU_ORIGINS.has(c)).toBe(false);
    });
  });

  it("contiene Norte de África relevante a viajero ES (RAK, CMN)", () => {
    expect(EU_ORIGINS.has("RAK")).toBe(true);
    expect(EU_ORIGINS.has("CMN")).toBe(true);
  });
});

describe("ES_ORIGINS Set", () => {
  it("contiene aeropuertos peninsulares + islas", () => {
    ["MAD", "BCN", "AGP", "VLC", "PMI", "IBZ", "TFS"].forEach((c) => {
      expect(ES_ORIGINS.has(c)).toBe(true);
    });
  });

  it("NO contiene CDG (París)", () => {
    expect(ES_ORIGINS.has("CDG")).toBe(false);
  });

  it("NO contiene LHR (Londres)", () => {
    expect(ES_ORIGINS.has("LHR")).toBe(false);
  });
});

describe("hasEuOrigin", () => {
  it("MAD → true", () => {
    expect(hasEuOrigin({ origin: "MAD" })).toBe(true);
  });

  it("BCN → true", () => {
    expect(hasEuOrigin({ origin: "BCN" })).toBe(true);
  });

  it("GRU → false (LATAM)", () => {
    expect(hasEuOrigin({ origin: "GRU" })).toBe(false);
  });

  it("origin null → false", () => {
    expect(hasEuOrigin({ origin: null })).toBe(false);
  });

  it("origin undefined → false", () => {
    expect(hasEuOrigin({})).toBe(false);
  });

  it("origin vacío → false", () => {
    expect(hasEuOrigin({ origin: "" })).toBe(false);
  });

  it("origin lowercase 'mad' → true (normaliza)", () => {
    expect(hasEuOrigin({ origin: "mad" })).toBe(true);
  });
});

describe("hasSpainOrigin", () => {
  it("MAD → true", () => {
    expect(hasSpainOrigin({ origin: "MAD" })).toBe(true);
  });

  it("LIS (Portugal) → false", () => {
    expect(hasSpainOrigin({ origin: "LIS" })).toBe(false);
  });

  it("CDG (París) → false", () => {
    expect(hasSpainOrigin({ origin: "CDG" })).toBe(false);
  });

  it("origin vacío → false", () => {
    expect(hasSpainOrigin({ origin: "" })).toBe(false);
  });

  it("lowercase 'bcn' → true", () => {
    expect(hasSpainOrigin({ origin: "bcn" })).toBe(true);
  });
});

describe("enrichDealLocations", () => {
  it("city_to vacío + destination=GRU → llena con 'São Paulo'", () => {
    const d = {
      origin: "MAD",
      destination: "GRU",
      city_from: "Madrid",
      city_to: "",
      country_to: "",
      region: "",
    };
    const out = enrichDealLocations(d);
    expect(out.city_to).toBe("São Paulo Guarulhos");
    expect(out.country_to).toBe("Brasil");
    expect(out.region).toBe("América Sur");
  });

  it("city_to igual a IATA → reemplaza por nombre", () => {
    const d = {
      origin: "MAD",
      destination: "GRU",
      city_to: "GRU",
      city_from: "Madrid",
    };
    const out = enrichDealLocations(d);
    expect(out.city_to).not.toBe("GRU");
    expect(out.city_to).toContain("São Paulo");
  });

  it("city_to con nombre real → no se sobrescribe", () => {
    const d = {
      origin: "MAD",
      destination: "GRU",
      city_to: "São Paulo Guarulhos",
      city_from: "Madrid",
    };
    const out = enrichDealLocations(d);
    expect(out.city_to).toBe("São Paulo Guarulhos");
  });

  it("country_to ya seteado → no se sobrescribe", () => {
    const d = {
      origin: "MAD",
      destination: "GRU",
      city_to: "São Paulo",
      country_to: "Brasil (custom)",
    };
    const out = enrichDealLocations(d);
    expect(out.country_to).toBe("Brasil (custom)");
  });

  it("destination IATA desconocido → no llena nada", () => {
    const d = {
      origin: "MAD",
      destination: "ZZZ",
      city_to: "",
    };
    const out = enrichDealLocations(d);
    expect(out.city_to).toBe("");
  });

  it("headline contiene IATA → reemplaza por city", () => {
    const d = {
      origin: "MAD",
      destination: "GRU",
      city_to: "",
      headline: "Vuelos a GRU desde 299€",
    };
    const out = enrichDealLocations(d);
    expect(out.headline).not.toContain("GRU");
    expect(out.headline).toContain("São Paulo");
  });

  it("región 'Internacional' (placeholder) se sobrescribe con la real", () => {
    const d = {
      origin: "MAD",
      destination: "LIM",
      city_to: "Lima",
      country_to: "Perú",
      region: "Internacional",
    };
    const out = enrichDealLocations(d);
    expect(out.region).toBe("América Sur");
  });

  it("no muta input original", () => {
    const d = {
      origin: "MAD",
      destination: "GRU",
      city_to: "",
    };
    const before = JSON.stringify(d);
    enrichDealLocations(d);
    expect(JSON.stringify(d)).toBe(before);
  });
});
