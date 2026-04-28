import type { Metadata } from "next";
import { MilesCalculator } from "@/components/MilesCalculator";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Calculadora de millas y distancia: cuántas millas ganarás",
  description:
    "Calcula distancia gran círculo IATA-IATA, millas que acumularás en tu programa frequent flyer y valor estimado en redenciones. Para 50+ aeropuertos.",
  alternates: { canonical: "/calculadora-millas" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function CalculadoraMillasPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Calculadora de millas TripCazador",
      url: "https://tripcazador.com/calculadora-millas",
      applicationCategory: "TravelApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: [
        "Cálculo distancia gran círculo (Haversine)",
        "Estimación millas por programa frequent flyer (8 programas)",
        "Valor estimado en redenciones",
        "50+ aeropuertos pre-cargados",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Calculadora millas",
          item: "https://tripcazador.com/calculadora-millas",
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
          <span className="text-white">Calculadora millas</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Calculadora de millas</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          ¿Cuántas millas ganarás en tu próximo vuelo? ¿Cuál vale más, Iberia Plus o Lufthansa M&M? Calcula distancia + millas + valor real.
        </p>
      </header>

      <MilesCalculator />

      <section className="space-y-3 prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-white">Cómo funciona</h2>
        <p className="text-gray-300">
          Todos los programas frequent flyer del mundo tienen una tabla de millas mínimas que ganas por kilómetro/milla volada. La calculadora estima esto para 8 programas principales según fare class. Para Avios (Iberia/BA) la tasa es relativamente baja per-mile pero el valor en redenciones es alto en short-haul. Para Lufthansa M&M (Star Alliance) la tasa per-mile es mejor en business class pero las redenciones cuestan más millas.
        </p>
        <p className="text-gray-300">
          La distancia se calcula con la fórmula Haversine sobre coordenadas reales de aeropuertos (datos OpenFlights). Es la distancia "gran círculo" — la más corta posible entre dos puntos en una esfera. Los vuelos reales pueden añadir 5-15% por airways y restricciones de tráfico aéreo.
        </p>
        <h3 className="text-xl font-bold text-white pt-4">Sweet spots de redención por programa</h3>
        <ul className="text-gray-300 space-y-2">
          <li>· <strong>Iberia Plus (Avios)</strong>: vuelos Madrid-Caribe en business clase 90K-120K Avios. Increíble valor.</li>
          <li>· <strong>Lufthansa M&M</strong>: redenciones en First Class de partner Lufthansa cuestan menos millas que en otros programas Star Alliance.</li>
          <li>· <strong>ANA Mileage Club</strong>: round-the-world award por 200K millas en business — uno de los mejores deals del mundo.</li>
          <li>· <strong>British Airways Avios</strong>: vuelos cortos europeos por 4K-7K Avios + tasas. Mejor que pagar cash low-cost.</li>
          <li>· <strong>Flying Blue (AF/KLM)</strong>: ofertas mensuales Promo Awards a -50% de millas. Suscríbete al newsletter del programa.</li>
        </ul>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Quiero saber más sobre frequent flyer programs</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Lee nuestro lead magnet "30 trucos avanzados de cazadores" — incluye estrategia detallada de millas, transferencias entre programas, y sweet spots por carrier.
        </p>
        <a
          href="/lead-magnet/30-trucos-avanzados"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Descargar PDF gratis
        </a>
      </section>
    </div>
  );
}
