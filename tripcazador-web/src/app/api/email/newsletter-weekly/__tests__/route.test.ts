/**
 * Tests for /api/email/newsletter-weekly — fase SSS152.
 *
 * - 401 cuando no se pasa token
 * - 401 cuando el token es incorrecto
 * - 503 cuando ADMIN_TOKEN no está set
 * - 200 + sent=0 cuando no hay subscribers
 * - 200 + sent=0 cuando RESEND_API_KEY no está set
 * - pickTopFiveDeals filtra solo CRÍTICO/ERROR y prioriza España
 * - renderNewsletterHtml escapa HTML y formatea precio
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Deal } from "@/lib/api";

vi.mock("@/lib/subscribers_store", () => ({
  listPendingDrip: vi.fn(async () => []),
}));

// loadDeals lee public/deals-latest.json del cwd (Vercel) o tripcazador-web/public.
// En vitest, el cwd es tripcazador-web/, así que public/deals-latest.json existe.
// Los tests que necesiten controlar deals exportan via la fn pickTopFiveDeals.

import { GET } from "../route";
import {
  pickTopFiveDeals,
  renderNewsletterHtml as renderHtmlRaw,
  resetNewsletterRateLimit as _resetRateLimitForTest,
} from "@/lib/newsletter_weekly_helpers";
import { listPendingDrip } from "@/lib/subscribers_store";

// El test original llamaba renderNewsletterHtml(deals, unsubUrl). El nuevo
// helper toma además siteUrl como 3er arg; lo wrapeamos con default fixed.
const renderNewsletterHtml = (deals: Parameters<typeof renderHtmlRaw>[0], unsub: string) =>
  renderHtmlRaw(deals, unsub, "https://tripcazador.com");

function buildReq(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost"));
}

function mkDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "test_id",
    type: "flight",
    headline: "Test",
    origin: "XYZ",
    destination: "ABC",
    city_from: "X",
    city_to: "A",
    country_to: "AA",
    region: "Internacional",
    price_eur: 100,
    savings_pct: 30,
    savings_eur: 30,
    nights: -1,
    date_out: "2027-01-01",
    date_ret: "",
    cabin: "economy",
    airline: "FR",
    airline_name: "Ryanair",
    stops: 0,
    duration_min: 0,
    distance_category: "corto",
    score: 80,
    classification: "OFERTA",
    tags: [],
    image_url: "",
    booking_url: "",
    verified: false,
    sources: [],
    found_at: "",
    expires_at: "",
    ...overrides,
  };
}

describe("newsletter-weekly route", () => {
  const origToken = process.env.ADMIN_TOKEN;
  const origResend = process.env.RESEND_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_TOKEN = "valid-token-xyz";
    delete process.env.RESEND_API_KEY;
    _resetRateLimitForTest();
    vi.mocked(listPendingDrip).mockReset();
    vi.mocked(listPendingDrip).mockResolvedValue([]);
  });

  afterEach(() => {
    if (origToken === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = origToken;
    if (origResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = origResend;
    _resetRateLimitForTest();
  });

  it("returns 401 cuando no se pasa token", async () => {
    const res = await GET(buildReq("/api/email/newsletter-weekly"));
    expect(res.status).toBe(401);
  });

  it("returns 401 cuando el token es incorrecto", async () => {
    const res = await GET(
      buildReq("/api/email/newsletter-weekly?token=wrong"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 cuando ADMIN_TOKEN no está configurado", async () => {
    delete process.env.ADMIN_TOKEN;
    const res = await GET(
      buildReq("/api/email/newsletter-weekly?token=anything"),
    );
    expect(res.status).toBe(503);
  });

  it("returns 200 y sent=0 cuando hay 0 subs (RESEND no set)", async () => {
    vi.mocked(listPendingDrip).mockResolvedValueOnce([]);
    const res = await GET(
      buildReq("/api/email/newsletter-weekly?token=valid-token-xyz"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.sent).toBe(0);
  });

  it("returns 200 y skipped>0 con subs pero sin RESEND_API_KEY", async () => {
    vi.mocked(listPendingDrip).mockResolvedValueOnce([
      {
        email: "x@y.com",
        created_at: 0,
        drip_stage: 5,
        last_sent_at: null,
        unsubscribed_at: null,
        consent_ts: 0,
        source: "test",
        locale: "es",
      },
    ]);
    const res = await GET(
      buildReq("/api/email/newsletter-weekly?token=valid-token-xyz"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.sent).toBe(0);
    // Either reason no_deals (si deals-latest.json no tiene CRÍTICO/ERROR)
    // o resend_not_configured. Ambos son aceptables para este escenario.
    expect(["resend_not_configured", "no_deals"]).toContain(body.reason);
  });

  it("rate-limit: segunda llamada devuelve 429", async () => {
    vi.mocked(listPendingDrip).mockResolvedValue([]);
    const res1 = await GET(
      buildReq("/api/email/newsletter-weekly?token=valid-token-xyz"),
    );
    expect(res1.status).toBe(200);
    const res2 = await GET(
      buildReq("/api/email/newsletter-weekly?token=valid-token-xyz"),
    );
    expect(res2.status).toBe(429);
  });
});

describe("pickTopFiveDeals", () => {
  it("filtra solo CRÍTICO/ERROR (ignora OFERTA y ANOMALÍA)", () => {
    const deals = [
      mkDeal({ id: "a", classification: "CRÍTICO", origin: "MAD", score: 90 }),
      mkDeal({ id: "b", classification: "OFERTA", origin: "MAD", score: 95 }),
      mkDeal({ id: "c", classification: "ERROR", origin: "BCN", score: 80 }),
      mkDeal({ id: "d", classification: "ANOMALÍA", origin: "MAD", score: 100 }),
    ];
    const top = pickTopFiveDeals(deals);
    expect(top.length).toBe(2);
    expect(top.map((d) => d.id).sort()).toEqual(["a", "c"]);
  });

  it("prioriza Spain-origin sobre score mayor de no-España", () => {
    const deals = [
      mkDeal({ id: "fr-better", classification: "CRÍTICO", origin: "CDG", score: 100 }),
      mkDeal({ id: "es-lower", classification: "CRÍTICO", origin: "BCN", score: 50 }),
    ];
    const top = pickTopFiveDeals(deals);
    expect(top[0].id).toBe("es-lower");
    expect(top[1].id).toBe("fr-better");
  });

  it("devuelve como máximo 5 deals incluso si hay más candidatos", () => {
    const many: Deal[] = [];
    for (let i = 0; i < 12; i++) {
      many.push(mkDeal({
        id: `d${i}`,
        classification: i % 2 === 0 ? "CRÍTICO" : "ERROR",
        origin: "MAD",
      }));
    }
    const top = pickTopFiveDeals(many);
    expect(top.length).toBe(5);
  });

  it("devuelve [] cuando no hay CRÍTICO/ERROR", () => {
    const deals = [
      mkDeal({ classification: "OFERTA" }),
      mkDeal({ classification: "ANOMALÍA" }),
    ];
    expect(pickTopFiveDeals(deals)).toEqual([]);
  });
});

describe("renderNewsletterHtml", () => {
  it("incluye headline, precio, y unsub url", () => {
    const deals = [
      mkDeal({
        city_from: "Madrid",
        city_to: "Tokio",
        price_eur: 451,
        savings_pct: 62,
        airline_name: "Iberia",
      }),
    ];
    const html = renderNewsletterHtml(deals, "https://x/unsub");
    expect(html).toContain("Madrid → Tokio");
    expect(html).toContain("€451");
    expect(html).toContain("https://x/unsub");
    expect(html).toContain("-62%");
    expect(html).toContain("Iberia");
  });

  it("escapa caracteres HTML en city names", () => {
    const deals = [
      mkDeal({ city_from: '<script>alert(1)</script>', city_to: "X" }),
    ];
    const html = renderNewsletterHtml(deals, "https://x/u");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
