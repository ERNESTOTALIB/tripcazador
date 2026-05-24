/**
 * ab_test.test.ts — SSS465
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
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
  // @ts-expect-error mock global
  globalThis.localStorage = localStorageMock;
  // @ts-expect-error mock global
  globalThis.window = { localStorage: localStorageMock };
});

describe("ab_test", () => {
  it("asigna una variant válida de la lista", async () => {
    const { getAbVariant } = await import("@/lib/ab_test");
    const v = getAbVariant("test1", ["A", "B"] as const);
    expect(["A", "B"]).toContain(v);
  });

  it("la asignación es estable (mismo testId devuelve mismo variant)", async () => {
    const { getAbVariant } = await import("@/lib/ab_test");
    const v1 = getAbVariant("test_stable", ["A", "B", "C"] as const);
    const v2 = getAbVariant("test_stable", ["A", "B", "C"] as const);
    const v3 = getAbVariant("test_stable", ["A", "B", "C"] as const);
    expect(v1).toBe(v2);
    expect(v2).toBe(v3);
  });

  it("resetAbTest borra y vuelve a asignar", async () => {
    const { getAbVariant, resetAbTest } = await import("@/lib/ab_test");
    const v1 = getAbVariant("test_reset", ["A", "B"] as const);
    resetAbTest("test_reset");
    // Tras reset puede salir distinto o igual (random). Verificamos al menos que no errore.
    const v2 = getAbVariant("test_reset", ["A", "B"] as const);
    expect(["A", "B"]).toContain(v2);
  });

  it("variants vacío lanza error", async () => {
    const { getAbVariant } = await import("@/lib/ab_test");
    expect(() => getAbVariant("test_empty", [] as const)).toThrow();
  });

  it("trackAbExposure dedupea (mismo variant solo 1x)", async () => {
    const { trackAbExposure } = await import("@/lib/ab_test");
    const fetchMock = vi.fn().mockResolvedValue(undefined);
    // @ts-expect-error mock global
    globalThis.fetch = fetchMock;
    trackAbExposure("test_dedup", "A");
    trackAbExposure("test_dedup", "A"); // no-op
    trackAbExposure("test_dedup", "A"); // no-op
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("trackAbConversion dispara fetch con value", async () => {
    const { trackAbConversion } = await import("@/lib/ab_test");
    const fetchMock = vi.fn().mockResolvedValue(undefined);
    // @ts-expect-error mock global
    globalThis.fetch = fetchMock;
    trackAbConversion("test_conv", "B", 9.99);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.meta.value).toBe(9.99);
    expect(body.meta.variant).toBe("B");
  });
});
