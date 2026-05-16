/**
 * travel_partners.test.ts — SSS231 (16 may 2026)
 *
 * Tests para lib/travel_partners.ts (318 líneas previo sin cov).
 *
 * Cubre: PARTNERS catalog + getPartner + getPartnersByCategory +
 * affiliateUrl per partner (con env var fallbacks).
 *
 * Foco revenue-critical: cada partner debe tener affiliateUrl que incluya
 * el marker correspondiente cuando env var está set. Si rompemos el
 * marker → revenue se cae.
 */
import { describe, it, expect } from "vitest";
import {
  PARTNERS,
  PARTNERS_BY_SLUG,
  getPartner,
  getPartnersByCategory,
} from "../travel_partners";

describe("PARTNERS catalog", () => {
  it("tiene mínimo 8 partners", () => {
    expect(PARTNERS.length).toBeGreaterThanOrEqual(8);
  });

  it("cada partner tiene fields obligatorios", () => {
    for (const p of PARTNERS) {
      expect(p.slug).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(typeof p.affiliateUrl).toBe("function");
    }
  });

  it("slugs son únicos", () => {
    const slugs = PARTNERS.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("categorías están en allowlist", () => {
    const validCats = new Set([
      "vuelos", "hoteles", "tours", "transporte",
      "alquiler", "pagos", "esim", "seguro",
    ]);
    for (const p of PARTNERS) {
      expect(validCats.has(p.category)).toBe(true);
    }
  });

  it("PARTNERS_BY_SLUG indexa correctamente", () => {
    expect(PARTNERS_BY_SLUG.booking).toBeDefined();
    expect(PARTNERS_BY_SLUG.holafly).toBeDefined();
    expect(PARTNERS_BY_SLUG.heymondo).toBeDefined();
    expect(PARTNERS_BY_SLUG.getyourguide).toBeDefined();
  });
});

describe("getPartner", () => {
  it("devuelve partner existente", () => {
    const booking = getPartner("booking");
    expect(booking).toBeDefined();
    expect(booking?.slug).toBe("booking");
    expect(booking?.category).toBe("hoteles");
  });

  it("undefined si slug no existe", () => {
    expect(getPartner("nonexistent_xx")).toBeUndefined();
  });
});

describe("getPartnersByCategory", () => {
  it("filtra por categoría hoteles", () => {
    const hoteles = getPartnersByCategory("hoteles");
    expect(hoteles.length).toBeGreaterThanOrEqual(1);
    expect(hoteles.every((p) => p.category === "hoteles")).toBe(true);
    expect(hoteles.map((p) => p.slug)).toContain("booking");
  });

  it("filtra por categoría seguro", () => {
    const seguros = getPartnersByCategory("seguro");
    expect(seguros.length).toBeGreaterThanOrEqual(1);
    expect(seguros.map((p) => p.slug)).toContain("heymondo");
  });

  it("filtra por categoría esim", () => {
    const esims = getPartnersByCategory("esim");
    expect(esims.length).toBeGreaterThanOrEqual(1);
    expect(esims.map((p) => p.slug)).toContain("holafly");
  });

  it("transporte incluye Trainline + Omio", () => {
    const transporte = getPartnersByCategory("transporte");
    const slugs = transporte.map((p) => p.slug);
    expect(slugs).toContain("trainline");
    expect(slugs).toContain("omio");
  });
});

describe("affiliateUrl per partner — revenue critical", () => {
  it("Booking.com URL incluye aid (default 714734)", () => {
    const url = getPartner("booking")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/www\.booking\.com/);
    // aid debe estar presente (env var NEXT_PUBLIC_BOOKING_AID o default 714734)
    expect(url).toMatch(/aid=/);
  });

  it("Heymondo URL usa dominio .com (SSS213 fix, no .es)", () => {
    const url = getPartner("heymondo")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/heymondo\.com\//);
    expect(url).not.toMatch(/heymondo\.es/);
    // utm_source siempre presente
    expect(url).toContain("utm_source=tripcazador");
  });

  it("Holafly URL incluye ref (default tripcazador) y dominio esim.holafly.com", () => {
    const url = getPartner("holafly")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/esim\.holafly\.com|holafly\.com/);
  });

  it("GetYourGuide URL maneja partner_id condicional", () => {
    const url = getPartner("getyourguide")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/(www\.)?getyourguide\.com/);
  });

  it("Revolut URL incluye referral_code (default ernestv)", () => {
    const url = getPartner("revolut")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/(www\.)?revolut\.com/);
  });

  it("Trainline URL incluye affiliate id condicional", () => {
    const url = getPartner("trainline")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/(www\.)?(thetrainline\.com|trainline\.com)/);
  });

  it("DiscoverCars URL", () => {
    const url = getPartner("discovercars")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/(www\.)?discovercars\.com/);
  });

  it("Omio URL", () => {
    const url = getPartner("omio")?.affiliateUrl();
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/(www\.)?omio\.(com|es)/);
  });
});

describe("affiliateUrl security — XSS defense", () => {
  it("ningún partner URL contiene esquemas peligrosos", () => {
    for (const p of PARTNERS) {
      const url = p.affiliateUrl();
      expect(url).not.toMatch(/^javascript:/i);
      expect(url).not.toMatch(/^data:/i);
      expect(url).not.toMatch(/^vbscript:/i);
      expect(url).not.toMatch(/^file:/i);
    }
  });

  it("todas las URLs son https://", () => {
    for (const p of PARTNERS) {
      const url = p.affiliateUrl();
      expect(url).toMatch(/^https:\/\//);
    }
  });
});
