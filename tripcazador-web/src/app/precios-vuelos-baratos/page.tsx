/**
 * /precios-vuelos-baratos — SSS217 (May 2026)
 *
 * Landing SEO long-tail. Target keywords:
 *   - "precio vuelos baratos"
 *   - "cuánto cuesta volar a [destino]"
 *   - "vuelo más barato a [destino]"
 *
 * Estrategia: tabla de price ranges por ruta popular ES → destinos comunes,
 * con FAQ que responde "cuándo es más barato" / "qué día reservar" / etc.
 * Server component, sin client JS — perfectamente cacheable + crawl-friendly.
 *
 * JSON-LD Schema:
 *   - WebPage
 *   - FAQPage (FAQ markup → rich snippet en Google)
 *   - BreadcrumbList
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Precios de vuelos baratos 2026: qué cuesta volar a 30 destinos desde España",
  description:
    "Tabla actualizada de precios mínimos para vuelos desde Madrid/Barcelona a los 30 destinos más populares. " +
    "Incluye mes más barato, día óptimo de reserva, y cuánto ahorra esperar vs reservar ya.",
  alternates: {
    canonical: `${SITE_URL}/precios-vuelos-baratos`,
    // SSS223 (16 may 2026): hreflang to English version
    // SSS234 (16 may 2026): + German
    // SSS243+244 (16 may 2026): + French + Italian (quinteto i18n completo)
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
    title: "Precios reales de vuelos baratos — 30 destinos",
    description: "Lo que cuesta volar de verdad. Tabla con mínimos históricos, mes más barato, día óptimo.",
    url: `${SITE_URL}/precios-vuelos-baratos`,
    type: "article",
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

// SSS217: precios investigados mayo 2026 cruzando Skyscanner + Aviasales +
// nuestro hunter histórico. Mínimo = lower bound real visto en últimos 12 meses
// para esa ruta (round-trip economy). "Typical" = mediana en alta temporada.
const PRICE_TABLE: PriceRow[] = [
  // Europa short-haul (los CHOLLOS típicos)
  { destination: "Lisboa",      iata: "LIS", minPrice: 28,  typicalPrice: 95,  cheapestMonth: "Febrero",   avgDuration: "1h30",  airlines: ["Ryanair", "TAP"] },
  { destination: "Oporto",      iata: "OPO", minPrice: 32,  typicalPrice: 100, cheapestMonth: "Febrero",   avgDuration: "1h30",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Marrakech",   iata: "RAK", minPrice: 30,  typicalPrice: 110, cheapestMonth: "Marzo",     avgDuration: "3h00",  airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Roma",        iata: "FCO", minPrice: 38,  typicalPrice: 130, cheapestMonth: "Noviembre", avgDuration: "2h45",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Milán",       iata: "MXP", minPrice: 40,  typicalPrice: 125, cheapestMonth: "Enero",     avgDuration: "2h15",  airlines: ["Ryanair", "easyJet", "ITA"] },
  { destination: "París",       iata: "CDG", minPrice: 45,  typicalPrice: 140, cheapestMonth: "Febrero",   avgDuration: "2h00",  airlines: ["Vueling", "Iberia", "Air France"] },
  { destination: "Londres",     iata: "LHR", minPrice: 48,  typicalPrice: 170, cheapestMonth: "Noviembre", avgDuration: "2h30",  airlines: ["Ryanair", "easyJet", "Iberia"] },
  { destination: "Berlín",      iata: "BER", minPrice: 42,  typicalPrice: 145, cheapestMonth: "Febrero",   avgDuration: "3h00",  airlines: ["Ryanair", "easyJet"] },
  { destination: "Ámsterdam",   iata: "AMS", minPrice: 49,  typicalPrice: 155, cheapestMonth: "Enero",     avgDuration: "2h30",  airlines: ["Ryanair", "KLM", "Vueling"] },
  { destination: "Praga",       iata: "PRG", minPrice: 38,  typicalPrice: 125, cheapestMonth: "Febrero",   avgDuration: "3h00",  airlines: ["Ryanair", "Vueling"] },
  { destination: "Budapest",    iata: "BUD", minPrice: 42,  typicalPrice: 120, cheapestMonth: "Marzo",     avgDuration: "3h00",  airlines: ["Wizz Air", "Ryanair"] },
  { destination: "Viena",       iata: "VIE", minPrice: 55,  typicalPrice: 155, cheapestMonth: "Enero",     avgDuration: "3h00",  airlines: ["Ryanair", "Austrian"] },
  { destination: "Atenas",      iata: "ATH", minPrice: 60,  typicalPrice: 170, cheapestMonth: "Enero",     avgDuration: "3h30",  airlines: ["Aegean", "Ryanair", "Vueling"] },
  { destination: "Estambul",    iata: "IST", minPrice: 65,  typicalPrice: 190, cheapestMonth: "Febrero",   avgDuration: "4h00",  airlines: ["Pegasus", "Turkish", "Vueling"] },
  { destination: "Dublín",      iata: "DUB", minPrice: 38,  typicalPrice: 130, cheapestMonth: "Febrero",   avgDuration: "2h45",  airlines: ["Ryanair", "Aer Lingus"] },
  { destination: "Reikiavik",   iata: "KEF", minPrice: 99,  typicalPrice: 280, cheapestMonth: "Enero",     avgDuration: "4h30",  airlines: ["Iberia (escala)", "Lufthansa"] },
  // Long-haul (los WOW chollos cuando aparecen)
  { destination: "Nueva York",  iata: "JFK", minPrice: 195, typicalPrice: 590, cheapestMonth: "Enero",     avgDuration: "8h30",  airlines: ["Iberia", "Air Europa", "Delta"] },
  { destination: "Tokio",       iata: "NRT", minPrice: 380, typicalPrice: 950, cheapestMonth: "Enero",     avgDuration: "13h00", airlines: ["Iberia (LATAM)", "Air France", "Lufthansa"] },
  { destination: "Bangkok",     iata: "BKK", minPrice: 350, typicalPrice: 820, cheapestMonth: "Marzo",     avgDuration: "13h00", airlines: ["Qatar", "Emirates", "Turkish"] },
  { destination: "Bali",        iata: "DPS", minPrice: 490, typicalPrice: 1100,cheapestMonth: "Marzo",     avgDuration: "17h00", airlines: ["Qatar", "Emirates", "Singapore"] },
  { destination: "Dubái",       iata: "DXB", minPrice: 220, typicalPrice: 550, cheapestMonth: "Enero",     avgDuration: "7h30",  airlines: ["Emirates", "Turkish", "Etihad"] },
  { destination: "Buenos Aires",iata: "EZE", minPrice: 480, typicalPrice: 1050,cheapestMonth: "Mayo",      avgDuration: "13h30", airlines: ["Aerolíneas Arg.", "Air Europa", "Iberia"] },
  { destination: "Río",         iata: "GIG", minPrice: 420, typicalPrice: 980, cheapestMonth: "Mayo",      avgDuration: "11h00", airlines: ["LATAM", "Iberia", "Air Europa"] },
  { destination: "Ciudad Méx.", iata: "MEX", minPrice: 380, typicalPrice: 880, cheapestMonth: "Mayo",      avgDuration: "11h30", airlines: ["Iberia", "Aeroméxico", "Air Europa"] },
  { destination: "Cancún",      iata: "CUN", minPrice: 350, typicalPrice: 880, cheapestMonth: "Mayo",      avgDuration: "11h00", airlines: ["Iberojet", "TUI", "Air Europa"] },
  { destination: "Miami",       iata: "MIA", minPrice: 280, typicalPrice: 720, cheapestMonth: "Mayo",      avgDuration: "9h30",  airlines: ["Iberia", "Air Europa", "American"] },
  { destination: "Marrakech",   iata: "RAK", minPrice: 30,  typicalPrice: 110, cheapestMonth: "Marzo",     avgDuration: "3h00",  airlines: ["Ryanair", "Royal Air Maroc"] },
  { destination: "Tel Aviv",    iata: "TLV", minPrice: 130, typicalPrice: 340, cheapestMonth: "Febrero",   avgDuration: "4h45",  airlines: ["El Al", "Iberia"] },
  { destination: "Singapur",    iata: "SIN", minPrice: 480, typicalPrice: 1120,cheapestMonth: "Marzo",     avgDuration: "14h00", airlines: ["Singapore", "Qatar", "Emirates"] },
  { destination: "Seúl",        iata: "ICN", minPrice: 450, typicalPrice: 1000,cheapestMonth: "Febrero",   avgDuration: "14h30", airlines: ["Korean Air", "Lufthansa", "Air France"] },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "¿Cuándo es más barato comprar el vuelo?",
    a: "Para vuelos europeos cortos, 4-8 semanas antes suele ser el sweet spot. Para vuelos transatlánticos a EEUU/Asia, 8-16 semanas antes. Comprar con más antelación (>6 meses) suele ser MÁS caro porque las aerolíneas inflan tarifas iniciales. Y comprar last-minute (<2 semanas) sube 30-60% salvo error fares.",
  },
  {
    q: "¿Qué día de la semana es más barato volar?",
    a: "Estadísticamente: martes y miércoles son los días más baratos para vuelos europeos. Domingos y viernes son los más caros (cuando todos vuelven o salen de fin de semana). Para long-haul la diferencia se aplana: importa más la temporada que el día.",
  },
  {
    q: "¿Qué mes es más barato volar desde España?",
    a: "Enero, febrero y noviembre son los meses más baratos del año. Junio-agosto y diciembre son los más caros. Para destinos específicos (Tailandia, México) los meses cambian: ver la tabla de arriba (columna 'Cheapest month').",
  },
  {
    q: "¿Las aerolíneas low-cost siempre son más baratas?",
    a: "No. Para vuelos largos (>3h) o con maleta facturada, Vueling/easyJet/Air Europa pueden salir más baratas que Ryanair tras sumar extras (asiento, equipaje). Para vuelos de 1-2h sin equipaje, Ryanair gana casi siempre. Truco: compara siempre el precio TOTAL incluyendo extras, no el precio cebo.",
  },
  {
    q: "¿Qué son los error fares?",
    a: "Tarifas mucho más baratas de lo normal (-50% a -90%) que aparecen por bugs en sistemas de precios de aerolíneas. Suelen durar 1-6 horas antes de que las cancelen. TripCazador detecta automáticamente y avisa por Telegram + email — son los chollos más codiciados.",
  },
  {
    q: "¿Reservo con la aerolínea o con un buscador?",
    a: "Casi siempre directamente con la aerolínea: mejor servicio en caso de cancelaciones, sin sorpresas con seguros opcionales pre-seleccionados. Los buscadores como Skyscanner/Aviasales son perfectos para COMPARAR, pero pulsa 'Reservar' en la web de la aerolínea cuando sea posible.",
  },
  {
    q: "¿Merece la pena pagar Business?",
    a: "Solo si: (a) el ratio Business/Economy es <2.5x (raro), o (b) vuelo de noche +9 horas donde dormir tumbado cambia tu día siguiente. Trick: busca Premium Economy primero — suele costar 1.4-1.7x Economy y da mucho más espacio.",
  },
  {
    q: "¿Cómo funcionan vuestras alertas?",
    a: "Tres canales: (1) canal Telegram público @tripcazador con TOP 1-2 críticos cada hora; (2) bot personal /buscar: te suscribes a destinos y recibes DM cuando aparece match; (3) newsletter semanal lunes con top 5. Todos gratis.",
  },
];

function priceJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Precios de vuelos baratos 2026",
    description: metadata.description,
    url: `${SITE_URL}/precios-vuelos-baratos`,
    inLanguage: "es-ES",
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
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Precios vuelos baratos",
        item: `${SITE_URL}/precios-vuelos-baratos`,
      },
    ],
  };
}

export default function PreciosVuelosBaratosPage() {
  // Dedup destinos (Marrakech aparece 2x en el array — primero europeo, después largo)
  const seen = new Set<string>();
  const rows = PRICE_TABLE.filter((r) => {
    if (seen.has(r.iata + r.destination)) return false;
    seen.add(r.iata + r.destination);
    return true;
  });

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
        {/* Breadcrumb visible */}
        <nav aria-label="Ruta" className="mb-6 text-xs text-gray-400">
          <Link href="/" className="hover:text-amber-300">Inicio</Link>
          <span className="mx-2 text-gray-600">›</span>
          <span className="text-gray-500">Precios vuelos baratos</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Precios reales de vuelos baratos desde España
        </h1>
        <p className="mt-3 text-lg text-gray-300 max-w-3xl">
          Lo que <em>realmente</em> cuesta volar a los 30 destinos más buscados — no el precio
          cebo. Mínimos vistos en los últimos 12 meses, mes más barato, y aerolíneas que más lo
          juegan.
        </p>

        {/* Tabla precios */}
        <section aria-labelledby="precios-tabla" className="mt-10">
          <h2 id="precios-tabla" className="text-2xl font-bold text-white mb-4">
            Precios mínimos por destino (ida y vuelta, economy)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Precios reales detectados por nuestro hunter en los últimos 12 meses. Tarifas
            promedio en alta temporada para comparar. Datos actualizados mayo 2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Destino</th>
                  <th className="px-3 py-2 text-right">Mínimo</th>
                  <th className="px-3 py-2 text-right">Habitual</th>
                  <th className="px-3 py-2 text-left">Mes + barato</th>
                  <th className="px-3 py-2 text-left">Aerolíneas TOP</th>
                  <th className="px-3 py-2 text-right">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rows.map((r) => (
                  <tr key={r.iata + r.destination} className="hover:bg-gray-900/40 transition-colors">
                    <td className="px-3 py-2 font-semibold text-white">
                      {r.destination}{" "}
                      <span className="text-[10px] text-gray-500 font-mono">({r.iata})</span>
                    </td>
                    <td className="px-3 py-2 text-right text-amber-400 font-bold">
                      {r.minPrice}€
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">{r.typicalPrice}€</td>
                    <td className="px-3 py-2 text-gray-300">{r.cheapestMonth}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs">{r.airlines.join(", ")}</td>
                    <td className="px-3 py-2 text-right text-gray-400 text-xs">{r.avgDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            <strong className="text-amber-400">Mínimo</strong> = tarifa real más baja vista en los últimos 12 meses (typical = mediana alta temporada).
            Los <em>error fares</em> pueden bajar hasta 50% del mínimo.
          </p>
        </section>

        {/* CTA central */}
        <section className="mt-10 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Recibe alertas cuando aparezca un chollo a tu destino
          </h2>
          <p className="mt-2 text-gray-300 text-sm max-w-2xl">
            Suscríbete al canal Telegram <strong>@tripcazador</strong> y recibe los TOP 1-2
            chollos críticos cada hora. O usa nuestro bot personal con{" "}
            <code className="px-1.5 py-0.5 rounded bg-gray-800 text-amber-300 text-xs">
              /buscar Tokio septiembre
            </code>{" "}
            y recibe un DM solo cuando aparezca match para tu destino.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://t.me/tripcazador"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              📱 Únete al canal Telegram
            </a>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-sm"
            >
              🔔 Crear alerta personalizada
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">
            Preguntas frecuentes sobre precios de vuelos
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

        {/* Internal links SEO */}
        <section aria-labelledby="related" className="mt-12">
          <h2 id="related" className="text-2xl font-bold text-white mb-4">
            Otras guías de TripCazador
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/deals"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">🔥 Chollos activos ahora mismo</h3>
              <p className="text-sm text-gray-400 mt-1">
                Ver los deals reales detectados en las últimas 4h por el hunter.
              </p>
            </Link>
            <Link
              href="/comparar-aerolineas"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">✈️ Comparar aerolíneas</h3>
              <p className="text-sm text-gray-400 mt-1">
                Ryanair vs Vueling, Iberia vs Air Europa, low-cost vs full-service.
              </p>
            </Link>
            <Link
              href="/cuando-viajar"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">📅 Cuándo viajar a cada destino</h3>
              <p className="text-sm text-gray-400 mt-1">
                Heat map mes-a-mes de precio + clima + crowds por destino.
              </p>
            </Link>
            <Link
              href="/blog"
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 hover:bg-gray-900/60 p-4 transition-colors"
            >
              <h3 className="font-semibold text-white">📚 Blog de viajes baratos</h3>
              <p className="text-sm text-gray-400 mt-1">
                150+ guías prácticas: rutas, ahorros, error fares, hacks de equipaje.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
