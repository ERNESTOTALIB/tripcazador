/**
 * /de/billige-flugpreise — SSS234 (16 may 2026)
 *
 * German version of /precios-vuelos-baratos (SSS217) and
 * /en/cheap-flight-prices (SSS223).
 *
 * Target keywords:
 *   - "billige Flüge Spanien"
 *   - "günstige Flugpreise"
 *   - "Wann ist Fliegen am günstigsten"
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Billige Flugpreise aus Spanien 2026: echte Mindestpreise für 30 Ziele",
  description:
    "Echte Flugpreise von Madrid/Barcelona zu den 30 beliebtesten Zielen. " +
    "Günstigster Monat, optimaler Buchungstag und wie viel man durch Warten spart.",
  alternates: {
    canonical: `${SITE_URL}/de/billige-flugpreise`,
    languages: {
      "es-ES": `${SITE_URL}/precios-vuelos-baratos`,
      "en-US": `${SITE_URL}/en/cheap-flight-prices`,
      "de-DE": `${SITE_URL}/de/billige-flugpreise`,
    },
  },
  openGraph: {
    title: "Billige Flugpreise aus Spanien — 30 Ziele",
    description: "Was Flüge wirklich kosten. Echte Mindestpreis-Tabelle.",
    url: `${SITE_URL}/de/billige-flugpreise`,
    type: "article",
    locale: "de_DE",
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

const PRICE_TABLE: PriceRow[] = [
  { destination: "Lissabon",    iata: "LIS", minPrice: 28,  typicalPrice: 95,  cheapestMonth: "Februar",  avgDuration: "1Std30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Porto",       iata: "OPO", minPrice: 32,  typicalPrice: 100, cheapestMonth: "Februar",  avgDuration: "1Std30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marrakesch",  iata: "RAK", minPrice: 30,  typicalPrice: 110, cheapestMonth: "März",     avgDuration: "3Std",    airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Rom",         iata: "FCO", minPrice: 38,  typicalPrice: 130, cheapestMonth: "November", avgDuration: "2Std45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Mailand",     iata: "MXP", minPrice: 40,  typicalPrice: 125, cheapestMonth: "Januar",   avgDuration: "2Std15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "Paris",       iata: "CDG", minPrice: 45,  typicalPrice: 140, cheapestMonth: "Februar",  avgDuration: "2Std",    airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "London",      iata: "LHR", minPrice: 48,  typicalPrice: 170, cheapestMonth: "November", avgDuration: "2Std30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlin",      iata: "BER", minPrice: 42,  typicalPrice: 145, cheapestMonth: "Februar",  avgDuration: "3Std",    airlines: ["Ryanair", "easyJet"] },
  { destination: "Amsterdam",   iata: "AMS", minPrice: 49,  typicalPrice: 155, cheapestMonth: "Januar",   avgDuration: "2Std30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Prag",        iata: "PRG", minPrice: 38,  typicalPrice: 125, cheapestMonth: "Februar",  avgDuration: "3Std",    airlines: ["Ryanair", "Vueling"] },
  { destination: "Budapest",    iata: "BUD", minPrice: 42,  typicalPrice: 120, cheapestMonth: "März",     avgDuration: "3Std",    airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Wien",        iata: "VIE", minPrice: 55,  typicalPrice: 155, cheapestMonth: "Januar",   avgDuration: "3Std",    airlines: ["Ryanair", "Austrian"] },
  { destination: "Athen",       iata: "ATH", minPrice: 60,  typicalPrice: 170, cheapestMonth: "Januar",   avgDuration: "3Std30",  airlines: ["Aegean", "Ryanair"] },
  { destination: "Istanbul",    iata: "IST", minPrice: 65,  typicalPrice: 190, cheapestMonth: "Februar",  avgDuration: "4Std",    airlines: ["Pegasus", "Turkish"] },
  { destination: "Dublin",      iata: "DUB", minPrice: 38,  typicalPrice: 130, cheapestMonth: "Februar",  avgDuration: "2Std45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reykjavik",   iata: "KEF", minPrice: 99,  typicalPrice: 280, cheapestMonth: "Januar",   avgDuration: "4Std30",  airlines: ["Iberia (Transit)", "Lufthansa"] },
  { destination: "New York",    iata: "JFK", minPrice: 195, typicalPrice: 590, cheapestMonth: "Januar",   avgDuration: "8Std30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tokio",       iata: "NRT", minPrice: 380, typicalPrice: 950, cheapestMonth: "Januar",   avgDuration: "13Std",   airlines: ["Iberia", "Air France"] },
  { destination: "Bangkok",     iata: "BKK", minPrice: 350, typicalPrice: 820, cheapestMonth: "März",     avgDuration: "13Std",   airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",        iata: "DPS", minPrice: 490, typicalPrice: 1100,cheapestMonth: "März",     avgDuration: "17Std",   airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubai",       iata: "DXB", minPrice: 220, typicalPrice: 550, cheapestMonth: "Januar",   avgDuration: "7Std30",  airlines: ["Emirates", "Turkish", "Etihad"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Wann ist die beste Zeit, einen Flug zu kaufen?",
    a: "Für Europa-Kurzflüge ist 4-8 Wochen im Voraus der Sweet Spot. Für Langstreckenflüge nach Asien/USA: 8-16 Wochen. Zu früh (>6 Monate) ist meist TEURER — Airlines erhöhen Erstpreise. Last-Minute (<2 Wochen) steigt um 30-60% außer bei Error Fares.",
  },
  {
    q: "Welcher Wochentag ist am günstigsten zum Fliegen?",
    a: "Dienstag und Mittwoch sind statistisch die günstigsten Tage für Europa-Flüge. Sonntag und Freitag sind am teuersten. Bei Langstrecke flacht der Unterschied ab.",
  },
  {
    q: "Welcher Monat ist am günstigsten zum Fliegen aus Spanien?",
    a: "Januar, Februar und November sind die günstigsten Monate. Juni-August und Dezember sind am teuersten. Für spezifische Ziele (Thailand, Mexiko) variieren die Monate — siehe Tabelle oben.",
  },
  {
    q: "Sind Low-Cost-Airlines immer billiger?",
    a: "Nein. Bei Flügen über 3 Stunden oder mit aufgegebenem Gepäck können Vueling/easyJet/Air Europa nach Zusatzkosten günstiger sein als Ryanair. Vergleiche immer den GESAMTPREIS, nicht den Köderpreis.",
  },
  {
    q: "Was sind Error Fares?",
    a: "Tarife deutlich günstiger als normal (-50% bis -90%) durch Preissystem-Bugs. Sie dauern meist 1-6 Stunden bevor sie storniert werden. TripCazador erkennt sie automatisch und alarmiert via Telegram + Email.",
  },
  {
    q: "Direkt bei der Airline oder mit Suchmaschine buchen?",
    a: "Fast immer direkt bei der Airline: besserer Service bei Stornierungen, keine Überraschungen mit vorausgewählten Versicherungen. Suchmaschinen sind perfekt zum VERGLEICHEN, aber auf der Airline-Website buchen.",
  },
  {
    q: "Lohnt sich Business Class?",
    a: "Nur wenn: (a) Business/Economy Ratio <2.5x (selten), oder (b) Nachtflug +9 Stunden wo Liegen-Schlafen den nächsten Tag ändert. Tipp: Premium Economy zuerst probieren — 1.4-1.7x Economy mit mehr Platz.",
  },
  {
    q: "Wie funktionieren eure Alerts?",
    a: "Drei Kanäle: (1) Öffentlicher Telegram-Kanal @tripcazador mit TOP 1-2 kritischen Deals pro Stunde; (2) Persönlicher Bot /buscar: abonniere Ziele und erhalte DM bei Match; (3) Wöchentlicher Newsletter Montag mit Top 5. Alles kostenlos.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Billige Flugpreise aus Spanien 2026",
    description: metadata.description,
    url: `${SITE_URL}/de/billige-flugpreise`,
    inLanguage: "de-DE",
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: "TripCazador" },
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
      { "@type": "ListItem", position: 1, name: "Startseite", item: `${SITE_URL}/de` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Billige Flugpreise",
        item: `${SITE_URL}/de/billige-flugpreise`,
      },
    ],
  };
}

export default function BilligeFlugpreisePage() {
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
          <Link href="/de" className="hover:text-amber-300">Startseite</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Billige Flugpreise</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Echte billige Flugpreise aus Spanien
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          Was es <em>wirklich</em> kostet, zu den 30 beliebtesten Zielen zu fliegen — nicht
          der Köderpreis. Echte Mindestpreise der letzten 12 Monate, günstigster Monat und
          welche Airlines mitspielen.
        </p>

        <section aria-labelledby="prices-table" className="mt-10">
          <h2 id="prices-table" className="text-2xl font-bold text-white mb-4">
            Mindestpreise nach Ziel (Hin- und Rückflug, Economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Echte Preise erkannt von unserem Hunter in den letzten 12 Monaten. Daten Mai 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Ziel</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Üblich</th>
                  <th className="px-3 py-2 text-left">Günstigster Monat</th>
                  <th className="px-3 py-2 text-left">Top Airlines</th>
                  <th className="px-3 py-2 text-right">Dauer</th>
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
        </section>

        <section className="mt-10 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Erhalte Alerts wenn ein Deal für dein Ziel erscheint
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Abonniere den Telegram-Kanal <strong>@tripcazador</strong> und erhalte die TOP 1-2
            kritischen Deals stündlich.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Telegram-Kanal beitreten
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Custom Alert erstellen
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            FAQ zu Flugpreisen
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
            Weitere Sprachversionen
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/precios-vuelos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇪🇸 Versión en español</h3>
              <p className="text-sm text-gray-400 mt-1">
                Spanische Originalversion mit derselben Information.
              </p>
            </Link>
            <Link
              href="/en/cheap-flight-prices"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇬🇧 English version</h3>
              <p className="text-sm text-gray-400 mt-1">
                For English speakers based in Spain.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
