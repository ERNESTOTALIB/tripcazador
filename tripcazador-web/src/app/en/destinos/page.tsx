import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

/**
 * English destinations index.
 *
 * We don't duplicate the full Spanish `/destinos/[slug]` pages yet — those
 * remain Spanish-only for this MVP. Instead this page is a curated landing
 * that introduces the destinations in English and deep-links to each slug.
 * Search engines get an EN entry point with hreflang back to /destinos.
 *
 * The 12 slugs must stay in sync with `sitemap.ts -> DESTINOS` and the
 * static params inside `/destinos/[slug]/page.tsx`.
 */

const SITE_URL = "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Destinations — Cheap flights from Europe | TripCazador",
  description:
    "Curated guides for the twelve destinations our engine hunts hardest: Japan, Tanzania, Maldives, New York, Bali, Buenos Aires, Thailand and more.",
  alternates: {
    canonical: "/en/destinos",
    languages: {
      "en": "https://tripcazador.com/en/destinos",
      "es": "https://tripcazador.com/destinos",
      "x-default": "https://tripcazador.com/destinos",
    },
  },
  openGraph: {
    title: "TripCazador — Destinations",
    description: "Twelve destination guides, real mistake fares, all from European hubs.",
    type: "website",
    locale: "en_US",
    url: "https://tripcazador.com/en/destinos",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 3600;

interface EnDestination {
  slug: string;
  name: string;
  emoji: string;
  region: string;
  teaser: string;
  bestMonths: string;
  gradient: string;
}

const EN_DESTINATIONS: EnDestination[] = [
  { slug: "japon", name: "Japan", emoji: "🗼", region: "East Asia",
    teaser: "Frequent mistake fares to Tokyo with one stop. Sakura and koyo are the peaks.",
    bestMonths: "Mar-Apr, Oct-Nov",
    gradient: "from-pink-600 via-rose-700 to-fuchsia-900" },
  { slug: "tanzania", name: "Tanzania", emoji: "🦁", region: "East Africa",
    teaser: "Serengeti safari plus Zanzibar beaches — perfect combo from Europe.",
    bestMonths: "Jun-Oct",
    gradient: "from-orange-700 via-amber-800 to-red-900" },
  { slug: "maldivas", name: "Maldives", emoji: "🏝️", region: "Indian Ocean",
    teaser: "Rare but brutal business-class deals. Skip monsoon.",
    bestMonths: "Dec-Apr",
    gradient: "from-cyan-600 via-sky-700 to-blue-900" },
  { slug: "nueva-york", name: "New York", emoji: "🗽", region: "North America",
    teaser: "Highest density of transatlantic error fares. Business on DL/AA/UA.",
    bestMonths: "Apr-May, Sep-Oct",
    gradient: "from-indigo-700 via-violet-800 to-slate-900" },
  { slug: "bali", name: "Bali", emoji: "🌴", region: "Southeast Asia",
    teaser: "Stop over Singapore, KL or Doha. Mistake fares via SIN pop up often.",
    bestMonths: "May-Sep",
    gradient: "from-emerald-700 via-teal-800 to-green-900" },
  { slug: "buenos-aires", name: "Buenos Aires", emoji: "🥩", region: "South America",
    teaser: "Tango, steak and recurring error fares with Iberia and Aerolíneas Argentinas.",
    bestMonths: "Mar-May, Sep-Nov",
    gradient: "from-sky-700 via-blue-800 to-indigo-900" },
  { slug: "tailandia", name: "Thailand", emoji: "🛕", region: "Southeast Asia",
    teaser: "Bangkok, Phuket and Chiang Mai. Regular error fares via DOH or DXB.",
    bestMonths: "Nov-Feb",
    gradient: "from-amber-600 via-orange-700 to-red-900" },
  { slug: "sudafrica", name: "South Africa", emoji: "🦓", region: "Southern Africa",
    teaser: "Cape Town + Kruger. Business deals on Qatar and Lufthansa via DOH/FRA.",
    bestMonths: "Oct-Apr",
    gradient: "from-emerald-800 via-green-900 to-gray-900" },
  { slug: "islandia", name: "Iceland", emoji: "🌋", region: "Northern Europe",
    teaser: "Short-haul bargains from BSL/ZRH with Icelandair and easyJet.",
    bestMonths: "Jun-Aug, Sep-Feb (auroras)",
    gradient: "from-blue-700 via-cyan-800 to-slate-900" },
  { slug: "marruecos", name: "Morocco", emoji: "🕌", region: "North Africa",
    teaser: "Marrakech, Fez and Chefchaouen. Ryanair low fares from almost every hub.",
    bestMonths: "Mar-May, Sep-Nov",
    gradient: "from-red-700 via-orange-800 to-yellow-900" },
  { slug: "vietnam", name: "Vietnam", emoji: "🇻🇳", region: "Southeast Asia",
    teaser: "Hanoi to Saigon full country crossing. Error fares on Qatar and Emirates.",
    bestMonths: "Nov-Apr",
    gradient: "from-red-700 via-rose-800 to-yellow-900" },
  { slug: "costa-rica", name: "Costa Rica", emoji: "🌿", region: "Central America",
    teaser: "Pura vida plus volcanoes and Pacific beaches. Iberia deals via MAD.",
    bestMonths: "Dec-Apr",
    gradient: "from-green-700 via-emerald-800 to-teal-900" },
];

export default function EnDestinationsIndexPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "TripCazador Destinations",
    inLanguage: "en",
    itemListElement: EN_DESTINATIONS.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: d.name,
      url: `${SITE_URL}/destinos/${d.slug}`,
    })),
  };

  return (
    <div className="space-y-10">
      <JsonLd data={itemList} />
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/en" className="hover:text-white">
            Home
          </a>
          <span>/</span>
          <span className="text-white">Destinations</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Destinations</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Twelve places our engine hunts hardest, each with a quick take on
          when to go and what fares to expect. Click through to the live deal
          feed for each country (Spanish content — a translated version ships
          per request).
        </p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <a href="/destinos" hrefLang="es" className="hover:text-amber-400 transition-colors">
            🇪🇸 Ver en español
          </a>
        </div>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {EN_DESTINATIONS.map((d) => (
          <li key={d.slug}>
            <a
              href={`/destinos/${d.slug}`}
              className="block rounded-2xl overflow-hidden border border-gray-800 hover:border-amber-500/40 transition-colors group"
              aria-label={`Destination guide: ${d.name}`}
            >
              <div
                className={`h-36 bg-gradient-to-br ${d.gradient} flex items-end p-4`}
              >
                <span className="text-5xl drop-shadow-lg" aria-hidden="true">
                  {d.emoji}
                </span>
              </div>
              <div className="p-5 space-y-2 bg-gray-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {d.name}
                  </h2>
                  <span className="text-xs text-gray-500">{d.region}</span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{d.teaser}</p>
                <div className="text-xs text-amber-400/90 pt-1">
                  Best months: {d.bestMonths}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/20">
        <h2 className="text-xl font-bold text-white mb-2">
          Missing a destination?
        </h2>
        <p className="text-gray-400 mb-4">
          Tell us on Telegram and we&apos;ll add it to the hunter&apos;s rotation.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Request a destination
        </a>
      </section>
    </div>
  );
}
