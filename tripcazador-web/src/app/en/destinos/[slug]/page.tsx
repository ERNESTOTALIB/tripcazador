/**
 * /en/destinos/[slug] — UUU02 (May 2026)
 *
 * English-language destination guide pages. Mirrors the structure of the
 * Spanish /destinos/[slug] but with curated EN copy (NOT auto-translated)
 * for the top 8 destinations where Anglophone search volume is highest.
 *
 * Hreflang: each EN page links back to /destinos/{slug-es} as alternate
 * and `x-default` points to the ES variant (TripCazador's primary
 * audience is Spain). Canonical = self.
 *
 * Generates static params for the 8 slugs at build time. Other slugs
 * return 404 (intentional — we only commit to high-quality EN pages
 * for routes with proven EN demand).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { TravelInsuranceCTA } from "@/components/TravelInsuranceCTA";

interface DestEnEntry {
  /** Slug used in /en/destinos/{slug}. */
  slug: string;
  /** Slug of the equivalent ES page (often identical, but not always). */
  esSlug: string;
  name: string;
  emoji: string;
  iata: string[];
  countryEn: string;
  description: string;
  bestMonths: string[];
  avgTemp: string;
  flightTime: string;
  tips: string[];
  /** Average mistake-fare price spotted in last 90d (€, optional). */
  avgErrorFare?: number;
}

const DESTINATIONS_EN: Record<string, DestEnEntry> = {
  "japan": {
    slug: "japan",
    esSlug: "japon",
    name: "Japan",
    emoji: "🗼",
    iata: ["NRT", "HND", "KIX"],
    countryEn: "Japan, East Asia",
    description:
      "Mistake fares to Japan from Europe pop up several times a year. Best combo: error-fare ticket + cherry-blossom or autumn-foliage season.",
    bestMonths: ["March", "April", "October", "November"],
    avgTemp: "10-25°C (varies seasonally)",
    flightTime: "~12-14h from Europe",
    tips: [
      "Cherry blossoms (sakura): late March - early April",
      "Autumn (koyo): October-November (red leaves season)",
      "Avoid: August (extreme heat + rain) and Obon (Aug 15-ish)",
      "JR Pass: buy before flying, worth it for multi-city trips",
      "Frequent mistake fares: ANA, JAL, Air France with one stop",
    ],
    avgErrorFare: 480,
  },
  "thailand": {
    slug: "thailand",
    esSlug: "tailandia",
    name: "Thailand",
    emoji: "🛕",
    iata: ["BKK", "HKT", "CNX"],
    countryEn: "Thailand, Southeast Asia",
    description:
      "Cheap year-round, but November-February hits the sweet spot of dry weather and pre-Lunar-New-Year mistake fares.",
    bestMonths: ["November", "December", "January", "February"],
    avgTemp: "26-32°C",
    flightTime: "~11-13h with one stop",
    tips: [
      "Skip April (Songkran water festival = chaos but fun)",
      "Phuket vs. Koh Samui: PHK gets BKK direct, USM via BKK or DMK",
      "Visa: 30-day exemption for EU passports on arrival",
      "Avoid May-Oct (monsoon, but cheaper hotels)",
      "Mistake fares regular with Qatar, Etihad, Turkish via hub",
    ],
    avgErrorFare: 410,
  },
  "bali": {
    slug: "bali",
    esSlug: "bali",
    name: "Bali",
    emoji: "🌺",
    iata: ["DPS"],
    countryEn: "Indonesia, Southeast Asia",
    description:
      "Bali sees fewer mistake fares than Bangkok, but May-September dry season + Singapore Airlines errors via SIN are gold.",
    bestMonths: ["May", "June", "July", "August", "September"],
    avgTemp: "26-30°C",
    flightTime: "~16-18h with two stops",
    tips: [
      "Avoid Christmas + Western New Year (peak prices)",
      "Best stays: Ubud (jungle) + Canggu (surf) + Uluwatu (cliffs)",
      "Visa on arrival: 35 USD for 30 days",
      "Internal flights cheap (Wings Air, Lion Air)",
      "Mistake fares: Singapore Airlines ex-EU via SIN regular",
    ],
    avgErrorFare: 620,
  },
  "new-york": {
    slug: "new-york",
    esSlug: "nueva-york",
    name: "New York City",
    emoji: "🗽",
    iata: ["JFK", "EWR", "LGA"],
    countryEn: "USA, North America",
    description:
      "Highest density of transatlantic mistake fares from Europe. Especially Business class with American, Delta or United from EU hubs.",
    bestMonths: ["April", "May", "September", "October"],
    avgTemp: "0-30°C (highly seasonal)",
    flightTime: "~8h from western Europe",
    tips: [
      "Best: spring (Apr-May) and fall (Sep-Oct)",
      "Christmas magical but expensive — wait for error fares",
      "ESTA mandatory for EU citizens (21 USD)",
      "Business mistake fares: AA, DL, UA via BA/CDG/AMS/ZRH",
      "Avoid July-August (humid + crowded)",
    ],
    avgErrorFare: 280,
  },
  "tokyo": {
    slug: "tokyo",
    esSlug: "tokio",
    name: "Tokyo",
    emoji: "🗼",
    iata: ["NRT", "HND"],
    countryEn: "Japan, East Asia",
    description:
      "Tokyo specifically: HND is the closer hub (Haneda, downtown), NRT is the cheaper one. Both see frequent error fares with ANA/JAL.",
    bestMonths: ["March", "April", "October", "November"],
    avgTemp: "5-30°C",
    flightTime: "~12-14h",
    tips: [
      "HND > NRT for time-on-arrival convenience",
      "Suica/Pasmo card on arrival saves hours of ticket fumbling",
      "Capsule hotels: legitimate budget option in Shinjuku/Asakusa",
      "Business mistake fares: JL, NH, AF/LH via hub",
      "AvgErrorFare €450-550 economy ex-EU",
    ],
    avgErrorFare: 510,
  },
  "tanzania": {
    slug: "tanzania",
    esSlug: "tanzania",
    name: "Tanzania",
    emoji: "🦁",
    iata: ["JRO", "DAR", "ZNZ"],
    countryEn: "Tanzania, East Africa",
    description:
      "Combine Serengeti safari (June-October dry season) with Zanzibar beach in one trip. JRO is the closest hub for safari, ZNZ for beach.",
    bestMonths: ["June", "July", "August", "September", "October"],
    avgTemp: "25-30°C",
    flightTime: "~11h with one stop (DOH/DXB/IST)",
    tips: [
      "Safari season: June-October (dry, animals at waterholes)",
      "Avoid March-May (long rains)",
      "Visa on arrival: 50 USD",
      "Yellow fever vaccine + malaria prophylaxis recommended",
      "Mistake fares: Qatar via DOH most common",
    ],
    avgErrorFare: 540,
  },
  "buenos-aires": {
    slug: "buenos-aires",
    esSlug: "buenos-aires",
    name: "Buenos Aires",
    emoji: "🇦🇷",
    iata: ["EZE", "AEP"],
    countryEn: "Argentina, South America",
    description:
      "Mistake fares with Iberia, Air Europa or LATAM via MAD are routine. Argentina's peso devaluation makes on-the-ground costs dirt cheap for euro-holders.",
    bestMonths: ["March", "April", "October", "November"],
    avgTemp: "10-25°C",
    flightTime: "~13h direct from MAD",
    tips: [
      "Avoid January (peak summer + locals on vacation)",
      "Cash USD or EUR for the 'blue dollar' rate (3x official)",
      "Steakhouses: ~10€ per person for top-tier",
      "Visa-free 90 days for EU passports",
      "Mistake fares: IB, UX, AR ex-MAD common in Q4",
    ],
    avgErrorFare: 480,
  },
  "iceland": {
    slug: "iceland",
    esSlug: "islandia",
    name: "Iceland",
    emoji: "🌋",
    iata: ["KEF"],
    countryEn: "Iceland, North Atlantic",
    description:
      "Icelandair stopover (up to 7 days free, no extra charge) makes Iceland an effective free layover on transatlantic itineraries.",
    bestMonths: ["June", "July", "August", "September", "March"],
    avgTemp: "-5 to 15°C",
    flightTime: "~3-4h from continental Europe",
    tips: [
      "Northern lights: Sept-March (cloud-clear nights)",
      "Midnight sun: June-July (24h daylight)",
      "Stopover free up to 7 nights with Icelandair or Play",
      "Rental car essential (Reykjavik = 6% of country)",
      "Eat at gas stations + supermarkets to keep budget sane",
    ],
    avgErrorFare: 220,
  },
};

const SITE_URL = "https://tripcazador.com";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(DESTINATIONS_EN).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dest = DESTINATIONS_EN[params.slug];
  if (!dest) return { title: "Destination not found" };
  const title = `Cheap flights to ${dest.name}`;
  const description = dest.description.slice(0, 155);
  return {
    title,
    description,
    alternates: {
      canonical: `/en/destinos/${dest.slug}`,
      languages: {
        en: `${SITE_URL}/en/destinos/${dest.slug}`,
        "es": `${SITE_URL}/destinos/${dest.esSlug}`,
        "x-default": `${SITE_URL}/destinos/${dest.esSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_US",
      url: `${SITE_URL}/en/destinos/${dest.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function DestEnPage({ params }: { params: { slug: string } }) {
  const dest = DESTINATIONS_EN[params.slug];
  if (!dest) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/en/destinos` },
      {
        "@type": "ListItem",
        position: 3,
        name: dest.name,
        item: `${SITE_URL}/en/destinos/${dest.slug}`,
      },
    ],
  };

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: dest.name,
    description: dest.description,
    inLanguage: "en-US",
    image: `${SITE_URL}/og-default.png`,
    url: `${SITE_URL}/en/destinos/${dest.slug}`,
    iataCode: dest.iata.join(", "),
  };

  // LONG_HAUL flag drives whether to show insurance CTA.
  const isLongHaul = !["KEF"].includes(dest.iata[0]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={placeJsonLd} />

      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
        <Link href="/en" className="hover:text-amber-300">
          Home
        </Link>
        {" / "}
        <Link href="/en/destinos" className="hover:text-amber-300">
          Destinations
        </Link>
        {" / "}
        <span className="text-gray-300">{dest.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 text-balance">
          {dest.emoji} Cheap flights to {dest.name}
        </h1>
        <p className="text-gray-300 max-w-3xl">{dest.description}</p>
        {dest.avgErrorFare && (
          <p className="mt-4 text-amber-300 font-semibold">
            Average mistake-fare spotted (last 90d):{" "}
            <span className="text-3xl">€{dest.avgErrorFare}</span>{" "}
            <span className="text-xs text-gray-400">economy round-trip from EU</span>
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Stat label="Country" value={dest.countryEn} />
        <Stat label="Average temperature" value={dest.avgTemp} />
        <Stat label="Flight time" value={dest.flightTime} />
        <Stat label="Airports" value={dest.iata.join(" · ")} />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Best months to fly</h2>
        <div className="flex flex-wrap gap-2">
          {dest.bestMonths.map((m) => (
            <span
              key={m}
              className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Hunter tips for {dest.name}</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          {dest.tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </section>

      {isLongHaul && (
        <section className="mb-10">
          <TravelInsuranceCTA variant="expanded" destination={dest.name} />
        </section>
      )}

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-2">Get notified the next time {dest.name} drops</h2>
        <p className="text-gray-300 mb-3">
          Our hunter scans this route every 4 hours. Subscribe to push alerts and get a notification
          within 60s when an error-fare hits below the historical low.
        </p>
        <Link
          href="/en"
          className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
        >
          Notify me
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Other popular destinations (EN)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {Object.values(DESTINATIONS_EN)
            .filter((d) => d.slug !== dest.slug)
            .slice(0, 9)
            .map((d) => (
              <Link
                key={d.slug}
                href={`/en/destinos/${d.slug}`}
                className="text-amber-300 hover:underline"
              >
                {d.emoji} {d.name}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-sm text-white mt-1 font-semibold">{value}</div>
    </div>
  );
}
