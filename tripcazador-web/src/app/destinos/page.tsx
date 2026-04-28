import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { DestinationCard } from "@/components/DestinationCard";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// Mapa cargado bajo demanda — el componente es client-side (useState para
// hover) y pesa ~25KB minificados con su SVG inline. Lazy load reduce el
// bundle inicial de /destinos sin afectar SEO porque el contenido textual
// (lista de destinos) sí se prerenderiza.
const DestinationsMap = nextDynamic(
  () => import("@/components/DestinationsMap").then((m) => m.DestinationsMap),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="w-full aspect-[16/9] rounded-2xl bg-gray-900 border border-gray-800 animate-pulse"
      />
    ),
  },
);

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
  emoji: string;
  country: string;
  teaser: string;
  bestMonths: string;
  /** Tailwind gradient, ej: "from-orange-700 via-amber-800 to-red-900" */
  gradient: string;
  /** Coordenadas aproximadas de la capital/ciudad icónica del destino */
  lat: number;
  lon: number;
}

const DESTINATIONS: Destination[] = [
  { slug: "tanzania", name: "Tanzania", emoji: "🦁", country: "África Oriental",
    teaser: "Safari en Serengeti + playas de Zanzíbar. Combo perfecto desde Europa.",
    bestMonths: "Jun-Oct",
    gradient: "from-orange-700 via-amber-800 to-red-900",
    lat: -6.17, lon: 35.74 },
  { slug: "japon", name: "Japón", emoji: "🗼", country: "Asia Oriental",
    teaser: "Error fares frecuentes a Tokio con escala. Sakura y koyo son los picos.",
    bestMonths: "Mar-Abr, Oct-Nov",
    gradient: "from-pink-600 via-rose-700 to-fuchsia-900",
    lat: 35.68, lon: 139.76 },
  { slug: "maldivas", name: "Maldivas", emoji: "🏝️", country: "Océano Índico",
    teaser: "Chollos raros pero brutales en Business. Monzón fuera.",
    bestMonths: "Dic-Abr",
    gradient: "from-cyan-600 via-sky-700 to-blue-900",
    lat: 4.17, lon: 73.51 },
  { slug: "nueva-york", name: "Nueva York", emoji: "🗽", country: "EE.UU.",
    teaser: "Mayor densidad de error fares transatlánticos. Business DL/AA/UA.",
    bestMonths: "Abr-May, Sep-Oct",
    gradient: "from-indigo-700 via-violet-800 to-slate-900",
    lat: 40.71, lon: -74.01 },
  { slug: "bali", name: "Bali", emoji: "🌴", country: "Indonesia",
    teaser: "Con escala en Singapore, KL o Doha. Error fares vía SIN frecuentes.",
    bestMonths: "May-Sep",
    gradient: "from-emerald-700 via-teal-800 to-green-900",
    lat: -8.65, lon: 115.22 },
  { slug: "buenos-aires", name: "Buenos Aires", emoji: "🥩", country: "Argentina",
    teaser: "Tango, asado y error fares recurrentes con Iberia y Aerolíneas Argentinas.",
    bestMonths: "Mar-May, Sep-Nov",
    gradient: "from-sky-700 via-blue-800 to-indigo-900",
    lat: -34.60, lon: -58.44 },
  { slug: "tailandia", name: "Tailandia", emoji: "🛕", country: "Sudeste Asiático",
    teaser: "Bangkok, Phuket y Chiang Mai. Oasis de error fares vía DOH o DXB.",
    bestMonths: "Nov-Feb",
    gradient: "from-yellow-600 via-orange-700 to-red-800",
    lat: 13.75, lon: 100.50 },
  { slug: "sudafrica", name: "Sudáfrica", emoji: "🦏", country: "África Austral",
    teaser: "Cape Town + Kruger + Garden Route. Business con Lufthansa o Turkish.",
    bestMonths: "Oct-Abr",
    gradient: "from-amber-700 via-yellow-800 to-green-900",
    lat: -33.92, lon: 18.42 },
  { slug: "islandia", name: "Islandia", emoji: "🌋", country: "Europa Norte",
    teaser: "Vuelos directos muy baratos con WOW extinta, ahora Icelandair + Play.",
    bestMonths: "Jun-Sep, Feb-Mar (auroras)",
    gradient: "from-slate-600 via-cyan-800 to-blue-950",
    lat: 64.15, lon: -21.94 },
  { slug: "marruecos", name: "Marruecos", emoji: "🕌", country: "Norte de África",
    teaser: "Marrakech, Fez, Chefchaouen. Ryanair y TUI desde Basel regularmente.",
    bestMonths: "Mar-May, Sep-Nov",
    gradient: "from-red-700 via-orange-800 to-amber-900",
    lat: 31.63, lon: -7.99 },
  { slug: "vietnam", name: "Vietnam", emoji: "🍜", country: "Sudeste Asiático",
    teaser: "Hanói, Halong y Ho Chi Minh. Mejor ratio calidad/precio del sudeste.",
    bestMonths: "Nov-Abr",
    gradient: "from-green-700 via-emerald-800 to-teal-900",
    lat: 21.03, lon: 105.85 },
  { slug: "costa-rica", name: "Costa Rica", emoji: "🦥", country: "América Central",
    teaser: "Pura vida: selva, playas y volcanes. Iberia y Condor con escala.",
    bestMonths: "Dic-Abr",
    gradient: "from-lime-700 via-green-800 to-emerald-900",
    lat: 9.93, lon: -84.08 },
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
        <h1 className="text-4xl font-bold text-white">Destinos</h1>
        <p className="text-gray-300 max-w-2xl text-lg">
          Guías por destino: mejor época para volar, consejos prácticos y los chollos activos que el motor está siguiendo en este momento.
        </p>
      </header>

      {/* Mapa interactivo con los destinos georeferenciados */}
      <section aria-labelledby="destinos-mapa-heading">
        <h2 id="destinos-mapa-heading" className="sr-only">Mapa de destinos</h2>
        <DestinationsMap
          destinations={DESTINATIONS.map((d) => ({
            slug: d.slug,
            name: d.name,
            emoji: d.emoji,
            lat: d.lat,
            lon: d.lon,
          }))}
        />
      </section>

      {/* Grid visual de destinos (tarjetas con mapa/gradient) */}
      <section aria-labelledby="destinos-visual-heading">
        <h2 id="destinos-visual-heading" className="sr-only">Destinos disponibles</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 list-none m-0 p-0">
          {DESTINATIONS.map((d, i) => (
            <li key={d.slug}>
              <DestinationCard
                name={d.name}
                slug={d.slug}
                emoji={d.emoji}
                gradient={d.gradient}
                tagline={d.bestMonths}
                eager={i < 8}
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
              className="glass rounded-2xl border border-gray-800 card-hover"
            >
              <a
                href={`/destinos/${d.slug}`}
                className="block p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl"
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl leading-none" aria-hidden="true">{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white">{d.name}</h3>
                    <p className="text-xs text-gray-400">{d.country}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-3">{d.teaser}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Mejor época: <span className="text-gray-200">{d.bestMonths}</span>
                  </span>
                  <span className="text-amber-400 font-medium">Ver chollos →</span>
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

      {/* abr-2026t/u: Newsletter signup compact tras destinos — captura
          email de visitantes que llegan por SEO de destinos. Conversion
          típica below-fold: 2-4%. */}
      <section className="container mx-auto px-4 pb-10">
        <NewsletterSignup variant="compact" context="destinos-bottom" />
      </section>
    </div>
  );
}
