import type { Metadata } from "next";
import { GiftCardBuyer, GiftCardRedeemer } from "@/components/GiftCardClient";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Regala TripCazador — Gift cards desde 25€",
  description:
    "Regala un viaje. Tarjetas regalo de 25€, 50€, 100€ o 200€ aplicables a vuelos, hoteles y experiencias. Sin caducidad. Pago seguro con Stripe.",
  alternates: { canonical: "/regalo" },
  openGraph: {
    title: "Regala TripCazador — el regalo que se convierte en un viaje",
    description: "Tarjetas regalo desde 25€. Sin caducidad. Aplica a vuelos, hoteles y tours.",
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function RegaloPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "TripCazador Gift Card",
      description: "Tarjeta regalo aplicable a reservas de vuelos, hoteles y actividades.",
      url: "https://tripcazador.com/regalo",
      brand: { "@type": "Brand", name: "TripCazador" },
      offers: [
        { "@type": "Offer", price: 25, priceCurrency: "EUR", availability: "https://schema.org/InStock" },
        { "@type": "Offer", price: 50, priceCurrency: "EUR", availability: "https://schema.org/InStock" },
        { "@type": "Offer", price: 100, priceCurrency: "EUR", availability: "https://schema.org/InStock" },
        { "@type": "Offer", price: 200, priceCurrency: "EUR", availability: "https://schema.org/InStock" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com" },
        { "@type": "ListItem", position: 2, name: "Regalar", item: "https://tripcazador.com/regalo" },
      ],
    },
  ];

  return (
    <>
      <SectionHero
        title="Regala un viaje"
        subtitle="La tarjeta regalo de TripCazador se convierte en un vuelo, una noche de hotel o una experiencia. Lo elige quien lo recibe."
        badge="Sin caducidad · Sin comisiones"
        size="compact"
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-2 gap-6">
        <GiftCardBuyer />
        <GiftCardRedeemer />
      </main>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid md:grid-cols-3 gap-6">
        <div className="panel">
          <div className="text-3xl mb-2">🎁</div>
          <h3 className="font-bold text-white">Sin caducidad</h3>
          <p className="text-sm text-gray-300 mt-1">
            La tarjeta no caduca nunca. El receptor la usa cuando le venga bien.
          </p>
        </div>
        <div className="panel">
          <div className="text-3xl mb-2">✈️</div>
          <h3 className="font-bold text-white">Aplica a todo</h3>
          <p className="text-sm text-gray-300 mt-1">
            Vuelos (Skyscanner, aerolíneas directas), hoteles (Booking), experiencias (GetYourGuide).
          </p>
        </div>
        <div className="panel">
          <div className="text-3xl mb-2">🔒</div>
          <h3 className="font-bold text-white">Pago seguro</h3>
          <p className="text-sm text-gray-300 mt-1">
            Stripe procesa el pago. Sin comisiones extra. Sin datos guardados en TripCazador.
          </p>
        </div>
      </section>
      <JsonLd data={jsonLd} />
    </>
  );
}
