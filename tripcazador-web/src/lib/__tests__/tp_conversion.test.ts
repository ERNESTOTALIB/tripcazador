/**
 * tp_conversion.test.ts — SSS235 (16 may 2026)
 *
 * Tests para lib/tp_conversion.ts (revenue-critical).
 *
 * Cubre:
 *  - safeUrlHost (NUEVO en SSS235): no throw con URLs malformadas
 *  - trackPartnerClick: TP pixel, /api/track sendBeacon/fetch,
 *    GA4 dataLayer push, fallback paths
 *  - Bug regression SSS235: partner_url malformed NO debe matar
 *    el /api/track deal_click event.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { safeUrlHost, trackPartnerClick } from "../tp_conversion";

describe("safeUrlHost (SSS235)", () => {
  it("extrae host de URL válida", () => {
    expect(safeUrlHost("https://www.booking.com/searchresults.html?aid=714734")).toBe(
      "www.booking.com",
    );
  });

  it("extrae host con puerto custom", () => {
    expect(safeUrlHost("http://localhost:3000/path")).toBe("localhost:3000");
  });

  it("retorna '' para URL malformada (NO throw)", () => {
    expect(safeUrlHost("not-a-url")).toBe("");
    expect(safeUrlHost("///bad")).toBe("");
    expect(safeUrlHost("javascript:alert(1)")).not.toContain("alert"); // host part vacío
  });

  it("retorna '' para undefined", () => {
    expect(safeUrlHost(undefined)).toBe("");
  });

  it("retorna '' para string vacía", () => {
    expect(safeUrlHost("")).toBe("");
  });

  it("acepta URLs con query y hash", () => {
    expect(
      safeUrlHost("https://example.com/path?a=1&b=2#section"),
    ).toBe("example.com");
  });

  it("acepta URLs https con subdominio", () => {
    expect(safeUrlHost("https://www.skyscanner.es/transport/flights")).toBe(
      "www.skyscanner.es",
    );
  });
});

describe("trackPartnerClick (revenue critical)", () => {
  let mockBeacon: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;
  let dataLayerSpy: Array<Record<string, unknown>>;
  let blobBodies: string[] = [];
  let origBlob: typeof Blob;

  beforeEach(() => {
    // Mock Image constructor (TP pixel)
    // @ts-expect-error - jsdom no expone constructor por defecto en algunos setups
    global.Image = class {
      src = "";
      style: { display: string } = { display: "" };
      decoding = "";
      loading = "";
      alt = "";
      width = 0;
      height = 0;
    };

    // Mock Blob para poder leer el body que envía sendBeacon
    blobBodies = [];
    origBlob = global.Blob;
    // @ts-expect-error - mock
    global.Blob = class {
      _body: string;
      constructor(parts: string[]) {
        this._body = parts.join("");
        blobBodies.push(this._body);
      }
    };

    mockBeacon = vi.fn().mockReturnValue(true);
    mockFetch = vi.fn().mockResolvedValue(new Response());

    // sendBeacon disponible
    Object.defineProperty(global.navigator, "sendBeacon", {
      configurable: true,
      writable: true,
      value: mockBeacon,
    });
    global.fetch = mockFetch;

    // dataLayer init
    dataLayerSpy = [];
    interface W extends Window {
      dataLayer?: Array<Record<string, unknown>>;
    }
    (window as W).dataLayer = dataLayerSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.Blob = origBlob;
  });

  it("envía sendBeacon a /api/track con event deal_click", () => {
    trackPartnerClick({
      deal_id: "abc123",
      city_from: "MAD",
      city_to: "LIS",
      price_eur: 99,
      source: "ryanair",
      partner_url: "https://www.ryanair.com/flight/MAD-LIS",
    });

    expect(mockBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = mockBeacon.mock.calls[0];
    expect(url).toBe("/api/track");
    // Blob → leemos su texto
    expect(blob).toBeInstanceOf(Blob);
  });

  it("body incluye type=deal_click + meta correcto", () => {
    trackPartnerClick({
      deal_id: "deal-42",
      city_from: "BCN",
      city_to: "AMS",
      price_eur: 49,
      source: "vueling",
      partner_url: "https://www.vueling.com/es/BCN/AMS",
    });

    expect(blobBodies.length).toBeGreaterThanOrEqual(1);
    const payload = JSON.parse(blobBodies[0]);
    expect(payload.type).toBe("deal_click");
    expect(payload.meta.deal_id).toBe("deal-42");
    expect(payload.meta.city_from).toBe("BCN");
    expect(payload.meta.city_to).toBe("AMS");
    expect(payload.meta.price_eur).toBe(49);
    expect(payload.meta.source).toBe("vueling");
    expect(payload.meta.partner_url_host).toBe("www.vueling.com");
  });

  it("SSS235 REGRESSION: partner_url malformado NO mata el track event", () => {
    // Antes de SSS235: `new URL("not-a-url")` throw → catch swallow → /api/track NUNCA llamado
    // Después: safeUrlHost devuelve "" y track sigue adelante
    trackPartnerClick({
      deal_id: "broken-url-deal",
      city_from: "MAD",
      city_to: "BKK",
      price_eur: 350,
      source: "qatar",
      partner_url: "this is not a url at all", // sin protocolo → URL constructor throw
    });

    // CRÍTICO: debe haber llamado sendBeacon (antes era 0 → revenue blind)
    expect(mockBeacon).toHaveBeenCalledTimes(1);
    expect(blobBodies.length).toBeGreaterThanOrEqual(1);
    const payload = JSON.parse(blobBodies[0]);
    expect(payload.type).toBe("deal_click");
    expect(payload.meta.deal_id).toBe("broken-url-deal");
    expect(payload.meta.partner_url_host).toBe(""); // fallback safe
  });

  it("acepta deal sin partner_url (opcional)", () => {
    trackPartnerClick({
      deal_id: "min-deal",
    });
    expect(mockBeacon).toHaveBeenCalledTimes(1);
  });

  it("fallback a fetch keepalive cuando sendBeacon no disponible", () => {
    // Eliminar sendBeacon
    // @ts-expect-error - reset
    delete global.navigator.sendBeacon;

    trackPartnerClick({
      deal_id: "no-beacon-deal",
      city_from: "MAD",
      city_to: "LHR",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/track");
    expect(opts.method).toBe("POST");
    expect(opts.keepalive).toBe(true);
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("GA4 dataLayer recibe select_item ecommerce event", () => {
    trackPartnerClick({
      deal_id: "ga4-deal",
      city_from: "MAD",
      city_to: "JFK",
      price_eur: 195,
      source: "iberia",
    });

    expect(dataLayerSpy.length).toBeGreaterThanOrEqual(1);
    const ev = dataLayerSpy.find((e) => e.event === "select_item");
    expect(ev).toBeDefined();
    expect((ev?.ecommerce as { items: unknown[] }).items).toHaveLength(1);
    const item = (ev?.ecommerce as { items: Array<Record<string, unknown>> }).items[0];
    expect(item.item_id).toBe("ga4-deal");
    expect(item.item_name).toBe("MAD → JFK");
    expect(item.item_category).toBe("iberia");
    expect(item.price).toBe(195);
    expect(item.currency).toBe("EUR");
  });

  it("GA4 item_category default 'flight' si source vacío", () => {
    trackPartnerClick({
      deal_id: "no-source-deal",
      city_from: "MAD",
      city_to: "FRA",
    });

    const ev = dataLayerSpy.find((e) => e.event === "select_item");
    expect(ev).toBeDefined();
    const item = (ev?.ecommerce as { items: Array<Record<string, unknown>> }).items[0];
    expect(item.item_category).toBe("flight");
  });

  it("typeof window guard — no throw en SSR", () => {
    // Simulamos SSR temporalmente
    const origWindow = global.window;
    // @ts-expect-error - test SSR
    delete global.window;

    expect(() => {
      trackPartnerClick({ deal_id: "ssr-test" });
    }).not.toThrow();

    global.window = origWindow;
  });
});

describe("trackPartnerClick — XSS / safety", () => {
  beforeEach(() => {
    // @ts-expect-error - mock Image
    global.Image = class {
      src = "";
      style: { display: string } = { display: "" };
      decoding = ""; loading = ""; alt = ""; width = 0; height = 0;
    };
    Object.defineProperty(global.navigator, "sendBeacon", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(true),
    });
  });

  it("encodeURIComponent aplicado a deal_id (defense vs query injection en TP pixel)", () => {
    // Acceso al mock Image — verificamos src no tiene caracteres raw
    let lastSrc = "";
    // @ts-expect-error - reasignamos
    global.Image = class {
      _src = "";
      set src(v: string) { this._src = v; lastSrc = v; }
      get src() { return this._src; }
      style: { display: string } = { display: "" };
      decoding = ""; loading = ""; alt = ""; width = 0; height = 0;
    };

    trackPartnerClick({
      deal_id: "deal id with spaces & special=chars",
    });

    expect(lastSrc).toContain("tp.media/sender_v3.gif");
    expect(lastSrc).toContain("deal_id=deal%20id%20with%20spaces%20%26%20special%3Dchars");
    expect(lastSrc).not.toContain(" "); // no espacios raw
    expect(lastSrc).not.toContain("&special="); // & raw quedaría como separador
  });
});
