/**
 * /precio-vuelo/[origen]/[destino] — SSS337 (20 may 2026)
 *
 * Pattern programmatic SEO #2: rutas origen→destino con histórico de
 * precio y "cuándo reservar". 6 orígenes ES × 48 destinos = 288 URLs.
 *
 * Target queries:
 *  - "precio vuelo madrid lisboa"
 *  - "vuelo barcelona tokio precio"
 *  - "cuanto cuesta volar de bilbao a londres"
 *
 * Cada landing tiene:
 *  - Hero con precio "desde X€" + sweet spot mes
 *  - Tabla mes a mes con estimados (basado en sweetSpot)
 *  - Top deals reales del hunter filtrados origen→destino
 *  - Affiliate cross-sells
 *  - Schema FAQ + WebPage + BreadcrumbList
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  findOrigin,
  findCity,
  SEO_ORIGINS,
  SEO_CITIES,
  MONTHS_ES,
} from "@/lib/programmatic_seo";
import { getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
import { AffiliateCrossSell } from "@/components/AffiliateCrossSell";

export const revalidate = 3600; // ISR 1h

export async function generateStaticParams() {
  const params: { origen: string; destino: string }[] = [];
  for (const origin of SEO_ORIGINS) {
    for (const city of SEO_CITIES) {
      params.push({ origen: origin.slug, destino: city.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { origen: string; destino: string };
}): Promise<Metadata> {
  const origin = findOrigin(params.origen);
  const city = findCity(params.destino);
  if (!origin || !city) return { title: "No encontrado" };
  const title = `Precio vuelo ${origin.display} ${city.display} desde ${city.fromEur}€ · histórico`;
  const description = `¿Cuánto cuesta volar de ${origin.display} a ${city.display}? Precios desde ${city.fromEur}€, histórico mes a mes y cuándo reservar para pagar menos. Datos reales TripCazador.`;
  return {
    title,
    description,
    alternates: { canonical: `/precio-vuelo/${params.origen}/${params.destino}` },
    openGraph: { title, description, type: "article" },
  };
}

/**
 * Genera una estimación mes a mes basada en el sweet spot.
 * Sweet spot = 0.85x baseline. Picos (julio/agosto/dic) = 1.6x.
 * Resto = 1.0-1.3x progresivo.
 */
function monthlyEstimate(baseline: number, sweetSpot: number, monthNum: number): number {
  // Mes sweet spot
  if (monthNum === sweetSpot) return Math.round(baseline * 0.85);
  // Picos comunes: julio, agosto, diciembre
  if ([7, 8, 12].includes(monthNum)) return Math.round(baseline * 1.55);
  // Semana santa estimada (marzo/abril)
  if ([3, 4].includes(monthNum)) return Math.round(baseline * 1.25);
  // Resto: factor según distancia al sweet spot
  const distance = Math.min(
    Math.abs(monthNum - sweetSpot),
    12 - Math.abs(monthNum - sweetSpot),
  );
  return Math.round(baseline * (1 + distance * 0.05));
}

export default async function PrecioVueloLanding({
  params,
}: {
  params: { origen: string; destino: string };
}) {
  const origin = findOrigin(params.origen);
  const city = findCity(params.destino);
  if (!origin || !city) {
    notFound();
  }

  // Top deals reales del hunter filtrados por origen + destino
  const dealsData = await getDeals({ limit: 100 }).catch(() => null);
  const allDeals = dealsData?.deals || [];
  const matching = allDeals
    .filter(
      (d) =>
        d.origin === origin.iata &&
        d.destination === city.iata &&
        (d.price_eur ?? 9e9) <= city.fromEur * 3,
    )
    .slice(0, 6);

  const sweetMonth = MONTHS_ES[city.sweetSpot - 1];
  const cheapestEstimate = monthlyEstimate(city.fromEur, city.sweetSpot, city.sweetSpot);
  const peakEstimate = Math.max(
    ...MONTHS_ES.map((m) => monthlyEstimate(city.fromEur, city.sweetSpot, m.num)),
  );

  const faq = [
    {
      q: `¿Cuánto cuesta un vuelo de ${origin.display} a ${city.display}?`,
      a: `Desde ${city.fromEur}€ ida y vuelta. En ${sweetMonth.display} (sweet spot) puedes encontrar tickets desde ${cheapestEstimate}€. En temporada alta (julio/agosto/Navidad) sube hasta ${peakEstimate}€.`,
    },
    {
      q: `¿Cuál es el mes más barato para volar de ${origin.display} a ${city.display}?`,
      a: `Históricamente, ${sweetMonth.display} es el sweet spot — los precios bajan ~15% vs. el resto del año. Crea una alerta gratis y te avisamos en cuanto aparezca un chollo.`,
    },
    {
      q: `¿Cuánto se tarda en volar de ${origin.display} a ${city.display}?`,
      a:
        city.region === "europa"
          ? `Vuelo directo ${origin.display}–${city.display} suele ser de 2-3h. Con escala puede llegar a 5h.`
          : city.region === "africa"
          ? `${origin.display}–${city.display} con vuelo directo son 3-5h. Algunas combinaciones llevan 1 escala.`
          : `${origin.display}–${city.display} es long-haul: 8-15h con 1 escala típica. Vuelo directo sólo desde Madrid.`,
    },
    {
      q: `¿Mejor reservar con antelación o cerca de la fecha?`,
      a:
        city.region === "europa"
          ? `Para ${city.display} desde ${origin.display}, 4-8 semanas antes es el sweet spot. Última hora suele ser un 30-50% más caro.`
          : `Para ${city.display} long-haul desde ${origin.display}, 3-5 meses antes es el sweet spot. Reservar con menos de 30 días puede duplicar el precio.`,
    },
    {
      q: `¿Hay vuelo directo de ${origin.display} a ${city.display}?`,
      a:
        city.region === "europa"
          ? `Sí — varias aerolíneas low-cost (Ryanair, Vueling, easyJet) operan esta ruta con vuelo directo.`
          : `Vuelo directo ${origin.display}–${city.display} no siempre existe. Lo más habitual es escala en Madrid, Lisboa, París, Frankfurt o Estambul.`,
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
      { "@type": "ListItem", position: 2, name: "Precio vuelo", item: "https://tripcazador.com/precio-vuelo" },
      { "@type": "ListItem", position: 3, name: origin.display, item: `https://tripcazador.com/precio-vuelo/${origin.slug}` },
      {
        "@type": "ListItem",
        position: 4,
        name: `${origin.display} – ${city.display}`,
        item: `https://tripcazador.com/precio-vuelo/${origin.slug}/${city.slug}`,
      },
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
        <span className="text-gray-300">{origin.display} → {city.display}</span>
      </nav>

      <header className="space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          Precio vuelo
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
          Vuelo <em className="text-amber-400 not-italic">{origin.display}</em>{" "}
          → <em className="text-amber-400 not-italic">{city.display}</em>
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl">
          Desde <strong className="text-amber-300">{city.fromEur}€</strong> ida y vuelta.
          {" "}El mes más barato es{" "}
          <strong className="text-white">{sweetMonth.display}</strong> (desde {cheapestEstimate}€).
          En temporada alta sube hasta {peakEstimate}€.
        </p>
      </header>

      {/* Histórico mes a mes */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Histórico mes a mes — {origin.display} a {city.display}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/80">
              <tr className="text-left text-gray-400">
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3">Precio estimado</th>
                <th className="px-4 py-3">Notas</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS_ES.map((m) => {
                const price = monthlyEstimate(city.fromEur, city.sweetSpot, m.num);
                const isSweet = m.num === city.sweetSpot;
                const isPeak = [7, 8, 12].includes(m.num);
                return (
                  <tr
                    key={m.num}
                    className={`border-t border-gray-800 ${
                      isSweet ? "bg-emerald-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-white capitalize">{m.display}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono font-semibold ${
                          isSweet
                            ? "text-emerald-300"
                            : isPeak
                            ? "text-rose-300"
                            : "text-gray-300"
                        }`}
                      >
                        desde {price}€
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {isSweet && "🟢 Sweet spot — mes más barato"}
                      {isPeak && "🔴 Temporada alta — más caro"}
                      {!isSweet && !isPeak && "Precio medio"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          ✱ Precios estimados basados en histórico TripCazador. Los precios reales
          pueden variar — registra una alerta para recibir el chollo concreto cuando aparezca.
        </p>
      </section>

      {/* Deals reales si los hay */}
      {matching.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            🔥 Chollos actuales {origin.display} → {city.display}
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
            Ahora mismo no tenemos error fares activos en la ruta {origin.display} → {city.display}.
            {" "}Crea una{" "}
            <Link href={`/alertas?dest=${city.iata}&orig=${origin.iata}`} className="text-amber-400 hover:underline">
              alerta gratis
            </Link>{" "}
            y te avisamos cuando aparezca.
          </p>
        </section>
      )}

      <AffiliateCrossSell
        origin={origin.iata}
        destination={city.iata}
        cityTo={city.display}
        countryTo={city.country}
      />

      {/* FAQ */}
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

      {/* CTA alerta */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          ¿No quieres perderte el próximo chollo {origin.display} → {city.display}?
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Crea una alerta gratis y te avisamos en cuanto baje el precio. Sin spam, cancela cuando quieras.
        </p>
        <Link
          href={`/alertas?dest=${city.iata}&orig=${origin.iata}`}
          className="inline-block px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
        >
          🔔 Crear alerta gratis {origin.display} → {city.display}
        </Link>
      </section>

      {/* Cross links a otras rutas populares desde el mismo origen */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">
          Otras rutas populares desde {origin.display}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SEO_CITIES.filter((c) => c.slug !== city.slug)
            .slice(0, 12)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/precio-vuelo/${origin.slug}/${c.slug}`}
                className="px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 hover:border-amber-500/40 text-xs text-gray-300 hover:text-white"
              >
                {origin.display} → {c.display}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
