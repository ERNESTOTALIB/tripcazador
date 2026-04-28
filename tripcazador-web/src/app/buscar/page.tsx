import type { Metadata } from "next";
import { InternalSearch, type SearchItem } from "@/components/InternalSearch";
import { JsonLd } from "@/components/JsonLd";
import { getAllPosts } from "@/lib/blog";
import { COMPARISONS } from "@/lib/comparisons";
import { AIRLINES } from "@/lib/airlines";
import { HUBS } from "@/lib/hubs";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Buscar en TripCazador: blog, destinos, comparativas, aerolíneas",
  description:
    "Búsqueda interna sobre todo el contenido de TripCazador: 30+ blog posts, 18 destinos, 20 comparativas head-to-head, 10 aerolíneas, 50 términos del glosario.",
  alternates: { canonical: "/buscar" },
};

export const dynamic = "force-static";
export const revalidate = 3600;

const DESTINOS_LIST = [
  { slug: "tanzania", name: "Tanzania", desc: "Safari Serengeti + Zanzíbar playas" },
  { slug: "japon", name: "Japón", desc: "Cerezos, momiji, business class error fares" },
  { slug: "maldivas", name: "Maldivas", desc: "Atolones, bungalows sobre agua" },
  { slug: "nueva-york", name: "Nueva York", desc: "JFK desde €290 con Iberia/Air Europa" },
  { slug: "bali", name: "Bali", desc: "Indonesia tropical, surf, yoga" },
  { slug: "buenos-aires", name: "Buenos Aires", desc: "Tango, asado, blue dollar" },
  { slug: "tailandia", name: "Tailandia", desc: "Bangkok, Phi Phi, monzón estacional" },
  { slug: "sudafrica", name: "Sudáfrica", desc: "Cape Town, safaris, vinos" },
  { slug: "islandia", name: "Islandia", desc: "Auroras boreales, géiseres, glaciares" },
  { slug: "marruecos", name: "Marruecos", desc: "Marrakech, zocos, riads" },
  { slug: "vietnam", name: "Vietnam", desc: "Hanoi, Saigón, comida callejera" },
  { slug: "costa-rica", name: "Costa Rica", desc: "Selva tropical, ecoturismo" },
  { slug: "marrakech", name: "Marrakech", desc: "Zocos, Majorelle, vuelos directos baratos" },
  { slug: "tokio", name: "Tokio", desc: "Capital Japón, sushi top, tradición + neón" },
  { slug: "reykjavik", name: "Reikiavik", desc: "Auroras boreales, naturaleza Islandia" },
  { slug: "singapur", name: "Singapur", desc: "Hub Asia, hawker centres, futurista" },
  { slug: "praga", name: "Praga", desc: "Cien torres, cerveza checa, gótico" },
  { slug: "estambul", name: "Estambul", desc: "Cruce Europa-Asia, hub Turkish" },
];

export default function BuscarPage() {
  const posts = getAllPosts();

  // Construir índice combinado
  const items: SearchItem[] = [
    ...posts.map((p) => ({
      type: "blog" as const,
      title: p.title,
      url: `/blog/${p.slug}`,
      description: p.description,
      tags: p.tags,
    })),
    ...DESTINOS_LIST.map((d) => ({
      type: "destino" as const,
      title: `Vuelos baratos a ${d.name}`,
      url: `/destinos/${d.slug}`,
      description: d.desc,
      tags: [d.slug],
    })),
    ...COMPARISONS.map((c) => ({
      type: "comparativa" as const,
      title: c.title,
      url: `/comparar/${c.slug}`,
      description: c.description,
      tags: [c.a.iata.toLowerCase(), c.b.iata.toLowerCase()],
    })),
    ...AIRLINES.map((a) => ({
      type: "aerolinea" as const,
      title: `${a.name} (${a.code})`,
      url: `/aerolineas/${a.code.toLowerCase()}`,
      description: a.keyPoints[0],
      tags: [a.code.toLowerCase(), a.category, a.country],
    })),
    ...HUBS.map((h) => ({
      type: "hub" as const,
      title: `Vuelos desde ${h.city} (${h.code})`,
      url: `/vuelos-desde/${h.code.toLowerCase()}`,
      description: h.cityAccess,
      tags: [h.code.toLowerCase(), h.region.toLowerCase()],
    })),
    ...GLOSSARY.map((g) => ({
      type: "glosario" as const,
      title: g.term,
      url: `/glosario#${g.slug}`,
      description: g.definition,
      tags: g.aliases || [],
    })),
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "TripCazador",
      url: "https://tripcazador.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://tripcazador.com/buscar?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Buscar", item: "https://tripcazador.com/buscar" },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Buscar</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Buscar</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Búsqueda en todo el sitio: blog posts, destinos, comparativas, aerolíneas, hubs aeropuerto, glosario. {items.length} entradas indexadas.
        </p>
      </header>

      <InternalSearch items={items} />

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">¿No encuentras lo que buscas?</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Escríbenos por Telegram con tu pregunta o ruta concreta. Si es relevante para más usuarios, lo añadimos.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Preguntar por Telegram
        </a>
      </section>
    </div>
  );
}
