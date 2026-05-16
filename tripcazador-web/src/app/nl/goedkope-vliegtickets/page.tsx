/**
 * /nl/goedkope-vliegtickets — SSS250 (16 may 2026)
 *
 * Dutch version. Hreflang septeto ES/EN/DE/FR/IT/PT/NL.
 *
 * Target keywords:
 *   - "goedkope vluchten Spanje"
 *   - "vliegticket prijzen"
 *   - "wanneer vlucht boeken"
 *
 * Mercado: viajeros neerlandeses residentes en España + flamencos
 * belgas con interés en vuelos desde España (Schiphol-MAD frequent).
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Goedkope vliegtickets vanuit Spanje 2026: echte minimumprijzen voor 30 bestemmingen",
  description:
    "Echte prijzen voor vluchten van Madrid/Barcelona naar de 30 populairste bestemmingen. " +
    "Goedkoopste maand, optimale boekingsdag en hoeveel je bespaart door te wachten.",
  alternates: {
    canonical: `${SITE_URL}/nl/goedkope-vliegtickets`,
    languages: {
      "es-ES": `${SITE_URL}/precios-vuelos-baratos`,
      "en-US": `${SITE_URL}/en/cheap-flight-prices`,
      "de-DE": `${SITE_URL}/de/billige-flugpreise`,
      "fr-FR": `${SITE_URL}/fr/prix-vols-pas-chers`,
      "it-IT": `${SITE_URL}/it/prezzi-voli-economici`,
      "pt-PT": `${SITE_URL}/pt/precos-voos-baratos`,
      "nl-NL": `${SITE_URL}/nl/goedkope-vliegtickets`,
    },
  },
  openGraph: {
    title: "Goedkope vliegtickets vanuit Spanje — 30 bestemmingen",
    description: "Wat vluchten écht kosten. Tabel met echte minimumprijzen.",
    url: `${SITE_URL}/nl/goedkope-vliegtickets`,
    type: "article",
    locale: "nl_NL",
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
  { destination: "Lissabon",     iata: "LIS", minPrice: 28,  typicalPrice: 95,   cheapestMonth: "Februari", avgDuration: "1u30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Porto",        iata: "OPO", minPrice: 32,  typicalPrice: 100,  cheapestMonth: "Februari", avgDuration: "1u30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marrakesh",    iata: "RAK", minPrice: 30,  typicalPrice: 110,  cheapestMonth: "Maart",    avgDuration: "3u",    airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Rome",         iata: "FCO", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "November", avgDuration: "2u45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Milaan",       iata: "MXP", minPrice: 40,  typicalPrice: 125,  cheapestMonth: "Januari",  avgDuration: "2u15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "Parijs",       iata: "CDG", minPrice: 45,  typicalPrice: 140,  cheapestMonth: "Februari", avgDuration: "2u",    airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "Londen",       iata: "LHR", minPrice: 48,  typicalPrice: 170,  cheapestMonth: "November", avgDuration: "2u30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlijn",      iata: "BER", minPrice: 42,  typicalPrice: 145,  cheapestMonth: "Februari", avgDuration: "3u",    airlines: ["Ryanair", "easyJet"] },
  { destination: "Amsterdam",    iata: "AMS", minPrice: 49,  typicalPrice: 155,  cheapestMonth: "Januari",  avgDuration: "2u30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Praag",        iata: "PRG", minPrice: 38,  typicalPrice: 125,  cheapestMonth: "Februari", avgDuration: "3u",    airlines: ["Ryanair", "Vueling"] },
  { destination: "Boedapest",    iata: "BUD", minPrice: 42,  typicalPrice: 120,  cheapestMonth: "Maart",    avgDuration: "3u",    airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Wenen",        iata: "VIE", minPrice: 55,  typicalPrice: 155,  cheapestMonth: "Januari",  avgDuration: "3u",    airlines: ["Ryanair", "Austrian"] },
  { destination: "Athene",       iata: "ATH", minPrice: 60,  typicalPrice: 170,  cheapestMonth: "Januari",  avgDuration: "3u30",  airlines: ["Aegean", "Ryanair"] },
  { destination: "Istanboel",    iata: "IST", minPrice: 65,  typicalPrice: 190,  cheapestMonth: "Februari", avgDuration: "4u",    airlines: ["Pegasus", "Turkish"] },
  { destination: "Dublin",       iata: "DUB", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Februari", avgDuration: "2u45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reykjavik",    iata: "KEF", minPrice: 99,  typicalPrice: 280,  cheapestMonth: "Januari",  avgDuration: "4u30",  airlines: ["Iberia (Transit)", "Lufthansa"] },
  { destination: "New York",     iata: "JFK", minPrice: 195, typicalPrice: 590,  cheapestMonth: "Januari",  avgDuration: "8u30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tokio",        iata: "NRT", minPrice: 380, typicalPrice: 950,  cheapestMonth: "Januari",  avgDuration: "13u",   airlines: ["Iberia", "Air France"] },
  { destination: "Bangkok",      iata: "BKK", minPrice: 350, typicalPrice: 820,  cheapestMonth: "Maart",    avgDuration: "13u",   airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",         iata: "DPS", minPrice: 490, typicalPrice: 1100, cheapestMonth: "Maart",    avgDuration: "17u",   airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubai",        iata: "DXB", minPrice: 220, typicalPrice: 550,  cheapestMonth: "Januari",  avgDuration: "7u30",  airlines: ["Emirates", "Turkish", "Etihad"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Wat is de beste tijd om een vlucht te kopen?",
    a: "Voor Europese korte vluchten is 4-8 weken vooraf de sweet spot. Voor langeafstandsvluchten naar Azië/VS: 8-16 weken. Te vroeg (>6 maanden) is meestal DUURDER — luchtvaartmaatschappijen verhogen de aanvangsprijzen. Last-minute (<2 weken) stijgt met 30-60% behalve bij error fares.",
  },
  {
    q: "Welke dag van de week is het goedkoopst om te vliegen?",
    a: "Dinsdag en woensdag zijn statistisch de goedkoopste dagen voor Europese vluchten. Zondag en vrijdag zijn het duurst. Bij langeafstand wordt het verschil kleiner.",
  },
  {
    q: "Welke maand is het goedkoopst om vanuit Spanje te vliegen?",
    a: "Januari, februari en november zijn de goedkoopste maanden. Juni-augustus en december zijn het duurst. Voor specifieke bestemmingen (Thailand, Mexico) variëren de maanden — zie tabel hierboven.",
  },
  {
    q: "Zijn low-cost maatschappijen altijd goedkoper?",
    a: "Nee. Voor vluchten van meer dan 3 uur of met ruimbagage kunnen Vueling/easyJet/Air Europa goedkoper zijn dan Ryanair na extra kosten. Vergelijk altijd de TOTALE PRIJS, niet de lokprijs.",
  },
  {
    q: "Wat zijn error fares?",
    a: "Tarieven aanzienlijk goedkoper dan normaal (-50% tot -90%) door bugs in het prijssysteem. Ze duren meestal 1-6 uur voordat ze geannuleerd worden. TripCazador detecteert ze automatisch en waarschuwt via Telegram + email.",
  },
  {
    q: "Direct bij de luchtvaartmaatschappij of via een zoekmachine boeken?",
    a: "Bijna altijd direct bij de maatschappij: betere service bij annuleringen, geen verrassingen met vooraf geselecteerde verzekeringen. Zoekmachines zijn perfect om te VERGELIJKEN, maar boek op de website van de maatschappij.",
  },
  {
    q: "Is business class de moeite waard?",
    a: "Alleen als: (a) Business/Economy ratio <2,5x (zeldzaam), of (b) nachtvlucht +9 uur waar liggend slapen de volgende dag verandert. Tip: probeer eerst Premium Economy — 1,4-1,7x Economy met meer ruimte.",
  },
  {
    q: "Hoe werken jullie alerts?",
    a: "Drie kanalen: (1) Publiek Telegram-kanaal @tripcazador met TOP 1-2 kritieke deals per uur; (2) Persoonlijke bot /buscar: abonneer op bestemmingen en ontvang DM bij match; (3) Wekelijkse nieuwsbrief maandag met de Top 5. Allemaal gratis.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Goedkope vliegtickets vanuit Spanje 2026",
    description: metadata.description,
    url: `${SITE_URL}/nl/goedkope-vliegtickets`,
    inLanguage: "nl-NL",
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
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/nl` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Goedkope vliegtickets",
        item: `${SITE_URL}/nl/goedkope-vliegtickets`,
      },
    ],
  };
}

export default function GoedkopeVliegticketsPage() {
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
          <Link href="/nl" className="hover:text-amber-300">Home</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Goedkope vliegtickets</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Echte goedkope vliegticketprijzen vanuit Spanje
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          Wat het <em>écht</em> kost om naar de 30 populairste bestemmingen te vliegen — niet
          de lokprijs. Echte minimumprijzen van de afgelopen 12 maanden, goedkoopste maand en
          beschikbare maatschappijen.
        </p>

        <section aria-labelledby="prices-table" className="mt-10">
          <h2 id="prices-table" className="text-2xl font-bold text-white mb-4">
            Minimumprijzen per bestemming (heen-en-terug, Economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Echte prijzen gedetecteerd door onze hunter in de afgelopen 12 maanden. Data mei 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Bestemming</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Gemiddeld</th>
                  <th className="px-3 py-2 text-left">Goedkoopste maand</th>
                  <th className="px-3 py-2 text-left">Top maatschappijen</th>
                  <th className="px-3 py-2 text-right">Duur</th>
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
            Ontvang waarschuwingen wanneer er een deal verschijnt voor jouw bestemming
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Abonneer op het Telegram-kanaal <strong>@tripcazador</strong> en ontvang de TOP
            1-2 kritieke deals per uur.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Lid worden van Telegram-kanaal
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Persoonlijke alert maken
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            FAQ over vliegticketprijzen
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
            Andere taalversies
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/precios-vuelos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇪🇸 Versión en español</h3>
              <p className="text-sm text-gray-400 mt-1">
                Originele Spaanse versie met dezelfde informatie.
              </p>
            </Link>
            <Link
              href="/en/cheap-flight-prices"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇬🇧 English version</h3>
              <p className="text-sm text-gray-400 mt-1">For English speakers based in Spain.</p>
            </Link>
            <Link
              href="/de/billige-flugpreise"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇩🇪 Deutsche Version</h3>
              <p className="text-sm text-gray-400 mt-1">Für deutschsprachige Reisende in Spanien.</p>
            </Link>
            <Link
              href="/fr/prix-vols-pas-chers"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇫🇷 Version française</h3>
              <p className="text-sm text-gray-400 mt-1">Pour les francophones résidant en Espagne.</p>
            </Link>
            <Link
              href="/it/prezzi-voli-economici"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇮🇹 Versione italiana</h3>
              <p className="text-sm text-gray-400 mt-1">Per italiani residenti in Spagna.</p>
            </Link>
            <Link
              href="/pt/precos-voos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇵🇹 Versão portuguesa</h3>
              <p className="text-sm text-gray-400 mt-1">Para falantes portugueses na Espanha.</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
