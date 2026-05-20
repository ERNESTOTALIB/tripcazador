/**
 * /api-docs — SSS363 (21 may 2026)
 *
 * Public API documentation + pricing page para que desarrolladores y
 * blogs/agencias puedan ver cómo integrar TripCazador Deals API en su producto.
 *
 * Plan tiers:
 *   - Free 100 req/día (auto-issued)
 *   - Starter €99/mo · 1000 req/día
 *   - Pro €299/mo · 10k req/día
 *   - Enterprise €999/mo · 100k req/día + webhook push
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TripCazador API · feed de chollos de vuelos para tu plataforma",
  description:
    "Integra el feed de error fares + chollos de vuelos verificados de TripCazador en tu producto. REST API JSON, free tier 100 req/día, plans desde €99/mes.",
  alternates: { canonical: "/api-docs" },
  openGraph: {
    title: "TripCazador API · feed de chollos",
    description: "REST API JSON con error fares verificados. Free tier + planes.",
    type: "article",
  },
};

const TIERS = [
  {
    name: "Free",
    price: "0€",
    period: "/mes",
    description: "Para probar la API o blog personal",
    features: [
      "100 requests / día",
      "Deals últimas 24h",
      "Sin filtros avanzados",
      "Attribution requerida en UI",
    ],
    cta: "Empezar gratis",
    ctaHref: "mailto:partners@tripcazador.com?subject=Free%20API%20key%20request",
  },
  {
    name: "Starter",
    price: "99€",
    period: "/mes",
    description: "Para blogs travel medios + agencias pequeñas",
    features: [
      "1.000 requests / día",
      "Deals últimos 7 días",
      "Filtros origin/destination/region",
      "Soporte email 48h",
      "SLA 99% uptime",
    ],
    cta: "Empezar Starter",
    ctaHref: "mailto:partners@tripcazador.com?subject=Starter%20API%20%E2%80%94%2099%E2%82%AC%2Fmo",
  },
  {
    name: "Pro",
    price: "299€",
    period: "/mes",
    description: "Para metabuscadores y agencias media-grandes",
    features: [
      "10.000 requests / día",
      "Deals últimos 30 días",
      "Filtros completos + sorting",
      "Webhooks push real-time",
      "Soporte email 24h",
      "SLA 99.5% uptime",
      "Custom rate limit",
    ],
    cta: "Empezar Pro",
    ctaHref: "mailto:partners@tripcazador.com?subject=Pro%20API%20%E2%80%94%20299%E2%82%AC%2Fmo",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "999€",
    period: "/mes",
    description: "Para OTAs, aerolíneas, ERPs corporativos",
    features: [
      "100.000+ requests / día",
      "Full data history",
      "Dedicated webhook channel",
      "Slack channel dedicado",
      "SLA 99.9% uptime + uptime credits",
      "Custom integraciones",
      "Account manager",
    ],
    cta: "Hablar con ventas",
    ctaHref: "mailto:partners@tripcazador.com?subject=Enterprise%20API%20%E2%80%94%20Custom",
  },
];

const FAQ = [
  {
    q: "¿Qué formato de respuesta usa la API?",
    a: "REST + JSON. Auth vía Bearer token (formato TC-XXXX-XXXX). Endpoint base: https://tripcazador.com/api/v1/deals. Documentación OpenAPI en https://tripcazador.com/api/v1/openapi.json (próximamente).",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí. Sin permanencia. Cancela desde Stripe billing portal o respondiendo a tu email de facturación. Acceso continúa hasta fin de periodo facturado.",
  },
  {
    q: "¿Hay límite por second además de daily?",
    a: "Rate limit secundario: 10 req/s en Free, 100 req/s en Starter, 500 req/s en Pro, 2k req/s en Enterprise. Bursts cortos aceptados (1.5×).",
  },
  {
    q: "¿Cómo recibo updates de nuevos deals en tiempo real?",
    a: "Plan Pro+: te damos un webhook URL que enviamos POST cada vez que detectamos un error fare nuevo. Signed con HMAC, payload similar al endpoint GET.",
  },
  {
    q: "¿Puedo cachear los deals en mi backend?",
    a: "Sí, hasta 5 min de cache (TTL recomendado). Más tiempo y los precios pueden estar desactualizados — Cache-Control header te lo recuerda.",
  },
  {
    q: "¿Hay SDK o librería oficial?",
    a: "Aún no — la API es lo suficientemente simple para integrar con fetch/curl. Si necesitas SDK Python/Node/PHP avísanos y priorizamos.",
  },
];

const CODE_EXAMPLE = `# Request
curl -H "Authorization: Bearer TC-XXXX-XXXX" \\
     "https://tripcazador.com/api/v1/deals?origin=MAD&limit=20"

# Response
{
  "deals": [
    {
      "id": "deal_abc123",
      "type": "flight",
      "origin": "MAD",
      "destination": "TYO",
      "city_to": "Tokio",
      "price_eur": 469,
      "savings_pct": 60,
      "airline": "Korean Air",
      "date_out": "2026-09-15",
      "date_ret": "2026-09-29",
      "booking_url": "https://skyscanner.es/...",
      "hot_until": "2026-09-13T10:00:00Z"
    }
  ],
  "count": 20,
  "generated_at": "2026-05-21T14:32:00Z",
  "attribution": "Data by TripCazador.com"
}`;

export default function ApiDocsPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4 max-w-3xl mx-auto text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          Developer API
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          API de chollos de vuelo
        </h1>
        <p className="text-lg text-gray-300">
          Integra el feed de error fares + chollos verificados de TripCazador en tu
          producto. REST · JSON · auth Bearer · free tier disponible.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Quick start</h2>
        <pre className="rounded-2xl border border-gray-800 bg-gray-900 p-5 overflow-x-auto text-sm text-gray-300 font-mono">
          {CODE_EXAMPLE}
        </pre>
        <p className="text-sm text-gray-400 mt-3">
          Para conseguir tu API key gratis, envía email a{" "}
          <a href="mailto:partners@tripcazador.com" className="text-amber-400 hover:underline">
            partners@tripcazador.com
          </a>{" "}
          con asunto &ldquo;Free API key request&rdquo; y te respondemos en 24h.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-6 ${
                tier.highlighted
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-gray-800 bg-gray-900"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-amber-500 text-black text-xs font-bold uppercase">
                  Más vendido
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{tier.description}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-amber-300">{tier.price}</span>
                <span className="text-xs text-gray-500">{tier.period}</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {tier.features.map((f, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                    <span className="text-amber-400 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={tier.ctaHref}
                className={`mt-5 block text-center px-3 py-2 rounded-lg font-semibold text-xs ${
                  tier.highlighted
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
                }`}
              >
                {tier.cta} →
              </a>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Endpoints disponibles</h2>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/80 text-gray-400 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Método</th>
                <th className="px-4 py-3 text-left">Endpoint</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Tier mín</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-800">
                <td className="px-4 py-3 font-mono text-emerald-300">GET</td>
                <td className="px-4 py-3 font-mono text-amber-200">/api/v1/deals</td>
                <td className="px-4 py-3 text-gray-300">Feed de chollos con filtros</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">Free</span></td>
              </tr>
              <tr className="border-t border-gray-800">
                <td className="px-4 py-3 font-mono text-emerald-300">GET</td>
                <td className="px-4 py-3 font-mono text-amber-200">/api/v1/deals/{`{id}`}</td>
                <td className="px-4 py-3 text-gray-300">Detalle de deal específico</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">Free</span></td>
              </tr>
              <tr className="border-t border-gray-800">
                <td className="px-4 py-3 font-mono text-emerald-300">GET</td>
                <td className="px-4 py-3 font-mono text-amber-200">/api/v1/regions</td>
                <td className="px-4 py-3 text-gray-300">Estadísticas por región</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">Starter</span></td>
              </tr>
              <tr className="border-t border-gray-800">
                <td className="px-4 py-3 font-mono text-fuchsia-300">POST</td>
                <td className="px-4 py-3 font-mono text-amber-200">/api/v1/webhooks/register</td>
                <td className="px-4 py-3 text-gray-300">Suscribir webhook push deals</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">Pro</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white text-sm">
                {f.q}
              </summary>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">¿Listo para empezar?</h2>
        <p className="text-sm text-gray-300 mb-4">
          Envíanos email y te enviamos tu API key en 24h laborables. Free tier sin
          tarjeta. Plans paid via Stripe Checkout estándar.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:partners@tripcazador.com?subject=API%20access%20%E2%80%94%20TripCazador"
            className="inline-block px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
          >
            📧 Pedir API key
          </a>
          <Link
            href="/sponsor"
            className="inline-block px-5 py-3 rounded-lg border border-gray-700 hover:border-amber-500/40 text-white font-semibold text-sm"
          >
            🎯 Sponsorship opportunities
          </Link>
        </div>
      </section>
    </div>
  );
}
