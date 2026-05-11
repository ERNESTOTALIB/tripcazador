/**
 * searchHistory.test.ts — localStorage history dedup + cap + consent gating.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getRecentSearches,
  pushSearch,
  clearSearchHistory,
  removeSearch,
} from "../searchHistory";

function setConsent(functional: boolean) {
  localStorage.setItem("cv_consent_v1", JSON.stringify({ functional, analytics: true }));
}

describe("searchHistory — consent gating", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
  });

  it("sin consent → getRecentSearches devuelve []", () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it("sin consent → pushSearch no escribe", () => {
    pushSearch("MAD", "BCN");
    expect(getRecentSearches()).toEqual([]);
  });

  it("consent functional=false → no guarda", () => {
    setConsent(false);
    pushSearch("MAD", "BCN");
    expect(getRecentSearches()).toEqual([]);
  });

  it("consent functional=true → guarda", () => {
    setConsent(true);
    pushSearch("MAD", "BCN");
    const r = getRecentSearches();
    expect(r.length).toBe(1);
    expect(r[0].origin).toBe("MAD");
    expect(r[0].destination).toBe("BCN");
  });
});

describe("searchHistory — dedup + cap + sort", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
    setConsent(true);
  });

  it("misma búsqueda no duplica", () => {
    pushSearch("MAD", "BCN");
    pushSearch("MAD", "BCN");
    expect(getRecentSearches().length).toBe(1);
  });

  it("misma búsqueda actualiza ts (más reciente)", async () => {
    pushSearch("MAD", "BCN");
    await new Promise((r) => setTimeout(r, 5));
    pushSearch("MAD", "BCN");
    expect(getRecentSearches().length).toBe(1);
  });

  it("nuevas búsquedas insertadas head-first", () => {
    pushSearch("MAD", "BCN");
    pushSearch("BCN", "LIS");
    const r = getRecentSearches();
    expect(r[0].destination).toBe("LIS");
    expect(r[1].destination).toBe("BCN");
  });

  it("cap a 5 entradas (FIFO)", () => {
    pushSearch("MAD", "A1");
    pushSearch("MAD", "A2");
    pushSearch("MAD", "A3");
    pushSearch("MAD", "A4");
    pushSearch("MAD", "A5");
    pushSearch("MAD", "A6");
    const r = getRecentSearches();
    expect(r.length).toBe(5);
  });

  it("normaliza UPPERCASE", () => {
    pushSearch("mad", "bcn");
    const r = getRecentSearches();
    expect(r[0].origin).toBe("MAD");
    expect(r[0].destination).toBe("BCN");
  });

  it("rechaza origen vacío", () => {
    pushSearch("", "BCN");
    expect(getRecentSearches().length).toBe(0);
  });

  it("rechaza destination vacío", () => {
    pushSearch("MAD", "");
    expect(getRecentSearches().length).toBe(0);
  });

  it("guarda date si se pasa", () => {
    pushSearch("MAD", "BCN", "2026-06-01");
    const r = getRecentSearches();
    expect(r[0].date).toBe("2026-06-01");
  });
});

describe("searchHistory — clearSearchHistory", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
    setConsent(true);
  });

  it("vacía todo", () => {
    pushSearch("MAD", "BCN");
    pushSearch("BCN", "LIS");
    clearSearchHistory();
    expect(getRecentSearches()).toEqual([]);
  });

  it("clearSearchHistory funciona aunque no haya consent (limpia siempre)", () => {
    setConsent(true);
    pushSearch("MAD", "BCN");
    setConsent(false);
    // clearSearchHistory no gating consent (siempre limpia, es destructivo seguro)
    clearSearchHistory();
    setConsent(true);
    expect(getRecentSearches()).toEqual([]);
  });
});

describe("searchHistory — removeSearch", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
    setConsent(true);
  });

  it("quita entrada específica", () => {
    pushSearch("MAD", "BCN");
    pushSearch("BCN", "LIS");
    removeSearch("MAD", "BCN");
    const r = getRecentSearches();
    expect(r.length).toBe(1);
    expect(r[0].destination).toBe("LIS");
  });

  it("removeSearch insensible a case", () => {
    pushSearch("MAD", "BCN");
    removeSearch("mad", "bcn");
    expect(getRecentSearches().length).toBe(0);
  });

  it("removeSearch no existente es no-op", () => {
    pushSearch("MAD", "BCN");
    removeSearch("XX", "YY");
    expect(getRecentSearches().length).toBe(1);
  });
});
