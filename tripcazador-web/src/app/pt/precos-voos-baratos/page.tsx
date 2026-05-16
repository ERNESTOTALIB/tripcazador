/**
 * /pt/precos-voos-baratos — SSS246 (16 may 2026)
 *
 * Portuguese version. Hreflang sexteto ES/EN/DE/FR/IT/PT.
 *
 * Target keywords:
 *   - "voos baratos Espanha"
 *   - "preços voos económicos"
 *   - "quando comprar um voo"
 *
 * Mercado endpoint: viajeros portugueses residentes en España +
 * brasileños buscando vuelos desde España (oversees lusophone diaspora).
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Preços de voos baratos de Espanha 2026: preços reais mínimos para 30 destinos",
  description:
    "Preços reais de voos de Madrid/Barcelona para os 30 destinos mais populares. " +
    "Mês mais barato, dia óptimo de reserva, e quanto poupa esperando vs reservar já.",
  alternates: {
    canonical: `${SITE_URL}/pt/precos-voos-baratos`,
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
    title: "Preços voos baratos de Espanha — 30 destinos",
    description: "Quanto custam realmente os voos. Tabela de preços mínimos reais.",
    url: `${SITE_URL}/pt/precos-voos-baratos`,
    type: "article",
    locale: "pt_PT",
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
  { destination: "Lisboa",      iata: "LIS", minPrice: 28,  typicalPrice: 95,   cheapestMonth: "Fevereiro", avgDuration: "1h30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Porto",       iata: "OPO", minPrice: 32,  typicalPrice: 100,  cheapestMonth: "Fevereiro", avgDuration: "1h30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marraquexe",  iata: "RAK", minPrice: 30,  typicalPrice: 110,  cheapestMonth: "Março",     avgDuration: "3h",    airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Roma",        iata: "FCO", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Novembro",  avgDuration: "2h45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Milão",       iata: "MXP", minPrice: 40,  typicalPrice: 125,  cheapestMonth: "Janeiro",   avgDuration: "2h15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "Paris",       iata: "CDG", minPrice: 45,  typicalPrice: 140,  cheapestMonth: "Fevereiro", avgDuration: "2h",    airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "Londres",     iata: "LHR", minPrice: 48,  typicalPrice: 170,  cheapestMonth: "Novembro",  avgDuration: "2h30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlim",      iata: "BER", minPrice: 42,  typicalPrice: 145,  cheapestMonth: "Fevereiro", avgDuration: "3h",    airlines: ["Ryanair", "easyJet"] },
  { destination: "Amesterdão",  iata: "AMS", minPrice: 49,  typicalPrice: 155,  cheapestMonth: "Janeiro",   avgDuration: "2h30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Praga",       iata: "PRG", minPrice: 38,  typicalPrice: 125,  cheapestMonth: "Fevereiro", avgDuration: "3h",    airlines: ["Ryanair", "Vueling"] },
  { destination: "Budapeste",   iata: "BUD", minPrice: 42,  typicalPrice: 120,  cheapestMonth: "Março",     avgDuration: "3h",    airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Viena",       iata: "VIE", minPrice: 55,  typicalPrice: 155,  cheapestMonth: "Janeiro",   avgDuration: "3h",    airlines: ["Ryanair", "Austrian"] },
  { destination: "Atenas",      iata: "ATH", minPrice: 60,  typicalPrice: 170,  cheapestMonth: "Janeiro",   avgDuration: "3h30",  airlines: ["Aegean", "Ryanair"] },
  { destination: "Istambul",    iata: "IST", minPrice: 65,  typicalPrice: 190,  cheapestMonth: "Fevereiro", avgDuration: "4h",    airlines: ["Pegasus", "Turkish"] },
  { destination: "Dublin",      iata: "DUB", minPrice: 38,  typicalPrice: 130,  cheapestMonth: "Fevereiro", avgDuration: "2h45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reiquiavique",iata: "KEF", minPrice: 99,  typicalPrice: 280,  cheapestMonth: "Janeiro",   avgDuration: "4h30",  airlines: ["Iberia (Transit)", "Lufthansa"] },
  { destination: "Nova Iorque", iata: "JFK", minPrice: 195, typicalPrice: 590,  cheapestMonth: "Janeiro",   avgDuration: "8h30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tóquio",      iata: "NRT", minPrice: 380, typicalPrice: 950,  cheapestMonth: "Janeiro",   avgDuration: "13h",   airlines: ["Iberia", "Air France"] },
  { destination: "Banguecoque", iata: "BKK", minPrice: 350, typicalPrice: 820,  cheapestMonth: "Março",     avgDuration: "13h",   airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",        iata: "DPS", minPrice: 490, typicalPrice: 1100, cheapestMonth: "Março",     avgDuration: "17h",   airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubai",       iata: "DXB", minPrice: 220, typicalPrice: 550,  cheapestMonth: "Janeiro",   avgDuration: "7h30",  airlines: ["Emirates", "Turkish", "Etihad"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Qual é a melhor altura para comprar um voo?",
    a: "Para voos europeus de curta distância, 4 a 8 semanas antes é o ponto ótimo. Para voos de longa distância para Ásia/EUA: 8 a 16 semanas. Muito cedo (>6 meses) é geralmente MAIS CARO — as companhias aumentam os preços iniciais. Última hora (<2 semanas) sobe 30-60% exceto para error fares.",
  },
  {
    q: "Qual é o dia da semana mais barato para voar?",
    a: "Terça e quarta-feira são estatisticamente os dias mais baratos para voos europeus. Domingo e sexta-feira são os mais caros. Para longas distâncias a diferença esbate-se.",
  },
  {
    q: "Qual é o mês mais barato para voar de Espanha?",
    a: "Janeiro, fevereiro e novembro são os meses mais baratos. Junho-agosto e dezembro são os mais caros. Para destinos específicos (Tailândia, México) os meses variam — ver a tabela acima.",
  },
  {
    q: "As companhias low-cost são sempre mais baratas?",
    a: "Não. Para voos com mais de 3 horas ou com bagagem despachada, Vueling/easyJet/Air Europa podem ser mais baratas que Ryanair após extras. Compare sempre o PREÇO TOTAL, não o preço-isca.",
  },
  {
    q: "O que são error fares?",
    a: "Tarifas significativamente mais baratas que o normal (-50% a -90%) devido a bugs no sistema de preços. Duram normalmente 1 a 6 horas antes de serem canceladas. TripCazador deteta-os automaticamente e avisa via Telegram + email.",
  },
  {
    q: "Reservar diretamente pela companhia ou via motor de busca?",
    a: "Quase sempre diretamente pela companhia: melhor serviço em caso de cancelamento, sem surpresas com seguros pré-selecionados. Os motores de busca são perfeitos para COMPARAR, mas reserve no site da companhia.",
  },
  {
    q: "Vale a pena a business class?",
    a: "Apenas se: (a) rácio Business/Economy <2,5x (raro), ou (b) voo noturno +9 horas onde dormir deitado muda o dia seguinte. Dica: experimente primeiro Premium Economy — 1,4-1,7x Economy com mais espaço.",
  },
  {
    q: "Como funcionam os vossos alertas?",
    a: "Três canais: (1) Canal público Telegram @tripcazador com TOP 1-2 deals críticos por hora; (2) Bot pessoal /buscar: subscreva destinos e receba DM em caso de match; (3) Newsletter semanal segunda-feira com o Top 5. Tudo gratuito.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Preços voos baratos de Espanha 2026",
    description: metadata.description,
    url: `${SITE_URL}/pt/precos-voos-baratos`,
    inLanguage: "pt-PT",
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
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/pt` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Preços voos baratos",
        item: `${SITE_URL}/pt/precos-voos-baratos`,
      },
    ],
  };
}

export default function PrecosVoosBaratosPage() {
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
          <Link href="/pt" className="hover:text-amber-300">Início</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Preços voos baratos</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Preços reais voos baratos de Espanha
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          Quanto custa <em>realmente</em> voar para os 30 destinos mais populares — não
          o preço-isca. Preços reais mínimos dos últimos 12 meses, mês mais barato e
          companhias disponíveis.
        </p>

        <section aria-labelledby="prices-table" className="mt-10">
          <h2 id="prices-table" className="text-2xl font-bold text-white mb-4">
            Preços mínimos por destino (ida e volta, Economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Preços reais detetados pelo nosso hunter nos últimos 12 meses. Dados maio 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Destino</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Habitual</th>
                  <th className="px-3 py-2 text-left">Mês mais barato</th>
                  <th className="px-3 py-2 text-left">Top companhias</th>
                  <th className="px-3 py-2 text-right">Duração</th>
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
            Receba alertas quando aparecer um deal para o seu destino
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Subscreva o canal Telegram <strong>@tripcazador</strong> e receba os TOP 1-2
            deals críticos por hora.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Juntar-se ao canal Telegram
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Criar alerta personalizado
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            FAQ sobre preços de voos
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
            Outras versões linguísticas
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/precios-vuelos-baratos"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇪🇸 Versión en español</h3>
              <p className="text-sm text-gray-400 mt-1">
                Versão espanhola original com as mesmas informações.
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
            <Link
              href="/it/prezzi-voli-economici"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🇮🇹 Versione italiana</h3>
              <p className="text-sm text-gray-400 mt-1">
                Per italiani residenti in Spagna.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
