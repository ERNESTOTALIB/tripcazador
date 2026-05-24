import { describe, it, expect, beforeEach } from "vitest";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  // @ts-expect-error mock
  globalThis.localStorage = localStorageMock;
  // @ts-expect-error mock
  globalThis.window = { localStorage: localStorageMock };
});

function makeItem(id: string, priceEur = 100) {
  return {
    id,
    origin: "MAD",
    destination: "LIS",
    cityTo: "Lisboa",
    priceEur,
    airline: "Vueling",
  };
}

describe("recently_viewed", () => {
  it("empty inicialmente", async () => {
    const m = await import("@/lib/recently_viewed");
    expect(m.getRecentlyViewed()).toEqual([]);
  });

  it("track 1 deal y persiste", async () => {
    const m = await import("@/lib/recently_viewed");
    m.trackDealView(makeItem("a"));
    const items = m.getRecentlyViewed();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe("a");
    expect(items[0].viewedAt).toBeGreaterThan(0);
  });

  it("limit 6 items max", async () => {
    const m = await import("@/lib/recently_viewed");
    for (let i = 0; i < 10; i++) {
      m.trackDealView(makeItem(`deal-${i}`));
    }
    const items = m.getRecentlyViewed();
    expect(items.length).toBe(6);
    // Newest first
    expect(items[0].id).toBe("deal-9");
  });

  it("re-track existing mueve a top (LRU)", async () => {
    const m = await import("@/lib/recently_viewed");
    m.trackDealView(makeItem("a"));
    m.trackDealView(makeItem("b"));
    m.trackDealView(makeItem("c"));
    m.trackDealView(makeItem("a")); // a re-visited
    const items = m.getRecentlyViewed();
    expect(items[0].id).toBe("a");
    expect(items.length).toBe(3); // no dup
  });

  it("clearRecentlyViewed borra todo", async () => {
    const m = await import("@/lib/recently_viewed");
    m.trackDealView(makeItem("a"));
    m.clearRecentlyViewed();
    expect(m.getRecentlyViewed()).toEqual([]);
  });

  it("getRecentlyViewed tolera JSON corrupto", async () => {
    localStorageMock.setItem("tc_recently_viewed_v1", "{not json");
    const m = await import("@/lib/recently_viewed");
    expect(m.getRecentlyViewed()).toEqual([]);
  });
});
