import { describe, it, expect } from "vitest";
import { quickSearch } from "@/lib/quick_search";

describe("quick_search", () => {
  it("query <2 char devuelve []", () => {
    expect(quickSearch("a")).toEqual([]);
    expect(quickSearch("")).toEqual([]);
  });

  it("encuentra airport por IATA", () => {
    const r = quickSearch("MAD");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].type).toBe("airport");
    expect(r[0].label).toContain("MAD");
  });

  it("encuentra airport por city normalizada", () => {
    const r = quickSearch("madrid");
    expect(r.find((x) => x.type === "airport")).toBeTruthy();
  });

  it("encuentra destino por nombre", () => {
    const r = quickSearch("japon");
    expect(r.find((x) => x.type === "destino")).toBeTruthy();
  });

  it("encuentra vertical por keyword", () => {
    const r = quickSearch("equipaje");
    expect(r.find((x) => x.type === "vertical" && x.href === "/equipaje")).toBeTruthy();
  });

  it("respeta maxResults", () => {
    const r = quickSearch("a", 3); // <2 → []
    expect(r.length).toBe(0);
    const r2 = quickSearch("madrid", 3);
    expect(r2.length).toBeLessThanOrEqual(3);
  });

  it("búsqueda normalizada: ignora acentos", () => {
    const r = quickSearch("japon");
    const r2 = quickSearch("japón");
    expect(r.length).toBeGreaterThan(0);
    expect(r2.length).toBeGreaterThan(0);
  });
});
