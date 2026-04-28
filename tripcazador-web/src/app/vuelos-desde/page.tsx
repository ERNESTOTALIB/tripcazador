import type { Metadata } from "next";
import { HUBS } from "@/lib/hubs";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Vuelos baratos desde España: 7 hubs analizados (2026)",
  description:
    "Análisis de 7 aeropuertos españoles con datos reales: top destinos europeos y long-haul, aerolíneas operativas, rangos de precio observados.",
  alternates: { canonical: "/vuelos-desde" },
};

export const revalidate = 86400;

const CATEGORY_LABELS: Record<string, string> = {
  "hub-principal": "Hubs principales",
  "hub-secundario": "Hubs secundarios",
  regional: "Regionales",
};

export default function HubsIndexPage() {
  const grouped: Record<string, typeof HUBS> = {};
  for (const h of HUBS) {
    grouped[h.category] = grouped[h.category] || [];
    grouped[h.category].push(h);
  }
  const order = ["hub-principal", "hub-secundario", "regional"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Aeropuertos españoles analizados — TripCazador",
    numberOfItems: HUBS.length,
    itemListElement: HUBS.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/vuelos-desde/${h.code.toLowerCase()}`,
      name: `Vuelos desde ${h.city} (${h.code})`,
    })),
  };

  return (
    <div className="space-y-10">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Vuelos desde España</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Vuelos baratos desde España: 7 hubs analizados</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Cada aeropuerto español tiene su red, sus aerolíneas y sus oportunidades de chollos. Aquí tienes el desglose con datos reales del motor.
        </p>
      </header>

      {order.map((cat) =>
        grouped[cat] ? (
          <section key={cat} className="space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">
              {CATEGORY_LABELS[cat]}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grouped[cat].map((h) => (
                <li
                  key={h.code}
                  className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl transition-colors"
                >
                  <a
                    href={`/vuelos-desde/${h.code.toLowerCase()}`}
                    className="block p-5 space-y-2"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-amber-400 text-sm">{h.code}</span>
                      <h3 className="text-lg font-bold text-white">{h.city}</h3>
                    </div>
                    <p className="text-xs text-gray-500">{h.region} · {h.distanceKm} km al centro</p>
                    <p className="text-sm text-gray-400 line-clamp-2">{h.cityAccess}</p>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}
