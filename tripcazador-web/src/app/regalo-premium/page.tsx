/**
 * /regalo-premium — SSS487 (24 may 2026)
 *
 * Landing dedicada para Premium Gift €9.99 (one-off, 1 mes Premium
 * activado en cuenta destinatario). Diferente de /regalo (gift cards
 * generales €25-200 para vuelos+hoteles).
 *
 * Revenue path: Stripe Checkout via /api/premium/checkout?cycle=gift
 * activa con email_recipient. Backend usa STRIPE_PRICE_PREMIUM_GIFT.
 *
 * Captura intent "regalar Premium TripCazador" o "Premium mes gratis".
 * AEO via FAQ schema.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { PremiumGiftClient } from "@/components/PremiumGiftClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Regala Premium 1 mes — €9.99 | TripCazador",
  description:
    "Regala Premium TripCazador a un amigo: alertas ilimitadas, error fares, filtros avanzados y secret deals 24h. €9.99 una vez (no se renueva).",
  alternates: { canonical: `${SITE_URL}/regalo-premium` },
  openGraph: {
    title: "Regala Premium TripCazador — €9.99",
    description: "El regalo ideal para viajeros: 1 mes Premium sin compromiso.",
    url: `${SITE_URL}/regalo-premium`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const FEATURES = [
  { emoji: "🔔", title: "Alertas ilimitadas", desc: "Sin tope de rutas vigiladas (free = 3 max)" },
  { emoji: "⚡", title: "Error fares VIP", desc: "Notificación instant antes que canal público" },
  { emoji: "🎯", title: "Filtros avanzados", desc: "Por aerolínea, escalas, horario, cabina" },
  { emoji: "🔮", title: "Predictor precio", desc: "Modelo ML predice si subirá/bajará" },
  { emoji: "🤫", title: "Secret deals 24h", desc: "Ofertas exclusivas no públicas" },
  { emoji: "📊", title: "ROI dashboard", desc: "Cuánto has ahorrado en total" },
];

const FAQ = [
  {
    q: "¿Se renueva automáticamente?",
    a: "No. El regalo Premium es un pago único de €9.99 que activa 1 mes Premium en la cuenta del destinatario. No se vuelve a cobrar y no requiere tarjeta del receptor.",
  },
  {
    q: "¿Cómo recibe el regalo?",
    a: "Tras tu pago, el destinatario recibe un email con un magic link para activar Premium en su cuenta TripCazador (o crear cuenta si no tiene). Activación instantánea.",
  },
  {
    q: "¿Y si ya tiene Premium activo?",
    a: "El regalo extiende su Premium 30 días extra al final de su periodo actual. Nadie pierde nada.",
  },
  {
    q: "¿Puedo añadir un mensaje personalizado?",
    a: "Sí. En el checkout puedes incluir un mensaje breve (max 200 chars) que aparece en el email del destinatario.",
  },
  {
    q: "¿Diferencia con las gift cards de /regalo?",
    a: "Aquí regalas 1 mes Premium TripCazador (€9.99). En /regalo son tarjetas regalo €25-200 aplicables a vuelos, hoteles y experiencias.",
  },
];

export default function RegaloPremiumPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Premium", url: "/premium" },
    { name: "Regalar Premium", url: "/regalo-premium" },
  ]);

  const faqJsonLd = faqPageSchema(FAQ.map((f) => ({ q: f.q, a: f.a })));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "TripCazador Premium Gift — 1 mes",
    description:
      "Regalo Premium TripCazador 30 días. Alertas ilimitadas, error fares, filtros y secret deals.",
    brand: { "@type": "Brand", name: "TripCazador" },
    offers: {
      "@type": "Offer",
      price: 9.99,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/regalo-premium`,
    },
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/premium" className="hover:text-amber-400">Premium</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Regalar</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🎁</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Regala Premium TripCazador
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          El regalo ideal para viajeros. 1 mes Premium activado en la cuenta de
          quien tú elijas. <strong className="text-amber-300">€9.99</strong> una vez.
          Sin renovación, sin compromiso.
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-8 text-center">
        <div className="text-4xl font-bold text-white">€9.99</div>
        <p className="mt-2 text-sm text-slate-300">Pago único — Mes Premium activado al instante</p>
        <PremiumGiftClient />
        <p className="mt-3 text-xs text-slate-500">
          Pago seguro con Stripe. Sin renovación automática.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-bold text-white">Qué incluye Premium</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <article
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
            >
              <summary className="cursor-pointer text-sm font-bold text-white">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link
          href="/premium"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">⭐</div>
          <div className="mt-1 text-sm font-bold text-white">Premium para ti</div>
          <div className="text-xs text-slate-400">€9.99/mes</div>
        </Link>
        <Link
          href="/regalo"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">💳</div>
          <div className="mt-1 text-sm font-bold text-white">Gift cards</div>
          <div className="text-xs text-slate-400">€25-200 vuelos+hoteles</div>
        </Link>
        <Link
          href="/concierge"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🎩</div>
          <div className="mt-1 text-sm font-bold text-white">Concierge</div>
          <div className="text-xs text-slate-400">Búsqueda humana</div>
        </Link>
      </section>
    </main>
  );
}
