/**
 * dest_images.test.ts — coverage para dest_images.ts.
 */
import { describe, it, expect } from "vitest";
import {
  getDestImage,
  buildUnsplashUrl,
  getSeasonalDestImage,
  getCurrentSeasonalDestImage,
} from "../dest_images";

describe("getDestImage", () => {
  it("'bali' → photoId definido", () => {
    const r = getDestImage("bali");
    expect(r.photoId).toBeTruthy();
    expect(r.alt).toBeTruthy();
    expect(r.accent).toBeTruthy();
  });

  it("IATA 'DPS' → resuelve a bali", () => {
    const r = getDestImage("DPS");
    expect(r.alt.toLowerCase()).toContain("bali");
  });

  it("IATA 'NRT' → resuelve a Tokio", () => {
    const r = getDestImage("NRT");
    expect(r.alt.toLowerCase()).toContain("tok");
  });

  it("IATA 'MAD' → Madrid", () => {
    const r = getDestImage("MAD");
    expect(r.photoId).toBeTruthy();
  });

  it("input null → fallback world", () => {
    const r = getDestImage(null);
    expect(r.photoId).toBeTruthy();
  });

  it("input undefined → fallback world", () => {
    const r = getDestImage(undefined);
    expect(r.photoId).toBeTruthy();
  });

  it("input vacío → fallback world", () => {
    const r = getDestImage("");
    expect(r.photoId).toBeTruthy();
  });

  it("input desconocido 'martiano' → fallback world", () => {
    const r = getDestImage("martiano-xx");
    expect(r.photoId).toBeTruthy();
  });

  it("'Tokio' (con T mayúscula) resuelve", () => {
    const r = getDestImage("Tokio");
    expect(r.alt.toLowerCase()).toContain("tok");
  });

  it("normaliza tildes 'parís' → paris", () => {
    const r = getDestImage("parís");
    expect(r.alt.toLowerCase()).toContain("paris");
  });

  it("siempre devuelve DestImage no-null", () => {
    expect(getDestImage("anything")).toBeDefined();
  });

  it("accent es color hex", () => {
    const r = getDestImage("bali");
    expect(r.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe("buildUnsplashUrl", () => {
  it("genera URL completa con photo prefix", () => {
    const u = buildUnsplashUrl("1537996194471-e657df975ab4");
    expect(u).toContain("https://images.unsplash.com/photo-1537996194471");
  });

  it("no duplica 'photo-' si ya viene con prefix", () => {
    const u = buildUnsplashUrl("photo-1537996194471");
    expect(u).not.toMatch(/photo-photo-/);
  });

  it("default 1080×1080", () => {
    const u = buildUnsplashUrl("xxx");
    expect(u).toContain("w=1080");
    expect(u).toContain("h=1080");
  });

  it("dimensiones custom", () => {
    const u = buildUnsplashUrl("xxx", 800, 600);
    expect(u).toContain("w=800");
    expect(u).toContain("h=600");
  });

  it("incluye q=80 (quality)", () => {
    const u = buildUnsplashUrl("xxx");
    expect(u).toContain("q=80");
  });

  it("incluye auto=format", () => {
    const u = buildUnsplashUrl("xxx");
    expect(u).toContain("auto=format");
  });
});

describe("getSeasonalDestImage", () => {
  it("tokio + month=4 → sakura variant", () => {
    const r = getSeasonalDestImage("tokio", 4);
    expect(r.alt.toLowerCase()).toMatch(/cherry|sakura|blossom/i);
  });

  it("tokio + month=4 alt accent rosa", () => {
    const r = getSeasonalDestImage("tokio", 4);
    expect(r.accent.toLowerCase()).toMatch(/^#ec/i); // EC4899
  });

  it("tokio + month=7 → base (no sakura)", () => {
    const r = getSeasonalDestImage("tokio", 7);
    expect(r.alt.toLowerCase()).not.toContain("cherry");
  });

  it("reikiavik + month=12 → aurora", () => {
    const r = getSeasonalDestImage("reikiavik", 12);
    expect(r.alt.toLowerCase()).toMatch(/aurora/i);
  });

  it("amsterdam + month=4 → tulipanes", () => {
    const r = getSeasonalDestImage("amsterdam", 4);
    expect(r.alt.toLowerCase()).toMatch(/tulip/i);
  });

  it("destino sin variantes → base", () => {
    const baseSee = getSeasonalDestImage("madrid", 6);
    expect(baseSee.photoId).toBeTruthy();
  });

  it("month undefined → base", () => {
    const r = getSeasonalDestImage("tokio", undefined);
    // sin month, sin variant
    expect(r.alt.toLowerCase()).not.toContain("cherry");
  });

  it("input null → base world", () => {
    const r = getSeasonalDestImage(null, 4);
    expect(r.photoId).toBeTruthy();
  });
});

describe("getCurrentSeasonalDestImage", () => {
  it("no crashea sin args", () => {
    expect(() => getCurrentSeasonalDestImage("tokio")).not.toThrow();
  });

  it("devuelve DestImage para 'bali'", () => {
    const r = getCurrentSeasonalDestImage("bali");
    expect(r.photoId).toBeTruthy();
  });
});
