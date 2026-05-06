import type { Metadata } from "next";
import { TripPlannerClient } from "@/components/TripPlannerClient";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Planificador de viajes con IA — TripCazador",
  description:
    "Genera un itinerario día-a-día personalizado con vuelos, hoteles, restaurantes y actividades. Indica destino, días, presupuesto y estilo — el resto lo hacemos nosotros.",
  alternates: { canonical: "/planificador" },
  openGraph: {
    title: "Planifica tu viaje en 30 segundos — TripCazador",
    description:
      "Itinerarios automáticos con vuelos, hoteles y actividades enlazados a las mejores ofertas reales.",
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function PlanificadorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Planificador de viajes TripCazador",
      url: "https://tripcazador.com/planificador",
      applicationCategory: "TravelApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: [
        "Itinerario día-a-día personalizado",
        "Vuelos, hoteles, actividades, seguro y eSIM enlazados",
        "Presupuesto y estilo de viaje configurables",
        "Generación instantánea con IA",
      ],
      creator: {
        "@type": "Organization",
        name: "TripCazador",
        url: "https://tripcazador.com",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com" },
        { "@type": "ListItem", position: 2, name: "Planificador", item: "https://tripcazador.com/planificador" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Es gratis usar el planificador?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Cada visitante tiene 1 generación gratuita al día. Con TripCazador Premium (2,99€/mes) tienes uso ilimitado.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cómo se generan los itinerarios?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Combinamos IA generativa con nuestro catálogo de destinos, comparativas de aerolíneas y partners verificados (Booking, GetYourGuide, Heymondo, Holafly).",
          },
        },
        {
          "@type": "Question",
          name: "¿Los enlaces de reserva son afiliados?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. TripCazador se sostiene con comisiones de partners cuando reservas a través de nuestros enlaces. El precio es el mismo para ti — pagamos con su comisión, no con tu bolsillo.",
          },
        },
      ],
    },
  ];

  return (
    <>
      <SectionHero
        title="Planificador de viajes con IA"
        subtitle="Cuéntanos a dónde quieres ir y te generamos el plan completo: día-a-día, vuelos, hoteles, comidas y actividades."
        badge="GRATIS · 1 generación al día"
        size="compact"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TripPlannerClient />
        <section className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="panel">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-bold text-white">Instantáneo</h3>
            <p className="text-sm text-gray-300 mt-1">
              Itinerario de 5 días generado en menos de 10 segundos. Sin formularios largos ni esperas.
            </p>
          </div>
          <div className="panel">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-bold text-white">Ofertas reales</h3>
            <p className="text-sm text-gray-300 mt-1">
              Cada bloque de "Reservar" enlaza a Skyscanner, Booking, GetYourGuide y partners verificados con
              precios actualizados.
            </p>
          </div>
          <div className="panel">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold text-white">Personalizado</h3>
            <p className="text-sm text-gray-300 mt-1">
              Estilo (foodie, cultural, aventura…), número de viajeros, presupuesto y notas (alergias, niños, must-see).
            </p>
          </div>
        </section>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
