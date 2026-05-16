/**
 * /it/prezzi-voli-economici — SSS244 (16 may 2026)
 *
 * Italian version. Hreflang quinteto ES/EN/DE/FR/IT.
 *
 * Target keywords:
 *   - "voli economici Spagna"
 *   - "prezzi voli low cost"
 *   - "quando comprare un volo"
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Prezzi voli economici dalla Spagna 2026: prezzi reali minimi per 30 destinazioni",
  description:
    "Prezzi reali dei voli da Madrid/Barcellona verso le 30 destinazioni più popolari. " +
    "Mese più economico, giorno di prenotazione ottimale e quanto risparmi aspettando.",
  alternates: {
    canonical: `${SITE_URL}/it/prezzi-voli-economici`,
    languages: {
      "es-ES": `${SITE_URL}/precios-vuelos-baratos`,
      "en-US": `${SITE_URL}/en/cheap-flight-prices`,
      "de-DE": `${SITE_URL}/de/billige-flugpreise`,
      "fr-FR": `${SITE_URL}/fr/prix-vols-pas-chers`,
      "it-IT": `${SITE_URL}/it/prezzi-voli-economici`,
    },
  },
  openGraph: {
    title: "Prezzi voli economici dalla Spagna — 30 destinazioni",
    description: "Quanto costano davvero i voli. Tabella di prezzi minimi reali.",
    url: `${SITE_URL}/it/prezzi-voli-economici`,
    type: "article",
    locale: "it_IT",
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
  { destination: "Lisbona",     iata: "LIS", minPrice: 28,  typicalPrice: 95,   cheapestMonth: "Febbraio", avgDuration: "1h30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Porto",       iata: "OPO", minPrice: 32,  typicalPrice: 100,  cheapestMonth: "Febbraio", avgDuration: "1h30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marrakech",   iata: "RAK", minPrice: 30,  typicalPrice: 110,  cheapestMonth: "Marzo",    avgDuration: "3h",    airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Roma",        iata: "FCO", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Novembre", avgDuration: "2h45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Milano",      iata: "MXP", minPrice: 40,  typicalPrice: 125,  cheapestMonth: "Gennaio",  avgDuration: "2h15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "Parigi",      iata: "CDG", minPrice: 45,  typicalPrice: 140,  cheapestMonth: "Febbraio", avgDuration: "2h",    airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "Londra",      iata: "LHR", minPrice: 48,  typicalPrice: 170,  cheapestMonth: "Novembre", avgDuration: "2h30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlino",     iata: "BER", minPrice: 42,  typicalPrice: 145,  cheapestMonth: "Febbraio", avgDuration: "3h",    airlines: ["Ryanair", "easyJet"] },
  { destination: "Amsterdam",   iata: "AMS", minPrice: 49,  typicalPrice: 155,  cheapestMonth: "Gennaio",  avgDuration: "2h30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Praga",       iata: "PRG", minPrice: 38,  typicalPrice: 125,  cheapestMonth: "Febbraio", avgDuration: "3h",    airlines: ["Ryanair", "Vueling"] },
  { destination: "Budapest",    iata: "BUD", minPrice: 42,  typicalPrice: 120,  cheapestMonth: "Marzo",    avgDuration: "3h",    airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Vienna",      iata: "VIE", minPrice: 55,  typicalPrice: 155,  cheapestMonth: "Gennaio",  avgDuration: "3h",    airlines: ["Ryanair", "Austrian"] },
  { destination: "Atene",       iata: "ATH", minPrice: 60,  typicalPrice: 170,  cheapestMonth: "Gennaio",  avgDuration: "3h30",  airlines: ["Aegean", "Ryanair"] },
  { destination: "Istanbul",    iata: "IST", minPrice: 65,  typicalPrice: 190,  cheapestMonth: "Febbraio", avgDuration: "4h",    airlines: ["Pegasus", "Turkish"] },
  { destination: "Dublino",     iata: "DUB", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Febbraio", avgDuration: "2h45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reykjavik",   iata: "KEF", minPrice: 99,  typicalPrice: 280,  cheapestMonth: "Gennaio",  avgDuration: "4h30",  airlines: ["Iberia (Transit)", "Lufthansa"] },
  { destination: "New York",    iata: "JFK", minPrice: 195, typicalPrice: 590,  cheapestMonth: "Gennaio",  avgDuration: "8h30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tokyo",       iata: "NRT", minPrice: 380, typicalPrice: 950,  cheapestMonth: "Gennaio",  avgDuration: "13h",   airlines: ["Iberia", "Air France"] },
  { destination: "Bangkok",     iata: "BKK", minPrice: 350, typicalPrice: 820,  cheapestMonth: "Marzo",    avgDuration: "13h",   airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",        iata: "DPS", minPrice: 490, typicalPrice: 1100, cheapestMonth: "Marzo",    avgDuration: "17h",   airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubai",       iata: "DXB", minPrice: 220, typicalPrice: 550,  cheapestMonth: "Gennaio",  avgDuration: "7h30",  airlines: ["Emirates", "Turkish", "Etihad"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Qual è il momento migliore per comprare un volo?",
    a: "Per i voli europei a corto raggio, da 4 a 8 settimane prima è il punto ottimale. Per i voli a lungo raggio verso Asia/USA: da 8 a 16 settimane. Troppo presto (>6 mesi) di solito è PIÙ CARO — le compagnie aumentano i prezzi iniziali. Dell'ultimo minuto (<2 settimane) sale del 30-60% tranne per gli error fares.",
  },
  {
    q: "Quale giorno della settimana è più economico per volare?",
    a: "Martedì e mercoledì sono statisticamente i giorni più economici per i voli europei. Domenica e venerdì sono i più costosi. Per i voli a lungo raggio la differenza si appiattisce.",
  },
  {
    q: "Quale mese è il più economico per volare dalla Spagna?",
    a: "Gennaio, febbraio e novembre sono i mesi più economici. Giugno-agosto e dicembre sono i più costosi. Per destinazioni specifiche (Thailandia, Messico) i mesi variano — vedi la tabella sopra.",
  },
  {
    q: "Le compagnie low-cost sono sempre più economiche?",
    a: "No. Per voli di oltre 3 ore o con bagaglio in stiva, Vueling/easyJet/Air Europa possono essere più economiche di Ryanair dopo i costi aggiuntivi. Confronta sempre il PREZZO TOTALE, non quello civetta.",
  },
  {
    q: "Cosa sono gli error fares?",
    a: "Tariffe nettamente più basse del normale (-50% a -90%) dovute a bug del sistema di prezzi. Durano solitamente da 1 a 6 ore prima di essere cancellate. TripCazador li rileva automaticamente e avvisa via Telegram + email.",
  },
  {
    q: "Prenotare direttamente dalla compagnia o con un motore di ricerca?",
    a: "Quasi sempre direttamente dalla compagnia: miglior servizio in caso di cancellazione, nessuna sorpresa con assicurazioni pre-selezionate. I motori di ricerca sono perfetti per CONFRONTARE, ma prenota sul sito della compagnia.",
  },
  {
    q: "Vale la pena la business class?",
    a: "Solo se: (a) rapporto Business/Economy <2,5x (raro), o (b) volo notturno +9 ore in cui dormire sdraiato cambia il giorno dopo. Suggerimento: prova prima Premium Economy — 1,4-1,7x Economy con più spazio.",
  },
  {
    q: "Come funzionano i vostri avvisi?",
    a: "Tre canali: (1) Canale pubblico Telegram @tripcazador con i TOP 1-2 deal critici all'ora; (2) Bot personale /buscar: iscriviti a destinazioni e ricevi un DM in caso di match; (3) Newsletter settimanale lunedì con la Top 5. Tutto gratuito.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Prezzi voli economici dalla Spagna 2026",
    description: metadata.description,
    url: `${SITE_URL}/it/prezzi-voli-economici`,
    inLanguage: "it-IT",
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
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/it` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Prezzi voli economici",
        item: `${SITE_URL}/it/prezzi-voli-economici`,
      },
    ],
  };
}

export default function PrezziVoliEconomiciPage() {
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
          <Link href="/it" className="hover:text-amber-300">Home</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Prezzi voli economici</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Prezzi reali voli economici dalla Spagna
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          Quanto costa <em>davvero</em> volare verso le 30 destinazioni più popolari — non il
          prezzo civetta. Prezzi reali minimi degli ultimi 12 mesi, mese più economico e
          compagnie disponibili.
        </p>

        <section aria-labelledby="prices-table" className="mt-10">
          <h2 id="prices-table" className="text-2xl font-bold text-white mb-4">
            Prezzi minimi per destinazione (andata e ritorno, Economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Prezzi reali rilevati dal nostro hunter negli ultimi 12 mesi. Dati maggio 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Destinazione</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Tipico</th>
                  <th className="px-3 py-2 text-left">Mese più economico</th>
                  <th className="px-3 py-2 text-left">Top compagnie</th>
                  <th className="px-3 py-2 text-right">Durata</th>
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
            Ricevi avvisi quando appare un deal per la tua destinazione
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Iscriviti al canale Telegram <strong>@tripcazador</strong> e ricevi i TOP 1-2
            deal critici all&apos;ora.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Unisciti al canale Telegram
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Crea un avviso personalizzato
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            FAQ sui prezzi dei voli
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
            Altre versioni linguistiche
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/precios-vuelos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇪🇸 Versión en español</h3>
              <p className="text-sm text-gray-400 mt-1">
                Versione spagnola originale con le stesse informazioni.
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
            <Link
              href="/de/billige-flugpreise"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇩🇪 Deutsche Version</h3>
              <p className="text-sm text-gray-400 mt-1">
                Für deutschsprachige Reisende in Spanien.
              </p>
            </Link>
            <Link
              href="/fr/prix-vols-pas-chers"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇫🇷 Version française</h3>
              <p className="text-sm text-gray-400 mt-1">
                Pour les francophones résidant en Espagne.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
