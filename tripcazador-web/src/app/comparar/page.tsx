import type { Metadata } from "next";
import { COMPARISONS } from "@/lib/comparisons";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Comparativas de destinos: cuál elegir para tu próximo viaje (2026)",
  description:
    "Comparativas head-to-head entre destinos populares. Madrid vs Lisboa, Barcelona vs Roma, Madrid vs Nueva York: precios reales, criterios y veredicto.",
  alternates: { canonical: "/comparar" },
};

export const revalidate = 86400;

export default function CompararIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Comparativas de destinos — TripCazador",
    numberOfItems: COMPARISONS.length,
    itemListElement: COMPARISONS.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/comparar/${c.slug}`,
      name: c.title,
    })),
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Comparativas</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Comparativas de destinos</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          ¿Madrid o Lisboa? ¿Roma o Barcelona? ¿NYC merece la pena? Análisis head-to-head con datos reales del motor.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4">
        {COMPARISONS.map((c) => (
          <li
            key={c.slug}
            className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl transition-colors"
          >
            <a href={`/comparar/${c.slug}`} className="block p-6 space-y-3">
              <div className="flex items-center gap-4 text-3xl">
                <span>{c.a.emoji}</span>
                <span className="text-gray-600 text-lg">vs</span>
                <span>{c.b.emoji}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{c.title}</h2>
              <p className="text-gray-400 text-sm">{c.description}</p>
              <p className="text-xs text-amber-400">
                {c.criteria.length} criterios analizados · veredicto final
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
