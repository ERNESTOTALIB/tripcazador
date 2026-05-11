/**
 * favorites.test.ts — localStorage-backed favorites lib.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  clearFavorites,
  subscribeFavorites,
} from "../favorites";

const SAMPLE = {
  id: "deal-1",
  origin: "MAD",
  destination: "BCN",
  city_to: "Barcelona",
  country_to: "España",
  price_eur: 80,
};

describe("favorites — localStorage CRUD", () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch { /* swallow */ }
  });

  it("getFavorites inicial → []", () => {
    expect(getFavorites()).toEqual([]);
  });

  it("isFavorite('id') sin entries → false", () => {
    expect(isFavorite("deal-1")).toBe(false);
  });

  it("addFavorite añade y persiste", () => {
    addFavorite(SAMPLE);
    expect(getFavorites().length).toBe(1);
    expect(isFavorite("deal-1")).toBe(true);
  });

  it("addFavorite idempotente (mismo id no duplica)", () => {
    addFavorite(SAMPLE);
    addFavorite(SAMPLE);
    expect(getFavorites().length).toBe(1);
  });

  it("añadido tiene saved_at ISO", () => {
    addFavorite(SAMPLE);
    const f = getFavorites()[0];
    expect(f.saved_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("removeFavorite quita por id", () => {
    addFavorite(SAMPLE);
    removeFavorite("deal-1");
    expect(getFavorites().length).toBe(0);
  });

  it("removeFavorite id inexistente no crashea", () => {
    expect(() => removeFavorite("nonexistent")).not.toThrow();
  });

  it("toggleFavorite añade si no existe y devuelve true", () => {
    const r = toggleFavorite(SAMPLE);
    expect(r).toBe(true);
    expect(isFavorite("deal-1")).toBe(true);
  });

  it("toggleFavorite quita si existe y devuelve false", () => {
    addFavorite(SAMPLE);
    const r = toggleFavorite(SAMPLE);
    expect(r).toBe(false);
    expect(isFavorite("deal-1")).toBe(false);
  });

  it("clearFavorites vacía toda la lista", () => {
    addFavorite(SAMPLE);
    addFavorite({ ...SAMPLE, id: "deal-2" });
    clearFavorites();
    expect(getFavorites().length).toBe(0);
  });

  it("orden: nuevo añadido va primero (head insertion)", () => {
    addFavorite({ ...SAMPLE, id: "deal-1" });
    addFavorite({ ...SAMPLE, id: "deal-2" });
    const r = getFavorites();
    expect(r[0].id).toBe("deal-2");
    expect(r[1].id).toBe("deal-1");
  });

  it("cap a 50 elementos máximo", () => {
    for (let i = 0; i < 60; i++) {
      addFavorite({ ...SAMPLE, id: `d-${i}` });
    }
    expect(getFavorites().length).toBeLessThanOrEqual(50);
  });

  it("subscribeFavorites devuelve unsubscribe function", () => {
    const unsub = subscribeFavorites(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("callback de subscribeFavorites se dispara al añadir", () => {
    let called = false;
    const unsub = subscribeFavorites(() => { called = true; });
    addFavorite(SAMPLE);
    expect(called).toBe(true);
    unsub();
  });

  it("localStorage JSON corrupto → getFavorites devuelve []", () => {
    localStorage.setItem("tc_favorites", "}}}not-json{{{");
    expect(getFavorites()).toEqual([]);
  });

  it("localStorage no-array → []", () => {
    localStorage.setItem("tc_favorites", '"a string"');
    expect(getFavorites()).toEqual([]);
  });
});
