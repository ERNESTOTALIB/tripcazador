/**
 * /vuelos-baratos/[ciudad]/[mes] — SSS337 (20 may 2026)
 *
 * Landing programmatic SEO: 48 ciudades × 12 meses = 576 URLs.
 * Target query: "vuelos baratos {ciudad} {mes}" (~5-50k/mes ES).
 *
 * Cada landing tiene contenido único:
 *  - Hero con precio "desde X€" anchor
 *  - Sweet spot comparison vs el mes consultado
 *  - Top 6 deals reales filtrados (si el destino tiene)
 *  - Affiliate cross-sells (Heymondo, Holafly long-haul)
 *  - Schema FAQPage + WebPage
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  findCity,
  findMonth,
  sweetSpotCopy,
  SEO_CITIES,
  MONTHS_ES,
} from "@/lib/programmatic_seo";
import { getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
import { AffiliateCrossSell } from "@/components/AffiliateCrossSell";

export const revalidate = 3600; // ISR 1h

export async function generateStaticParams() {
  const params: { ciudad: string; mes: string }[] = [];
  for (const city of SEO_CITIES) {
    for (const month of MONTHS_ES) {
      params.push({ ciudad: city.slug, mes: month.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { ciudad: string; mes: string };
}): Promise<Metadata> {
  const city = findCity(params.ciudad);
  const month = findMonth(params.mes);
  if (!city || !month) return { title: "No encontrado" };
  const year = new Date().getFullYear();
  const targetYear = month.num < new Date().getMonth() + 1 ? year + 1 : year;
  const title = `Vuelos baratos ${city.display} en ${month.display} ${targetYear} desde ${city.fromEur}€`;
  const description = `Los mejores chollos de vuelos a ${city.display} (${city.country}) en ${month.display} ${targetYear}. Desde ${city.fromEur}€. Histórico de precios, sweet spot y consejos para reservar al mejor precio.`;
  return {
    title,
    description,
    alternates: { canonical: `/vuelos-baratos/${params.mes}/${params.ciudad}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function VuelosBaratosLanding({
  params,
}: {
  params: { ciudad: string; mes: string };
}) {
  const city = findCity(params.ciudad);
  const month = findMonth(params.mes);
  if (!city || !month) {
    notFound();
  }
  const year = new Date().getFullYear();
  const targetYear = month.num < new Date().getMonth() + 1 ? year + 1 : year;

  // Top deals reales del hunter filtrados por destino
  const dealsData = await getDeals({ limit: 100 }).catch(() => null);
  const allDeals = dealsData?.deals || [];
  const matching = allDeals
    .filter(
      (d) => d.destination === city.iata && (d.price_eur ?? 9e9) <= city.fromEur * 3,
    )
    .slice(0, 6);

  const sweetCopy = sweetSpotCopy(city, month.num);

  const faq = [
    {
      q: `¿Cuál es el mes más barato para volar a ${city.display}?`,
      a: `Históricamente, ${MONTHS_ES[city.sweetSpot - 1].display} es el sweet spot. Aun así, ${month.display} ${targetYear} puede tener chollos puntuales — registra una alerta TripCazador y te avisamos.`,
    },
    {
      q: `¿Desde qué precio puedo encontrar vuelos a ${city.display}?`,
      a: `Históricamente desde ${city.fromEur}€ ida y vuelta. Con error fares puntuales hemos visto precios -30% por debajo. Premium recibe alertas en <60s.`,
    },
    {
      q: `¿Mejor reservar con antelación o cerca de la fecha?`,
      a: `Para vuelos a ${city.region === "europa" ? "Europa, 4-8 semanas antes" : city.region === "asia" || city.region === "oceania" ? "Asia/Oceanía long-haul, 3-5 meses antes" : "América, 2-4 meses antes"} es el sweet spot. Última hora suele ser más caro.`,
    },
    {
      q: `¿Cuántas escalas suelen tener los vuelos a ${city.display}?`,
      a: city.region === "europa"
        ? `${city.display} desde España suele tener vuelo directo en 2-3 horas. Hay alternativas con escala más baratas.`
        : `Los vuelos a ${city.display} desde España suelen tener 1-2 escalas. Vuelos directos existen pero suelen ser 30-50% más caros.`,
    },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
      { "@type": "ListItem", position: 2, name: "Vuelos baratos", item: "https://tripcazador.com/vuelos-baratos" },
      { "@type": "ListItem", position: 3, name: month.display, item: `https://tripcazador.com/vuelos-baratos/${month.slug}` },
      { "@type": "ListItem", position: 4, name: `${city.display} en ${month.display} ${targetYear}`, item: `https://tripcazador.com/vuelos-baratos/${month.slug}/${city.slug}` },
    ],
  };

  return (
    <div className="space-y-10">
      <JsonLd data={[faqLd, breadcrumbLd]} />

      <nav className="text-xs text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-1">/</span>
        <Link href="/deals" className="hover:text-amber-400">Deals</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-300">{city.display} en {month.display} {targetYear}</span>
      </nav>

      <header className="space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          Vuelos baratos
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
          Vuelos baratos a <em className="text-amber-400 not-italic">{city.display}</em>
          {" "}en {month.display} {targetYear}
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl">
          Desde <strong className="text-amber-300">{city.fromEur}€</strong>. {sweetCopy}
        </p>
      </header>

      {matching.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            🔥 Chollos actuales a {city.display}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matching.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}

      {matching.length === 0 && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
          <p className="text-sm text-gray-400">
            Ahora mismo no tenemos error fares activos a {city.display}. Crea una{" "}
            <Link href="/alertas" className="text-amber-400 hover:underline">
              alerta gratis
            </Link>{" "}
            y te avisamos cuando aparezca el siguiente.
          </p>
        </section>
      )}

      <AffiliateCrossSell
        destination={city.iata}
        cityTo={city.display}
        countryTo={city.country}
      />

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {faq.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white text-sm">
                {f.q}
              </summary>
              <p className="text-sm text-gray-300 mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          ¿No quieres perderte el próximo chollo a {city.display}?
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Crea una alerta gratis y te avisamos en cuanto baje el precio. Sin spam, cancela cuando quieras.
        </p>
        <Link
          href={`/alertas?dest=${city.iata}`}
          className="inline-block px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
        >
          🔔 Crear alerta gratis para {city.display}
        </Link>
      </section>
    </div>
  );
}
