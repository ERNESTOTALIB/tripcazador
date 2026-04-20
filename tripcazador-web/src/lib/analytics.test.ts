/**
 * Tests para el helper track() de analytics.
 *
 * Invariante crítico: un fallo del tracker (gtag ausente, gtag throw,
 * plausible throw) NO debe romper el flujo del usuario. Si cualquiera
 * de estos tests explota, la web puede quedarse con el botón "Buscar"
 * inservible en cuanto GA falla.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

describe("track()", () => {
  beforeEach(() => {
    // Simulamos el objeto window para el código que corre en el browser.
    // En Node puro, `typeof window === "undefined"` y track() retorna temprano
    // sin tocar nada — ese camino también queremos validarlo.
    // @ts-expect-error – seteamos window solo para testing
    globalThis.window = { } as Window & typeof globalThis;
  });

  afterEach(() => {
    // @ts-expect-error – limpiamos para no filtrar entre tests
    delete globalThis.window;
    vi.restoreAllMocks();
  });

  it("es no-op si window no existe (SSR / Node)", async () => {
    // @ts-expect-error
    delete globalThis.window;
    const { track } = await import("./analytics");
    // No debe lanzar
    expect(() =>
      track({
        name: "search_submitted",
        params: { origin: "MAD", destination: "JFK", search_type: "airport" },
      })
    ).not.toThrow();
  });

  it("llama a gtag con el nombre y params si está disponible", async () => {
    const gtag = vi.fn();
    (globalThis.window as any).gtag = gtag;
    const { track } = await import("./analytics");
    track({
      name: "result_clicked",
      params: { deal_id: "abc123", origin: "MAD", destination: "JFK", price_eur: 350 },
    });
    expect(gtag).toHaveBeenCalledWith("event", "result_clicked", {
      deal_id: "abc123",
      origin: "MAD",
      destination: "JFK",
      price_eur: 350,
    });
  });

  it("llama a plausible si está disponible (dual-tracker)", async () => {
    const plausible = vi.fn();
    (globalThis.window as any).plausible = plausible;
    const { track } = await import("./analytics");
    track({
      name: "booking_url_opened",
      params: { source: "deal_card", destination: "JFK", price_eur: 350 },
    });
    expect(plausible).toHaveBeenCalledWith("booking_url_opened", {
      props: { source: "deal_card", destination: "JFK", price_eur: 350 },
    });
  });

  it("sobrevive a gtag que lanza excepción (garantía: no romper UX)", async () => {
    (globalThis.window as any).gtag = () => {
      throw new Error("GA consent denied");
    };
    const { track } = await import("./analytics");
    expect(() =>
      track({
        name: "search_submitted",
        params: { origin: "MAD", destination: "JFK", search_type: "airport" },
      })
    ).not.toThrow();
  });

  it("es seguro con window presente pero sin gtag/plausible (ad-blocker)", async () => {
    const { track } = await import("./analytics");
    expect(() =>
      track({
        name: "search_submitted",
        params: { origin: "MAD", destination: "JFK", search_type: "airport" },
      })
    ).not.toThrow();
  });
});
