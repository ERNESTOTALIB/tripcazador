import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HOTELS_VS_AIRBNB, getCityComparison } from "@/lib/hotels_vs_airbnb";
import { JsonLd } from "@/components/JsonLd";

type Params = { city: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return HOTELS_VS_AIRBNB.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  const c = getCityComparison(city);
  if (!c) return { title: "No encontrado" };
  return {
    title: `Hotel vs Airbnb en ${c.city} — Cuál elegir y cuánto cuesta`,
    description: `${c.intro} Precios medios, recomendación por tipo de viajero y mejores barrios.`,
    alternates: { canonical: `/hoteles-vs-airbnb/${c.slug}` },
    openGraph: {
      type: "article",
      title: `Hotel vs Airbnb en ${c.city}`,
      description: c.intro,
    },
  };
}

function bar(score: number, color: string): React.ReactNode {
  return (
    <div className="flex-1 bg-slate-800 rounded h-1.5 overflow-hidden">
      <div className={`${color} h-full`} style={{ width: `${score * 10}%` }} />
    </div>
  );
}

export default async function HotelsVsAirbnbCityPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const c = getCityComparison(city);
  if (!c) notFound();

  const tpMarker = process.env.NEXT_PUBLIC_TP_MARKER || "tripcazador";
  const bookingAid = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";
  const hotelLink = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(c.city)}&aid=${bookingAid}`;
  const airbnbLink = `https://www.airbnb.com/s/${encodeURIComponent(c.city)}/homes`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Hotel vs Airbnb en ${c.city}`,
      description: c.intro,
      author: { "@type": "Organization", name: "TripCazador" },
      publisher: { "@type": "Organization", name: "TripCazador" },
      mainEntityOfPage: `https://tripcazador.com/hoteles-vs-airbnb/${c.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Hotel vs Airbnb",
          item: "https://tripcazador.com/hoteles-vs-airbnb",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: c.city,
          item: `https://tripcazador.com/hoteles-vs-airbnb/${c.slug}`,
        },
      ],
    },
  ];

  const overall = (Object.values(c.axes).reduce((sum, ax) => sum + ax.hotel - ax.airbnb, 0));
  const winner = overall > 0 ? "hotel" : overall < 0 ? "airbnb" : "tie";

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{c.hero_emoji}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">
            Hotel vs Airbnb en {c.city}
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl mx-auto">{c.intro}</p>
        </div>

        {/* Veredicto */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div
            className={`panel ${winner === "hotel" ? "border-amber-400 bg-amber-400/5" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-blue-300">🏨 Hotel</h2>
              <a
                href={hotelLink}
                target="_blank"
                rel="noopener sponsored"
                className="text-xs bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded"
              >
                Ver en Booking →
              </a>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-400 uppercase">3★</div>
                <div className="text-white text-lg font-bold">{c.avg_price_per_night.hotel_3star}€/n</div>
              </div>
              <div>
                <div className="text-gray-400 uppercase">4★</div>
                <div className="text-white text-lg font-bold">{c.avg_price_per_night.hotel_4star}€/n</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-gray-200">
              {c.hotel_pros.map((p, i) => (
                <li key={i}>✓ {p}</li>
              ))}
            </ul>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              {c.hotel_cons.map((p, i) => (
                <li key={i}>− {p}</li>
              ))}
            </ul>
          </div>

          <div
            className={`panel ${winner === "airbnb" ? "border-emerald-400 bg-emerald-400/5" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-emerald-300">🏠 Airbnb</h2>
              <a
                href={airbnbLink}
                target="_blank"
                rel="noopener sponsored"
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1 rounded"
              >
                Ver en Airbnb →
              </a>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-400 uppercase">Habitación</div>
                <div className="text-white text-lg font-bold">{c.avg_price_per_night.airbnb_room}€/n</div>
              </div>
              <div>
                <div className="text-gray-400 uppercase">Apartamento</div>
                <div className="text-white text-lg font-bold">{c.avg_price_per_night.airbnb_apt}€/n</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-gray-200">
              {c.airbnb_pros.map((p, i) => (
                <li key={i}>✓ {p}</li>
              ))}
            </ul>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              {c.airbnb_cons.map((p, i) => (
                <li key={i}>− {p}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tabla de ejes */}
        <div className="panel mb-8">
          <h3 className="text-lg font-bold text-amber-400 mb-4">Comparativa por dimensión</h3>
          <div className="space-y-3">
            {Object.entries(c.axes).map(([axis, scores]) => (
              <div key={axis}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs uppercase tracking-wide text-gray-400 w-24 capitalize">
                    {axis.replace("_", " ")}
                  </span>
                  <span className="text-xs text-blue-300 w-12 text-right">{scores.hotel}/10</span>
                  {bar(scores.hotel, "bg-blue-500")}
                  <span className="text-xs text-gray-500">vs</span>
                  {bar(scores.airbnb, "bg-emerald-500")}
                  <span className="text-xs text-emerald-300 w-12">{scores.airbnb}/10</span>
                </div>
                <p className="text-xs text-gray-400 ml-28">{scores.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones por tipo */}
        <div className="panel mb-8">
          <h3 className="text-lg font-bold text-amber-400 mb-4">¿Cuál te conviene a ti?</h3>
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(c.recommendation).map(([type, choice]) => (
              <div
                key={type}
                className={`p-3 rounded-lg border text-center ${
                  choice === "hotel"
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-200"
                    : "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                }`}
              >
                <div className="text-xs uppercase tracking-wide opacity-70 capitalize">
                  {type === "long_stay" ? "Larga estancia" : type}
                </div>
                <div className="text-lg font-bold mt-1">
                  {choice === "hotel" ? "🏨 Hotel" : "🏠 Airbnb"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mejores barrios */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="panel">
            <h3 className="font-bold text-blue-300">Mejores barrios para hotel</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-200">
              {c.best_neighborhoods_hotel.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3 className="font-bold text-emerald-300">Mejores barrios para Airbnb</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-200">
              {c.best_neighborhoods_airbnb.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href={hotelLink}
            target="_blank"
            rel="noopener sponsored"
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-lg"
          >
            Ver hoteles en {c.city}
          </a>
          <a
            href={airbnbLink}
            target="_blank"
            rel="noopener sponsored"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-lg"
          >
            Ver Airbnb en {c.city}
          </a>
        </div>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
