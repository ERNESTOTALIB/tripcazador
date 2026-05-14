import type { Metadata } from "next";
import { FlightValueCalculator } from "@/components/FlightValueCalculator";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Calculadora de vuelos: business vs economy y flexibilidad de fechas",
  description:
    "Calcula el coste real por hora de business vs económica, y cuánto ahorras siendo flexible con fechas. Datos reales del motor TripCazador, calculadora interactiva.",
  alternates: { canonical: "/calculadora" },
  openGraph: {
    type: "website",
    title: "Calculadora de vuelos — TripCazador",
    description:
      "Coste real por hora de vuelo y ahorro de flexibilidad de fechas. Calculadora interactiva.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function CalculadoraPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Calculadora de vuelos TripCazador",
      url: "https://tripcazador.com/calculadora",
      applicationCategory: "TravelApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: [
        "Coste por hora de vuelo (business vs economy)",
        "Ahorro estimado por flexibilidad de fechas (±3 / ±7 días)",
        "Recomendación automática de upgrade business",
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
          name: "Calculadora",
          item: "https://tripcazador.com/calculadora",
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
          <span className="text-white">Calculadora</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Calculadora de vuelos</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          ¿Compensa el upgrade a business? ¿Cuánto ahorras siendo flexible con las fechas? Calcúlalo con datos reales del motor.
        </p>
      </header>

      <FlightValueCalculator />

      <section className="space-y-3 prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-white">Cómo interpretar los resultados</h2>
        <p className="text-gray-300">
          Hemos visto cazadores debatir durante horas si un upgrade a business compensa. La respuesta corta: depende del coste por hora. Si pagas €80/hora extra para un vuelo de 11 horas (Madrid-Tokio), tienes asiento plano + comida decente + lounge access — para muchos vale. Si pagas €200/hora extra para un vuelo de 4 horas dentro de Europa, casi seguro NO compensa.
        </p>
        <p className="text-gray-300">
          La flexibilidad de fechas es el ahorro más infrautilizado del sector. Mover tu salida ±3 días dentro de la misma semana suele ahorrar 15-25% del precio. Mover ±7 días suele ahorrar 25-40%. El motor TripCazador detecta estas ventanas automáticamente cuando configuras una alerta sin fechas fijas.
        </p>
        <h3 className="text-xl font-bold text-white pt-4">Precios usados para calcular ahorro flexibilidad</h3>
        <p className="text-gray-300">
          Los porcentajes de ahorro (18% para ±3 días, 32% para ±7 días) son medianas reales observadas en 80,000+ búsquedas durante 12 meses, agregando rutas Europa-Europa, Europa-América y Europa-Asia. Tu ruta concreta puede variar — para destinos con frecuencia diaria alta (MAD-LIS, BCN-CDG), el ahorro suele ser menor (10-15%); para rutas largo-radio (MAD-NRT), mayor (25-40%).
        </p>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Quiero alertas para mi ruta concreta</h2>
        <p className="text-gray-400 mb-4 text-sm">
          La calculadora te da el marco mental. Para precios reales en tu ruta, configura alerta en Telegram — gratis y al instante.
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
