/**
 * saved_searches_store.test.ts — SSS303 (18 may 2026)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createSavedSearch,
  listSavedSearches,
  deleteSavedSearch,
  buildSearchUrl,
  SavedSearchQuotaError,
  SAVED_SEARCH_QUOTA,
  SAVED_SEARCH_NAME_MAX,
  _clearStore,
} from "../saved_searches_store";

describe("saved_searches_store SSS303", () => {
  beforeEach(() => _clearStore());

  it("crea búsqueda básica", async () => {
    const s = await createSavedSearch({
      customerId: "cs_live_test01",
      name: "Tokio business",
      cabin: "business",
    });
    expect(s.id).toMatch(/^ss_/);
    expect(s.customerId).toBe("cs_live_test01");
    expect(s.name).toBe("Tokio business");
    expect(s.cabin).toBe("business");
  });

  it("airlines IATA filtradas + cap 20", async () => {
    const s = await createSavedSearch({
      customerId: "cs_live_test01",
      name: "x",
      airlines: ["FR", "IB", "VY", "garbage", "BB"],
    });
    expect(s.airlines).toEqual(["FR", "IB", "VY", "BB"]);
  });

  it("name trimmed + truncated", async () => {
    const longName = "x".repeat(100);
    const s = await createSavedSearch({
      customerId: "cs_live_test01",
      name: longName,
    });
    expect(s.name.length).toBe(SAVED_SEARCH_NAME_MAX);
  });

  it("name vacío rechazado", async () => {
    await expect(
      createSavedSearch({ customerId: "cs_live_test01", name: "   " }),
    ).rejects.toThrow("name_required");
  });

  it("customerId requerido", async () => {
    await expect(createSavedSearch({ customerId: "", name: "x" })).rejects.toThrow(
      "customerId_required",
    );
  });

  it("quota enforced a 25 por customer", async () => {
    for (let i = 0; i < SAVED_SEARCH_QUOTA; i++) {
      await createSavedSearch({ customerId: "cs_live_quotam", name: `s${i}` });
    }
    await expect(
      createSavedSearch({ customerId: "cs_live_quotam", name: "extra" }),
    ).rejects.toThrow(SavedSearchQuotaError);
  });

  it("listSavedSearches filtra por customerId", async () => {
    await createSavedSearch({ customerId: "cs_live_aaa", name: "A" });
    await createSavedSearch({ customerId: "cs_live_bbb", name: "B" });
    const a = await listSavedSearches("cs_live_aaa");
    expect(a.length).toBe(1);
    expect(a[0].name).toBe("A");
  });

  it("listSavedSearches sort desc por created_at", async () => {
    const s1 = await createSavedSearch({ customerId: "cs_live_sort", name: "old" });
    // pequeño delay artificial — created_at distinto
    await new Promise((r) => setTimeout(r, 5));
    await createSavedSearch({ customerId: "cs_live_sort", name: "new" });
    const list = await listSavedSearches("cs_live_sort");
    expect(list[0].name).toBe("new");
    expect(list[1].id).toBe(s1.id);
  });

  it("deleteSavedSearch requiere customerId match", async () => {
    const s = await createSavedSearch({ customerId: "cs_live_own", name: "x" });
    const wrong = await deleteSavedSearch(s.id, "cs_live_intruder");
    expect(wrong).toBe(false);
    const ok = await deleteSavedSearch(s.id, "cs_live_own");
    expect(ok).toBe(true);
    expect((await listSavedSearches("cs_live_own")).length).toBe(0);
  });

  it("deleteSavedSearch id inexistente devuelve false", async () => {
    const ok = await deleteSavedSearch("ss_nope", "cs_live_test01");
    expect(ok).toBe(false);
  });

  it("buildSearchUrl genera params correctos", () => {
    const url = buildSearchUrl({
      id: "ss_abc",
      customerId: "cs_live_x",
      name: "x",
      airlines: ["FR", "IB"],
      cabin: "business",
      stops: "0",
      timeBand: "morning",
      origin: "BCN",
      destination: "NRT",
      max_price: 1500,
      created_at: 0,
    });
    expect(url).toContain("airlines=FR%2CIB");
    expect(url).toContain("cabin_exact=business");
    expect(url).toContain("stops_exact=0");
    expect(url).toContain("time=morning");
    expect(url).toContain("origin=BCN");
    expect(url).toContain("destination=NRT");
    expect(url).toContain("price_max=1500");
    expect(url).toContain("saved=ss_abc");
  });

  it("buildSearchUrl omite values 'any'", () => {
    const url = buildSearchUrl({
      id: "ss_min",
      customerId: "cs_live_x",
      name: "min",
      airlines: [],
      cabin: "any",
      stops: "any",
      timeBand: "any",
      created_at: 0,
    });
    expect(url).not.toContain("airlines=");
    expect(url).not.toContain("cabin_exact=");
    expect(url).toContain("saved=ss_min");
  });

  it("origin/destination upper + 3 chars", async () => {
    const s = await createSavedSearch({
      customerId: "cs_live_x1",
      name: "x",
      origin: "bcn",
      destination: "jfklong",
    });
    expect(s.origin).toBe("BCN");
    // destination slice(0,3) = "JFK"
    expect(s.destination).toBe("JFK");
  });
});
