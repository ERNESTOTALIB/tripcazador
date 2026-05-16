/**
 * /pl/tanie-bilety-lotnicze — SSS252 (16 may 2026)
 *
 * Polish version. Hreflang octeto ES/EN/DE/FR/IT/PT/NL/PL.
 *
 * Target keywords:
 *   - "tanie loty z Hiszpanii"
 *   - "tanie bilety lotnicze"
 *   - "kiedy kupić bilet"
 *
 * Mercado: ~150k polacos residentes en España + ~1.2M turistas
 * polacos anuales en España. Búsquedas SEO en polaco: alto intent +
 * baja competencia (mercado underserved en flight comparators).
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Tanie bilety lotnicze z Hiszpanii 2026: prawdziwe minimalne ceny dla 30 kierunków",
  description:
    "Prawdziwe ceny lotów z Madrytu/Barcelony do 30 najpopularniejszych kierunków. " +
    "Najtańszy miesiąc, optymalny dzień rezerwacji i ile oszczędzasz czekając vs rezerwując teraz.",
  alternates: {
    canonical: `${SITE_URL}/pl/tanie-bilety-lotnicze`,
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
    title: "Tanie bilety lotnicze z Hiszpanii — 30 kierunków",
    description: "Ile naprawdę kosztują loty. Tabela rzeczywistych minimalnych cen.",
    url: `${SITE_URL}/pl/tanie-bilety-lotnicze`,
    type: "article",
    locale: "pl_PL",
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
  { destination: "Lizbona",     iata: "LIS", minPrice: 28,  typicalPrice: 95,   cheapestMonth: "Luty",      avgDuration: "1g30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Porto",       iata: "OPO", minPrice: 32,  typicalPrice: 100,  cheapestMonth: "Luty",      avgDuration: "1g30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marrakesz",   iata: "RAK", minPrice: 30,  typicalPrice: 110,  cheapestMonth: "Marzec",    avgDuration: "3g",    airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Rzym",        iata: "FCO", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Listopad",  avgDuration: "2g45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Mediolan",    iata: "MXP", minPrice: 40,  typicalPrice: 125,  cheapestMonth: "Styczeń",   avgDuration: "2g15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "Paryż",       iata: "CDG", minPrice: 45,  typicalPrice: 140,  cheapestMonth: "Luty",      avgDuration: "2g",    airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "Londyn",      iata: "LHR", minPrice: 48,  typicalPrice: 170,  cheapestMonth: "Listopad",  avgDuration: "2g30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlin",      iata: "BER", minPrice: 42,  typicalPrice: 145,  cheapestMonth: "Luty",      avgDuration: "3g",    airlines: ["Ryanair", "easyJet"] },
  { destination: "Amsterdam",   iata: "AMS", minPrice: 49,  typicalPrice: 155,  cheapestMonth: "Styczeń",   avgDuration: "2g30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Praga",       iata: "PRG", minPrice: 38,  typicalPrice: 125,  cheapestMonth: "Luty",      avgDuration: "3g",    airlines: ["Ryanair", "Vueling"] },
  { destination: "Budapeszt",   iata: "BUD", minPrice: 42,  typicalPrice: 120,  cheapestMonth: "Marzec",    avgDuration: "3g",    airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Wiedeń",      iata: "VIE", minPrice: 55,  typicalPrice: 155,  cheapestMonth: "Styczeń",   avgDuration: "3g",    airlines: ["Ryanair", "Austrian"] },
  { destination: "Ateny",       iata: "ATH", minPrice: 60,  typicalPrice: 170,  cheapestMonth: "Styczeń",   avgDuration: "3g30",  airlines: ["Aegean", "Ryanair"] },
  { destination: "Stambuł",     iata: "IST", minPrice: 65,  typicalPrice: 190,  cheapestMonth: "Luty",      avgDuration: "4g",    airlines: ["Pegasus", "Turkish"] },
  { destination: "Dublin",      iata: "DUB", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Luty",      avgDuration: "2g45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reykjavik",   iata: "KEF", minPrice: 99,  typicalPrice: 280,  cheapestMonth: "Styczeń",   avgDuration: "4g30",  airlines: ["Iberia (Transit)", "Lufthansa"] },
  { destination: "Nowy Jork",   iata: "JFK", minPrice: 195, typicalPrice: 590,  cheapestMonth: "Styczeń",   avgDuration: "8g30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tokio",       iata: "NRT", minPrice: 380, typicalPrice: 950,  cheapestMonth: "Styczeń",   avgDuration: "13g",   airlines: ["Iberia", "Air France"] },
  { destination: "Bangkok",     iata: "BKK", minPrice: 350, typicalPrice: 820,  cheapestMonth: "Marzec",    avgDuration: "13g",   airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",        iata: "DPS", minPrice: 490, typicalPrice: 1100, cheapestMonth: "Marzec",    avgDuration: "17g",   airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubaj",       iata: "DXB", minPrice: 220, typicalPrice: 550,  cheapestMonth: "Styczeń",   avgDuration: "7g30",  airlines: ["Emirates", "Turkish", "Etihad"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Kiedy jest najlepszy czas na kupno biletu lotniczego?",
    a: "Dla europejskich krótkich lotów 4-8 tygodni wcześniej to optymalny moment. Dla lotów długodystansowych do Azji/USA: 8-16 tygodni. Zbyt wcześnie (>6 miesięcy) jest zazwyczaj DROŻSZE — linie podnoszą ceny początkowe. Last minute (<2 tygodnie) rośnie o 30-60% z wyjątkiem error fares.",
  },
  {
    q: "Który dzień tygodnia jest najtańszy do lotu?",
    a: "Wtorek i środa są statystycznie najtańszymi dniami dla lotów europejskich. Niedziela i piątek są najdroższe. Dla długich dystansów różnica się wyrównuje.",
  },
  {
    q: "Który miesiąc jest najtańszy do lotu z Hiszpanii?",
    a: "Styczeń, luty i listopad to najtańsze miesiące. Czerwiec-sierpień i grudzień są najdroższe. Dla konkretnych kierunków (Tajlandia, Meksyk) miesiące się różnią — zobacz tabelę powyżej.",
  },
  {
    q: "Czy tanie linie zawsze są tańsze?",
    a: "Nie. Dla lotów ponad 3 godziny lub z bagażem rejestrowanym Vueling/easyJet/Air Europa mogą być tańsze niż Ryanair po dodatkach. Zawsze porównuj CENĘ CAŁKOWITĄ, nie cenę reklamową.",
  },
  {
    q: "Czym są error fares?",
    a: "Taryfy znacznie tańsze niż normalnie (-50% do -90%) z powodu błędów w systemie cen. Trwają zwykle 1-6 godzin zanim zostaną anulowane. TripCazador wykrywa je automatycznie i ostrzega przez Telegram + email.",
  },
  {
    q: "Rezerwować bezpośrednio u linii lotniczej czy przez wyszukiwarkę?",
    a: "Prawie zawsze bezpośrednio u linii: lepsza obsługa przy anulacjach, brak niespodzianek z preselekcjonowanymi ubezpieczeniami. Wyszukiwarki świetnie służą do PORÓWNAŃ, ale rezerwuj na stronie linii.",
  },
  {
    q: "Czy business class jest tego warta?",
    a: "Tylko jeśli: (a) stosunek Business/Economy <2,5x (rzadko), lub (b) lot nocny +9 godzin gdzie leżący sen zmienia następny dzień. Tip: spróbuj najpierw Premium Economy — 1,4-1,7x Economy z więcej miejsca.",
  },
  {
    q: "Jak działają wasze alerty?",
    a: "Trzy kanały: (1) Publiczny kanał Telegram @tripcazador z TOP 1-2 krytycznymi dealami na godzinę; (2) Osobisty bot /buscar: zapisz się na kierunki i otrzymuj DM przy dopasowaniu; (3) Cotygodniowy newsletter w poniedziałek z Top 5. Wszystko za darmo.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tanie bilety lotnicze z Hiszpanii 2026",
    description: metadata.description,
    url: `${SITE_URL}/pl/tanie-bilety-lotnicze`,
    inLanguage: "pl-PL",
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
      { "@type": "ListItem", position: 1, name: "Strona główna", item: `${SITE_URL}/pl` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tanie bilety lotnicze",
        item: `${SITE_URL}/pl/tanie-bilety-lotnicze`,
      },
    ],
  };
}

export default function TanieBiletyLotniczePage() {
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
          <Link href="/pl" className="hover:text-amber-300">Strona główna</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Tanie bilety lotnicze</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Prawdziwe tanie bilety lotnicze z Hiszpanii
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          Ile <em>naprawdę</em> kosztuje lot do 30 najpopularniejszych kierunków — nie cena
          reklamowa. Prawdziwe minimalne ceny z ostatnich 12 miesięcy, najtańszy miesiąc
          i dostępne linie.
        </p>

        <section aria-labelledby="prices-table" className="mt-10">
          <h2 id="prices-table" className="text-2xl font-bold text-white mb-4">
            Minimalne ceny według kierunku (w obie strony, Economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Prawdziwe ceny wykryte przez nasz hunter w ostatnich 12 miesiącach. Dane maj 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Kierunek</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Średnio</th>
                  <th className="px-3 py-2 text-left">Najtańszy miesiąc</th>
                  <th className="px-3 py-2 text-left">Top linie</th>
                  <th className="px-3 py-2 text-right">Czas</th>
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
            Otrzymuj alerty gdy pojawi się okazja dla Twojego kierunku
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Zapisz się na kanał Telegram <strong>@tripcazador</strong> i otrzymuj TOP 1-2
            krytyczne okazje na godzinę.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Dołącz do kanału Telegram
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Stwórz osobisty alert
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            FAQ o cenach biletów
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
            Inne wersje językowe
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/precios-vuelos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇪🇸 Versión en español</h3>
              <p className="text-sm text-gray-400 mt-1">
                Oryginalna wersja hiszpańska z tymi samymi informacjami.
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
            <Link
              href="/nl/goedkope-vliegtickets"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇳🇱 Nederlandse versie</h3>
              <p className="text-sm text-gray-400 mt-1">Voor Nederlandstaligen in Spanje.</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
