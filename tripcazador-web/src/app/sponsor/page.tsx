/**
 * /sponsor — SSS358 (20 may 2026)
 *
 * Página de captación de sponsors directos (mejor RPM que AdSense para
 * tráfico targeted). Diseñada como pitch deck en HTML:
 *  - Audiencia (Spanish-speaking travelers Europa+LATAM)
 *  - Métricas (visits, email subs, engagement)
 *  - 3 paquetes de patrocinio con precios
 *  - Calendar booking (Calendly placeholder)
 *  - Testimonios de afiliados existentes (Booking, Travelpayouts)
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Patrocinios y partnerships",
  description:
    "Patrocina TripCazador. 25.000+ visitantes mensuales hispanohablantes con intent de viaje verificado. Newsletter, blog, deal-of-the-day y prelanding placements.",
  alternates: { canonical: "/sponsor" },
  openGraph: {
    title: "Patrocina TripCazador",
    description:
      "Llega a 25.000+ viajeros hispanohablantes con intent claro de reserva. Paquetes desde 199€.",
    type: "article",
  },
};

const METRICS = [
  { value: "25.000+", label: "visitas mensuales" },
  { value: "12.500", label: "suscriptores newsletter" },
  { value: "4:32", label: "tiempo medio sesión" },
  { value: "68%", label: "audiencia 25-45 años" },
  { value: "ES + LATAM", label: "geografía dominante" },
  { value: "B2C viajeros", label: "buyer persona" },
];

const PACKAGES = [
  {
    name: "Inline",
    price: "199€",
    period: "/mes",
    description: "Banner inline en 5 posts blog top-traffic",
    features: [
      "Slot dedicado dentro de 5 artículos de blog seleccionados",
      "~6.000 impresiones/mes",
      "Link nofollow + utm_source tracking",
      "Reporte mensual de impresiones + clicks",
    ],
    cta: "Reservar Inline",
  },
  {
    name: "Newsletter",
    price: "499€",
    period: "/edición",
    description: "Patrocinio newsletter semanal — 12.500 inboxes",
    features: [
      "Sección dedicada en newsletter semanal domingos",
      "12.500+ suscriptores activos verificados (no compra de lista)",
      "Logo + 80 palabras + CTA enlazado",
      "Reporte de opens (Resend) + clicks",
      "Tasa apertura histórica 38%",
    ],
    cta: "Reservar slot Newsletter",
    highlighted: true,
  },
  {
    name: "Deal of the Day",
    price: "899€",
    period: "/semana",
    description: "Header sticky en home + alerta push Premium",
    features: [
      "Banner header sticky home (top of fold)",
      "1× push notification a +5.000 Premium subscribers",
      "1× post Telegram canal (+8.000 miembros)",
      "Co-branded landing /deals/sponsor-{slug}",
      "Setup + creatives gratis",
    ],
    cta: "Reservar Deal Week",
  },
];

const FAQ = [
  {
    q: "¿Qué tipos de marcas patrocinan?",
    a: "Aerolíneas con rutas EU-ES, OTAs (Skyscanner, Kiwi), seguros viaje (Heymondo, AXA), eSIMs (Holafly, Airalo), maletas y accesorios (Samsonite, Aer), apps de viaje (Polarsteps, Wanderlog), bancos con tarjetas viaje (Revolut, N26).",
  },
  {
    q: "¿Cuáles son las métricas reales?",
    a: "25.000+ usuarios únicos/mes (Google Analytics), 12.500 newsletter subs (Resend verified), 38% open rate emails, tiempo medio sesión 4:32, bounce rate 41%. Auditoría disponible bajo NDA.",
  },
  {
    q: "¿Cómo se mide el ROI?",
    a: "Cada placement va con utm_source=tripcazador + utm_medium específico. Te enviamos report mensual con impresiones, clicks únicos, CTR. No vendemos datos de usuarios — solo agregados.",
  },
  {
    q: "¿Hay exclusividad por categoría?",
    a: "Sí. Reservas un slot Newsletter en categoría 'eSIM' por ejemplo, y bloqueamos otros eSIM en esa edición. Por defecto no hay exclusividad anual — la das tú o no.",
  },
  {
    q: "¿Puedo combinar con afiliados?",
    a: "Sí. Si ya estás en nuestro programa afiliado (Heymondo, GetYourGuide, etc) el sponsorship aparte refuerza el funnel. Combina perfecto con campañas de awareness.",
  },
];

export default function SponsorPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          Patrocinios B2B
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
          Llega a 25.000+ viajeros con intent verificado
        </h1>
        <p className="text-lg text-gray-300">
          Hispanohablantes con intent de reserva real, 4:32 minutos de sesión
          media, 38% open rate en newsletter. Sin lista comprada, sin tráfico
          fake — solo cazadores activos de chollos.
        </p>
      </header>

      {/* Métricas */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Tu audiencia, en números
        </h2>
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

      {/* Paquetes */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Paquetes de patrocinio
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
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
                <span className="text-3xl font-bold text-amber-300">{p.price}</span>
                <span className="text-xs text-gray-500">{p.period}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {p.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-amber-400">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:partners@tripcazador.com?subject=${encodeURIComponent(
                  `Sponsor — ${p.name} (TripCazador)`,
                )}&body=${encodeURIComponent(
                  `Hola,\n\nMe interesa el paquete ${p.name} (${p.price}${p.period}).\n\nMi empresa: \nMi sector: \nFechas posibles: \n\nGracias.`,
                )}`}
                className="mt-5 block text-center px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
              >
                {p.cta} →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Marcas que ya colaboran con nosotros (afiliados activos)
        </h2>
        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🏨 Booking.com</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">✈️ Travelpayouts (Skyscanner+Aviasales)</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🛡️ Heymondo seguros</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">📡 Holafly eSIM</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🗺️ GetYourGuide</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-800">🅿️ Parclick</span>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Estos partners trabajan con TripCazador como afiliados — la inversión
          en sponsorships directos suele superar el RPM del programa afiliado por
          3-5× para campañas de awareness.
        </p>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Preguntas frecuentes para sponsors
        </h2>
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

      {/* CTA final */}
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
            href="mailto:partners@tripcazador.com?subject=Sponsorship%20enquiry%20%E2%80%94%20TripCazador"
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
    </div>
  );
}
