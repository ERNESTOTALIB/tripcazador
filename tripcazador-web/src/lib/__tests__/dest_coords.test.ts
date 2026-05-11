/**
 * dest_coords.test.ts — coverage for SSS74 coord formatter + lookups.
 */
import { describe, it, expect } from "vitest";
import { formatCoord, lookupCoord, getCoordForDeal } from "../dest_coords";

describe("formatCoord — DegMin formatting", () => {
  it("Barcelona 41.4, 2.17", () => {
    expect(formatCoord(41.4, 2.17)).toBe("41°24′ N · 2°10′ E");
  });

  it("Madrid 40.42, -3.7 → W hemisphere", () => {
    expect(formatCoord(40.42, -3.7)).toBe("40°25′ N · 3°42′ W");
  });

  it("Buenos Aires -34.61, -58.38 → S + W", () => {
    expect(formatCoord(-34.61, -58.38)).toBe("34°37′ S · 58°23′ W");
  });

  it("Tokio 35.68, 139.69 → N + E", () => {
    expect(formatCoord(35.68, 139.69)).toBe("35°41′ N · 139°41′ E");
  });

  it("Origin 0,0 → 0°00 N · 0°00 E", () => {
    expect(formatCoord(0, 0)).toBe("0°00′ N · 0°00′ E");
  });

  it.each([
    [undefined, undefined],
    [undefined, 1],
    [1, undefined],
    [NaN, 0],
    [0, NaN],
    [Infinity, 0],
    [0, -Infinity],
  ])("returns null for invalid (%s, %s)", (lat, lon) => {
    // @ts-expect-error testing invalid inputs
    expect(formatCoord(lat, lon)).toBeNull();
  });

  it("formato pad minutos a 2 dígitos", () => {
    expect(formatCoord(40.05, 2.05)).toMatch(/40°03′/);
  });
});

describe("lookupCoord — slug/IATA matching", () => {
  it.each([
    ["barcelona", { lat: 41.4, lon: 2.17 }],
    ["BCN", { lat: 41.4, lon: 2.17 }],
    ["madrid", { lat: 40.42, lon: -3.7 }],
    ["MAD", { lat: 40.42, lon: -3.7 }],
    ["paris", { lat: 48.86, lon: 2.35 }],
    ["cdg", { lat: 48.86, lon: 2.35 }],
    ["bali", { lat: -8.65, lon: 115.22 }],
    ["DPS", { lat: -8.65, lon: 115.22 }],
    ["tokio", { lat: 35.68, lon: 139.69 }],
    ["tokyo", { lat: 35.68, lon: 139.69 }],
  ])("lookup %s", (input, expected) => {
    expect(lookupCoord(input)).toEqual(expected);
  });

  it("null para input vacío/null/undefined", () => {
    expect(lookupCoord(null)).toBeNull();
    expect(lookupCoord(undefined)).toBeNull();
    expect(lookupCoord("")).toBeNull();
  });

  it("trim + normaliza espacios", () => {
    expect(lookupCoord("  Madrid  ")).toEqual({ lat: 40.42, lon: -3.7 });
  });

  it("normaliza acentos (Fráncfort → frankfurt)", () => {
    const result = lookupCoord("fráncfort");
    expect(result).toEqual({ lat: 50.11, lon: 8.68 });
  });

  it("multi-palabra con espacio → underscore", () => {
    expect(lookupCoord("Nueva York")).toEqual({ lat: 40.71, lon: -74.01 });
    expect(lookupCoord("Los Angeles")).toEqual({ lat: 34.05, lon: -118.24 });
  });

  it("destino no en catálogo → null", () => {
    expect(lookupCoord("alpha-centauri")).toBeNull();
    expect(lookupCoord("XYZ")).toBeNull();
  });

  it("acepta mayúsculas en slug ciudad", () => {
    expect(lookupCoord("BARCELONA")).toEqual({ lat: 41.4, lon: 2.17 });
  });
});

describe("getCoordForDeal", () => {
  it("usa lat/lon del deal si están presentes", () => {
    expect(getCoordForDeal({ lat: 10, lon: 20 })).toBe("10°00′ N · 20°00′ E");
  });

  it("fallback a catalog destination IATA", () => {
    const out = getCoordForDeal({ destination: "BCN" });
    expect(out).toBe("41°24′ N · 2°10′ E");
  });

  it("fallback a catalog cityTo", () => {
    const out = getCoordForDeal({ cityTo: "Roma" });
    expect(out).toBe("41°54′ N · 12°30′ E");
  });

  it("prioriza lat/lon explícito sobre destination", () => {
    const out = getCoordForDeal({ lat: 0, lon: 0, destination: "BCN" });
    expect(out).toBe("0°00′ N · 0°00′ E");
  });

  it("ninguna info → null", () => {
    expect(getCoordForDeal({})).toBeNull();
  });

  it("destino unknown + sin coord → null", () => {
    expect(getCoordForDeal({ destination: "XYZ", cityTo: "Alpha" })).toBeNull();
  });

  it("destination null friendly", () => {
    expect(() =>
      getCoordForDeal({ destination: undefined, cityTo: undefined }),
    ).not.toThrow();
  });
});
