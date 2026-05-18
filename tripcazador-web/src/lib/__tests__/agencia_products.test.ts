/**
 * agencia_products.test.ts — SSS309 (19 may 2026)
 */
import { describe, it, expect } from "vitest";
import {
  AGENCIA_PRODUCTS,
  AGENCIA_PRODUCT_IDS,
  getAgenciaProductBySlug,
  getAgenciaProductByTipo,
} from "../agencia_products";
import { AGENCIA_PRICES } from "../agencia_store";

describe("AGENCIA_PRODUCTS catalog SSS309", () => {
  it("tiene exactamente 2 productos: vuelo y vuelo_hotel", () => {
    expect(AGENCIA_PRODUCT_IDS).toEqual(["vuelo", "vuelo_hotel"]);
  });

  it("vuelo.amount_eur coincide con AGENCIA_PRICES.vuelo", () => {
    expect(AGENCIA_PRODUCTS.vuelo.amount_eur).toBe(AGENCIA_PRICES.vuelo);
  });

  it("vuelo_hotel.amount_eur coincide con AGENCIA_PRICES.vuelo_hotel", () => {
    expect(AGENCIA_PRODUCTS.vuelo_hotel.amount_eur).toBe(AGENCIA_PRICES.vuelo_hotel);
  });

  it("cada producto tiene slug, name, shortName, emoji, tagline, description", () => {
    for (const p of Object.values(AGENCIA_PRODUCTS)) {
      expect(p.slug.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.shortName.length).toBeGreaterThan(0);
      expect(p.emoji.length).toBeGreaterThan(0);
      expect(p.tagline.length).toBeGreaterThan(10);
      expect(p.description.length).toBeGreaterThan(50);
    }
  });

  it("cada producto tiene >=4 bullets", () => {
    for (const p of Object.values(AGENCIA_PRODUCTS)) {
      expect(p.bullets.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("slugs son URL-safe", () => {
    for (const p of Object.values(AGENCIA_PRODUCTS)) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("vuelo_hotel marcado como popular", () => {
    expect(AGENCIA_PRODUCTS.vuelo_hotel.popular).toBe(true);
  });

  it("getAgenciaProductBySlug encuentra ambos", () => {
    expect(getAgenciaProductBySlug("vuelo")?.tipo).toBe("vuelo");
    expect(getAgenciaProductBySlug("vuelo-hotel")?.tipo).toBe("vuelo_hotel");
  });

  it("getAgenciaProductBySlug devuelve null para slug desconocido", () => {
    expect(getAgenciaProductBySlug("garbage")).toBeNull();
    expect(getAgenciaProductBySlug("")).toBeNull();
  });

  it("getAgenciaProductByTipo devuelve null para tipo desconocido", () => {
    expect(getAgenciaProductByTipo("garbage")).toBeNull();
    expect(getAgenciaProductByTipo("")).toBeNull();
  });

  it("getAgenciaProductByTipo encuentra ambos", () => {
    expect(getAgenciaProductByTipo("vuelo")?.amount_eur).toBe(9.99);
    expect(getAgenciaProductByTipo("vuelo_hotel")?.amount_eur).toBe(19.99);
  });

  it("descripción y bullets mencionan garantía mejor precio", () => {
    for (const p of Object.values(AGENCIA_PRODUCTS)) {
      const all = (p.description + " " + p.bullets.join(" ")).toLowerCase();
      expect(all.includes("garant") || all.includes("reembolso") || all.includes("premium")).toBe(true);
    }
  });
});
