import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Lead magnets gratuitos: PDFs descargables sobre vuelos baratos",
  description:
    "Descarga gratis nuestras guías PDF: 50 hubs error-fare + 30 trucos avanzados. Para cazadores de vuelos baratos serios.",
  alternates: { canonical: "/lead-magnet" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const MAGNETS = [
  {
    slug: "50-hubs-error-fare",
    title: "50 hubs con más error fares",
    description:
      "Listado de los 50 aeropuertos donde más error fares se han observado en los últimos 24 meses. Por categoría: low-cost, full-service, premium.",
    pages: 32,
    level: "Principiante-intermedio",
  },
  {
    slug: "30-trucos-avanzados",
    title: "30 trucos avanzados de cazadores",
    description:
      "Técnicas avanzadas: stopover gratis, codeshare arbitrage, hidden city ticketing, sweet spots de millas, monitoring de fare buckets.",
    pages: 28,
    level: "Intermedio-avanzado",
  },
];

export default function LeadMagnetIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Lead magnets TripCazador",
    numberOfItems: MAGNETS.length,
    itemListElement: MAGNETS.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/lead-magnet/${m.slug}`,
      name: m.title,
    })),
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Lead magnets</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">PDFs gratuitos</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Guías descargables con técnicas y datos del motor TripCazador. Email + newsletter semanal a cambio. Sin spam.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4">
        {MAGNETS.map((m) => (
          <li
            key={m.slug}
            className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl transition-colors"
          >
            <a href={`/lead-magnet/${m.slug}`} className="block p-6 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-white">{m.title}</h2>
                <span className="text-xs bg-gray-800 text-amber-300 px-2 py-1 rounded-full whitespace-nowrap">
                  {m.pages} págs
                </span>
              </div>
              <p className="text-sm text-gray-400">{m.description}</p>
              <p className="text-xs text-gray-500">
                Nivel: <span className="text-amber-400">{m.level}</span>
              </p>
            </a>
          </li>
        ))}
      </ul>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">¿Quieres alertas en tiempo real?</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Los PDFs son referencias — el bot Telegram avisa cuando los error fares aparecen realmente.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar bot Telegram
        </a>
      </section>
    </div>
  );
}
