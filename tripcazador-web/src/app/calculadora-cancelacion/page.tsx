import type { Metadata } from "next";
import { CancellationCalculator } from "@/components/CancellationCalculator";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Calculadora cancelación vuelos: probabilidad y compensación EU 261",
  description:
    "Calcula probabilidad de cancelación o retraso 3h+ según ruta, aerolínea y temporada. Estima compensación EU 261 esperada. Datos basados en EASA 2024.",
  alternates: { canonical: "/calculadora-cancelacion" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function CalculadoraCancelacionPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Calculadora cancelación TripCazador",
      url: "https://tripcazador.com/calculadora-cancelacion",
      applicationCategory: "TravelApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Calculadora cancelación",
          item: "https://tripcazador.com/calculadora-cancelacion",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Calculadora cancelación</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Calculadora cancelación de vuelos</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Estima probabilidad de cancelación + retraso 3h+ + compensación EU 261 según ruta, aerolínea y temporada. Datos EASA 2024.
        </p>
      </header>

      <CancellationCalculator />

      <section className="space-y-3 prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-white">Cómo se interpreta esta calculadora</h2>
        <p className="text-gray-300">
          La probabilidad mostrada es <strong>histórica</strong>: lo que ha sucedido en promedio durante 2024 con esa combinación. Tu vuelo concreto puede ser excepción. Si la calculadora marca 5%, significa que de 100 vuelos similares, 5 tuvieron incidencia.
        </p>
        <p className="text-gray-300">
          La <strong>compensación EU 261</strong> se calcula automáticamente según distancia: €250 ({"<"}1500 km), €400 (1500-3500 km), €600 ({">"}3500 km). Aplica si la cancelación o retraso es atribuible a la aerolínea (no meteo extrema ni huelga ATC).
        </p>
        <h3 className="text-xl font-bold text-white pt-4">Por qué algunos vuelos cancelan más</h3>
        <p className="text-gray-300">
          Los <strong>low-cost</strong> tienen ratios más altos por flotas más utilizadas (24/7) y menos margen para reescalado. Las <strong>full-service</strong> tienen mejor track record por flotas grandes que permiten swap de avión. La <strong>temporada</strong> importa: invierno tiene tormentas, verano tiene huelgas + sobrecarga + tormentas eléctricas.
        </p>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Si tu vuelo se cancela</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Lee nuestra guía completa paso a paso para reclamar compensación EU 261. Plantilla email + jurisprudencia + casos reales.
        </p>
        <a
          href="/blog/eu-261-reclamar-compensacion-vuelo-cancelado-2026"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Leer guía EU 261 →
        </a>
      </section>
    </div>
  );
}
