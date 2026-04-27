import type { Metadata } from "next";
import { MONTHS } from "@/lib/months";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Vuelos baratos por mes 2026: guía completa de cuándo viajar",
  description:
    "Cuándo es más barato volar a cada destino: 12 guías mensuales con destinos top, precios típicos y trucos por mes. Análisis estacional 2026.",
  alternates: { canonical: "/vuelos-baratos-mes" },
};

export const revalidate = 86400;

export default function MonthsIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guías mensuales TripCazador 2026",
    numberOfItems: MONTHS.length,
    itemListElement: MONTHS.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/vuelos-baratos-${m.slug}`,
      name: `Vuelos baratos en ${m.monthEs}`,
    })),
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Vuelos por mes</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Vuelos baratos por mes 2026</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          12 guías mensuales con los mejores destinos, precios típicos y trucos cazador. Encuentra el mes perfecto para tu próximo viaje.
        </p>
      </header>

      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {MONTHS.map((m) => (
          <li
            key={m.slug}
            className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl transition-colors"
          >
            <a href={`/vuelos-baratos-${m.slug}`} className="block p-4 text-center space-y-2">
              <div className="text-3xl">{m.emoji}</div>
              <h2 className="text-lg font-bold text-white">{m.monthEs}</h2>
              <p className="text-xs text-gray-500">{m.topDestinations.length} destinos top</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
