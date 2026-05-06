import type { Metadata } from "next";
import Link from "next/link";
import { HOTELS_VS_AIRBNB } from "@/lib/hotels_vs_airbnb";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Hotel vs Airbnb por ciudad — Cuál elegir según destino",
  description:
    "Comparativa Hotel vs Airbnb en 12 ciudades top: Tokio, Bali, Lisboa, París, Roma, NYC… Métricas, precios medios, recomendación por tipo de viajero.",
  alternates: { canonical: "/hoteles-vs-airbnb" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function HotelsVsAirbnbIndex() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: HOTELS_VS_AIRBNB.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://tripcazador.com/hoteles-vs-airbnb/${c.slug}`,
        name: `${c.city} — Hotel vs Airbnb`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com" },
        { "@type": "ListItem", position: 2, name: "Hotel vs Airbnb", item: "https://tripcazador.com/hoteles-vs-airbnb" },
      ],
    },
  ];

  return (
    <>
      <SectionHero
        title="Hotel vs Airbnb: cuál elegir"
        subtitle="Comparativa por ciudad con métricas reales de precio, espacio, ubicación y experiencia. Recomendación según seas solo, pareja, familia o business."
        size="compact"
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOTELS_VS_AIRBNB.map((c) => (
            <Link
              key={c.slug}
              href={`/hoteles-vs-airbnb/${c.slug}`}
              className="panel hover:border-amber-400 transition group"
            >
              <div className="text-3xl mb-2">{c.hero_emoji}</div>
              <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
                {c.city} <span className="text-sm text-gray-400 font-normal">{c.country}</span>
              </h2>
              <p className="text-sm text-gray-300 mt-1 line-clamp-2">{c.intro}</p>
              <div className="mt-3 flex items-baseline gap-3 text-xs">
                <div>
                  <div className="text-gray-400 uppercase">Hotel 3★</div>
                  <div className="text-amber-400 font-bold">{c.avg_price_per_night.hotel_3star}€/n</div>
                </div>
                <div>
                  <div className="text-gray-400 uppercase">Airbnb apt</div>
                  <div className="text-emerald-400 font-bold">{c.avg_price_per_night.airbnb_apt}€/n</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
