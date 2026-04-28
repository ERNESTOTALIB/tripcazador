import type { Metadata } from "next";
import { REGIONS } from "@/lib/regions";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Regiones turísticas: vuelos baratos a 6 zonas del mundo",
  description:
    "Hub-pages por región: Caribe, Sudeste Asiático, Norte África, Europa Este, Sudamérica, Asia Este. Destinos + comparativas + posts agrupados.",
  alternates: { canonical: "/regiones" },
};

export const revalidate = 86400;

export default function RegionesIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Regiones turísticas — TripCazador",
    numberOfItems: REGIONS.length,
    itemListElement: REGIONS.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/regiones/${r.slug}`,
      name: r.name,
    })),
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Regiones</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Regiones turísticas</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Hub-pages por región del mundo. Cada una agrupa destinos + comparativas + blog posts asociados para que tengas una vista panorámica antes de planificar.
        </p>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REGIONS.map((r) => (
          <li
            key={r.slug}
            className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl transition-colors"
          >
            <a href={`/regiones/${r.slug}`} className="block p-5 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl">{r.emoji}</span>
                <h2 className="text-xl font-bold text-white">{r.name}</h2>
              </div>
              <p className="text-sm text-gray-400 line-clamp-3">{r.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
                  {r.destSlugs.length} destinos
                </span>
                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                  {r.comparisonSlugs.length} comparativas
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                  {r.blogSlugs.length} blog posts
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
