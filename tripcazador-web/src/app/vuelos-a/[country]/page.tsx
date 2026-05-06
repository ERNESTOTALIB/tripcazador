import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COUNTRY_HUBS, getCountryBySlug } from "@/lib/country_hubs";
import { JsonLd } from "@/components/JsonLd";

type Params = { country: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return COUNTRY_HUBS.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country } = await params;
  const c = getCountryBySlug(country);
  if (!c) return { title: "No encontrado" };
  return {
    title: `Vuelos a ${c.name} desde España — Cuándo, cuánto, qué saber`,
    description: `Guía completa para vuelos a ${c.name}: mejor temporada, precio típico (~${c.avg_price_madrid_eur}€), ${c.visa_status.toLowerCase()}, top destinos y tips prácticos.`,
    alternates: { canonical: `/vuelos-a/${c.slug}` },
    openGraph: { type: "article", title: `Vuelos a ${c.name}`, description: c.intro },
  };
}

export default async function CountryHubPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const c = getCountryBySlug(country);
  if (!c) notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: c.name,
      description: c.intro,
      touristType: "international",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com" },
        { "@type": "ListItem", position: 2, name: "Vuelos por país", item: "https://tripcazador.com/vuelos-a" },
        { "@type": "ListItem", position: 3, name: c.name, item: `https://tripcazador.com/vuelos-a/${c.slug}` },
      ],
    },
  ];

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{c.emoji}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">Vuelos a {c.name}</h1>
          <p className="mt-3 text-gray-300 max-w-2xl mx-auto">{c.intro}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat label="Vuelo desde MAD" value={`~${c.avg_price_madrid_eur}€`} />
          <Stat label="Presupuesto día" value={`${c.budget_per_day_eur}€`} />
          <Stat label="Visa" value={c.visa_status} />
          <Stat label="Capital" value={c.capital} />
        </div>

        <section className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="panel border-emerald-500/40 bg-emerald-500/5">
            <h2 className="text-lg font-bold text-emerald-300">📅 Mejor temporada</h2>
            <p className="text-sm text-gray-200 mt-2">{c.best_months.join(", ").toUpperCase()}</p>
          </div>
          <div className="panel border-red-500/40 bg-red-500/5">
            <h2 className="text-lg font-bold text-red-300">🚫 Evitar</h2>
            <p className="text-sm text-gray-200 mt-2">{c.worst_months.join(", ").toUpperCase()}</p>
          </div>
        </section>

        <section className="panel mb-8">
          <h2 className="text-lg font-bold text-amber-400 mb-4">Top destinos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {c.top_cities.map((city) => (
              <a
                key={city.iata}
                href={`/deals?destination=${city.iata}`}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-lg p-3 transition"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold text-white">{city.name}</h3>
                  <span className="text-xs text-gray-400">{city.iata}</span>
                </div>
                <p className="text-xs text-gray-300 mt-1">{city.teaser}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="panel mb-8">
          <h2 className="text-lg font-bold text-amber-400 mb-4">Tips locales</h2>
          <ul className="space-y-2 text-sm text-gray-200">
            {c.tips.map((tip, i) => (
              <li key={i}>💡 {tip}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-4">
            Idioma: {c.language} · Moneda: {c.currency}
          </p>
        </section>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/deals?destination=${c.top_cities[0].iata}`}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-6 py-3 rounded-lg"
          >
            Ver vuelos a {c.name} →
          </Link>
          <Link
            href={`/visados`}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg"
          >
            Detalle visa →
          </Link>
        </div>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 border border-amber-400/30 bg-amber-400/5 text-center">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-base font-bold text-amber-400 mt-1">{value}</div>
    </div>
  );
}
