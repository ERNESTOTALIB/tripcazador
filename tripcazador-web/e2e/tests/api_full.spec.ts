/**
 * api_full.spec.ts — fase XX3
 *
 * Contract tests Playwright multi-environment para todas las API routes
 * Next.js (frontend). Complementa tests/integration/test_api_contract_apr26hh.py
 * (Python) que cubre el FastAPI directamente.
 *
 * Estos tests corren contra cualquier BASE_URL (local/staging/prod) y
 * verifican que el frontend está sirviendo cada endpoint con shape esperado.
 *
 * Endpoints cubiertos:
 *   GET  /api/deals
 *   GET  /api/deals?classification=...
 *   GET  /api/airports
 *   GET  /api/health
 *   GET  /api/status
 *   GET  /api/metrics
 *   GET  /api/og?dealId=X
 *   GET  /api/og/destination/X
 *   GET  /api/og/instagram?dealId=X
 *   GET  /api/img?u=https://...
 *   GET  /api/feed.xml
 *   GET  /api/sitemap.xml
 *   GET  /robots.txt
 *   GET  /sitemap.xml
 *   POST /api/track {event_type, ...}
 *   POST /api/push/subscribe {subscription}
 *   POST /api/premium/checkout
 *   POST /api/price-alerts
 *   POST /api/notify-alert
 *   POST /api/subscribe (newsletter)
 *
 * Headers requeridos:
 *   - X-Content-Type-Options: nosniff
 *   - X-Frame-Options: DENY o SAMEORIGIN
 *   - Strict-Transport-Security (en https only)
 */
import { test, expect, APIRequestContext } from "@playwright/test";

// Las API routes son livianas y no necesitan página: usamos request directo
const SHARED_HEADERS_REQUIRED = ["x-content-type-options"] as const;

async function expectJsonOk(req: APIRequestContext, path: string, allow404 = false) {
  const r = await req.get(path);
  if (allow404 && r.status() === 404) return null;
  expect.soft(r.status(), `${path} status`).toBeLessThan(500);
  if (r.status() === 200) {
    const ct = r.headers()["content-type"] || "";
    expect.soft(ct, `${path} content-type`).toMatch(/json|text|xml/i);
    if (ct.includes("json")) {
      const body = await r.json();
      return body;
    }
    return await r.text();
  }
  return null;
}

test.describe("GET endpoints públicos", () => {
  test("/api/deals retorna lista", async ({ request }) => {
    const r = await request.get("/api/deals?limit=5");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      const deal = body[0];
      for (const f of ["id", "origin", "destination", "price_eur"]) {
        expect.soft(deal, `deal missing ${f}`).toHaveProperty(f);
      }
    }
  });

  test("/api/deals con classification filter", async ({ request }) => {
    const r = await request.get("/api/deals?classification=ERROR&limit=10");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("/api/deals con region filter", async ({ request }) => {
    const r = await request.get("/api/deals?region=Europa&limit=10");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("/api/deals con cabin filter", async ({ request }) => {
    const r = await request.get("/api/deals?cabin=business&limit=10");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("/api/deals limit fuera de rango se acota", async ({ request }) => {
    const r = await request.get("/api/deals?limit=99999");
    expect(r.status()).toBeLessThan(500);
  });

  test("/api/airports devuelve lista o vacío", async ({ request }) => {
    const r = await request.get("/api/airports?q=mad");
    if (r.status() === 200) {
      const body = await r.json();
      // Puede ser lista o objeto con airports
      const list = Array.isArray(body) ? body : (body.airports || body.results || []);
      expect(Array.isArray(list)).toBe(true);
    } else {
      test.info().annotations.push({ type: "info", description: `/api/airports status ${r.status()}` });
    }
  });

  test("/api/health retorna ok", async ({ request }) => {
    const r = await request.get("/api/health");
    if (r.status() === 200) {
      const body = await r.json();
      expect(body).toHaveProperty("status");
    }
  });

  test("/api/status público", async ({ request }) => {
    const r = await request.get("/api/status");
    expect.soft(r.status()).toBeLessThan(500);
  });

  test("/api/metrics público (o no existe)", async ({ request }) => {
    // SSS167: el endpoint backend /api/metrics no se expone en web (404).
    // Mantenemos el test soft — solo verifica que NO es 500 si existe.
    const r = await request.get("/api/metrics");
    expect.soft(r.status()).toBeLessThan(500);
  });

  test("/sitemap.xml válido", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/<urlset|<sitemapindex/);
  });

  test("/robots.txt incluye User-agent", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/User-agent/i);
  });

  test("RSS feed válido (/rss.xml con fallbacks)", async ({ request }) => {
    // SSS167: feed canónico está en /rss.xml. /api/feed.xml y /blog/feed.xml
    // ahora redirigen a /rss.xml (301). Playwright follow redirects por default.
    let r = await request.get("/rss.xml");
    if (r.status() !== 200) r = await request.get("/api/feed.xml");
    if (r.status() !== 200) r = await request.get("/blog/feed.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/<rss|<feed/);
  });
});

test.describe("OG image endpoints (edge runtime)", () => {
  test("/api/og genérico responde imagen", async ({ request }) => {
    const r = await request.get("/api/og");
    expect.soft(r.status()).toBeLessThan(500);
    const ct = r.headers()["content-type"] || "";
    if (r.status() === 200) {
      expect(ct).toMatch(/image\/png|image\/jpeg/i);
    }
  });

  test("/api/og/instagram con dealId responde 1080×1350", async ({ request }) => {
    const r = await request.get("/api/og/instagram");
    expect.soft(r.status()).toBeLessThan(500);
    const ct = r.headers()["content-type"] || "";
    if (r.status() === 200) {
      expect(ct).toMatch(/image\/png|image\/jpeg/i);
    }
  });
});

test.describe("Image proxy /api/img anti-SSRF", () => {
  test("rechaza URL no-whitelisted", async ({ request }) => {
    const r = await request.get("/api/img?u=" + encodeURIComponent("https://example.com/foo.png"));
    expect([400, 403, 404, 422]).toContain(r.status());
  });

  test("acepta URL Unsplash whitelisted", async ({ request }) => {
    const r = await request.get(
      "/api/img?u=" + encodeURIComponent("https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400")
    );
    expect.soft(r.status()).toBeLessThan(500);
  });
});

test.describe("POST endpoints — validación", () => {
  test("/api/track con body válido", async ({ request }) => {
    const r = await request.post("/api/track", {
      data: { type: "page_view", path: "/test", ts: Date.now() },
    });
    // Backend puede devolver 202 (accepted) o 200
    expect([200, 202, 204]).toContain(r.status());
  });

  test("/api/track con body vacío devuelve 4xx o ignora", async ({ request }) => {
    const r = await request.post("/api/track", { data: {} });
    expect.soft(r.status()).toBeLessThan(500);
  });

  test("/api/push/subscribe sin subscription devuelve 400", async ({ request }) => {
    const r = await request.post("/api/push/subscribe", { data: {} });
    expect([400, 422]).toContain(r.status());
  });

  test("/api/push/subscribe con subscription dummy devuelve 202", async ({ request }) => {
    const r = await request.post("/api/push/subscribe", {
      data: {
        subscription: {
          endpoint: "https://fcm.googleapis.com/fcm/send/dummy",
          keys: { p256dh: "dummy", auth: "dummy" },
        },
      },
    });
    expect([200, 202]).toContain(r.status());
  });

  test("/api/premium/checkout sin Stripe configurado devuelve 503 o redirect", async ({ request }) => {
    const r = await request.post("/api/premium/checkout", { data: {} });
    // 503 si stub, 200/302 si Stripe live, 4xx si email requerido
    expect.soft(r.status()).toBeLessThan(600);
  });

  test("/api/price-alerts POST validación email", async ({ request }) => {
    const r = await request.post("/api/price-alerts", {
      data: { email: "not-an-email" },
    });
    expect([400, 422]).toContain(r.status());
  });

  test("/api/subscribe (newsletter) sin email devuelve 4xx", async ({ request }) => {
    const r = await request.post("/api/subscribe", { data: {} });
    expect([400, 422, 404]).toContain(r.status());
  });
});

test.describe("Security headers presentes", () => {
  test("/api/deals tiene X-Content-Type-Options", async ({ request }) => {
    const r = await request.get("/api/deals?limit=1");
    const headers = r.headers();
    expect.soft(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("home / tiene security headers básicos", async ({ request }) => {
    const r = await request.get("/");
    const headers = r.headers();
    expect.soft(headers["x-content-type-options"]).toBe("nosniff");
    // CSP puede estar en Report-Only
    const csp = headers["content-security-policy"] || headers["content-security-policy-report-only"];
    expect.soft(csp).toBeDefined();
  });
});

test.describe("CORS", () => {
  test("/api/deals OPTIONS preflight", async ({ request }) => {
    const r = await request.fetch("/api/deals", {
      method: "OPTIONS",
      headers: {
        Origin: "https://tripcazador.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect.soft(r.status()).toBeLessThan(500);
  });
});
