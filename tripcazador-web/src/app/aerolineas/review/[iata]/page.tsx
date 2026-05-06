import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AIRLINE_REVIEWS, getAirlineReview } from "@/lib/airline_reviews";
import { JsonLd } from "@/components/JsonLd";

type Params = { iata: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return AIRLINE_REVIEWS.map((a) => ({ iata: a.iata.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { iata } = await params;
  const a = getAirlineReview(iata);
  if (!a) return { title: "No encontrado" };
  return {
    title: `${a.name} review 2026 — Puntualidad, equipaje, comida, servicio`,
    description: `Review profundo de ${a.name}: ${a.on_time_pct}% on-time, ${a.bag_lost_per_1000}/1000 bolsas perdidas, comodidad ${a.cabin_score}/10, comida ${a.food_score}/10. ${a.verdict}`,
    alternates: { canonical: `/aerolineas/review/${iata.toLowerCase()}` },
  };
}

export default async function AirlineReviewPage({ params }: { params: Promise<Params> }) {
  const { iata } = await params;
  const a = getAirlineReview(iata);
  if (!a) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Airline",
      name: a.name,
      iataCode: a.iata,
      icaoCode: a.icao,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: a.star_rating,
      bestRating: 5,
    },
    author: { "@type": "Organization", name: "TripCazador" },
    reviewBody: a.verdict,
  };

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400">{a.name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Hub {a.hub} · Alianza {a.alliance}
          </p>
          <div className="mt-3 inline-flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`text-xl ${i < a.star_rating ? "text-amber-400" : "text-slate-700"}`}>★</span>
            ))}
            <span className="ml-2 text-sm text-gray-400">{a.star_rating}/5</span>
          </div>
        </div>

        <div className="panel mb-6 bg-amber-400/5 border-amber-400/30">
          <p className="text-base text-gray-200">{a.verdict}</p>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Puntualidad" value={`${a.on_time_pct}%`} good={a.on_time_pct >= 80} bad={a.on_time_pct < 70} />
          <Stat label="Bolsas perdidas /1000" value={a.bag_lost_per_1000.toFixed(1)} good={a.bag_lost_per_1000 < 5} bad={a.bag_lost_per_1000 >= 10} />
          <Stat label="Comodidad" value={`${a.cabin_score}/10`} good={a.cabin_score >= 8} bad={a.cabin_score < 5} />
          <Stat label="Comida" value={`${a.food_score}/10`} good={a.food_score >= 8} bad={a.food_score < 5} />
          <Stat label="Servicio" value={`${a.service_score}/10`} good={a.service_score >= 8} bad={a.service_score < 5} />
          <Stat label="Valor" value={`${a.value_score}/10`} good={a.value_score >= 8} bad={a.value_score < 5} />
          <Stat label="Equipaje cabina" value={`${a.hand_baggage_kg}kg`} />
          <Stat label="Equipaje facturado" value={a.checked_baggage_included ? "Incluido" : "Opcional"} good={a.checked_baggage_included} />
        </section>

        <section className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="panel border-emerald-500/40 bg-emerald-500/5">
            <h2 className="text-lg font-bold text-emerald-300">✓ Pros</h2>
            <ul className="mt-2 space-y-1 text-sm text-gray-200">
              {a.pros.map((p, i) => <li key={i}>• {p}</li>)}
            </ul>
          </div>
          <div className="panel border-red-500/40 bg-red-500/5">
            <h2 className="text-lg font-bold text-red-300">− Contras</h2>
            <ul className="mt-2 space-y-1 text-sm text-gray-200">
              {a.cons.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="panel">
            <h3 className="text-sm uppercase tracking-wide text-amber-400 font-bold">Mejor para</h3>
            <ul className="mt-2 text-sm text-gray-200 space-y-1">
              {a.best_for.map((b, i) => <li key={i}>✓ {b}</li>)}
            </ul>
          </div>
          <div className="panel">
            <h3 className="text-sm uppercase tracking-wide text-amber-400 font-bold">Evitar para</h3>
            <ul className="mt-2 text-sm text-gray-200 space-y-1">
              {a.worst_for.map((b, i) => <li key={i}>− {b}</li>)}
            </ul>
          </div>
        </section>

        <p className="text-xs text-gray-500 text-center">
          Datos: agregados públicos FlightStats / Cirium / OAG / SITA Baggage Report 2025-2026.
        </p>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}

function Stat({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  const color = good ? "border-emerald-500/40 text-emerald-300" : bad ? "border-red-500/40 text-red-300" : "border-amber-400/30 text-amber-400";
  return (
    <div className={`rounded-lg p-3 border ${color} bg-slate-800/30 text-center`}>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}
