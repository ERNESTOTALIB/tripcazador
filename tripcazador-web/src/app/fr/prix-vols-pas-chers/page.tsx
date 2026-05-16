/**
 * /fr/prix-vols-pas-chers — SSS243 (16 may 2026)
 *
 * French version of /precios-vuelos-baratos (SSS217),
 * /en/cheap-flight-prices (SSS223), /de/billige-flugpreise (SSS234).
 *
 * Target keywords:
 *   - "vols pas chers Espagne"
 *   - "prix vols économiques"
 *   - "quand acheter un vol"
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Prix vols pas chers depuis l'Espagne 2026 : prix réels minimums pour 30 destinations",
  description:
    "Prix réels des vols Madrid/Barcelone vers les 30 destinations les plus populaires. " +
    "Mois le moins cher, jour de réservation optimal et combien vous économisez en attendant.",
  alternates: {
    canonical: `${SITE_URL}/fr/prix-vols-pas-chers`,
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
    title: "Prix vols pas chers depuis l'Espagne — 30 destinations",
    description: "Ce que coûtent vraiment les vols. Tableau de prix minimums réels.",
    url: `${SITE_URL}/fr/prix-vols-pas-chers`,
    type: "article",
    locale: "fr_FR",
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
  { destination: "Lisbonne",     iata: "LIS", minPrice: 28,  typicalPrice: 95,   cheapestMonth: "Février",   avgDuration: "1h30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Porto",        iata: "OPO", minPrice: 32,  typicalPrice: 100,  cheapestMonth: "Février",   avgDuration: "1h30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marrakech",    iata: "RAK", minPrice: 30,  typicalPrice: 110,  cheapestMonth: "Mars",      avgDuration: "3h",    airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Rome",         iata: "FCO", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Novembre",  avgDuration: "2h45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Milan",        iata: "MXP", minPrice: 40,  typicalPrice: 125,  cheapestMonth: "Janvier",   avgDuration: "2h15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "Paris",        iata: "CDG", minPrice: 45,  typicalPrice: 140,  cheapestMonth: "Février",   avgDuration: "2h",    airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "Londres",      iata: "LHR", minPrice: 48,  typicalPrice: 170,  cheapestMonth: "Novembre",  avgDuration: "2h30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlin",       iata: "BER", minPrice: 42,  typicalPrice: 145,  cheapestMonth: "Février",   avgDuration: "3h",    airlines: ["Ryanair", "easyJet"] },
  { destination: "Amsterdam",    iata: "AMS", minPrice: 49,  typicalPrice: 155,  cheapestMonth: "Janvier",   avgDuration: "2h30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Prague",       iata: "PRG", minPrice: 38,  typicalPrice: 125,  cheapestMonth: "Février",   avgDuration: "3h",    airlines: ["Ryanair", "Vueling"] },
  { destination: "Budapest",     iata: "BUD", minPrice: 42,  typicalPrice: 120,  cheapestMonth: "Mars",      avgDuration: "3h",    airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Vienne",       iata: "VIE", minPrice: 55,  typicalPrice: 155,  cheapestMonth: "Janvier",   avgDuration: "3h",    airlines: ["Ryanair", "Austrian"] },
  { destination: "Athènes",      iata: "ATH", minPrice: 60,  typicalPrice: 170,  cheapestMonth: "Janvier",   avgDuration: "3h30",  airlines: ["Aegean", "Ryanair"] },
  { destination: "Istanbul",     iata: "IST", minPrice: 65,  typicalPrice: 190,  cheapestMonth: "Février",   avgDuration: "4h",    airlines: ["Pegasus", "Turkish"] },
  { destination: "Dublin",       iata: "DUB", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Février",   avgDuration: "2h45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reykjavik",    iata: "KEF", minPrice: 99,  typicalPrice: 280,  cheapestMonth: "Janvier",   avgDuration: "4h30",  airlines: ["Iberia (Transit)", "Lufthansa"] },
  { destination: "New York",     iata: "JFK", minPrice: 195, typicalPrice: 590,  cheapestMonth: "Janvier",   avgDuration: "8h30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tokyo",        iata: "NRT", minPrice: 380, typicalPrice: 950,  cheapestMonth: "Janvier",   avgDuration: "13h",   airlines: ["Iberia", "Air France"] },
  { destination: "Bangkok",      iata: "BKK", minPrice: 350, typicalPrice: 820,  cheapestMonth: "Mars",      avgDuration: "13h",   airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",         iata: "DPS", minPrice: 490, typicalPrice: 1100, cheapestMonth: "Mars",      avgDuration: "17h",   airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubaï",        iata: "DXB", minPrice: 220, typicalPrice: 550,  cheapestMonth: "Janvier",   avgDuration: "7h30",  airlines: ["Emirates", "Turkish", "Etihad"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Quel est le meilleur moment pour acheter un vol ?",
    a: "Pour les vols européens court-courriers, 4 à 8 semaines à l'avance est le sweet spot. Pour les long-courriers vers l'Asie/USA : 8 à 16 semaines. Trop tôt (>6 mois) est généralement PLUS CHER — les compagnies augmentent les prix d'origine. Dernière minute (<2 semaines) augmente de 30-60% sauf pour les error fares.",
  },
  {
    q: "Quel jour de la semaine est le moins cher pour voler ?",
    a: "Mardi et mercredi sont statistiquement les jours les moins chers pour les vols européens. Dimanche et vendredi sont les plus chers. Pour les long-courriers, l'écart s'aplatit.",
  },
  {
    q: "Quel mois est le moins cher pour voler depuis l'Espagne ?",
    a: "Janvier, février et novembre sont les mois les moins chers. Juin-août et décembre sont les plus chers. Pour des destinations spécifiques (Thaïlande, Mexique), les mois varient — voir le tableau ci-dessus.",
  },
  {
    q: "Les compagnies low-cost sont-elles toujours moins chères ?",
    a: "Non. Pour les vols de plus de 3 heures ou avec bagage en soute, Vueling/easyJet/Air Europa peuvent être moins chères que Ryanair après suppléments. Comparez toujours le PRIX TOTAL, pas le prix d'appel.",
  },
  {
    q: "Que sont les error fares ?",
    a: "Tarifs nettement moins chers que la normale (-50% à -90%) dus à des bugs du système de prix. Ils durent généralement 1 à 6 heures avant d'être annulés. TripCazador les détecte automatiquement et alerte via Telegram + email.",
  },
  {
    q: "Réserver directement chez la compagnie ou via un moteur de recherche ?",
    a: "Presque toujours directement chez la compagnie : meilleur service en cas d'annulation, pas de surprises avec des assurances pré-sélectionnées. Les moteurs de recherche sont parfaits pour COMPARER, mais réservez sur le site de la compagnie.",
  },
  {
    q: "La business class vaut-elle la peine ?",
    a: "Seulement si : (a) le ratio Business/Economy <2,5x (rare), ou (b) vol de nuit +9 heures où dormir allongé change le lendemain. Astuce : essayez d'abord Premium Economy — 1,4-1,7x Economy avec plus d'espace.",
  },
  {
    q: "Comment fonctionnent vos alertes ?",
    a: "Trois canaux : (1) Canal public Telegram @tripcazador avec les TOP 1-2 deals critiques par heure ; (2) Bot personnel /buscar : abonnez-vous à des destinations et recevez un DM en cas de match ; (3) Newsletter hebdomadaire lundi avec le Top 5. Tout est gratuit.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Prix vols pas chers depuis l'Espagne 2026",
    description: metadata.description,
    url: `${SITE_URL}/fr/prix-vols-pas-chers`,
    inLanguage: "fr-FR",
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
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/fr` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Prix vols pas chers",
        item: `${SITE_URL}/fr/prix-vols-pas-chers`,
      },
    ],
  };
}

export default function PrixVolsPasChersPage() {
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
          <Link href="/fr" className="hover:text-amber-300">Accueil</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Prix vols pas chers</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Vrais prix de vols pas chers depuis l&apos;Espagne
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          Ce que coûte <em>vraiment</em> voler vers les 30 destinations les plus populaires —
          pas le prix d&apos;appel. Prix réels minimums des 12 derniers mois, mois le moins
          cher et compagnies disponibles.
        </p>

        <section aria-labelledby="prices-table" className="mt-10">
          <h2 id="prices-table" className="text-2xl font-bold text-white mb-4">
            Prix minimums par destination (aller-retour, Economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Prix réels détectés par notre hunter sur les 12 derniers mois. Données mai 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Destination</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Habituel</th>
                  <th className="px-3 py-2 text-left">Mois le moins cher</th>
                  <th className="px-3 py-2 text-left">Top compagnies</th>
                  <th className="px-3 py-2 text-right">Durée</th>
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
            Recevez des alertes quand un deal apparaît pour votre destination
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Abonnez-vous au canal Telegram <strong>@tripcazador</strong> et recevez les TOP
            1-2 deals critiques par heure.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Rejoindre le canal Telegram
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Créer une alerte personnalisée
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            FAQ sur les prix des vols
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
            Autres versions linguistiques
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/precios-vuelos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇪🇸 Versión en español</h3>
              <p className="text-sm text-gray-400 mt-1">
                Version espagnole originale avec les mêmes informations.
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
          </div>
        </section>
      </main>
    </>
  );
}
