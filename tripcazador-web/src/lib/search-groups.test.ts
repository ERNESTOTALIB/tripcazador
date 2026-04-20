/**
 * Tests unitarios para utilidades de búsqueda.
 *
 * Cubrimos:
 *  - Expansión de grupos: el submit del SearchBar depende de que
 *    `GRP:ES` se convierta en la lista real de IATAs. Si esto rompe,
 *    las búsquedas por país devuelven vacío silenciosamente.
 *  - Fuzzy distance: si regresamos a un algoritmo sin corte temprano,
 *    el autocomplete se pone lento; probamos el caso de corte y el
 *    caso de typo aceptado.
 *  - Invariantes de los datos de grupos: evitar que un PR meta un
 *    grupo con slug duplicado o sin IATAs (error humano común).
 */

import { describe, it, expect } from "vitest";
import {
  AIRPORT_GROUPS,
  matchGroupInput,
  fuzzyDistance,
  normalizeInput,
} from "./search-groups";

describe("matchGroupInput", () => {
  it("devuelve null si el input no tiene el prefijo GRP:", () => {
    expect(matchGroupInput("")).toBeNull();
    expect(matchGroupInput("MAD")).toBeNull();
    expect(matchGroupInput("españa")).toBeNull();
    expect(matchGroupInput("GRP")).toBeNull(); // sin los dos puntos
  });

  it("resuelve el grupo de España (flujo crítico de search submit)", () => {
    const g = matchGroupInput("GRP:ES");
    expect(g).not.toBeNull();
    expect(g?.slug).toBe("ES");
    expect(g?.iatas).toContain("MAD");
    expect(g?.iatas).toContain("BCN");
    // Si alguien quita MAD o BCN del grupo, es casi seguro un bug.
    expect(g!.iatas.length).toBeGreaterThanOrEqual(5);
  });

  it("resuelve el grupo DACH con hubs alemanes/austriacos/suizos", () => {
    const g = matchGroupInput("GRP:DACH");
    expect(g?.iatas).toEqual(expect.arrayContaining(["FRA", "MUC", "ZRH", "VIE", "BSL"]));
  });

  it("acepta whitespace alrededor del token (input copy-pasteado)", () => {
    const g = matchGroupInput("  GRP:JP  ");
    expect(g?.slug).toBe("JP");
  });

  it("devuelve null para un slug inventado", () => {
    expect(matchGroupInput("GRP:MARS")).toBeNull();
    expect(matchGroupInput("GRP:")).toBeNull();
  });
});

describe("fuzzyDistance", () => {
  it("0 para strings iguales (fast path)", () => {
    expect(fuzzyDistance("madrid", "madrid")).toBe(0);
    expect(fuzzyDistance("", "")).toBe(0);
  });

  it("corta temprano si la diferencia de longitud ya supera max", () => {
    // "madrid" (6) vs "m" (1): dif = 5, con max=2 devolvemos max+1 = 3
    expect(fuzzyDistance("madrid", "m", 2)).toBe(3);
  });

  it("1 para typos de 1 carácter (tolerancia por defecto)", () => {
    expect(fuzzyDistance("madrid", "madird")).toBeLessThanOrEqual(2); // swap → 2 subs
    expect(fuzzyDistance("barcelona", "barcelon")).toBe(1); // missing char
    expect(fuzzyDistance("tokio", "tokyo")).toBe(1); // substitución i→y
  });

  it("excede max+1 cuando la distancia real lo supera (corte temprano)", () => {
    // "madrid" vs "tokyo" claramente >2; devolvemos max+1=3
    expect(fuzzyDistance("madrid", "tokyo", 2)).toBe(3);
  });

  it("max configurable: max=0 corta incluso typos pequeños", () => {
    // Con max=0 incluso un typo de 1 carácter rebasa el presupuesto → max+1=1
    expect(fuzzyDistance("tokio", "tokyo", 0)).toBe(1);
    // Con max=2 un typo de 1 debe quedar dentro
    expect(fuzzyDistance("tokio", "tokyo", 2)).toBe(1);
  });
});

describe("normalizeInput", () => {
  it("lowercase y strip de acentos (matching de 'España'→'espana')", () => {
    expect(normalizeInput("España")).toBe("espana");
    expect(normalizeInput("MÜNCHEN")).toBe("munchen");
    expect(normalizeInput("Zürich")).toBe("zurich");
  });

  it("no rompe strings ya normalizadas", () => {
    expect(normalizeInput("madrid")).toBe("madrid");
    expect(normalizeInput("")).toBe("");
  });
});

describe("AIRPORT_GROUPS data invariants", () => {
  // Si un PR mete un grupo mal formado, el autocomplete sigue funcionando
  // pero los resultados son misteriosamente vacíos. Estos tests son el
  // tripwire que garantiza "si este test pasa, los grupos están sanos".

  it("todos los slugs son únicos", () => {
    const slugs = AIRPORT_GROUPS.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("cada grupo tiene al menos 1 IATA", () => {
    for (const g of AIRPORT_GROUPS) {
      expect(g.iatas.length).toBeGreaterThan(0);
    }
  });

  it("los IATAs son códigos de 3 letras en mayúsculas", () => {
    for (const g of AIRPORT_GROUPS) {
      for (const iata of g.iatas) {
        expect(iata).toMatch(/^[A-Z]{3}$/);
      }
    }
  });

  it("cada grupo tiene al menos un alias normalizado no vacío", () => {
    for (const g of AIRPORT_GROUPS) {
      expect(g.aliases.length).toBeGreaterThan(0);
      for (const a of g.aliases) {
        expect(a.length).toBeGreaterThan(0);
        // Los aliases deben ser normalizables — lo que tipee el user ya viene lowercased
        expect(a).toBe(a.toLowerCase());
      }
    }
  });
});
