/**
 * /en/cheap-flight-prices — SSS223 (May 2026)
 *
 * English-language counterpart of /precios-vuelos-baratos (SSS217).
 * Target keywords:
 *   - "cheap flight prices Spain"
 *   - "how much do flights cost"
 *   - "cheapest month to fly Spain"
 *
 * Server component, FAQ schema, hreflang to /precios-vuelos-baratos.
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Cheap flight prices from Spain 2026: real minimums for 30 destinations",
  description:
    "Real flight prices from Madrid/Barcelona to the 30 most popular destinations. " +
    "Cheapest month, optimal booking day, and how much waiting saves vs booking now.",
  alternates: {
    canonical: `${SITE_URL}/en/cheap-flight-prices`,
    languages: {
      "es-ES": `${SITE_URL}/precios-vuelos-baratos`,
      "en-US": `${SITE_URL}/en/cheap-flight-prices`,
      "de-DE": `${SITE_URL}/de/billige-flugpreise`,
      "fr-FR": `${SITE_URL}/fr/prix-vols-pas-chers`,
      "it-IT": `${SITE_URL}/it/prezzi-voli-economici`,
      "pt-PT": `${SITE_URL}/pt/precos-voos-baratos`,
      "nl-NL": `${SITE_URL}/nl/goedkope-vliegtickets`,
      "pl-PL": `${SITE_URL}/pl/tanie-bilety-lotnicze`,
    },
  },
  openGraph: {
    title: "Cheap flight prices from Spain — 30 destinations",
    description: "What flights actually cost. Real minimums table + booking tips.",
    url: `${SITE_URL}/en/cheap-flight-prices`,
    type: "article",
    locale: "en_US",
  },
};

interface PriceRow {
  destination: string;
  iata: string;
  minPrice: number;
  typicalPrice: number;
  cheapestMonth: string;
  avgDuration: string;
  airlines: string[];
}

// SSS223: same data as ES version, just localized labels
const PRICE_TABLE: PriceRow[] = [
  { destination: "Lisbon",      iata: "LIS", minPrice: 28,  typicalPrice: 95,  cheapestMonth: "February", avgDuration: "1h30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Porto",       iata: "OPO", minPrice: 32,  typicalPrice: 100, cheapestMonth: "February", avgDuration: "1h30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marrakech",   iata: "RAK", minPrice: 30,  typicalPrice: 110, cheapestMonth: "March",    avgDuration: "3h00",  airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Rome",        iata: "FCO", minPrice: 38,  typicalPrice: 130, cheapestMonth: "November", avgDuration: "2h45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Milan",       iata: "MXP", minPrice: 40,  typicalPrice: 125, cheapestMonth: "January",  avgDuration: "2h15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "Paris",       iata: "CDG", minPrice: 45,  typicalPrice: 140, cheapestMonth: "February", avgDuration: "2h00",  airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "London",      iata: "LHR", minPrice: 48,  typicalPrice: 170, cheapestMonth: "November", avgDuration: "2h30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlin",      iata: "BER", minPrice: 42,  typicalPrice: 145, cheapestMonth: "February", avgDuration: "3h00",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Amsterdam",   iata: "AMS", minPrice: 49,  typicalPrice: 155, cheapestMonth: "January",  avgDuration: "2h30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Prague",      iata: "PRG", minPrice: 38,  typicalPrice: 125, cheapestMonth: "February", avgDuration: "3h00",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Budapest",    iata: "BUD", minPrice: 42,  typicalPrice: 120, cheapestMonth: "March",    avgDuration: "3h00",  airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Vienna",      iata: "VIE", minPrice: 55,  typicalPrice: 155, cheapestMonth: "January",  avgDuration: "3h00",  airlines: ["Ryanair", "Austrian"] },
  { destination: "Athens",      iata: "ATH", minPrice: 60,  typicalPrice: 170, cheapestMonth: "January",  avgDuration: "3h30",  airlines: ["Aegean", "Ryanair", "Vueling"] },
  { destination: "Istanbul",    iata: "IST", minPrice: 65,  typicalPrice: 190, cheapestMonth: "February", avgDuration: "4h00",  airlines: ["Pegasus", "Turkish", "Vueling"] },
  { destination: "Dublin",      iata: "DUB", minPrice: 38,  typicalPrice: 130, cheapestMonth: "February", avgDuration: "2h45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reykjavik",   iata: "KEF", minPrice: 99,  typicalPrice: 280, cheapestMonth: "January",  avgDuration: "4h30",  airlines: ["Iberia (transit)", "Lufthansa"] },
  { destination: "New York",    iata: "JFK", minPrice: 195, typicalPrice: 590, cheapestMonth: "January",  avgDuration: "8h30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tokyo",       iata: "NRT", minPrice: 380, typicalPrice: 950, cheapestMonth: "January",  avgDuration: "13h00", airlines: ["Iberia (LATAM)", "Air France", "Lufthansa"] },
  { destination: "Bangkok",     iata: "BKK", minPrice: 350, typicalPrice: 820, cheapestMonth: "March",    avgDuration: "13h00", airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",        iata: "DPS", minPrice: 490, typicalPrice: 1100,cheapestMonth: "March",    avgDuration: "17h00", airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubai",       iata: "DXB", minPrice: 220, typicalPrice: 550, cheapestMonth: "January",  avgDuration: "7h30",  airlines: ["Emirates", "Turkish", "Etihad"] },
  { destination: "Buenos Aires",iata: "EZE", minPrice: 480, typicalPrice: 1050,cheapestMonth: "May",      avgDuration: "13h30", airlines: ["Aerolíneas Arg.", "Air Europa", "Iberia"] },
  { destination: "Rio",         iata: "GIG", minPrice: 420, typicalPrice: 980, cheapestMonth: "May",      avgDuration: "11h00", airlines: ["LATAM", "Iberia", "Air Europa"] },
  { destination: "Mexico City", iata: "MEX", minPrice: 380, typicalPrice: 880, cheapestMonth: "May",      avgDuration: "11h30", airlines: ["Iberia", "Aeromexico", "Air Europa"] },
  { destination: "Cancun",      iata: "CUN", minPrice: 350, typicalPrice: 880, cheapestMonth: "May",      avgDuration: "11h00", airlines: ["Iberojet", "TUI", "Air Europa"] },
  { destination: "Miami",       iata: "MIA", minPrice: 280, typicalPrice: 720, cheapestMonth: "May",      avgDuration: "9h30",  airlines: ["Iberia", "Air Europa", "American"] },
  { destination: "Tel Aviv",    iata: "TLV", minPrice: 130, typicalPrice: 340, cheapestMonth: "February", avgDuration: "4h45",  airlines: ["El Al", "Iberia"] },
  { destination: "Singapore",   iata: "SIN", minPrice: 480, typicalPrice: 1120,cheapestMonth: "March",    avgDuration: "14h00", airlines: ["Singapore", "Qatar", "Emirates"] },
  { destination: "Seoul",       iata: "ICN", minPrice: 450, typicalPrice: 1000,cheapestMonth: "February", avgDuration: "14h30", airlines: ["Korean Air", "Lufthansa", "Air France"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "When is the cheapest time to buy a flight?",
    a: "For short European flights, 4-8 weeks ahead is the sweet spot. For transatlantic flights to USA/Asia, 8-16 weeks ahead. Booking too early (>6 months) is usually MORE expensive — airlines inflate initial fares. Last-minute (<2 weeks) jumps 30-60% except for error fares.",
  },
  {
    q: "What day of the week is cheapest to fly?",
    a: "Statistically: Tuesdays and Wednesdays are the cheapest days for European flights. Sundays and Fridays are the most expensive (when everyone returns or leaves for weekends). For long-haul the difference flattens out: the season matters more than the day.",
  },
  {
    q: "Which month is cheapest to fly from Spain?",
    a: "January, February and November are the cheapest months. June-August and December are the most expensive. For specific destinations (Thailand, Mexico) months differ: see the table above (Cheapest month column).",
  },
  {
    q: "Are low-cost airlines always cheaper?",
    a: "No. For flights longer than 3h or with checked bag, Vueling/easyJet/Air Europa can end up cheaper than Ryanair after adding fees (seat, baggage). For 1-2h no-bag flights, Ryanair almost always wins. Trick: always compare TOTAL price including extras, not the bait price.",
  },
  {
    q: "What are error fares?",
    a: "Fares much cheaper than normal (-50% to -90%) that appear due to airline pricing system bugs. Usually last 1-6 hours before being cancelled. TripCazador auto-detects and alerts via Telegram + email — these are the most coveted deals.",
  },
  {
    q: "Book direct with airline or with a search engine?",
    a: "Almost always with the airline directly: better service for cancellations, no surprises with pre-selected optional insurance. Search engines like Skyscanner/Aviasales are perfect for COMPARING, but click 'Book' on the airline's site when possible.",
  },
  {
    q: "Is Business class worth it?",
    a: "Only if: (a) the Business/Economy ratio is <2.5x (rare), or (b) night flight +9 hours where sleeping flat changes your next day. Tip: try Premium Economy first — usually costs 1.4-1.7x Economy and gives much more space.",
  },
  {
    q: "How do your alerts work?",
    a: "Three channels: (1) public Telegram channel @tripcazador with TOP 1-2 critical deals every hour; (2) personal bot /buscar: subscribe to destinations and receive DM when match appears; (3) weekly Monday newsletter with top 5. All free.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Cheap flight prices from Spain 2026",
    description: metadata.description,
    url: `${SITE_URL}/en/cheap-flight-prices`,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      url: SITE_URL,
      name: "TripCazador",
    },
  };
}

function faqJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function breadcrumbJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cheap flight prices",
        item: `${SITE_URL}/en/cheap-flight-prices`,
      },
    ],
  };
}

export default function CheapFlightPricesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(priceJsonLd()) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd()) }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-gray-400">
          <Link href="/en" className="hover:text-amber-300">Home</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Cheap flight prices</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Real cheap flight prices from Spain
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          What it <em>actually</em> costs to fly to the 30 most popular destinations — not the
          bait price. Minimums seen in the last 12 months, cheapest month, and which airlines
          play the game.
        </p>

        <section aria-labelledby="prices-table" className="mt-10">
          <h2 id="prices-table" className="text-2xl font-bold text-white mb-4">
            Minimum prices by destination (round-trip, economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Real prices detected by our hunter in the last 12 months. Average fares in high
            season for comparison. Data updated May 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Destination</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Typical</th>
                  <th className="px-3 py-2 text-left">Cheapest month</th>
                  <th className="px-3 py-2 text-left">Top airlines</th>
                  <th className="px-3 py-2 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {PRICE_TABLE.map((r) => (
                  <tr key={r.iata + r.destination} className="hover:bg-gray-900/40 transition-colors">
                    <td className="px-3 py-2 font-semibold text-white">
                      {r.destination}{" "}
                      <span className="text-[10px] text-gray-500 font-mono">({r.iata})</span>
                    </td>
                    <td className="px-3 py-2 text-right text-amber-400 font-bold">
                      €{r.minPrice}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">€{r.typicalPrice}</td>
                    <td className="px-3 py-2 text-gray-300">{r.cheapestMonth}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs">{r.airlines.join(", ")}</td>
                    <td className="px-3 py-2 text-right text-gray-400 text-xs">{r.avgDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            <strong className="text-amber-400">Min</strong> = lowest real fare seen in the last 12
            months (typical = high-season median). <em>Error fares</em> can drop below 50% of min.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Get alerts when a deal appears for your destination
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Subscribe to the Telegram channel <strong>@tripcazador</strong> and get TOP 1-2
            critical deals every hour. Or use our personal bot with{" "}
            <code className="px-1.5 py-0.5 rounded bg-gray-800 text-amber-300 text-xs">
              /buscar Tokyo september
            </code>{" "}
            and receive a DM only when there's a match for your destination.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Join Telegram channel
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Create custom alert
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            Flight prices FAQ
          </h2>
          <div className="space-y-4">
            {FAQS.map((f, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 open:border-amber-500/40"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-3 font-semibold text-white">
                  <span>{f.q}</span>
                  <span className="text-amber-400 text-xl leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="related" className="mt-12">
          <h2 id="related" className="text-2xl font-bold text-white mb-4">
            More TripCazador guides
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/deals"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🔥 Live deals right now</h3>
              <p className="text-sm text-gray-400 mt-1">
                See real deals detected in the last 4h by the hunter.
              </p>
            </Link>
            <Link
              href="/en/blog"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">📚 Cheap flights blog (English)</h3>
              <p className="text-sm text-gray-400 mt-1">
                Long-haul guides, error fares, baggage hacks.
              </p>
            </Link>
            <Link
              href="/precios-vuelos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇪🇸 Versión en español</h3>
              <p className="text-sm text-gray-400 mt-1">
                Si prefieres leerlo en español, esta página tiene la misma información.
              </p>
            </Link>
            <Link
              href="/hoteles"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🏨 Cheap hotels</h3>
              <p className="text-sm text-gray-400 mt-1">
                Capital city hotels from €38/night. Booking partner.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
