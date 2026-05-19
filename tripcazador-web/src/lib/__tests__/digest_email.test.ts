/**
 * digest_email.test.ts — SSS316 (19 may 2026)
 *
 * Tests para el template HTML del digest email. Foco:
 *  - Escape de input (XSS defense)
 *  - Render correcto del número de deals + ranking
 *  - UTM tags en los links
 *  - Stable HTML para inspección humana
 */
import { describe, it, expect } from "vitest";
import { buildDigestEmailHtml, escapeHtml } from "../digest_email";
import type { PersonalizedDeal } from "../premium_digest_scorer";

function mkDeal(
  overrides: Partial<PersonalizedDeal> = {},
): PersonalizedDeal {
  return {
    id: "deal_x",
    origin: "BCN",
    destination: "JFK",
    price_eur: 350,
    headline: "BCN→JFK desde 350€",
    airline_name: "Iberia",
    date_out: "2026-08-15",
    date_ret: "2026-08-25",
    savings_pct: 25,
    match_score: 30,
    why_matched: ["match origin BCN", "precio bajo media"],
    ...overrides,
  };
}

describe("escapeHtml SSS316", () => {
  it("escapa caracteres peligrosos", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(escapeHtml('"onload="alert(1)')).toBe(
      "&quot;onload=&quot;alert(1)",
    );
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("input limpio pasa intacto", () => {
    expect(escapeHtml("BCN → JFK")).toBe("BCN → JFK");
  });
});

describe("buildDigestEmailHtml SSS316", () => {
  it("renderiza header con week + count correcto", () => {
    const html = buildDigestEmailHtml({
      topDeals: [mkDeal()],
      reasoning: "Personalizado en base a 2 alertas",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html).toContain("Tu digest semanal");
    expect(html).toContain("2026-05-17");
    expect(html).toContain("1 deal top");
  });

  it("pluraliza 'deals' cuando count > 1", () => {
    const html = buildDigestEmailHtml({
      topDeals: [mkDeal(), mkDeal({ id: "deal_y" }), mkDeal({ id: "deal_z" })],
      reasoning: "x",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html).toContain("3 deals top");
  });

  it("incluye precio y savings_pct", () => {
    const html = buildDigestEmailHtml({
      topDeals: [mkDeal({ price_eur: 199, savings_pct: 42 })],
      reasoning: "x",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html).toContain("199€");
    expect(html).toContain("-42%");
  });

  it("links llevan UTM tags + path /deals/[id]", () => {
    const html = buildDigestEmailHtml({
      topDeals: [mkDeal({ id: "deal_abc" })],
      reasoning: "x",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html).toContain("/deals/deal_abc?utm_source=email_digest");
    expect(html).toContain("utm_medium=email");
    expect(html).toContain("utm_campaign=weekly_premium");
  });

  it("escape XSS: headline con <script> NO ejecuta", () => {
    const html = buildDigestEmailHtml({
      topDeals: [
        mkDeal({
          headline: "<script>alert('xss')</script>BCN→JFK",
          airline_name: "<img src=x onerror=alert(1)>",
        }),
      ],
      reasoning: 'reason with "quotes" and <tag>',
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    // El script tag no aparece como tag real
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&quot;quotes&quot;");
  });

  it("ranking #1, #2... en orden", () => {
    const html = buildDigestEmailHtml({
      topDeals: [
        mkDeal({ id: "a" }),
        mkDeal({ id: "b" }),
        mkDeal({ id: "c" }),
      ],
      reasoning: "x",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html.indexOf("#1")).toBeGreaterThan(-1);
    expect(html.indexOf("#2")).toBeGreaterThan(html.indexOf("#1"));
    expect(html.indexOf("#3")).toBeGreaterThan(html.indexOf("#2"));
  });

  it("incluye razones why_matched como lista", () => {
    const html = buildDigestEmailHtml({
      topDeals: [
        mkDeal({
          why_matched: ["razon A", "razon B"],
        }),
      ],
      reasoning: "x",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html).toContain("razon A");
    expect(html).toContain("razon B");
  });

  it("link footer al panel premium con UTM", () => {
    const html = buildDigestEmailHtml({
      topDeals: [mkDeal()],
      reasoning: "x",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html).toContain("/panel/premium/alertas?utm_source=email_digest");
    expect(html).toContain("/panel/premium/busquedas?utm_source=email_digest");
  });

  it("HTML válido empieza con DOCTYPE", () => {
    const html = buildDigestEmailHtml({
      topDeals: [mkDeal()],
      reasoning: "x",
      digestWeek: "2026-05-17",
      siteUrl: "https://tripcazador.com",
    });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
  });
});
