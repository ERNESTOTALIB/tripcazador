import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "30 trucos avanzados de cazadores de vuelos baratos (PDF gratis)",
  description:
    "Descarga gratis nuestra guía PDF con 30 trucos avanzados que solo conocen los cazadores experimentados. Stopover gratis, codeshare arbitrage, alianzas y más.",
  alternates: { canonical: "/lead-magnet/30-trucos-avanzados" },
  openGraph: {
    type: "website",
    title: "30 trucos avanzados — TripCazador",
    description: "Guía PDF gratis con técnicas avanzadas de cazadores.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

const TRICKS_PREVIEW = [
  { title: "Stopover gratis con Turkish/Singapore/Icelandair", category: "Optimización" },
  { title: "Booking en moneda débil (HUF, ARS) para arbitraje", category: "Pricing" },
  { title: "Búsqueda invertida en metabuscadores", category: "Discovery" },
  { title: "Combo Avios + Iberia Plus en redenciones", category: "Miles" },
  { title: "Detección de error fares vía monitoring de fare buckets", category: "Tools" },
  { title: "Throwaway ticketing: cuándo es seguro y cuándo no", category: "Avanzado" },
  { title: "Hidden city ticketing detallado por carrier", category: "Avanzado" },
  { title: "VPN + IP + cookies: qué funciona en 2026", category: "Pricing" },
  { title: "Multi-city queries que la mayoría no conoce", category: "Discovery" },
  { title: "Open jaw + stopover combinados", category: "Optimización" },
];

const FAQS_LM = [
  {
    q: "¿Qué nivel de cazador tengo que ser?",
    a: "Intermedio-avanzado. Si ya has cazado 1-2 error fares y conoces términos como 'fare bucket' o 'codeshare', este PDF amplía tus técnicas. Para principiantes, recomendamos primero leer el blog y el glosario.",
  },
  {
    q: "¿Es realmente gratis? ¿Cuál es el truco?",
    a: "Sí, es 100% gratuito. Pedimos tu email para enviarte el PDF + newsletter semanal con error fares destacados. Cancelas en cualquier momento con un click. Sin venta de datos a terceros, RGPD-compliant.",
  },
  {
    q: "¿Cuándo recibiré el PDF?",
    a: "Inmediatamente tras confirmar tu email. Llega un email con el link de descarga directo. PDF de 28 páginas, ~4 MB.",
  },
  {
    q: "¿Está actualizado para 2026?",
    a: "Sí. Edición revisada en abril 2026 con datos del último año, casos reales, y técnicas verificadas en plataformas actuales (Google Flights, Skyscanner, Kiwi.com).",
  },
];

export default function LeadMagnet30TricksPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "30 trucos avanzados de cazadores de vuelos baratos",
      description:
        "Guía PDF gratuita con 30 técnicas avanzadas para cazar vuelos a precios anómalos.",
      author: { "@type": "Organization", name: "TripCazador team" },
      publisher: { "@type": "Organization", name: "TripCazador" },
      datePublished: "2026-04-27",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS_LM.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Lead magnets", item: "https://tripcazador.com/lead-magnet" },
        {
          "@type": "ListItem",
          position: 3,
          name: "30 trucos avanzados",
          item: "https://tripcazador.com/lead-magnet/30-trucos-avanzados",
        },
      ],
    },
  ];

  return (
    <article className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-wider text-amber-400 font-semibold">
          Lead magnet · PDF gratis · 28 páginas
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          30 trucos avanzados de cazadores de vuelos baratos
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Técnicas que la mayoría de blogs de viaje NO cuentan: stopover gratis, arbitraje de moneda, hidden city ticketing y 27 más.
        </p>
      </header>

      <section className="bg-gradient-to-br from-amber-500/15 to-transparent rounded-2xl p-8 border border-amber-500/30 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Descarga el PDF gratis</h2>
        <p className="text-sm text-gray-300 max-w-md mx-auto">
          Recibe el PDF en tu email + newsletter semanal con error fares destacados. Sin spam. Cancelas con 1 click.
        </p>
        <form
          action="/api/subscribe"
          method="POST"
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="tu@email.com"
            className="flex-1 bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
          <input type="hidden" name="source" value="lead-magnet-30-tricks" />
          <input type="hidden" name="consent" value="true" />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            Descargar PDF →
          </button>
        </form>
        <p className="text-xs text-gray-500">
          Al introducir tu email aceptas nuestra <a href="/legal" className="text-amber-400 hover:text-amber-300">política RGPD</a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Vista previa: 10 de los 30 trucos</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TRICKS_PREVIEW.map((t, i) => (
            <li key={i} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
              <span className="font-mono text-amber-400 text-sm mt-0.5">#{i + 1}</span>
              <div>
                <p className="text-sm text-white font-medium">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.category}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-400 text-center pt-2">
          ...y 20 trucos más en el PDF completo.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Lo que vas a aprender</h2>
        <ul className="space-y-3">
          {[
            { label: "Optimización", desc: "Cómo combinar stopovers, open-jaw y multi-city para reducir 30-50% del coste total." },
            { label: "Pricing arbitrage", desc: "Cuándo cambiar de moneda al bookear ahorra 10-30% sin riesgo." },
            { label: "Miles avanzado", desc: "Combos de redenciones entre Avios, Aeroplan, Flying Blue para sweet spots invisibles." },
            { label: "Avanzado (cuidado)", desc: "Hidden city + throwaway ticketing: pros, contras y cuándo NO hacerlos." },
            { label: "Tools profesionales", desc: "Setup de alertas multi-canal + ITA Matrix + AwardLogic para nivel pro." },
          ].map((cat, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-amber-400 shrink-0">·</span>
              <div>
                <p className="text-white font-medium">{cat.label}</p>
                <p className="text-sm text-gray-400">{cat.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQS_LM.map((f, i) => (
            <details key={i} className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 group">
              <summary className="font-semibold text-white cursor-pointer flex justify-between items-center">
                {f.q}
                <span className="text-amber-400 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="text-gray-300 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="text-center bg-gray-900/40 border border-gray-800 rounded-2xl p-8 space-y-3">
        <p className="text-sm text-gray-400">¿También quieres alertas en tiempo real?</p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar bot Telegram
        </a>
        <p className="text-xs text-gray-500 pt-2">
          O descarga primero el <a href="/lead-magnet" className="text-amber-400 hover:text-amber-300">otro lead magnet: "50 hubs error-fare"</a>.
        </p>
      </section>
    </article>
  );
}
