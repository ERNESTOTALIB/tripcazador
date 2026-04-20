import type { Metadata } from "next";
import { DestinationCard } from "@/components/DestinationCard";
import { JsonLd } from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Destinos", item: `${SITE_URL}/destinos` },
  ],
};

export const metadata: Metadata = {
  title: "Destinos — Guías de vuelos baratos desde Europa",
  description:
    "Guías de destino con la mejor época para volar, consejos prácticos y los chollos actuales del motor TripCazador para cada país.",
  alternates: { canonical: "/destinos" },
  openGraph: {
    title: "Destinos TripCazador",
    description:
      "Tanzania, Japón, Maldivas, Nueva York, Bali, Buenos Aires y más. Guías con mejor época y chollos activos.",
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 3600;

interface Destination {
  slug: string;
  name: string;
  country: string;
  teaser: string;
  bestMonths: string;
  kicker: string;
  /** Photo ID en Unsplash (sin el prefijo photo-) */
  photoId: string;
  /** Tailwind gradient fallback, ej: "from-orange-700 via-amber-800 to-red-900" */
  gradient: string;
}

const UNSPLASH = (id: string, w = 800, q = 75) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

const DESTINATIONS: Destination[] = [
  {
    slug: "tanzania", name: "Tanzania", country: "África Oriental", kicker: "Safari",
    teaser: "Safari en Serengeti + playas de Zanzíbar. Combo perfecto desde Europa.",
    bestMonths: "Jun-Oct",
    photoId: "1516426122078-c23e76319801",
    gradient: "from-orange-700 via-amber-800 to-red-900",
  },
  {
    slug: "japon", name: "Japón", country: "Asia Oriental", kicker: "Sakura",
    teaser: "Error fares frecuentes a Tokio con escala. Sakura y koyo son los picos.",
    bestMonths: "Mar-Abr, Oct-Nov",
    photoId: "1540959733332-eab4deabeeaf",
    gradient: "from-pink-600 via-rose-700 to-fuchsia-900",
  },
  {
    slug: "maldivas", name: "Maldivas", country: "Océano Índico", kicker: "Paraíso",
    teaser: "Chollos raros pero brutales en Business. Monzón fuera.",
    bestMonths: "Dic-Abr",
    photoId: "1540541338287-41700207dee6",
    gradient: "from-cyan-600 via-sky-700 to-blue-900",
  },
  {
    slug: "nueva-york", name: "Nueva York", country: "EE.UU.", kicker: "Transatlántico",
    teaser: "Mayor densidad de error fares transatlánticos. Business DL/AA/UA.",
    bestMonths: "Abr-May, Sep-Oct",
    photoId: "1496442226666-8d4d0e62e6e9",
    gradient: "from-indigo-700 via-violet-800 to-slate-900",
  },
  {
    slug: "bali", name: "Bali", country: "Indonesia", kicker: "Trópico",
    teaser: "Con escala en Singapore, KL o Doha. Error fares vía SIN frecuentes.",
    bestMonths: "May-Sep",
    photoId: "1537996194471-e657df975ab4",
    gradient: "from-emerald-700 via-teal-800 to-green-900",
  },
  {
    slug: "buenos-aires", name: "Buenos Aires", country: "Argentina", kicker: "Latinoamérica",
    teaser: "Tango, asado y error fares recurrentes con Iberia y Aerolíneas Argentinas.",
    bestMonths: "Mar-May, Sep-Nov",
    photoId: "1589909202802-8f4aadce1849",
    gradient: "from-sky-700 via-blue-800 to-indigo-900",
  },
  {
    slug: "tailandia", name: "Tailandia", country: "Sudeste Asiático", kicker: "Templo",
    teaser: "Bangkok, Phuket y Chiang Mai. Oasis de error fares vía DOH o DXB.",
    bestMonths: "Nov-Feb",
    photoId: "1508009603885-50cf7c579365",
    gradient: "from-yellow-600 via-orange-700 to-red-800",
  },
  {
    slug: "sudafrica", name: "Sudáfrica", country: "África Austral", kicker: "Safari + Costa",
    teaser: "Cape Town + Kruger + Garden Route. Business con Lufthansa o Turkish.",
    bestMonths: "Oct-Abr",
    photoId: "1484318571209-661cf29a69c3",
    gradient: "from-amber-700 via-yellow-800 to-green-900",
  },
  {
    slug: "islandia", name: "Islandia", country: "Europa Norte", kicker: "Auroras",
    teaser: "Vuelos directos muy baratos con Icelandair + Play desde varios aeropuertos europeos.",
    bestMonths: "Jun-Sep, Feb-Mar (auroras)",
    photoId: "1529963183134-61a90db47eaf",
    gradient: "from-slate-600 via-cyan-800 to-blue-950",
  },
  {
    slug: "marruecos", name: "Marruecos", country: "Norte de África", kicker: "Medina",
    teaser: "Marrakech, Fez, Chefchaouen. Ryanair y TUI desde Basel regularmente.",
    bestMonths: "Mar-May, Sep-Nov",
    photoId: "1489749798305-4fea3ae63d43",
    gradient: "from-red-700 via-orange-800 to-amber-900",
  },
  {
    slug: "vietnam", name: "Vietnam", country: "Sudeste Asiático", kicker: "Halong",
    teaser: "Hanói, Halong y Ho Chi Minh. Mejor ratio calidad/precio del sudeste.",
    bestMonths: "Nov-Abr",
    photoId: "1528127269322-539801943592",
    gradient: "from-green-700 via-emerald-800 to-teal-900",
  },
  {
    slug: "costa-rica", name: "Costa Rica", country: "América Central", kicker: "Pura Vida",
    teaser: "Pura vida: selva, playas y volcanes. Iberia y Condor con escala.",
    bestMonths: "Dic-Abr",
    photoId: "1518259102261-b40117eabbc9",
    gradient: "from-lime-700 via-green-800 to-emerald-900",
  },
];

export default function DestinosIndexPage() {
  return (
    <div className="space-y-10">
      <JsonLd data={BREADCRUMB_JSONLD} />
      <header className="space-y-4">
        <nav aria-label="Migas de pan" className="flex items-center gap-2 text-sm text-gray-400">
          <a href="/" className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1">
            Inicio
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-white">Destinos</span>
        </nav>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">Destinos</h1>
        <p className="text-gray-300 max-w-2xl text-lg">
          Guías por destino: mejor época para volar, consejos prácticos y los chollos activos que el motor está siguiendo en este momento.
        </p>
      </header>

      {/* Grid visual de destinos con fotografía real */}
      <section aria-labelledby="destinos-visual-heading">
        <h2 id="destinos-visual-heading" className="sr-only">Destinos disponibles</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 list-none m-0 p-0">
          {DESTINATIONS.map((d, idx) => (
            <li key={d.slug}>
              <DestinationCard
                name={d.name}
                slug={d.slug}
                imageUrl={UNSPLASH(d.photoId)}
                gradient={d.gradient}
                kicker={d.kicker}
                tagline={d.bestMonths}
                priority={idx < 4}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Listado con detalle para SEO */}
      <section aria-labelledby="destinos-detalle-heading" className="space-y-4">
        <h2 id="destinos-detalle-heading" className="text-2xl font-bold text-white">
          Guías detalladas
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none m-0 p-0">
          {DESTINATIONS.map((d) => (
            <li
              key={d.slug}
              className="glass rounded-2xl border border-gray-800 card-hover overflow-hidden"
            >
              <a
                href={`/destinos/${d.slug}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl"
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div
                    className="relative w-28 sm:w-36 shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${UNSPLASH(d.photoId, 400)})` }}
                    aria-hidden="true"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-950/80" />
                  </div>
                  {/* Contenido */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-white truncate">{d.name}</h3>
                        <p className="text-xs text-gray-400">{d.country}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] uppercase tracking-wider font-semibold shrink-0">
                        {d.kicker}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-3 line-clamp-2">{d.teaser}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Mejor época: <span className="text-gray-200">{d.bestMonths}</span>
                      </span>
                      <span className="text-amber-400 font-medium">Ver chollos →</span>
                    </div>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-8">
        <h2 className="text-xl font-bold text-white mb-2">¿Echas en falta un destino?</h2>
        <p className="text-gray-300 mb-3">
          Estamos añadiendo nuevas guías semanalmente. Si hay un destino que te interesa y no está aquí, cuéntanoslo por Telegram y lo priorizamos.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
        >
          Contactar por Telegram →
        </a>
      </section>
    </div>
  );
}
