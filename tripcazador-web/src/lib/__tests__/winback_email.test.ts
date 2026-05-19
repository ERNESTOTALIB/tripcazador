/**
 * winback_email.test.ts — SSS322
 */
import { describe, it, expect } from "vitest";
import { buildWinbackEmailHtml } from "../winback_email";

describe("buildWinbackEmailHtml SSS322", () => {
  const BASE_INPUT = {
    daysAway: 20,
    totalSavingsEur: 437,
    triggersCount: 5,
    favoriteRoute: { origin: "BCN", destination: "JFK" },
    topDeals: [
      {
        id: "deal_a",
        origin: "BCN",
        destination: "JFK",
        price_eur: 380,
        airline_name: "Iberia",
        date_out: "2026-08-15",
        savings_pct: 25,
      },
    ],
    siteUrl: "https://tripcazador.com",
  };

  it("incluye daysAway en el subject-line del body", () => {
    const html = buildWinbackEmailHtml(BASE_INPUT);
    expect(html).toContain("Hace 20 días");
  });

  it("renderiza savings block si totalSavingsEur > 0", () => {
    const html = buildWinbackEmailHtml(BASE_INPUT);
    expect(html).toContain("437€ ahorrados");
    expect(html).toContain("5 alertas disparadas");
  });

  it("renderiza warning block si totalSavingsEur=0", () => {
    const html = buildWinbackEmailHtml({ ...BASE_INPUT, totalSavingsEur: 0, triggersCount: 0 });
    expect(html).toContain("aún no has recibido ninguna alerta");
  });

  it("incluye ruta favorita en el copy", () => {
    const html = buildWinbackEmailHtml(BASE_INPUT);
    expect(html).toContain("BCN → JFK");
  });

  it("sin ruta favorita usa copy genérico", () => {
    const html = buildWinbackEmailHtml({ ...BASE_INPUT, favoriteRoute: undefined });
    expect(html).toContain("mejores chollos de la semana");
  });

  it("UTM tags en links", () => {
    const html = buildWinbackEmailHtml(BASE_INPUT);
    expect(html).toContain("utm_source=email_winback");
    expect(html).toContain("utm_campaign=anti_churn_14d");
  });

  it("CTA principal apunta a /panel/premium", () => {
    const html = buildWinbackEmailHtml(BASE_INPUT);
    expect(html).toContain("/panel/premium?utm_source=email_winback");
  });

  it("escape XSS en favorite route + deal data", () => {
    const html = buildWinbackEmailHtml({
      ...BASE_INPUT,
      favoriteRoute: { origin: "<script>", destination: '"onload="alert' },
      topDeals: [
        {
          ...BASE_INPUT.topDeals[0],
          airline_name: "<img onerror=alert(1)>",
        },
      ],
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
  });

  it("HTML válido DOCTYPE", () => {
    const html = buildWinbackEmailHtml(BASE_INPUT);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("sin deals → mensaje crear alerta", () => {
    const html = buildWinbackEmailHtml({ ...BASE_INPUT, topDeals: [] });
    expect(html).toContain("Crea una alerta");
  });
});
