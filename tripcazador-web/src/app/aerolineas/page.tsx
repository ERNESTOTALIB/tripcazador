import type { Metadata } from "next";
import { AIRLINES } from "@/lib/airlines";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Aerolíneas — Análisis y rangos de precio reales 2026",
  description:
    "Análisis profundo de las 10 principales aerolíneas que vuelan desde España: rangos de precio reales, error fares observados, hubs y rutas. Datos del motor 24/7.",
  alternates: { canonical: "/aerolineas" },
  openGraph: {
    type: "website",
    title: "Análisis de aerolíneas con datos reales — TripCazador",
    description:
      "Las 10 aerolíneas más relevantes desde España, con rangos de precio reales y error fares observados.",
  },
};

export const revalidate = 86400;

const CATEGORY_LABELS: Record<string, string> = {
  "low-cost": "Low-cost",
  "full-service": "Full-service",
  luxury: "Luxury",
  regional: "Regional",
};

const CATEGORY_ORDER = ["full-service", "low-cost", "luxury", "regional"];

export default function AerolineasIndexPage() {
  // Group by category for visual hierarchy
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: AIRLINES.filter((a) => a.category === cat),
  })).filter((g) => g.items.length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Aerolíneas analizadas por TripCazador",
    description: "Listado de aerolíneas con análisis y rangos de precio reales.",
    numberOfItems: AIRLINES.length,
    itemListElement: AIRLINES.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/aerolineas/${a.code.toLowerCase()}`,
      name: a.name,
    })),
  };

  return (
    <div className="space-y-10">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Aerolíneas</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Análisis de aerolíneas con datos reales</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          {AIRLINES.length} aerolíneas analizadas con rangos de precio observados por nuestro motor 24/7. Cada perfil incluye hubs, rutas típicas desde España, error fares confirmados y la jugada para cazadores.
        </p>
      </header>

      {grouped.map((group) => (
        <section key={group.category} className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">
            {CATEGORY_LABELS[group.category] || group.category}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.items.map((a) => (
              <li
                key={a.code}
                className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl transition-colors"
              >
                <a
                  href={`/aerolineas/${a.code.toLowerCase()}`}
                  className="block p-5 space-y-2"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-amber-400 text-sm">{a.code}</span>
                    <h3 className="text-lg font-bold text-white">{a.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500">{a.country} · Hubs: {a.hubs.slice(0, 3).join(", ")}</p>
                  <p className="text-sm text-gray-400 line-clamp-2">{a.keyPoints[0]}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">¿Quieres que te avisemos del próximo error fare?</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Nuestro bot Telegram avisa en segundos cuando aparece un glitch en estas aerolíneas. Gratis.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar alertas Telegram
        </a>
      </section>
    </div>
  );
}
