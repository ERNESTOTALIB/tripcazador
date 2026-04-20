import { describe, expect, it } from "vitest";
import { parseSortHash, sortKeyToHashParam, sortDeals, type SortKey } from "./DealsListClient";

describe("parseSortHash", () => {
  it("hash vacío → best", () => {
    expect(parseSortHash("")).toBe("best");
    expect(parseSortHash("#")).toBe("best");
  });

  it("#orden=baratos → cheap", () => {
    expect(parseSortHash("#orden=baratos")).toBe("cheap");
  });

  it("#orden=rapidos → fast", () => {
    expect(parseSortHash("#orden=rapidos")).toBe("fast");
  });

  it("#orden=directos → direct", () => {
    expect(parseSortHash("#orden=directos")).toBe("direct");
  });

  it("valor desconocido → best (default fallback)", () => {
    expect(parseSortHash("#orden=xyz")).toBe("best");
  });

  it("acepta hash sin el # prefix", () => {
    expect(parseSortHash("orden=baratos")).toBe("cheap");
  });

  it("ignora parámetros extraños", () => {
    expect(parseSortHash("#foo=bar&orden=directos&x=1")).toBe("direct");
  });
});

describe("sortKeyToHashParam", () => {
  it("best → null (default no necesita hash)", () => {
    expect(sortKeyToHashParam("best")).toBeNull();
  });

  it("maneja las 3 variantes no-default", () => {
    expect(sortKeyToHashParam("cheap")).toBe("orden=baratos");
    expect(sortKeyToHashParam("fast")).toBe("orden=rapidos");
    expect(sortKeyToHashParam("direct")).toBe("orden=directos");
  });

  it("round-trip parse → serialize → parse para todas las claves no-default", () => {
    const keys: SortKey[] = ["cheap", "fast", "direct"];
    for (const k of keys) {
      const param = sortKeyToHashParam(k);
      expect(param).not.toBeNull();
      expect(parseSortHash(`#${param}`)).toBe(k);
    }
  });
});

// Tipo mínimo para sortDeals — el generic acepta subconjuntos
type D = { id: string; price_eur: number; duration_min: number; stops: number; score: number };
const mk = (id: string, p: number, dur: number, stops: number, sc: number): D => ({
  id, price_eur: p, duration_min: dur, stops, score: sc,
});

const FIXT: D[] = [
  mk("A", 200, 180, 0, 90),   // directo barato medio
  mk("B", 100, 600, 1, 70),   // más barato pero con escala
  mk("C", 350, 90, 0, 95),    // directo rápido caro
  mk("D", 120, 0, 0, 80),     // duración desconocida (0)
];

describe("sortDeals", () => {
  it("best: ordenación por score desc (no filtra)", () => {
    const r = sortDeals(FIXT, "best").map((d) => d.id);
    expect(r).toEqual(["C", "A", "D", "B"]);
  });

  it("cheap: ordenación por precio asc (no filtra)", () => {
    const r = sortDeals(FIXT, "cheap").map((d) => d.id);
    expect(r).toEqual(["B", "D", "A", "C"]);
  });

  it("fast: ordenación por duración asc, duración 0 al final", () => {
    const r = sortDeals(FIXT, "fast").map((d) => d.id);
    // C (90) < A (180) < B (600) < D (0 → MAX_SAFE_INTEGER)
    expect(r).toEqual(["C", "A", "B", "D"]);
  });

  it("direct: filtra stops===0 y ordena por precio asc", () => {
    const r = sortDeals(FIXT, "direct").map((d) => d.id);
    // B queda fuera (stops=1). Resto (D=120, A=200, C=350) asc por precio.
    expect(r).toEqual(["D", "A", "C"]);
  });

  it("no muta el array original", () => {
    const copy = [...FIXT];
    sortDeals(FIXT, "cheap");
    expect(FIXT).toEqual(copy);
  });

  it("lista vacía devuelve lista vacía para cualquier key", () => {
    (["best", "cheap", "fast", "direct"] as SortKey[]).forEach((k) =>
      expect(sortDeals([], k)).toEqual([]),
    );
  });
});
