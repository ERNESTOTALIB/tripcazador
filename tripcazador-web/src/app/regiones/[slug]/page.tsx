import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { REGIONS, getRegionBySlug } from "@/lib/regions";
import { JsonLd } from "@/components/JsonLd";

type Params = { slug: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return REGIONS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const r = getRegionBySlug(params.slug);
  if (!r) return { title: "Región no encontrada" };
  return {
    title: `Vuelos baratos a ${r.name}: destinos, comparativas y guías`,
    description: r.description,
    alternates: { canonical: `/regiones/${r.slug}` },
    openGraph: {
      type: "website",
      title: `${r.emoji} Vuelos baratos a ${r.name} — TripCazador`,
      description: r.description,
    },
  };
}

export default function RegionDetailPage({ params }: { params: Params }) {
  const r = getRegionBySlug(params.slug);
  if (!r) notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: r.name,
      description: r.description,
      url: `https://tripcazador.com/regiones/${r.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Regiones", item: "https://tripcazador.com/regiones" },
        {
          "@type": "ListItem",
          position: 3,
          name: r.name,
          item: `https://tripcazador.com/regiones/${r.slug}`,
        },
      ],
    },
  ];

  return (
    <article className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <a href="/regiones" className="hover:text-white">Regiones</a>
          <span>/</span>
          <span className="text-white">{r.name}</span>
        </nav>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl">{r.emoji}</span>
          <h1 className="text-4xl font-bold text-white">Vuelos baratos a {r.name}</h1>
        </div>
        <p className="text-gray-400 text-lg">{r.description}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Mejores meses</p>
          <p className="text-sm text-gray-300 mt-1">{r.bestMonths.join(", ")}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Tiempo vuelo</p>
          <p className="text-sm text-gray-300 mt-1">{r.flightTimeFromSpain}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Presupuesto medio</p>
          <p className="text-sm text-gray-300 mt-1">{r.averageBudget}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Aspectos destacados</h2>
        <ul className="space-y-2">
          {r.highlights.map((h, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 shrink-0">·</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </section>

      {r.destSlugs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Destinos en {r.name}</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {r.destSlugs.map((d) => (
              <li key={d} className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl transition-colors">
                <a href={`/destinos/${d}`} className="block p-4">
                  <p className="text-sm text-amber-300 font-mono">/destinos/{d}</p>
                  <p className="text-white font-semibold capitalize">{d.replace(/-/g, " ")}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.comparisonSlugs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Comparativas relevantes</h2>
          <ul className="space-y-2">
            {r.comparisonSlugs.map((c) => (
              <li key={c} className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl transition-colors">
                <a href={`/comparar/${c}`} className="block p-4">
                  <p className="text-sm text-purple-300 font-mono">/comparar/{c}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.blogSlugs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Guías del blog</h2>
          <ul className="space-y-2">
            {r.blogSlugs.map((b) => (
              <li key={b} className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl transition-colors">
                <a href={`/blog/${b}`} className="block p-4">
                  <p className="text-sm text-emerald-300 font-mono">/blog/{b}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Activar alertas para {r.name}</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Configura el bot Telegram con tus rutas favoritas. Te avisa cuando aparece error fare.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar bot
        </a>
      </section>
    </article>
  );
}
