import { Suspense } from "react";
import { getTopDeals, getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";

/**
 * English homepage — MVP launch for the EN market.
 *
 * Keep this file ≤ 250 lines. It should be a genuine EN rewrite (not an
 * auto-translation) so Google doesn't mark it as duplicate content.
 * Shared components (DealCard, JsonLd) stay — they render deal data that is
 * already language-neutral (prices, airport codes, IATA).
 */

export const metadata: Metadata = {
  title: "Error fares & cheap flights from Europe — TripCazador",
  description:
    "Automatic 24/7 tracking of mistake fares, business-class at economy prices, and the best flight deals across European airports.",
  alternates: {
    canonical: "/en",
    languages: {
      "en": "https://tripcazador.com/en",
      "es": "https://tripcazador.com/",
      "x-default": "https://tripcazador.com/",
    },
  },
};

// ISR: same refresh window as the Spanish home
export const revalidate = 300;

async function HeroStatsEN() {
  const data = await getDeals({ limit: 1 });
  const stats = data.stats;
  return (
    <div className="flex flex-wrap justify-center gap-8 text-center mt-10">
      <div>
        <div className="text-3xl font-bold text-amber-400 tabular-nums">
          {stats.total}
        </div>
        <div className="text-sm text-gray-300 mt-1">Active deals</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-amber-400 tabular-nums">
          {stats.price_min > 0 ? `€${stats.price_min.toFixed(0)}` : "—"}
        </div>
        <div className="text-sm text-gray-300 mt-1">Cheapest right now</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-amber-400 tabular-nums">
          {stats.verified_count}
        </div>
        <div className="text-sm text-gray-300 mt-1">Verified (2+ sources)</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-amber-400">24h</div>
        <div className="text-sm text-gray-300 mt-1">Refresh window</div>
      </div>
    </div>
  );
}

async function TopDealsEN() {
  const deals = await getTopDeals(9);
  if (!deals || deals.length === 0) {
    return (
      <div className="panel text-center py-16 px-6">
        <p className="text-2xl">🛰️</p>
        <p className="text-lg text-gray-200 mt-2">
          No active deals right now.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          The engine is scanning airports and carriers. Come back in a couple
          of hours, or subscribe to Telegram so you don&apos;t miss the next
          mistake fare.
        </p>
      </div>
    );
  }
  const featured = deals[0];
  const rest = deals.slice(1);
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full bg-amber-400 pulse-ring"
            aria-hidden="true"
          />
          Deal of the moment
        </h2>
        <div className="max-w-sm">
          <DealCard deal={featured} featured />
        </div>
      </div>
      {rest.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Latest catches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rest.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// FAQ in English for FAQPage schema + visible <details> (same contract as
// home.tsx — Google wants the Q&A visible in the DOM, not only in JSON-LD).
const HOME_FAQ_EN: Array<{ q: string; a: string }> = [
  {
    q: "What is an error fare?",
    a: "An error fare is an abnormally low price published by mistake by an airline or OTA (wrong currency conversion, missing taxes, glitch in the booking engine). TripCazador spots them by comparing live prices against the route's historical baseline and publishes them in seconds.",
  },
  {
    q: "How reliable are your deals?",
    a: "Every deal is cross-checked against at least two independent sources (Kiwi, Skyscanner, Ryanair direct, Travelpayouts, RapidAPI) before being flagged as 'verified'. Prices move fast, so book quickly and always confirm on the airline's own website before paying.",
  },
  {
    q: "Which airports do you scan?",
    a: "We track 312 airports worldwide, with strong coverage of the DACH region (Switzerland, Germany, Austria), Spain and the UK. Main hubs include BSL, ZRH, GVA, FRA, MUC, BER, VIE, LHR, MAD, BCN and AGP.",
  },
  {
    q: "What does 'business at economy price' mean?",
    a: "Business-class tickets selling under €500 on long-haul routes where the normal price is €2,000–€5,000. We prioritise intercontinental flights (Europe to Asia, the Americas, Africa) with premium cabins mispriced at economy-level fares.",
  },
  {
    q: "Do you charge for alerts?",
    a: "The Telegram channel and the website are free. We fund the engine with affiliate commissions when you book through our links — at no extra cost to you. We never share personal data with airlines or advertisers.",
  },
  {
    q: "How often are deals refreshed?",
    a: "The engine runs in parallel every 6 hours (four cycles per day). Critical error fares hit Telegram within 60 seconds of detection, before airlines patch the price.",
  },
];

export default async function EnHomePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "en",
    mainEntity: HOME_FAQ_EN.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="space-y-16">
      <JsonLd data={faqSchema} />

      {/* Language toggle — lets EN visitors switch back to ES without going
          through the navbar (which is still in Spanish). */}
      <div className="text-right text-sm -mb-8">
        <a
          href="/"
          hrefLang="es"
          className="text-gray-400 hover:text-amber-400 transition-colors"
          aria-label="Switch to Spanish"
        >
          🇪🇸 Español
        </a>
      </div>

      <section className="hero-map text-center py-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-4">
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
            aria-hidden="true"
          />
          Engine live — scanning airports in real time
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          The automatic hunter for{" "}
          <br />
          <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">
            flight deals
          </span>
        </h1>

        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Error fares, business class at economy prices and the best flight
          deals from European airports. 750+ airlines scanned 24/7.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <a
            href="/deals"
            className="px-6 py-3 btn-gradient text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            Browse all deals →
          </a>
          <a
            href="/deals?classification=CR%C3%8DTICO"
            className="px-6 py-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            🔥 Only error fares
          </a>
          <a
            href="/deals?cabin=business"
            className="px-6 py-3 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            👑 Cheap business
          </a>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center gap-8 mt-10">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse text-center">
                  <div className="h-8 w-16 bg-gray-800 rounded mx-auto" />
                  <div className="h-4 w-24 bg-gray-800 rounded mt-2 mx-auto" />
                </div>
              ))}
            </div>
          }
        >
          <HeroStatsEN />
        </Suspense>
      </section>

      <section>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-gray-900 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <TopDealsEN />
        </Suspense>
      </section>

      <section className="panel p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            How TripCazador works
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            An engine that never sleeps, watching prices between 80+ airports
            and 750+ airlines. When it spots a deal, you hear about it first.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              n: "01",
              t: "24/7 scanning",
              d: "The engine sweeps Kiwi, Skyscanner, Ryanair direct, Travelpayouts and RapidAPI every 6 hours.",
            },
            {
              n: "02",
              t: "Smart detection",
              d: "An algorithm compares against route history and flags mistake fares and statistical anomalies.",
            },
            {
              n: "03",
              t: "Instant alert",
              d: "CRITICAL deals are pushed to the Telegram channel within seconds — before the airline reprices.",
            },
          ].map((s) => (
            <div key={s.n} className="glass rounded-xl p-5 card-hover">
              <div className="text-amber-400 font-mono text-sm">{s.n}</div>
              <div className="text-white font-semibold mt-2">{s.t}</div>
              <p className="text-sm text-gray-300 mt-2">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <a
            href="/telegram"
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            📣 Join the Telegram channel
          </a>
        </div>
      </section>

      <section className="panel p-6 sm:p-10 space-y-5">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Frequently asked questions
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            The most common questions about error fares, alerts and how
            TripCazador works.
          </p>
        </div>
        <div className="space-y-3 max-w-3xl mx-auto">
          {HOME_FAQ_EN.map(({ q, a }, idx) => (
            <details
              key={q}
              className="group glass rounded-xl p-4 sm:p-5 cursor-pointer focus-within:ring-2 focus-within:ring-amber-400/40"
              open={idx === 0}
            >
              <summary className="font-semibold text-white list-none flex items-start justify-between gap-4 min-h-[44px] items-center">
                <span className="text-base sm:text-lg">{q}</span>
                <span
                  aria-hidden="true"
                  className="text-amber-400 text-xl transition-transform group-open:rotate-45 shrink-0"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
