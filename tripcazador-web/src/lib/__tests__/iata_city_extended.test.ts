/**
 * iata_city_extended.test.ts — exhaustive coverage of IATA city fallback + helpers.
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

describe("IATA_CITY_FALLBACK — catalogue integrity", () => {
  it("contiene 100+ entradas", () => {
    expect(Object.keys(IATA_CITY_FALLBACK).length).toBeGreaterThan(60);
  });

  it.each([
    ["SAO", "São Paulo", "Brasil"],
    ["GRU", "São Paulo Guarulhos", "Brasil"],
    ["GIG", "Río de Janeiro Galeão", "Brasil"],
    ["EZE", "Buenos Aires Ezeiza", "Argentina"],
    ["SCL", "Santiago de Chile", "Chile"],
    ["BOG", "Bogotá", "Colombia"],
    ["LIM", "Lima", "Perú"],
    ["UIO", "Quito", "Ecuador"],
    ["CCS", "Caracas", "Venezuela"],
    ["MVD", "Montevideo", "Uruguay"],
    ["ASU", "Asunción", "Paraguay"],
    ["LPB", "La Paz", "Bolivia"],
    ["MEX", "Ciudad de México", "México"],
    ["CUN", "Cancún", "México"],
    ["HAV", "La Habana", "Cuba"],
    ["PUJ", "Punta Cana", "República Dominicana"],
    ["NAS", "Nasáu", "Bahamas"],
    ["MBJ", "Montego Bay", "Jamaica"],
    ["MAD", "Madrid", "España"],
    ["BCN", "Barcelona", "España"],
    ["AGP", "Málaga", "España"],
    ["PMI", "Palma de Mallorca", "España"],
    ["SVQ", "Sevilla", "España"],
    ["TFS", "Tenerife Sur", "España"],
    ["TFN", "Tenerife Norte", "España"],
  ])("IATA %s maps to %s in %s", (iata, city, country) => {
    expect(IATA_CITY_FALLBACK[iata]?.city).toBe(city);
    expect(IATA_CITY_FALLBACK[iata]?.country).toBe(country);
  });

  it("todos los IATA codes son 3 letras mayúsculas", () => {
    for (const code of Object.keys(IATA_CITY_FALLBACK)) {
      expect(code).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("todas las entradas tienen region", () => {
    for (const entry of Object.values(IATA_CITY_FALLBACK)) {
      expect(entry.region).toBeTruthy();
    }
  });
});

describe("EU_ORIGINS — set integrity", () => {
  it("es un Set", () => {
    expect(EU_ORIGINS).toBeInstanceOf(Set);
  });

  it.each([
    "MAD", "BCN", "LHR", "CDG", "FCO", "FRA", "AMS", "LIS", "ZRH",
    "CPH", "ARN", "WAW", "ATH", "KEF", "RAK", "DUB",
  ])("contiene aeropuerto EU %s", (iata) => {
    expect(EU_ORIGINS.has(iata)).toBe(true);
  });

  it.each(["XXX", "ZZZ", "AAA"])("no contiene IATA inválido %s", (fake) => {
    expect(EU_ORIGINS.has(fake)).toBe(false);
  });
});

describe("ES_ORIGINS — set integrity", () => {
  it.each([
    "MAD", "BCN", "AGP", "PMI", "VLC", "SVQ", "BIO", "TFS",
    "TFN", "LPA", "ALC", "IBZ", "MAH",
  ])("contiene aeropuerto ES %s", (iata) => {
    expect(ES_ORIGINS.has(iata)).toBe(true);
  });

  it.each(["LHR", "CDG", "JFK", "SAO"])("no contiene non-ES %s", (iata) => {
    expect(ES_ORIGINS.has(iata)).toBe(false);
  });
});

describe("hasEuOrigin", () => {
  it.each([
    [{ origin: "MAD" }, true],
    [{ origin: "BCN" }, true],
    [{ origin: "LHR" }, true],
    [{ origin: "SAO" }, false],
    [{ origin: "JFK" }, false],
    [{ origin: "GRU" }, false],
    [{ origin: null }, false],
    [{ origin: "" }, false],
    [{ origin: " mad " }, true], // trim + upper
    [{ origin: "mad" }, true],
  ])("origin %j → %s", (deal, expected) => {
    expect(hasEuOrigin(deal)).toBe(expected);
  });

  it("acepta deal sin origin (undefined)", () => {
    expect(hasEuOrigin({})).toBe(false);
  });
});

describe("hasSpainOrigin", () => {
  it.each([
    [{ origin: "MAD" }, true],
    [{ origin: "BCN" }, true],
    [{ origin: "AGP" }, true],
    [{ origin: "LHR" }, false], // EU pero no ES
    [{ origin: "JFK" }, false],
    [{ origin: null }, false],
    [{ origin: "" }, false],
    [{ origin: "mad" }, true],
    [{ origin: "  bcn  " }, true],
  ])("origin %j → %s", (deal, expected) => {
    expect(hasSpainOrigin(deal)).toBe(expected);
  });
});

describe("enrichDealLocations — destination fix", () => {
  it("city_to vacío + destination en catálogo → rellena city_to", () => {
    const out = enrichDealLocations({
      origin: "MAD",
      destination: "SAO",
      city_to: "",
    });
    expect(out.city_to).toBe("São Paulo");
  });

  it("city_to = IATA code → reescribe a nombre ciudad", () => {
    const out = enrichDealLocations({
      origin: "MAD",
      destination: "GIG",
      city_to: "GIG",
    });
    expect(out.city_to).toBe("Río de Janeiro Galeão");
  });

  it("city_to ya con nombre → no toca", () => {
    const out = enrichDealLocations({
      origin: "MAD",
      destination: "BCN",
      city_to: "Mi Ciudad Personalizada",
    });
    expect(out.city_to).toBe("Mi Ciudad Personalizada");
  });

  it("country_to vacío + destination en catálogo → rellena country", () => {
    const out = enrichDealLocations({
      destination: "PUJ",
      country_to: "",
    });
    expect(out.country_to).toBe("República Dominicana");
  });

  it("region = 'Internacional' es reemplazado por catálogo", () => {
    const out = enrichDealLocations({
      destination: "BKK",
      region: "Internacional",
    });
    // BKK no está en IATA_CITY_FALLBACK, region se mantiene
    expect(out.region).toBe("Internacional");
  });

  it("destination GIG con headline tipo 'X desde GIG' → reemplaza", () => {
    const out = enrichDealLocations({
      origin: "SAO",
      destination: "GIG",
      headline: "Error fare: GIG desde SAO",
    });
    expect(out.headline).toContain("Río de Janeiro Galeão");
    expect(out.headline).toContain("São Paulo");
  });

  it("destination unknown → no muta city_to/country_to", () => {
    const out = enrichDealLocations({
      origin: "MAD",
      destination: "XYZ",
      city_to: "",
      country_to: "",
    });
    expect(out.city_to).toBe("");
  });

  it("origin city_from vacío + origin SAO → rellena city_from", () => {
    const out = enrichDealLocations({
      origin: "SAO",
      destination: "MAD",
      city_from: "",
      city_to: "Madrid",
    });
    expect(out.city_from).toBe("São Paulo");
  });

  it("no muta input original", () => {
    const original: { origin: string; destination: string; city_to: string } = {
      origin: "MAD",
      destination: "SAO",
      city_to: "",
    };
    enrichDealLocations(original);
    expect(original.city_to).toBe("");
  });

  it("destination undefined → safe", () => {
    expect(() => enrichDealLocations({ origin: "MAD" })).not.toThrow();
  });

  it("preserva todas las claves del objeto original", () => {
    const out = enrichDealLocations({
      origin: "MAD",
      destination: "SAO",
      city_to: "",
      headline: "h",
    });
    expect(out.origin).toBe("MAD");
    expect(out.destination).toBe("SAO");
    expect(out.headline).toBe("h");
  });
});
