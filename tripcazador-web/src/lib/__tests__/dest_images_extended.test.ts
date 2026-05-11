/**
 * dest_images_extended.test.ts — full coverage de SSS56 mapping y seasonal.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getDestImage,
  buildUnsplashUrl,
  getSeasonalDestImage,
  getCurrentSeasonalDestImage,
} from "../dest_images";

afterEach(() => vi.useRealTimers());

describe("getDestImage — direct slug match", () => {
  it.each([
    ["bali", "Bali rice terraces"],
    ["bangkok", "Bangkok temples"],
    ["tokio", "Tokyo neon street"],
    ["tokyo", "Tokyo neon street"],
    ["seul", "Seoul skyline"],
    ["singapur", "Singapore Marina Bay"],
    ["maldivas", "Maldives overwater villa"],
    ["lisboa", "Lisbon tram"],
    ["roma", "Rome Colosseum"],
    ["paris", "Paris Eiffel tower"],
    ["milan", "Milan duomo"],
    ["amsterdam", "Amsterdam canal"],
    ["berlin", "Berlin landmarks"],
    ["praga", "Prague old town"],
    ["estambul", "Istanbul Bosphorus"],
    ["marrakech", "Marrakech medina"],
    ["londres", "London Big Ben"],
    ["reikiavik", "Iceland landscape"],
    ["miami", "Miami beach palms"],
    ["los_angeles", "Los Angeles skyline"],
    ["buenos_aires", "Buenos Aires architecture"],
    ["rio", "Rio de Janeiro beach"],
    ["cdmx", "Mexico City colonial"],
    ["madrid", "Madrid Plaza Mayor"],
    ["barcelona", "Barcelona Sagrada Familia"],
    ["malaga", "Málaga Costa del Sol"],
    ["sevilla", "Seville Plaza España"],
    ["palma", "Palma de Mallorca Mediterranean beach"],
    ["cairo", "Cairo pyramids"],
  ])("slug %s → alt %s", (slug, alt) => {
    const r = getDestImage(slug);
    expect(r.alt).toBe(alt);
  });
});

describe("getDestImage — IATA lookups", () => {
  it.each([
    ["DPS", "bali"],
    ["BKK", "bangkok"],
    ["NRT", "tokio"],
    ["HND", "tokio"],
    ["ICN", "seul"],
    ["LIS", "lisboa"],
    ["FCO", "roma"],
    ["CDG", "paris"],
    ["ORY", "paris"],
    ["MXP", "milan"],
    ["AMS", "amsterdam"],
    ["BER", "berlin"],
    ["PRG", "praga"],
    ["IST", "estambul"],
    ["LHR", "londres"],
    ["LGW", "londres"],
    ["STN", "londres"],
    ["MAD", "madrid"],
    ["BCN", "barcelona"],
    ["AGP", "malaga"],
    ["JFK", "nueva_york"],
    ["MIA", "miami"],
    ["LAX", "los_angeles"],
    ["GIG", "rio"],
    ["MEX", "cdmx"],
    ["CUN", "cancun"],
  ])("IATA %s maps to slug %s", (iata, slug) => {
    const r = getDestImage(iata);
    const baseline = getDestImage(slug);
    expect(r).toEqual(baseline);
  });
});

describe("getDestImage — region fallback", () => {
  it.each([
    ["europa", "Europe travel"],
    ["asia", "Asia travel"],
    ["caribe", "Caribbean beach"],
    ["africa", "Africa travel"],
    ["oceania", "Oceania landscape"],
    ["norteamerica", "North America"],
    ["sudamerica", "South America"],
    ["oriente_medio", "Middle East"],
  ])("region %s alt is %s", (region, alt) => {
    expect(getDestImage(region).alt).toBe(alt);
  });
});

describe("getDestImage — fallback edge cases", () => {
  it("null → world fallback", () => {
    const r = getDestImage(null);
    expect(r.alt).toBe("World travel");
  });

  it("undefined → world fallback", () => {
    const r = getDestImage(undefined);
    expect(r.alt).toBe("World travel");
  });

  it("empty string → world fallback", () => {
    const r = getDestImage("");
    expect(r.alt).toBe("World travel");
  });

  it("destination unknown → world fallback", () => {
    const r = getDestImage("alphacentauri");
    expect(r.alt).toBe("World travel");
  });

  it("trim + lowercase del slug", () => {
    expect(getDestImage("  Barcelona  ").alt).toBe("Barcelona Sagrada Familia");
  });

  it("acentos normalizados (Fráncfort → unknown → world)", () => {
    // 'fráncfort' no está en PHOTOS, pero 'frankfurt' tampoco
    // así que cae al world fallback
    const r = getDestImage("fráncfort");
    expect(r.alt).toBe("World travel");
  });

  it("DestImage tiene photoId, alt y accent", () => {
    const r = getDestImage("bali");
    expect(r.photoId).toBeTruthy();
    expect(r.alt).toBeTruthy();
    expect(r.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe("buildUnsplashUrl", () => {
  it("URL completa Unsplash", () => {
    const u = buildUnsplashUrl("1234abc");
    expect(u).toBe(
      "https://images.unsplash.com/photo-1234abc?auto=format&fit=crop&w=1080&h=1080&q=80",
    );
  });

  it("incluye dimensiones custom", () => {
    const u = buildUnsplashUrl("xyz", 1920, 1080);
    expect(u).toContain("w=1920");
    expect(u).toContain("h=1080");
  });

  it("no duplica 'photo-' si ya está", () => {
    const u = buildUnsplashUrl("photo-abc");
    expect(u).toContain("photo-abc");
    expect(u).not.toContain("photo-photo");
  });

  it("default 1080x1080", () => {
    const u = buildUnsplashUrl("xyz");
    expect(u).toContain("w=1080&h=1080");
  });
});

describe("getSeasonalDestImage", () => {
  it("Tokio mes 4 (abril) → cherry blossoms", () => {
    const r = getSeasonalDestImage("tokio", 4);
    expect(r.alt).toBe("Tokyo cherry blossoms");
  });

  it("Tokio mes 3 (marzo) → cherry blossoms", () => {
    const r = getSeasonalDestImage("tokio", 3);
    expect(r.alt).toBe("Tokyo cherry blossoms");
  });

  it("Tokio mes 12 → winter illuminations", () => {
    const r = getSeasonalDestImage("tokio", 12);
    expect(r.alt).toBe("Tokyo winter illuminations");
  });

  it("Tokio mes 6 (junio) → base (no variant)", () => {
    const r = getSeasonalDestImage("tokio", 6);
    expect(r.alt).toBe("Tokyo neon street");
  });

  it("Reikiavik en invierno → auroras", () => {
    const r = getSeasonalDestImage("reikiavik", 12);
    expect(r.alt).toBe("Iceland aurora borealis");
  });

  it("Reikiavik en verano → base Iceland landscape", () => {
    const r = getSeasonalDestImage("reikiavik", 7);
    expect(r.alt).toBe("Iceland landscape");
  });

  it("Bali mes 8 (agosto) → dry-season terraces", () => {
    const r = getSeasonalDestImage("bali", 8);
    expect(r.alt).toBe("Bali dry-season terraces");
  });

  it("París mes 12 → Christmas", () => {
    const r = getSeasonalDestImage("paris", 12);
    expect(r.alt).toBe("Paris winter Christmas");
  });

  it("Nueva York mes 12 → Christmas tree", () => {
    const r = getSeasonalDestImage("nueva_york", 12);
    expect(r.alt).toBe("New York Christmas tree");
  });

  it("Amsterdam mes 4 → tulip fields", () => {
    const r = getSeasonalDestImage("amsterdam", 4);
    expect(r.alt).toBe("Amsterdam tulip fields");
  });

  it("sin destino → fallback world", () => {
    expect(getSeasonalDestImage(null, 1).alt).toBe("World travel");
  });

  it("destino sin variantes → base", () => {
    expect(getSeasonalDestImage("madrid", 6).alt).toBe("Madrid Plaza Mayor");
  });

  it("sin month → base", () => {
    expect(getSeasonalDestImage("tokio").alt).toBe("Tokyo neon street");
  });

  it("month=undefined → base", () => {
    expect(getSeasonalDestImage("tokio", undefined).alt).toBe(
      "Tokyo neon street",
    );
  });
});

describe("getCurrentSeasonalDestImage", () => {
  it("usa el mes UTC actual", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
    const r = getCurrentSeasonalDestImage("tokio");
    expect(r.alt).toBe("Tokyo cherry blossoms");
  });

  it("noviembre → tokio winter", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-15T12:00:00Z"));
    const r = getCurrentSeasonalDestImage("tokio");
    expect(r.alt).toBe("Tokyo winter illuminations");
  });

  it("mayo (sin variant) → base tokio neon", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T12:00:00Z"));
    const r = getCurrentSeasonalDestImage("tokio");
    expect(r.alt).toBe("Tokyo neon street");
  });

  it("safe con null", () => {
    expect(() => getCurrentSeasonalDestImage(null)).not.toThrow();
  });
});
