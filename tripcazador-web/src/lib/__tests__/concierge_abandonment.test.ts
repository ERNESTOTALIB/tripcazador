/**
 * concierge_abandonment.test.ts — SSS423 (23 may 2026)
 *
 * Pure-fn tests para helpers de cart abandonment. Simula document.cookie
 * y Date.now para verificar ventana de recuperación.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock document.cookie storage
class CookieStore {
  store = new Map<string, string>();
  get cookie(): string {
    return Array.from(this.store.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
  set cookie(raw: string) {
    // Soporte simple: clave=valor; Max-Age=N; Path=/; ...
    const first = raw.split(";")[0];
    const [k, ...rest] = first.split("=");
    const v = rest.join("=");
    const maxAgeMatch = raw.match(/Max-Age=(\d+)/i);
    if (maxAgeMatch && maxAgeMatch[1] === "0") {
      this.store.delete(k);
      return;
    }
    this.store.set(k, v);
  }
}

let cookieStore: CookieStore;
let originalDoc: Document | undefined;

beforeEach(() => {
  cookieStore = new CookieStore();
  // @ts-expect-error — sustituye document para tests
  originalDoc = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    value: cookieStore,
    configurable: true,
  });
  // @ts-expect-error — node test global, simular window
  globalThis.window = {};
});

afterEach(() => {
  if (originalDoc) {
    Object.defineProperty(globalThis, "document", {
      value: originalDoc,
      configurable: true,
    });
  } else {
    // @ts-expect-error — limpiar globals de test
    delete globalThis.document;
  }
  // @ts-expect-error — limpiar globals de test
  delete globalThis.window;
  vi.restoreAllMocks();
});

describe("concierge_abandonment", () => {
  it("marca y lee correctamente el estado", async () => {
    const m = await import("@/lib/concierge_abandonment");
    m.markConciergeOpened("premium");
    // Avanzar tiempo simulado >5min para que pase MIN_RECOVERY_DELAY
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6 * 60 * 1000);
    const state = m.getRecoverableAbandonment();
    expect(state).not.toBeNull();
    expect(state?.tier).toBe("premium");
  });

  it("no devuelve estado si <5min desde apertura", async () => {
    const m = await import("@/lib/concierge_abandonment");
    m.markConciergeOpened("standard");
    // Solo 1 minuto después
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60 * 1000);
    expect(m.getRecoverableAbandonment()).toBeNull();
  });

  it("clear borra cookie y devuelve null en siguientes reads", async () => {
    const m = await import("@/lib/concierge_abandonment");
    m.markConciergeOpened("express");
    m.clearConciergeAbandonment();
    expect(m.getRecoverableAbandonment()).toBeNull();
  });

  it("buildRecoveryUrl incluye tier + coupon", async () => {
    const m = await import("@/lib/concierge_abandonment");
    const url = m.buildRecoveryUrl({ openedAt: Date.now(), tier: "premium" });
    expect(url).toBe("/concierge/premium?from=abandonment&coupon=TC10");
  });

  it("buildRecoveryUrl sin tier usa /concierge", async () => {
    const m = await import("@/lib/concierge_abandonment");
    const url = m.buildRecoveryUrl({ openedAt: Date.now() });
    expect(url).toBe("/concierge?from=abandonment&coupon=TC10");
  });

  it("FIX-SEC-3: tier no-whitelisted cae a fallback (path injection defense)", async () => {
    const m = await import("@/lib/concierge_abandonment");
    // Tier malicioso intentando path traversal
    const url = m.buildRecoveryUrl({
      openedAt: Date.now(),
      tier: "../../checkout-redirect?to=evil.com",
    });
    expect(url).toBe("/concierge?from=abandonment&coupon=TC10");
    expect(url).not.toContain("evil.com");
    expect(url).not.toContain("..");
  });

  it("FIX-SEC-3: tier vacío string también cae a fallback", async () => {
    const m = await import("@/lib/concierge_abandonment");
    const url = m.buildRecoveryUrl({ openedAt: Date.now(), tier: "" });
    expect(url).toBe("/concierge?from=abandonment&coupon=TC10");
  });

  it("FIX-SEC-3: los 4 tiers válidos sí se aceptan", async () => {
    const m = await import("@/lib/concierge_abandonment");
    for (const t of ["express", "standard", "premium", "pro"]) {
      const url = m.buildRecoveryUrl({ openedAt: Date.now(), tier: t });
      expect(url).toContain(`/concierge/${t}`);
    }
  });

  it("preserva openedAt si se vuelve a marcar dentro de ventana", async () => {
    const m = await import("@/lib/concierge_abandonment");
    const baseNow = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(baseNow);
    m.markConciergeOpened("express");
    // 1h después, re-mark con tier nuevo
    vi.spyOn(Date, "now").mockReturnValue(baseNow + 60 * 60 * 1000);
    m.markConciergeOpened("standard");
    // Hacer fetch tras >5min total
    vi.spyOn(Date, "now").mockReturnValue(baseNow + 60 * 60 * 1000 + 6 * 60 * 1000);
    const state = m.getRecoverableAbandonment();
    expect(state).not.toBeNull();
    // El openedAt debe ser baseNow (preservado), no el segundo timestamp
    expect(state?.openedAt).toBe(baseNow);
    expect(state?.tier).toBe("standard"); // tier sí actualizado
  });
});
