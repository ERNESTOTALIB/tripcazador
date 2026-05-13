/**
 * /vuelos — índice SSG (SSS153, may 2026)
 *
 * Antes la ruta /vuelos era 404, aunque /vuelos/[ruta]/page.tsx existía
 * con 95 rutas pareadas SEO. El breadcrumb dentro de /vuelos/[ruta] linkeaba
 * a /vuelos como padre, generando un href roto. Auditoría SSS153 lo detectó.
 *
 * Server Component puro (anti-SSS143 regression).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

// Slugs sincronizados con TOP_ROUTES de /vuelos/[ruta]/page.tsx (95 rutas).
// Mantenerlos en este orden por relevancia (Madrid/Barcelona primero, secundarios después).
const ROUTE_SLUGS = [
  "madrid-lisboa", "madrid-londres", "barcelona-roma", "madrid-paris",
  "barcelona-londres", "madrid-roma", "barcelona-paris", "madrid-amsterdam",
  "madrid-berlin", "barcelona-amsterdam", "madrid-nueva-york", "madrid-tokio",
  "madrid-bangkok", "madrid-buenos-aires", "barcelona-nueva-york", "madrid-cancun",
  "madrid-bali", "madrid-cuba", "barcelona-tokio", "madrid-marrakech",
  "sevilla-roma", "valencia-londres", "bilbao-paris", "malaga-amsterdam",
  "palma-londres", "alicante-paris", "granada-londres", "tenerife-londres",
  "ibiza-paris", "santiago-roma", "madrid-estambul", "barcelona-estambul",
  "madrid-praga", "madrid-viena", "barcelona-viena", "madrid-zurich",
  "barcelona-zurich", "madrid-copenhague", "barcelona-copenhague", "madrid-estocolmo",
  "madrid-oslo", "madrid-helsinki", "madrid-varsovia", "barcelona-varsovia",
  "madrid-budapest", "madrid-atenas", "barcelona-atenas", "madrid-dubrovnik",
  "madrid-split", "madrid-malta", "madrid-cairo", "madrid-tanger",
  "madrid-casablanca", "barcelona-casablanca", "madrid-tunez", "madrid-dakar",
  "madrid-johannesburgo", "madrid-nairobi", "madrid-mauricio", "madrid-singapur",
  "madrid-hong-kong", "madrid-seul", "madrid-tokio-osaka", "madrid-hanoi",
  "madrid-saigon", "madrid-yakarta", "madrid-manila", "madrid-mumbai",
  "madrid-delhi", "madrid-katmandu", "madrid-male", "madrid-colombo",
  "madrid-doha", "madrid-dubai", "madrid-tel-aviv", "madrid-jakarta",
  "madrid-mexico", "madrid-bogota", "madrid-lima", "madrid-quito",
  "madrid-santiago-chile", "madrid-montevideo", "madrid-asuncion", "madrid-caracas",
  "madrid-rio", "madrid-sao-paulo", "barcelona-sao-paulo", "madrid-buenos-aires-easyjet",
  "lisboa-paris", "lisboa-londres", "roma-paris", "berlin-londres",
  "milan-barcelona", "praga-paris", "amsterdam-paris",
];

// Agrupación visual por categoría de origen
const BUCKETS = [
  { title: "🇪🇸 Desde Madrid", filter: (s: string) => s.startsWith("madrid-") },
  { title: "🇪🇸 Desde Barcelona", filter: (s: string) => s.startsWith("barcelona-") },
  { title: "🇪🇸 Desde otras ciudades ES", filter: (s: string) => /^(sevilla|valencia|bilbao|malaga|palma|alicante|granada|tenerife|ibiza|santiago)-/.test(s) },
  { title: "🇪🇺 Rutas entre capitales EU", filter: (s: string) => /^(lisboa|roma|berlin|milan|praga|amsterdam)-/.test(s) },
];

function formatLabel(slug: string): string {
  // Format: madrid-lisboa → "Madrid · Lisboa", madrid-nueva-york → "Madrid · Nueva York"
  // Heurística: primer token es origen, resto es destino multi-palabra
  const words = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (words.length < 2) return words[0] || slug;
  const [origin, ...destParts] = words;
  return `${origin} · ${destParts.join(" ")}`;
}

export const metadata: Metadata = {
  title: "Vuelos baratos por ruta (95 destinos) — TripCazador",
  description:
    "95 rutas pareadas con precios mes a mes, mejor aerolínea, hubs alternativos y error fares históricos. Madrid, Barcelona y secundarios ES.",
  alternates: { canonical: "/vuelos" },
};

export const revalidate = 86400;

export default function VuelosIndex() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Vuelos por ruta", item: `${SITE}/vuelos` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ROUTE_SLUGS.map((slug, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/vuelos/${slug}`,
      name: formatLabel(slug),
    })),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={breadcrumb} />
      <JsonLd data={itemList} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Vuelos por ruta</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          ✈️ Vuelos baratos por ruta
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          {ROUTE_SLUGS.length} rutas pareadas con análisis específico: precios mes a mes,
          mejor aerolínea, hubs alternativos y error fares históricos. Spain-first
          (Madrid, Barcelona, hubs secundarios ES).
        </p>
      </header>

      {BUCKETS.map((bucket) => {
        const slugs = ROUTE_SLUGS.filter(bucket.filter);
        if (slugs.length === 0) return null;
        return (
          <section key={bucket.title} className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              {bucket.title} <span className="text-base font-normal text-slate-500">({slugs.length})</span>
            </h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slugs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/vuelos/${slug}`}
                    className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                  >
                    {formatLabel(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-12 rounded-xl border bg-slate-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">Sigue explorando</h2>
        <ul className="mt-4 space-y-2 text-amber-700">
          <li>
            <Link className="underline hover:text-amber-900" href="/deals">
              Chollos activos hoy (1000+ vuelos)
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/cuando-viajar">
              Cuándo viajar a cada destino — mes a mes
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/comparar-aerolineas">
              Comparativas head-to-head aerolíneas
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/destinos">
              Guías de destino completas
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/seguro-viaje">
              Seguro de viaje 2026 — comparativa
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
