import type { Metadata } from "next";
import { AgenciaProductPageClient } from "@/components/AgenciaProductPageClient";
import { AGENCIA_PRODUCTS } from "@/lib/agencia_products";

const product = AGENCIA_PRODUCTS.vuelo_hotel;

export const metadata: Metadata = {
  title: `${product.name} — ${product.amount_eur.toFixed(2).replace(".", ",")} € · Paquete completo`,
  description: `${product.tagline}. ${product.amount_eur.toFixed(2).replace(".", ",")} € pago único. Vuelo + hotel coordinado. Mejor precio garantizado o reembolso + 1 mes Premium gratis.`,
  alternates: { canonical: "/agencia/vuelo-hotel" },
  openGraph: {
    title: `${product.name} · ${product.amount_eur.toFixed(2).replace(".", ",")} € · Paquete completo`,
    description: product.tagline,
    type: "website",
    url: "/agencia/vuelo-hotel",
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default function AgenciaVueloHotelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: product.name,
            description: product.description,
            provider: {
              "@type": "Organization",
              name: "TripCazador",
              url: "https://tripcazador.com",
            },
            offers: {
              "@type": "Offer",
              price: product.amount_eur,
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              url: "https://tripcazador.com/agencia/vuelo-hotel",
            },
          }),
        }}
      />
      <AgenciaProductPageClient product={product} />
    </main>
  );
}
