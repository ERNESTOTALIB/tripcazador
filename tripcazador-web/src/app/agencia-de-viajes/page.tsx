import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Clock, Shield, Star, Check } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { CONCIERGE_TIER_IDS, CONCIERGE_TIERS } from "@/lib/concierge_tiers";

/**
 * /agencia-de-viajes — fase SSS11 (May 2026)
 *
 * Landing SEO para captar tráfico de "agencia de viajes online" / "agencia
 * de viajes barata" / "agencia online vuelos". Conversiona al servicio
 * Concierge tiered (4 niveles desde €9). El destino real (formulario)
 * está en /concierge — esta página es la entrada SEO.
 *
 * Volumen estimado:
 *   - "agencia de viajes online" — 33.000 búsquedas/mes (España)
 *   - "agencia de viajes barata" — 8.100 búsquedas/mes
 *   - "agencia de viajes online España" — 4.400 búsquedas/mes
 */

export const metadata: Metadata = {
  title: "Agencia de viajes online TripCazador desde €9 — sin cuotas, sin sorpresas",
  description:
    "Agencia de viajes online en 4 niveles (€9 / €19 / €49 / €99). Búsqueda manual experta de vuelos, hoteles y rutas multi-stopover. Sin cuotas mensuales — pagas solo cuando viajas. Garantía de ahorro €100+ o reembolso.",
  alternates: { canonical: "/agencia-de-viajes" },
  openGraph: {
    title: "Agencia de viajes online TripCazador — desde €9",
    description:
      "4 niveles de servicio. Sin cuotas. Pagas solo cuando viajas. Garantía de ahorro o reembolso.",
    url: "/agencia-de-viajes",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export default function AgenciaDeViajesPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Agencia de viajes", item: `${SITE}/agencia-de-viajes` },
    ],
  };

  const travelAgencySchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "TripCazador — Agencia de viajes online",
    url: `${SITE}/agencia-de-viajes`,
    description:
      "Agencia de viajes online española especializada en error fares, codeshare arbitrage y rutas multi-stopover. 4 niveles de servicio desde €9.",
    priceRange: "€9 – €99",
    areaServed: { "@type": "Country", name: "España" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.7", reviewCount: "127" },
    sameAs: [
      "https://t.me/tripcazador",
      "https://x.com/tripcazador",
      "https://www.instagram.com/tripcazador",
    ],
    makesOffer: CONCIERGE_TIER_IDS.map((id) => {
      const t = CONCIERGE_TIERS[id];
      return {
        "@type": "Offer",
        name: `Concierge ${t.name}`,
        description: t.tagline,
        price: t.amount_eur.toFixed(2),
        priceCurrency: "EUR",
        url: `${SITE}/concierge?tier=${t.id}`,
      };
    }),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Sois una agencia de viajes oficial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Operamos como agencia de viajes online sin oficina física. Buscamos manualmente las mejores combinaciones (error fares, codeshares, multi-stopover) y te entregamos los links directos a la aerolínea para que reserves tú. No revendemos vuelos — eso te ahorra los markups de las agencias tradicionales.",
        },
      },
      {
        "@type": "Question",
        name: "¿Hay cuota mensual o suscripción?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Pagas solo cuando contratas un nivel concreto (€9, €19, €49 o €99). El servicio Premium opcional de €2,99/mes da acceso anticipado a deals y alertas, pero no es necesario para usar la agencia.",
        },
      },
      {
        "@type": "Question",
        name: "¿Qué pasa si no encontráis nada barato?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Para los niveles Standard, Premium y Pro tienes garantía: si no ahorramos al menos €100 vs. el mejor precio disponible en Skyscanner/Kayak el día del pedido, te devolvemos el 100% del importe pagado.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cuánto tardáis en entregar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Express: 24h · Standard: 48h · Premium: 72h · Pro: 5 días. Todas las entregas son por email con links directos a la aerolínea (ya sea Lufthansa, Iberia, Vueling, Wizz Air, etc) — tú decides cuándo reservar.",
        },
      },
      {
        "@type": "Question",
        name: "¿Tenéis seguro de viaje y visados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El nivel Premium (€49) y Pro (€99) incluye asesoría sobre visados, seguros y mejores tarjetas de crédito sin comisiones. Recomendamos partners externos (Heymondo para seguros, Holafly para eSIM) — no cobramos por la asesoría, sólo por el tiempo dedicado a buscar.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <JsonLd data={breadcrumb} />
      <JsonLd data={travelAgencySchema} />
      <JsonLd data={faqSchema} />

      <header className="mb-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Agencia de viajes online · sin cuotas · sin oficinas
        </p>
        <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Tu agencia de viajes en 4 niveles
          <span className="block text-amber-600">desde €9</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
          Búsqueda manual experta de vuelos, hoteles y rutas. Sin cuotas mensuales — pagas solo el
          servicio que pides. Entrega en 24h-5 días con links directos a la aerolínea.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
            <Shield className="h-3.5 w-3.5" /> Garantía €100+ ahorro o reembolso
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700 ring-1 ring-amber-200">
            <Star className="h-3.5 w-3.5 fill-current" /> 4.7/5 · 127 opiniones
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 ring-1 ring-sky-200">
            <Clock className="h-3.5 w-3.5" /> Entrega desde 24h
          </span>
        </div>
      </header>

      {/* 4 tier cards rápidas */}
      <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CONCIERGE_TIER_IDS.map((id) => {
          const t = CONCIERGE_TIERS[id];
          return (
            <article
              key={id}
              className={`relative rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                t.popular ? "border-amber-300 ring-2 ring-amber-200" : "border-slate-200"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  Más popular
                </span>
              )}
              <header className="mb-3 text-center">
                <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
                <p className="mt-1 text-3xl font-extrabold text-amber-600">€{t.amount_eur}</p>
                <p className="mt-1 text-xs text-slate-500">{t.delivery_label}</p>
              </header>
              <p className="mb-3 text-center text-xs text-slate-600">{t.tagline}</p>
              <ul className="mb-4 space-y-1.5 text-xs text-slate-700">
                {t.bullets.slice(0, 3).map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/concierge?tier=${t.id}`}
                className="block w-full rounded-lg bg-slate-900 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Pedir {t.name}
              </Link>
            </article>
          );
        })}
      </section>

      {/* Por qué somos distintos */}
      <section className="mb-12 rounded-3xl bg-gradient-to-br from-slate-50 to-amber-50 p-6 sm:p-10">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          ¿Por qué pagar por una agencia online en 2026?
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <Sparkles className="mb-2 h-6 w-6 text-amber-500" />
            <h3 className="mb-1 font-semibold text-slate-900">Error fares de verdad</h3>
            <p className="text-sm text-slate-600">
              Skyscanner y Kayak son agregadores de cache. Nosotros buscamos en tiempo real cuando
              detectamos picos de error fare en Lufthansa, Air France, Iberia o codeshares Asia/USA.
              Ahorros típicos €300-€2.500 vs. precio público.
            </p>
          </div>
          <div>
            <Shield className="mb-2 h-6 w-6 text-emerald-500" />
            <h3 className="mb-1 font-semibold text-slate-900">Garantía de ahorro</h3>
            <p className="text-sm text-slate-600">
              Niveles Standard, Premium y Pro: si no ahorramos al menos €100 vs. Skyscanner/Kayak el
              día del pedido, te devolvemos el 100%. Sin letra pequeña, sin "casos excepcionales".
            </p>
          </div>
          <div>
            <Clock className="mb-2 h-6 w-6 text-sky-500" />
            <h3 className="mb-1 font-semibold text-slate-900">Tú reservas, tú decides</h3>
            <p className="text-sm text-slate-600">
              Te entregamos los links directos a la web de la aerolínea (no Kayak, no agregadores).
              Tú reservas, tú pagas la aerolínea. Sin markups, sin cargos por cancelación
              inventados, sin sorpresas en check-in.
            </p>
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center sm:p-8">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          ¿Listo para empezar?
        </h2>
        <p className="mb-5 text-sm text-slate-600">
          Rellena el formulario en 90 segundos y recibirás un email con tu primera entrega en menos
          de 24-72h según el nivel elegido.
        </p>
        <Link
          href="/concierge"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-amber-600"
        >
          Empezar ahora →
        </Link>
        <p className="mt-3 text-xs text-slate-500">
          Pago seguro vía Stripe · Tarjeta o Apple/Google Pay · IVA incluido
        </p>
      </section>
    </main>
  );
}
