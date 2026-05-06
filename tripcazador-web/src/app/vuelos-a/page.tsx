import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRY_HUBS } from "@/lib/country_hubs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Vuelos a cualquier país — Guía + ofertas TripCazador",
  description: "Guías de vuelos a 13 países top: temporadas, visados, precios típicos, destinos top y consejos prácticos.",
  alternates: { canonical: "/vuelos-a" },
};

export const revalidate = 86400;
export const dynamic = "force-static";

export default function VuelosAIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: COUNTRY_HUBS.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/vuelos-a/${c.slug}`,
      name: `Vuelos a ${c.name}`,
    })),
  };
  return (
    <>
      <SectionHero title="Vuelos por país" subtitle="Cuándo ir, cuánto cuesta, qué necesitas." size="compact" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COUNTRY_HUBS.map((c) => (
            <Link key={c.slug} href={`/vuelos-a/${c.slug}`} className="panel hover:border-amber-400 transition group">
              <div className="text-3xl mb-2">{c.emoji}</div>
              <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
                {c.name} <span className="text-xs text-gray-400 font-normal">{c.region}</span>
              </h2>
              <p className="text-sm text-gray-300 mt-2 line-clamp-2">{c.intro}</p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="text-amber-400 font-bold">~{c.avg_price_madrid_eur}€</span>
                <span className="text-gray-400">{c.budget_per_day_eur}€/día</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
