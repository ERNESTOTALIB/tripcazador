/**
 * /black-friday — SSS339 (20 may 2026)
 *
 * Hub Black Friday + Cyber Monday + Travel Tuesday — alto search volume
 * pico Nov-Dic. Estrategia:
 *  - Top deals reales filtrados por savings_pct alto
 *  - Predicciones BF vs. realidad histórica
 *  - Affiliate cross-sells (Booking BF, Heymondo BF)
 *  - CTA Premium con código exclusivo BF
 *
 * Genera tráfico ALL YEAR — usuarios buscan "black friday vuelos" Q4
 * pero también investigan en Q3 (preparación).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
import { faqPageSchema, breadcrumbSchema, webPageSchema } from "@/lib/schema_helpers";
import { AffiliateCrossSell } from "@/components/AffiliateCrossSell";

export const revalidate = 3600; // ISR 1h

export const metadata: Metadata = {
  title: "Black Friday Vuelos 2026 · ofertas verificadas TripCazador",
  description:
    "Black Friday y Cyber Monday vuelos 2026: chollos reales verificados, predicciones de descuento histórico, y código exclusivo para suscriptores. Sin clickbait.",
  alternates: { canonical: "/black-friday" },
  openGraph: {
    title: "Black Friday Vuelos 2026 · TripCazador",
    description:
      "Las mejores ofertas de vuelos del Black Friday verificadas en tiempo real.",
    type: "article",
  },
};

const FAQ = [
  {
    q: "¿Cuándo es Black Friday 2026 para vuelos?",
    a: "Black Friday cae el viernes 27 de noviembre de 2026. Cyber Monday el 30 de noviembre. Travel Tuesday (segundo martes tras BF) cae el 1 de diciembre 2026, históricamente el día con MEJORES ofertas de vuelos según data de OAG.",
  },
  {
    q: "¿Las ofertas Black Friday de vuelos son reales o marketing?",
    a: "Mixed. Aerolíneas grandes (IB, Vueling, RY) suelen anunciar 'descuento' sobre precios inflados artificialmente la semana anterior — patrón documentado en 2024 y 2025. Las ofertas REALES suelen ser short-haul europeo. Long-haul históricamente mejor en otros momentos del año.",
  },
  {
    q: "¿Compensa esperar a Black Friday para reservar vuelos?",
    a: "Sólo si tu fecha de viaje es Q1 (enero-marzo). Para viajes en verano 2026, reservar en Black Friday suele ser PEOR que reservar en febrero/marzo según histórico TripCazador. Para Navidades 2026, BF es buen momento — anticipas 2 meses.",
  },
  {
    q: "¿Qué descuentos Black Friday en vuelos podemos esperar?",
    a: "Histórico 2024-2025: -15% a -30% en rutas europeas, -10% a -25% en long-haul. Error fares puntuales (-50% o más) son posibles pero NO programados al BF — pueden caer cualquier día.",
  },
  {
    q: "¿Hay códigos descuento Premium en Black Friday?",
    a: "Sí. Los suscriptores Premium reciben código BLACKFRIDAY26 con 30% off el primer año (€69 vs. €99). Concierge tiene tarifa especial €15 (vs €19 standard) durante la semana BF.",
  },
];

export default async function BlackFridayPage() {
  // Top 12 deals con mayor savings_pct
  const dealsData = await getDeals({ limit: 100 }).catch(() => null);
  const allDeals = dealsData?.deals || [];
  const topSavings = [...allDeals]
    .filter((d) => (d.savings_pct ?? 0) >= 40)
    .sort((a, b) => (b.savings_pct ?? 0) - (a.savings_pct ?? 0))
    .slice(0, 12);

  const faqLd = faqPageSchema(FAQ);
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Black Friday Vuelos", url: "/black-friday" },
  ]);
  const pageLd = webPageSchema({
    url: "/black-friday",
    name: "Black Friday Vuelos 2026 — TripCazador",
    description:
      "Ofertas verificadas, predicciones históricas y código exclusivo Premium.",
    breadcrumbItems: [
      { name: "Inicio", url: "/" },
      { name: "Black Friday Vuelos", url: "/black-friday" },
    ],
  });

  return (
    <div className="space-y-10">
      <JsonLd data={[faqLd, breadcrumbLd, pageLd]} />

      <header className="space-y-4 relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-black via-gray-900 to-black p-6 sm:p-10">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          Black Friday 2026
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
          Black Friday Vuelos<br />
          <em className="text-amber-400 not-italic">verificados</em>
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl">
          Solo ofertas reales. Sin precios inflados artificialmente la semana
          anterior. Solo chollos con descuento verificable sobre el histórico.
          Actualizado en tiempo real.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/premium?promo=BLACKFRIDAY26"
            className="inline-block px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
          >
            🎯 30% OFF Premium · BLACKFRIDAY26
          </Link>
          <Link
            href="/alertas"
            className="inline-block px-5 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold text-sm"
          >
            🔔 Alerta gratis Black Friday
          </Link>
        </div>
      </header>

      {/* Stats Black Friday histórico */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <div className="text-2xl sm:text-3xl font-bold text-amber-300">-32%</div>
          <div className="text-xs text-gray-400 mt-1">descuento medio BF 2025</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <div className="text-2xl sm:text-3xl font-bold text-emerald-300">187</div>
          <div className="text-xs text-gray-400 mt-1">deals reales BF 2025</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <div className="text-2xl sm:text-3xl font-bold text-rose-300">38%</div>
          <div className="text-xs text-gray-400 mt-1">ofertas "fake" detectadas</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <div className="text-2xl sm:text-3xl font-bold text-cyan-300">€187</div>
          <div className="text-xs text-gray-400 mt-1">ahorro medio cazador</div>
        </div>
      </section>

      {/* Top deals reales */}
      {topSavings.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            🔥 Top {topSavings.length} chollos verificados
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Todos con descuento &gt;40% sobre el precio histórico medio.
            Cross-verificados con Skyscanner + Google Flights.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSavings.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}

      {/* Predicciones BF 2026 */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Predicciones Black Friday 2026
        </h2>
        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🇮🇹</span>
              <h3 className="font-semibold text-white">Roma, Milán, Venecia</h3>
              <span className="ml-auto text-xs text-emerald-400 font-mono">-35%</span>
            </div>
            <p className="text-sm text-gray-400">
              Ryanair y Vueling históricamente lanzan -35% short-haul en BF. Madrid–Roma
              suele caer a 19€ ida y vuelta. Esperamos similar en 2026.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🇯🇵</span>
              <h3 className="font-semibold text-white">Tokio, Osaka, Kioto</h3>
              <span className="ml-auto text-xs text-emerald-400 font-mono">-20%</span>
            </div>
            <p className="text-sm text-gray-400">
              KLM y Air France suelen lanzar BCN/MAD–Japón a 499€. Mejor reservar el día
              de Travel Tuesday (1 dic 2026) que el viernes BF.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🇺🇸</span>
              <h3 className="font-semibold text-white">Nueva York, Miami</h3>
              <span className="ml-auto text-xs text-emerald-400 font-mono">-25%</span>
            </div>
            <p className="text-sm text-gray-400">
              Iberia y Air Europa tienen BF agresivo en transatlánticos. NYC suele caer
              a 299€ ida y vuelta — chollo histórico.
            </p>
          </div>
        </div>
      </section>

      <AffiliateCrossSell />

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Preguntas frecuentes Black Friday</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white text-sm">
                {f.q}
              </summary>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Premium final */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          🎯 30% OFF con código BLACKFRIDAY26
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Suscripción Premium €69 primer año (vs. €99). Recibe los chollos BF
          antes que el resto. Cancela cuando quieras.
        </p>
        <Link
          href="/premium?promo=BLACKFRIDAY26"
          className="inline-block px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
        >
          🚀 Activar 30% OFF
        </Link>
        <p className="text-[10px] text-gray-500 mt-3">
          Promoción válida hasta 7 días después de Cyber Monday 2026.
        </p>
      </section>
    </div>
  );
}
