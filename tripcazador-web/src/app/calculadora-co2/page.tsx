import type { Metadata } from "next";
import { CO2Calculator } from "@/components/CO2Calculator";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Calculadora CO2: vuelo vs tren — Comparativa emisiones 2026",
  description:
    "Calcula emisiones CO2 vuelo vs tren para 9 rutas Europeas. Datos oficiales EU EEA 2024. Equivalente en árboles. Tomar decisión consciente.",
  alternates: { canonical: "/calculadora-co2" },
  openGraph: {
    type: "website",
    title: "Calculadora CO2 vuelo vs tren — TripCazador",
    description: "9 rutas europeas con cálculo de emisiones. Datos oficiales.",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function CalculadoraCo2Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Calculadora CO2 vuelo vs tren — TripCazador",
      url: "https://tripcazador.com/calculadora-co2",
      applicationCategory: "TravelApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: [
        "Cálculo emisiones CO2 por persona y por grupo",
        "Comparativa vuelo vs tren para 9 rutas europeas",
        "Equivalente en árboles absorbidos",
        "Comparativa con coche (solo o 4 personas)",
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
          name: "Calculadora CO2",
          item: "https://tripcazador.com/calculadora-co2",
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
          <span className="text-white">Calculadora CO2</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Calculadora CO2: vuelo vs tren</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          ¿Cuánto CO2 emites volando vs en tren? Compara con datos oficiales EU EEA 2024 para 9 rutas europeas y decide informado.
        </p>
      </header>

      <CO2Calculator />

      <section className="space-y-3 prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-white">Por qué el tren AVE es 18× menos emisivo</h2>
        <p className="text-gray-300">
          La diferencia es masiva por dos razones técnicas. Primero, los trenes de alta velocidad europeos (AVE/TGV/ICE) operan con electricidad de la red — y la mezcla eléctrica europea (~30% renovables, +25% nuclear) es mucho más limpia que keroseno de aviación. Segundo, un tren AVE transporta 350-450 pasajeros por viaje vs 150-180 de un avión típico de short-haul, distribuyendo el coste energético entre más personas.
        </p>
        <p className="text-gray-300">
          Para rutas {"<"}800 km dentro de Europa con tren disponible (Madrid-Barcelona, Madrid-París, BCN-Marsella), elegir tren puede reducir tu huella en 90-95%. Para rutas {">"}1500 km el tren tarda demasiado en muchos casos (Madrid-Londres = 14h tren vs 2.5h vuelo), pero el ahorro CO2 sigue siendo del 85-90%.
        </p>
        <h3 className="text-xl font-bold text-white pt-4">Lo que NO incluye el cálculo</h3>
        <p className="text-gray-300">
          No incluimos: emisiones de fabricación del avión/tren amortizadas, viajes al aeropuerto vs estación, "radiative forcing" (efecto a alta altitud que algunas fuentes multiplican x1.9). Estos factores favorecerían más al tren — el cálculo es conservador.
        </p>
        <h3 className="text-xl font-bold text-white pt-4">Cuándo el tren NO es opción</h3>
        <p className="text-gray-300">
          Para vuelos transatlánticos o intercontinentales (Madrid-NYC, Madrid-Tokio), no hay alternativa práctica. Para rutas {">"}3000 km dentro de Europa, el tren tarda 24-30h, lo que para la mayoría de viajeros no es viable. La regla general: tren tiene sentido para rutas {"<"}1500 km cuando el viaje total tren ({"<"}10h) es comparable al viaje total puerta-a-puerta vuelo (incluyendo aeropuerto + esperas).
        </p>
      </section>

      <section className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl p-6 border border-emerald-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Calcula con tu ruta</h2>
        <p className="text-gray-400 mb-4 text-sm">
          ¿Tu ruta no aparece arriba? Configura alerta de vuelos para destinos europeos cuando vayas en tren no sea factible — el motor TripCazador encontrará el vuelo más eficiente y barato.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar alertas Telegram
        </a>
      </section>
    </div>
  );
}
