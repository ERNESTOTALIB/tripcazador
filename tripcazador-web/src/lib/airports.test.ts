/**
 * Tests del catálogo estático. Protegen contra regresiones de:
 *  - duplicados de IATA
 *  - nombres que rompen la búsqueda accent-insensitive (typos en alt)
 *  - aeropuertos clave desapareciendo del listado (ej. JFK, NRT, LIS)
 */
import { describe, it, expect } from "vitest";
import { TOP_AIRPORTS, type AirportEntry } from "./airports";

// Reutilizamos la misma normalización que SearchBar.tsx usa para matchear.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matches(entry: AirportEntry, query: string): boolean {
  const q = normalize(query);
  return (
    normalize(entry.iata).includes(q) ||
    normalize(entry.city).includes(q) ||
    normalize(entry.country).includes(q) ||
    (entry.alt ?? []).some((a) => normalize(a).includes(q))
  );
}

function find(query: string): AirportEntry[] {
  return TOP_AIRPORTS.filter((a) => matches(a, query));
}

describe("TOP_AIRPORTS catalog", () => {
  it("tiene al menos 250 entradas", () => {
    expect(TOP_AIRPORTS.length).toBeGreaterThanOrEqual(250);
  });

  it("no duplica códigos IATA", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const a of TOP_AIRPORTS) {
      if (seen.has(a.iata)) dupes.push(a.iata);
      seen.add(a.iata);
    }
    expect(dupes).toEqual([]);
  });

  it("todos los IATA son 3 letras mayúsculas", () => {
    const bad = TOP_AIRPORTS.filter((a) => !/^[A-Z]{3}$/.test(a.iata));
    expect(bad).toEqual([]);
  });

  it("todas las entradas tienen city y country no vacíos", () => {
    const bad = TOP_AIRPORTS.filter((a) => !a.city.trim() || !a.country.trim());
    expect(bad).toEqual([]);
  });
});

describe('búsqueda "new york" (regresión bug abril 2026)', () => {
  // El usuario escribe "new york" y espera ver JFK/EWR/LGA aunque la
  // city canónica esté en español ("Nueva York JFK"). Sin alts, esto
  // devolvía cero resultados.
  it("encuentra JFK", () => {
    const hits = find("new york");
    expect(hits.some((a) => a.iata === "JFK")).toBe(true);
  });

  it("encuentra EWR (Newark)", () => {
    const hits = find("new york");
    expect(hits.some((a) => a.iata === "EWR")).toBe(true);
  });

  it("encuentra LGA (LaGuardia)", () => {
    const hits = find("new york");
    expect(hits.some((a) => a.iata === "LGA")).toBe(true);
  });

  it("NYC resuelve a los tres aeropuertos", () => {
    const hits = find("nyc");
    const iatas = hits.map((a) => a.iata);
    expect(iatas).toContain("JFK");
    expect(iatas).toContain("EWR");
    expect(iatas).toContain("LGA");
  });
});

describe("alias multi-idioma", () => {
  it('"munich" encuentra MUC', () => {
    expect(find("munich").some((a) => a.iata === "MUC")).toBe(true);
  });

  it('"münchen" encuentra MUC', () => {
    expect(find("münchen").some((a) => a.iata === "MUC")).toBe(true);
  });

  it('"lisbon" encuentra LIS', () => {
    expect(find("lisbon").some((a) => a.iata === "LIS")).toBe(true);
  });

  it('"geneva" encuentra GVA', () => {
    expect(find("geneva").some((a) => a.iata === "GVA")).toBe(true);
  });

  it('"copenhagen" encuentra CPH', () => {
    expect(find("copenhagen").some((a) => a.iata === "CPH")).toBe(true);
  });

  it('"vienna" encuentra VIE', () => {
    expect(find("vienna").some((a) => a.iata === "VIE")).toBe(true);
  });

  it('"athens" encuentra ATH', () => {
    expect(find("athens").some((a) => a.iata === "ATH")).toBe(true);
  });

  it('"tokyo" encuentra NRT y HND', () => {
    const iatas = find("tokyo").map((a) => a.iata);
    expect(iatas).toContain("NRT");
    expect(iatas).toContain("HND");
  });
});

describe("regresiones de catálogo (bugs abr-2026)", () => {
  it("no contiene MZA duplicado para Mendoza (regresión, usar MDZ)", () => {
    const mza = TOP_AIRPORTS.find((a) => a.iata === "MZA");
    // MZA puede existir pero NO debe ser un clon de Mendoza — usamos MDZ.
    const mdz = TOP_AIRPORTS.find((a) => a.iata === "MDZ");
    if (mza) {
      expect(mza.city.toLowerCase()).not.toBe("mendoza");
    }
    if (mdz) {
      expect(mdz.city).toMatch(/Mendoza/i);
    }
  });

  it("SXM tiene país Sint Maarten (no 'San Martín')", () => {
    const sxm = TOP_AIRPORTS.find((a) => a.iata === "SXM");
    if (sxm) {
      expect(sxm.country.toLowerCase()).not.toBe("san martín");
      expect(sxm.country.toLowerCase()).toMatch(/sint maarten/i);
    }
  });

  it("no hay IATA de longitud ≠ 3", () => {
    const bad = TOP_AIRPORTS.filter((a) => a.iata.length !== 3);
    expect(bad).toEqual([]);
  });
});

describe("cobertura regional", () => {
  // Sanity checks: los hubs principales de cada región están presentes.
  // Si alguien borra uno por error, este test cae.
  const mustHave = [
    "JFK", "LAX", "MIA", "ORD", "SFO", // EE.UU.
    "LHR", "CDG", "FRA", "AMS", "MAD", // Europa hubs
    "BCN", "MUC", "VIE", "ZRH", "FCO", // Europa sur/DACH/IT
    "DXB", "DOH", "IST", "NRT", "HND", "ICN", "SIN", "BKK", // Asia/ME hubs
    "GRU", "EZE", "SCL", "MEX", "CUN", // LatAm
    "SYD", "AKL", "JNB", "CPT", "CAI", // Oceanía/África
    "LIS", "OPO", "BCN", "AGP", "VLC", // Iberia
  ];
  it.each(mustHave)("contiene %s", (iata) => {
    expect(TOP_AIRPORTS.some((a) => a.iata === iata)).toBe(true);
  });
});
