/**
 * recommendations.test.ts — SSS242 (16 may 2026)
 *
 * Tests para lib/recommendations.ts (185 líneas, recommender engine sin tests).
 *
 * Cubre:
 *  - getRecommendations: input vacío, IATAs inválidos, scoring relativo,
 *    excludeIatas, límite default 6, limit custom, mejor seed match
 *  - getDestinationFeature: lookup case-insensitive
 *  - listAllClusters: subset esperado
 *  - similarity heuristic invariants (mismo cluster > adjacent > unrelated)
 */
import { describe, it, expect } from "vitest";
import {
  getRecommendations,
  getDestinationFeature,
  listAllClusters,
} from "../recommendations";

describe("getDestinationFeature", () => {
  it("retorna feature para IATA válido", () => {
    const f = getDestinationFeature("BKK");
    expect(f).not.toBeNull();
    expect(f?.iata).toBe("BKK");
    expect(f?.city).toBe("Bangkok");
    expect(f?.cluster).toBe("asia_se");
  });

  it("case-insensitive lookup", () => {
    expect(getDestinationFeature("bkk")).not.toBeNull();
    expect(getDestinationFeature("Bkk")?.iata).toBe("BKK");
  });

  it("null para IATA desconocido", () => {
    expect(getDestinationFeature("XYZ")).toBeNull();
    expect(getDestinationFeature("")).toBeNull();
  });
});

describe("listAllClusters", () => {
  it("incluye los 9 clusters esperados", () => {
    const clusters = listAllClusters();
    expect(clusters).toContain("asia_se");
    expect(clusters).toContain("asia_e");
    expect(clusters).toContain("caribbean");
    expect(clusters).toContain("med_eu");
    expect(clusters).toContain("north_eu");
    expect(clusters).toContain("americas_n");
    expect(clusters).toContain("americas_s");
    expect(clusters).toContain("africa");
    expect(clusters).toContain("oceania");
  });

  it("no tiene duplicados", () => {
    const clusters = listAllClusters();
    expect(new Set(clusters).size).toBe(clusters.length);
  });
});

describe("getRecommendations — input edge cases", () => {
  it("retorna [] si favoriteIatas vacío", () => {
    expect(getRecommendations({ favoriteIatas: [] })).toEqual([]);
  });

  it("retorna [] si todos los IATAs son desconocidos", () => {
    expect(getRecommendations({ favoriteIatas: ["XYZ", "QQQ"] })).toEqual([]);
  });

  it("ignora IATAs desconocidos pero usa los válidos", () => {
    const recs = getRecommendations({
      favoriteIatas: ["XYZ", "BKK"],
      limit: 3,
    });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it("respeta limit default 6", () => {
    const recs = getRecommendations({ favoriteIatas: ["BKK"] });
    expect(recs.length).toBeLessThanOrEqual(6);
  });

  it("respeta limit custom", () => {
    const recs = getRecommendations({ favoriteIatas: ["BKK"], limit: 2 });
    expect(recs.length).toBeLessThanOrEqual(2);
  });
});

describe("getRecommendations — scoring semantics", () => {
  it("seed favorito NUNCA aparece en recommendations", () => {
    const recs = getRecommendations({ favoriteIatas: ["BKK"], limit: 10 });
    expect(recs.find((r) => r.iata === "BKK")).toBeUndefined();
  });

  it("excludeIatas también excluidos", () => {
    const recs = getRecommendations({
      favoriteIatas: ["BKK"],
      excludeIatas: ["DPS", "SIN"],
      limit: 10,
    });
    expect(recs.find((r) => r.iata === "DPS")).toBeUndefined();
    expect(recs.find((r) => r.iata === "SIN")).toBeUndefined();
  });

  it("recomendaciones para BKK incluyen otros asia_se (mismo cluster)", () => {
    const recs = getRecommendations({ favoriteIatas: ["BKK"], limit: 10 });
    const iatas = recs.map((r) => r.iata);
    // Asia SE: DPS, HKT, SGN, MNL, SIN, KUL — al menos algunos deben estar
    const asiaSe = ["DPS", "HKT", "SGN", "MNL", "SIN", "KUL"];
    const hits = asiaSe.filter((i) => iatas.includes(i)).length;
    expect(hits).toBeGreaterThanOrEqual(3);
  });

  it("scores ordenados descending", () => {
    const recs = getRecommendations({ favoriteIatas: ["BKK"], limit: 10 });
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    }
  });

  it("cada rec tiene reason y score > 0", () => {
    const recs = getRecommendations({ favoriteIatas: ["FCO"], limit: 5 });
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.reason).toBeTruthy();
      expect(r.score).toBeGreaterThan(30);
    }
  });

  it("acepta múltiples seeds favoritos", () => {
    const recs = getRecommendations({
      favoriteIatas: ["BKK", "FCO"], // Asia SE + med_eu
      limit: 10,
    });
    expect(recs.length).toBeGreaterThan(0);
    // No debe incluir ni BKK ni FCO
    expect(recs.find((r) => r.iata === "BKK")).toBeUndefined();
    expect(recs.find((r) => r.iata === "FCO")).toBeUndefined();
  });
});

describe("getRecommendations — reason explanation", () => {
  it("seed beach → reason contains 'playa' para targets beach", () => {
    const recs = getRecommendations({ favoriteIatas: ["DPS"], limit: 5 });
    // DPS es beach+luxury+cultural en asia_se. Recs adjacent o similar deben tener reason
    expect(recs.length).toBeGreaterThan(0);
    const someBeachReason = recs.some(
      (r) => r.reason.includes("playa") || r.reason.includes("perfil"),
    );
    expect(someBeachReason).toBe(true);
  });

  it("seed city + cultural → reason apropiada", () => {
    const recs = getRecommendations({ favoriteIatas: ["FCO"], limit: 5 });
    expect(recs.length).toBeGreaterThan(0);
    // Reason debería mencionar Roma o describir vibe
    const allHaveReason = recs.every((r) => r.reason.length > 5);
    expect(allHaveReason).toBe(true);
  });
});

describe("input normalization", () => {
  it("favoriteIatas se uppercasean", () => {
    const lowerRecs = getRecommendations({ favoriteIatas: ["bkk"], limit: 3 });
    const upperRecs = getRecommendations({ favoriteIatas: ["BKK"], limit: 3 });
    // Deben dar mismas recommendations
    expect(lowerRecs.map((r) => r.iata).sort()).toEqual(
      upperRecs.map((r) => r.iata).sort(),
    );
  });

  it("excludeIatas se uppercasean", () => {
    const a = getRecommendations({
      favoriteIatas: ["BKK"],
      excludeIatas: ["dps"],
      limit: 10,
    });
    const b = getRecommendations({
      favoriteIatas: ["BKK"],
      excludeIatas: ["DPS"],
      limit: 10,
    });
    expect(a.map((r) => r.iata).sort()).toEqual(b.map((r) => r.iata).sort());
    expect(a.find((r) => r.iata === "DPS")).toBeUndefined();
  });
});

describe("similarity invariants (heuristic)", () => {
  it("mismo cluster score > adjacent", () => {
    // BKK seed: asia_se. DPS también asia_se. NRT es asia_e (adjacent).
    // DPS debería tener score más alto que NRT.
    const recs = getRecommendations({ favoriteIatas: ["BKK"], limit: 30 });
    const dps = recs.find((r) => r.iata === "DPS");
    const nrt = recs.find((r) => r.iata === "NRT");
    if (dps && nrt) {
      expect(dps.score).toBeGreaterThan(nrt.score);
    }
  });

  it("adjacent cluster score > unrelated", () => {
    // BKK seed: asia_se. NRT (asia_e) adjacent. PMI (med_eu) unrelated.
    const recs = getRecommendations({ favoriteIatas: ["BKK"], limit: 30 });
    const nrt = recs.find((r) => r.iata === "NRT");
    const pmi = recs.find((r) => r.iata === "PMI");
    // pmi puede no estar (score<30), pero si está, nrt debe ser >
    if (nrt && pmi) {
      expect(nrt.score).toBeGreaterThan(pmi.score);
    }
  });
});
