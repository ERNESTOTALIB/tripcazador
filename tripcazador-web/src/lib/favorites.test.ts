import { describe, it, expect } from "vitest";
import {
  parseFavorites,
  serializeFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  isFavorite,
  FavoritesStore,
  MAX_FAVORITES,
} from "./favorites";

describe("parseFavorites", () => {
  it("returns empty store for null", () => {
    expect(parseFavorites(null)).toEqual({ ids: [], updatedAt: 0 });
  });

  it("returns empty store for invalid JSON", () => {
    expect(parseFavorites("{not json")).toEqual({ ids: [], updatedAt: 0 });
  });

  it("returns empty store for non-object JSON", () => {
    expect(parseFavorites("42")).toEqual({ ids: [], updatedAt: 0 });
    expect(parseFavorites("null")).toEqual({ ids: [], updatedAt: 0 });
  });

  it("filters non-string ids", () => {
    const raw = JSON.stringify({ ids: ["a", 1, null, "b", {}], updatedAt: 123 });
    expect(parseFavorites(raw)).toEqual({ ids: ["a", "b"], updatedAt: 123 });
  });

  it("zeros invalid updatedAt", () => {
    const raw = JSON.stringify({ ids: ["a"], updatedAt: "nope" });
    expect(parseFavorites(raw).updatedAt).toBe(0);
  });
});

describe("serializeFavorites", () => {
  it("round-trips with parseFavorites", () => {
    const store: FavoritesStore = { ids: ["x", "y"], updatedAt: 999 };
    const parsed = parseFavorites(serializeFavorites(store));
    expect(parsed).toEqual(store);
  });
});

describe("addFavorite", () => {
  it("adds new id to the front", () => {
    const s0: FavoritesStore = { ids: ["a", "b"], updatedAt: 1 };
    const s1 = addFavorite(s0, "c");
    expect(s1.ids).toEqual(["c", "a", "b"]);
    expect(s1.updatedAt).toBeGreaterThan(0);
  });

  it("is a no-op if id already exists", () => {
    const s0: FavoritesStore = { ids: ["a", "b"], updatedAt: 1 };
    const s1 = addFavorite(s0, "a");
    expect(s1).toBe(s0);
  });

  it("is a no-op for empty id", () => {
    const s0: FavoritesStore = { ids: ["a"], updatedAt: 1 };
    expect(addFavorite(s0, "")).toBe(s0);
  });

  it("respects MAX_FAVORITES cap (FIFO drop)", () => {
    const ids = Array.from({ length: MAX_FAVORITES }, (_, i) => `id-${i}`);
    const s0: FavoritesStore = { ids, updatedAt: 1 };
    const s1 = addFavorite(s0, "newest");
    expect(s1.ids.length).toBe(MAX_FAVORITES);
    expect(s1.ids[0]).toBe("newest");
    // oldest (last) should have been dropped
    expect(s1.ids.includes(`id-${MAX_FAVORITES - 1}`)).toBe(false);
  });
});

describe("removeFavorite", () => {
  it("removes the id", () => {
    const s0: FavoritesStore = { ids: ["a", "b", "c"], updatedAt: 1 };
    const s1 = removeFavorite(s0, "b");
    expect(s1.ids).toEqual(["a", "c"]);
    expect(s1.updatedAt).toBeGreaterThan(0);
  });

  it("is a no-op if id not present", () => {
    const s0: FavoritesStore = { ids: ["a"], updatedAt: 1 };
    expect(removeFavorite(s0, "missing")).toBe(s0);
  });
});

describe("toggleFavorite", () => {
  it("adds when missing, removes when present", () => {
    const s0: FavoritesStore = { ids: [], updatedAt: 0 };
    const s1 = toggleFavorite(s0, "a");
    expect(s1.ids).toEqual(["a"]);
    const s2 = toggleFavorite(s1, "a");
    expect(s2.ids).toEqual([]);
  });
});

describe("isFavorite", () => {
  it("returns true/false correctly", () => {
    const s: FavoritesStore = { ids: ["a", "b"], updatedAt: 1 };
    expect(isFavorite(s, "a")).toBe(true);
    expect(isFavorite(s, "z")).toBe(false);
  });
});
