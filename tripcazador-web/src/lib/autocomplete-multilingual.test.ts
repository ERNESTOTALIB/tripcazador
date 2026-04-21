import { describe, it, expect } from "vitest";
import { normalizeInput, fuzzyDistance, AIRPORT_GROUPS } from "../lib/search-groups";
import { TOP_AIRPORTS } from "../lib/airports";

describe("normalizeInput edge multilingual", () => {
  const cases: [string,string][] = [
    ["España", "espana"],
    ["München", "munchen"],
    ["Köln", "koln"],
    ["Düsseldorf", "dusseldorf"],
    ["Zürich", "zurich"],
    ["Málaga", "malaga"],
    ["São Paulo", "sao paulo"],
    ["Rzeszów", "rzeszow"],
    ["Göteborg", "goteborg"],
    ["ΑΘΗΝΑ", "αθηνα"],
    ["JFK", "jfk"],
    ["  New York  ", "  new york  "],
  ];
  for (const [inp, exp] of cases) {
    it(`"${inp}" → "${exp}"`, () => {
      expect(normalizeInput(inp)).toBe(exp);
    });
  }
});

describe("normalizeInput — ligaduras y glifos sin descomposición NFD", () => {
  // Estos casos NO se descomponen vía NFD; requieren el mapa LIGATURE_MAP
  // añadido en search-groups.ts. Sin ese mapa "Straße" → "straße" (la ß
  // sigue ahí y no matchea con "strasse"), "Łódź" → "łodz", etc.
  it("ß alemán → 'ss' ('Straße' → 'strasse')", () => {
    expect(normalizeInput("Straße")).toBe("strasse");
  });
  it("ł polaca → 'l' ('Łódź' → 'lodz')", () => {
    expect(normalizeInput("Łódź")).toBe("lodz");
  });
  it("ø danés/noruego → 'o' ('København' → 'kobenhavn')", () => {
    expect(normalizeInput("København")).toBe("kobenhavn");
  });
  it("æ escandinava → 'ae' ('Ærø' → 'aero')", () => {
    expect(normalizeInput("Ærø")).toBe("aero");
  });
  it("œ francesa → 'oe' ('Œuvre' → 'oeuvre')", () => {
    expect(normalizeInput("Œuvre")).toBe("oeuvre");
  });
  it("đ croata → 'd' ('Đakovo' → 'dakovo')", () => {
    expect(normalizeInput("Đakovo")).toBe("dakovo");
  });
  it("CJK pass-through (no hay catálogo CJK en TOP_AIRPORTS)", () => {
    expect(normalizeInput("北京")).toBe("北京");
  });
});

describe("búsqueda multi-idioma por alias en TOP_AIRPORTS", () => {
  function findByAnyAlias(query: string): { iata: string; match: string } | null {
    const q = normalizeInput(query);
    for (const a of TOP_AIRPORTS) {
      const candidates = [a.city, a.country, ...(a.alt ?? [])];
      for (const c of candidates) {
        if (normalizeInput(c) === q) {
          return { iata: a.iata, match: c };
        }
      }
    }
    return null;
  }

  it("'Londres' encuentra LHR", () => {
    const r = findByAnyAlias("Londres");
    expect(r).not.toBeNull();
    expect(["LHR", "LGW", "STN", "LTN"]).toContain(r!.iata);
  });
  it("'London' también encuentra aeropuerto", () => {
    expect(findByAnyAlias("London")).not.toBeNull();
  });
  it("'München' encuentra MUC", () => {
    const r = findByAnyAlias("München");
    expect(r?.iata).toBe("MUC");
  });
  it("'Köln' encuentra CGN", () => {
    const r = findByAnyAlias("Köln");
    expect(r?.iata).toBe("CGN");
  });
  it("'Zúrich' con acento encuentra ZRH", () => {
    const r = findByAnyAlias("Zúrich");
    expect(r?.iata).toBe("ZRH");
  });
  it("'Zurich' sin acento también encuentra ZRH", () => {
    const r = findByAnyAlias("Zurich");
    expect(r?.iata).toBe("ZRH");
  });
  it("'Kloten' (nombre local) encuentra ZRH por alt", () => {
    const r = findByAnyAlias("Kloten");
    expect(r?.iata).toBe("ZRH");
  });
  it("'Sao Paulo' sin tilde encuentra GRU", () => {
    const r = findByAnyAlias("Sao Paulo");
    expect(r?.iata).toBe("GRU");
  });
  it("'São Paulo' con tilde encuentra GRU", () => {
    const r = findByAnyAlias("São Paulo");
    expect(r?.iata).toBe("GRU");
  });
});

describe("búsqueda de grupos multi-idioma", () => {
  function findGroupByAlias(q: string) {
    const nq = normalizeInput(q);
    return AIRPORT_GROUPS.find((g) => g.aliases.some((a) => normalizeInput(a) === nq));
  }
  it("'Deutschland' encuentra grupo DE", () => {
    expect(findGroupByAlias("Deutschland")?.slug).toBe("DE");
  });
  it("'Schweiz' encuentra grupo CH", () => {
    expect(findGroupByAlias("Schweiz")?.slug).toBe("CH");
  });
  it("'Ōsterreich' o 'österreich' encuentra grupo AT", () => {
    // El alias está como 'osterreich' sin acento → sólo match si se normaliza query
    expect(findGroupByAlias("Österreich")?.slug).toBe("AT");
  });
});

describe("fuzzyDistance — typos comunes multilingüísticos", () => {
  it("'madri' (falta d) vs 'madrid' ≤ 2", () => {
    expect(fuzzyDistance("madri", "madrid", 2)).toBeLessThanOrEqual(2);
  });
  it("'londre' (falta s) vs 'londres' ≤ 2", () => {
    expect(fuzzyDistance("londre", "londres", 2)).toBeLessThanOrEqual(2);
  });
  it("'paris' vs 'tokio' > 2", () => {
    expect(fuzzyDistance("paris", "tokio", 2)).toBeGreaterThan(2);
  });
  it("string vacío vs 'madrid' > 2 con max=2", () => {
    expect(fuzzyDistance("", "madrid", 2)).toBeGreaterThan(2);
  });
  it("inputs idénticos devuelven 0", () => {
    expect(fuzzyDistance("barcelona", "barcelona", 2)).toBe(0);
  });
  it("diferencia de longitud grande sale rápido", () => {
    expect(fuzzyDistance("ab", "abcdef", 2)).toBeGreaterThan(2);
  });
});
