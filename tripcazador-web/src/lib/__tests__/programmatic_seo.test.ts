import { describe, it, expect } from "vitest";
import {
  SEO_CITIES,
  SEO_ORIGINS,
  MONTHS_ES,
  findCity,
  findOrigin,
  findMonth,
  sweetSpotCopy,
} from "@/lib/programmatic_seo";

describe("programmatic_seo catalog", () => {
  it("SEO_CITIES tiene 48 ciudades (objetivo SSS337)", () => {
    expect(SEO_CITIES.length).toBe(48);
  });

  it("SEO_ORIGINS tiene 6 orígenes ES", () => {
    expect(SEO_ORIGINS.length).toBe(6);
    expect(SEO_ORIGINS.map((o) => o.iata).sort()).toEqual(
      ["AGP", "BCN", "BIO", "MAD", "SVQ", "VLC"].sort(),
    );
  });

  it("MONTHS_ES tiene 12 meses con num 1-12", () => {
    expect(MONTHS_ES.length).toBe(12);
    expect(MONTHS_ES.map((m) => m.num)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("cada ciudad tiene IATA único", () => {
    const iatas = SEO_CITIES.map((c) => c.iata);
    expect(new Set(iatas).size).toBe(iatas.length);
  });

  it("cada ciudad tiene slug único", () => {
    const slugs = SEO_CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("cada ciudad tiene sweetSpot 1-12 y fromEur positivo", () => {
    for (const c of SEO_CITIES) {
      expect(c.sweetSpot).toBeGreaterThanOrEqual(1);
      expect(c.sweetSpot).toBeLessThanOrEqual(12);
      expect(c.fromEur).toBeGreaterThan(0);
    }
  });

  it("findCity devuelve correcta o undefined", () => {
    expect(findCity("lisboa")?.iata).toBe("LIS");
    expect(findCity("tokio")?.region).toBe("asia");
    expect(findCity("inexistente")).toBeUndefined();
  });

  it("findOrigin devuelve correcta o undefined", () => {
    expect(findOrigin("madrid")?.iata).toBe("MAD");
    expect(findOrigin("inexistente")).toBeUndefined();
  });

  it("findMonth devuelve correcta o undefined", () => {
    expect(findMonth("enero")?.num).toBe(1);
    expect(findMonth("inexistente")).toBeUndefined();
  });

  it("sweetSpotCopy reconoce el mes sweet spot", () => {
    const tokio = findCity("tokio")!;
    const copy = sweetSpotCopy(tokio, tokio.sweetSpot);
    expect(copy.toLowerCase()).toContain("más barato");
  });

  it("sweetSpotCopy compara con sweet spot cuando no es el mes pedido", () => {
    const tokio = findCity("tokio")!;
    const offMonth = tokio.sweetSpot === 1 ? 8 : 1;
    const copy = sweetSpotCopy(tokio, offMonth);
    expect(copy.toLowerCase()).toContain("sweet spot");
  });

  it("ningún slug contiene caracteres no URL-safe", () => {
    const urlSafeRe = /^[a-z0-9-]+$/;
    for (const c of SEO_CITIES) {
      expect(c.slug).toMatch(urlSafeRe);
    }
    for (const o of SEO_ORIGINS) {
      expect(o.slug).toMatch(urlSafeRe);
    }
    for (const m of MONTHS_ES) {
      expect(m.slug).toMatch(urlSafeRe);
    }
  });
});

describe("programmatic SEO totals", () => {
  it("vuelos-baratos genera 576 combinaciones (48×12)", () => {
    expect(SEO_CITIES.length * MONTHS_ES.length).toBe(576);
  });

  it("precio-vuelo genera 288 combinaciones (6×48)", () => {
    expect(SEO_ORIGINS.length * SEO_CITIES.length).toBe(288);
  });
});
