/**
 * /patrocinadores — SUPER-SPONSORS (25 may 2026)
 *
 * Versión self-serve del antiguo /sponsor (mailto-only). Aquí los tiers
 * llevan a un formulario inline que crea una sesión Stripe Checkout
 * vía /api/sponsors/checkout. Si el Stripe price ID no está configurado
 * todavía, el form fallback a mailto.
 *
 * Diferencia clave vs /sponsor:
 *  - Self-serve (sin contacto humano para tiers pequeños)
 *  - Stripe Checkout = pago inmediato
 *  - Sponsor cae en "pending_review" hasta admin lo aprueba
 *  - Activación auto al aprobar (max 24h)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { SPONSOR_TIERS } from "@/lib/sponsors_catalog";
import SponsorApplyClient from "@/components/SponsorApplyClient";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Patrocinios y partnerships self-serve",
  description:
    "Patrocina TripCazador en self-serve. Tiers desde 199 €. Stripe Checkout inmediato, activación 24h post-pago. 25.000+ viajeros hispanohablantes.",
  alternates: { canonical: `${SITE_URL}/patrocinadores` },
  openGraph: {
    title: "Patrocina TripCazador (self-serve)",
    description:
      "25.000+ viajeros hispanohablantes con intent reserva. Tiers self-serve desde 199 €.",
    url: `${SITE_URL}/patrocinadores`,
    type: "article",
  },
};

const METRICS = [
  { value: "25.000+", label: "visitas mensuales" },
  { value: "12.500", label: "newsletter subs" },
  { value: "4:32", label: "tiempo medio sesión" },
  { value: "68%", label: "audiencia 25-45 años" },
  { value: "ES+LATAM", label: "geo dominante" },
  { value: "Self-serve", label: "Stripe Checkout 24h" },
];

const FAQ = [
  {
    q: "¿Cómo funciona el self-serve?",
    a: "Eliges tier, pagas vía Stripe Checkout, y tu sponsor entra en cola de aprobación (max 24h). Una vez aprobado se activa automáticamente. No hace falta firmar contrato.",
  },
  {
    q: "¿Qué tipos de marcas patrocinan?",
    a: "Aerolíneas con rutas EU-ES, OTAs, seguros viaje (Heymondo, AXA), eSIMs (Holafly, Airalo), maletas (Samsonite), apps de viaje, bancos con tarjetas viaje (Revolut, N26). Rechazamos: casinos, dating apps, productos médicos no regulados.",
  },
  {
    q: "¿Hay garantía de impresiones?",
    a: "Sí. Inline tier garantiza 6.000 impresiones/mes (90 días si quedan cortos extendemos sin coste). Newsletter garantiza 12.000 inboxes. Deal of the Week garantiza homepage banner 7 días + 1 push notification Premium.",
  },
  {
    q: "¿Cuándo aparece mi sponsor live?",
    a: "Una vez aprobado (max 24h post-pago), aparece en rotación inmediata. Para Inline: 5 posts a las 24h. Newsletter: en la siguiente edición domingo. Deal Week: cuenta desde aprobación.",
  },
  {
    q: "¿Cómo se mide el ROI?",
    a: "Cada placement va con UTM tracking + nuestro endpoint /api/sponsors/click cuenta clicks server-side. Te enviamos reporte mensual con impresiones, clicks, CTR. Sin venta de datos.",
  },
  {
    q: "¿Puedo cancelar y obtener reembolso?",
    a: "Si no hemos aprobado tu sponsor todavía (status pending_review), reembolso 100%. Si ya está activo, prorrateo proporcional a días restantes. Reembolsos vía mail a partners@tripcazador.com.",
  },
];

export default function PatrocinadoresPage({
  searchParams,
}: {
  searchParams: { status?: string; session_id?: string };
}) {
  const status = searchParams.status;
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Patrocinadores", url: "/patrocinadores" },
  ]);
  const faqLd = faqPageSchema(FAQ);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      {status === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h2 className="font-bold text-emerald-300">✓ Pago recibido</h2>
          <p className="mt-1 text-sm text-slate-300">
            Tu sponsor está en cola de aprobación (max 24h). Recibirás email a{" "}
            <code>{searchParams.session_id?.slice(0, 20)}…</code> con el estado.
            Mientras tanto puedes preparar el creative (logo + tagline 80
            palabras).
          </p>
        </div>
      )}
      {status === "cancel" && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300">
            Checkout cancelado. Puedes volver a intentarlo o contactar{" "}
            <a
              href="mailto:partners@tripcazador.com"
              className="text-amber-400 underline"
            >
              partners@tripcazador.com
            </a>
            .
          </p>
        </div>
      )}

      <header className="text-center max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          Self-serve sponsorships
        </span>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-white leading-tight">
          Patrocina TripCazador en 2 clicks
        </h1>
        <p className="mt-3 text-lg text-gray-300">
          25.000+ viajeros hispanohablantes / mes con intent de reserva.
          Stripe Checkout inmediato. Sin contrato, sin demo, sin "te llamamos".
        </p>
      </header>

      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold text-amber-300">
                {m.value}
              </div>
              <div className="text-xs text-gray-400 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Elige un tier y paga
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SPONSOR_TIERS.map((p) => (
            <div
              key={p.slug}
              className={`relative rounded-2xl border p-6 ${
                p.highlighted
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-gray-800 bg-gray-900"
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-amber-500 text-black text-xs font-bold uppercase">
                  Más popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{p.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{p.description}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-amber-300">
                  {p.priceEur} €
                </span>
                <span className="text-xs text-gray-500">/ {p.period}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {p.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-amber-400">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <SponsorApplyClient />

      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Marcas que ya colaboran con TripCazador
        </h2>
        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🏨 Booking.com</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">✈️ Travelpayouts</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🛡️ Heymondo</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">📡 Holafly</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🗺️ GetYourGuide</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🅿️ Parclick</span>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Estos partners trabajan con TripCazador como afiliados — la inversión
          en sponsorships directos típicamente supera el RPM del programa
          afiliado por 3-5× para campañas de awareness.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Preguntas frecuentes</h2>
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
        <h2 className="text-2xl font-bold text-white mb-2">
          ¿Algo a medida? Hablemos.
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Campañas multi-paquete, exclusividad sectorial, partnership long-term
          (3+ meses) tienen tarifas especiales. Respondemos en 24-48h laborables.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:partners@tripcazador.com?subject=Sponsorship%20enterprise%20%E2%80%94%20TripCazador"
            className="inline-block px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
          >
            📧 partners@tripcazador.com
          </a>
          <Link
            href="/prensa"
            className="inline-block px-5 py-3 rounded-lg border border-gray-700 hover:border-amber-500/40 text-white font-semibold text-sm"
          >
            📰 Press kit + media
          </Link>
        </div>
      </section>
    </main>
  );
}
