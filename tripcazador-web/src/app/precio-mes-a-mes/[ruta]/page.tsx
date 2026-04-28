import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MONTHLY_ROUTES, getMonthlyPrices } from "@/lib/monthly_prices";

export const dynamicParams = false;
export const revalidate = 86400; // 24h

export async function generateStaticParams() {
  return Object.keys(MONTHLY_ROUTES).map((ruta) => ({ ruta }));
}

export async function generateMetadata({
  params,
}: {
  params: { ruta: string };
}): Promise<Metadata> {
  const route = MONTHLY_ROUTES[params.ruta];
  if (!route) return { title: "Precio mes a mes — TripCazador" };

  const title = `Vuelos ${route.origin_city} → ${route.dest_city}: precio mes a mes 2026-2027 | TripCazador`;
  const description = `Tabla precios mes a mes ${route.origin}→${route.destination} para próximos 12 meses. Mejor mes para volar, sweet spots de booking, calendar trending data del motor TripCazador.`;
  const url = `https://tripcazador.com/precio-mes-a-mes/${params.ruta}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "es_ES",
      siteName: "TripCazador",
    },
  };
}

export default function MonthlyPricePage({ params }: { params: { ruta: string } }) {
  const route = MONTHLY_ROUTES[params.ruta];
  if (!route) notFound();

  const months = getMonthlyPrices(route.hints, 2026, 7);
  const cheapest = [...months].sort((a, b) => a.minPrice - b.minPrice)[0];
  const expensive = [...months].sort((a, b) => b.minPrice - a.minPrice)[0];

  // Schema.org Dataset + AggregateOffer
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Precios mensuales ${route.origin_city} → ${route.dest_city}`,
    description: `Mediana de precios cash mes a mes ${route.origin}→${route.destination} para los próximos 12 meses`,
    url: `https://tripcazador.com/precio-mes-a-mes/${params.ruta}`,
    keywords: [
      `vuelos ${route.origin_city} ${route.dest_city}`,
      `mejor mes volar ${route.dest_city}`,
      "precio mes a mes",
      "calendario precios vuelos",
    ],
    creator: {
      "@type": "Organization",
      name: "TripCazador",
      url: "https://tripcazador.com",
    },
  };

  const aggregateOffer = {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: cheapest.minPrice,
    highPrice: expensive.medPrice,
    offerCount: months.length,
    itemOffered: {
      "@type": "Service",
      name: `Vuelo ${route.origin_city} → ${route.dest_city}`,
      provider: { "@type": "Organization", name: "Multiple airlines" },
    },
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateOffer) }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        {" / "}
        <Link href="/destinos" className="hover:text-amber-400">Destinos</Link>
        {" / "}
        <span className="text-gray-300">Precio mes a mes {route.origin}→{route.destination}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">
          Vuelos {route.origin_city} → {route.dest_city}
        </h1>
        <p className="text-lg text-gray-300 mt-2">
          Precio mes a mes 2026-2027 · {route.country}
          {route.hints.flightTimeHrs && ` · ~${route.hints.flightTimeHrs}h vuelo`}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-xs uppercase text-green-400">Mes más barato</p>
          <p className="text-2xl font-bold text-white mt-1">{cheapest.monthLabel}</p>
          <p className="text-sm text-gray-300">desde <span className="text-green-300 font-semibold">{cheapest.minPrice}€</span></p>
        </div>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-xs uppercase text-red-400">Mes más caro</p>
          <p className="text-2xl font-bold text-white mt-1">{expensive.monthLabel}</p>
          <p className="text-sm text-gray-300">desde <span className="text-red-300 font-semibold">{expensive.minPrice}€</span></p>
        </div>
      </section>

      <section className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th scope="col" className="text-left p-3">Mes</th>
              <th scope="col" className="text-right p-3">Desde</th>
              <th scope="col" className="text-right p-3 hidden sm:table-cell">Mediana</th>
              <th scope="col" className="text-left p-3 hidden md:table-cell">Mejor día</th>
              <th scope="col" className="text-left p-3">Notas</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {months.map((m) => {
              const rankBg =
                m.rank === "cheap"
                  ? "bg-green-900/10"
                  : m.rank === "expensive"
                  ? "bg-red-900/10"
                  : "";
              const priceColor =
                m.rank === "cheap"
                  ? "text-green-400"
                  : m.rank === "expensive"
                  ? "text-red-400"
                  : "text-amber-300";
              return (
                <tr key={m.month} className={`${rankBg} border-t border-gray-800`}>
                  <td className="p-3 font-medium">{m.monthLabel}</td>
                  <td className={`p-3 text-right font-bold ${priceColor}`}>{m.minPrice}€</td>
                  <td className="p-3 text-right text-gray-400 hidden sm:table-cell">{m.medPrice}€</td>
                  <td className="p-3 text-gray-400 hidden md:table-cell">{m.bestDayLabel}</td>
                  <td className="p-3 text-gray-300">{m.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-8 prose prose-invert max-w-none">
        <h2>Cómo aprovechar este calendario</h2>
        <ul>
          <li>
            <strong>Reserva con antelación correcta:</strong> 4-8 semanas para shoulder season,
            12-20 semanas para temporada alta (jul-ago, dic-ene, semana santa).
          </li>
          <li>
            <strong>Activa una alerta de precio</strong> para esta ruta y te avisamos cuando un
            error fare baje del precio de mes más barato.
          </li>
          <li>
            <strong>Vuela en los días óptimos:</strong> martes/miércoles suele ahorrar 15-25%
            vs viernes/domingo.
          </li>
          <li>
            <strong>Combina con stopovers gratuitos</strong> cuando vueles con QR (Doha 96h),
            TK (Estambul 24-48h) o IS (Reikiavik 7d).
          </li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          Datos basados en heurística estacional + medianas observadas por el motor
          TripCazador. Los precios reales pueden variar ±20% según anticipación, día de
          la semana, eventos especiales y disponibilidad de error fares. Esta página no
          es una garantía de precio — sirve como orientación para planificar.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <h2 className="col-span-full text-lg font-semibold text-gray-300 mb-2">Otras rutas</h2>
        {Object.entries(MONTHLY_ROUTES)
          .filter(([k]) => k !== params.ruta)
          .slice(0, 9)
          .map(([slug, r]) => (
            <Link
              key={slug}
              href={`/precio-mes-a-mes/${slug}`}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md p-3 transition-colors"
            >
              <p className="text-amber-400 font-semibold">{r.origin_city} → {r.dest_city}</p>
              <p className="text-xs text-gray-400">desde {r.hints.basePrice}€ ({r.country})</p>
            </Link>
          ))}
      </section>
    </main>
  );
}
