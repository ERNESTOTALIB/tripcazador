import type { Metadata } from "next";
import { AgenciaProductPageClient } from "@/components/AgenciaProductPageClient";
import { AGENCIA_PRODUCTS } from "@/lib/agencia_products";

const product = AGENCIA_PRODUCTS.vuelo;

export const metadata: Metadata = {
  title: `${product.name} — ${product.amount_eur.toFixed(2).replace(".", ",")} € · Mejor precio garantizado | TripCazador`,
  description: `${product.tagline}. ${product.amount_eur.toFixed(2).replace(".", ",")} € pago único. Si encuentras el mismo vuelo más barato en 7 días te devolvemos el dinero + 1 mes Premium gratis.`,
  alternates: { canonical: "/agencia/vuelo" },
  openGraph: {
    title: `${product.name} · ${product.amount_eur.toFixed(2).replace(".", ",")} € · Mejor precio garantizado`,
    description: product.tagline,
    type: "website",
    url: "/agencia/vuelo",
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default function AgenciaVueloPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* JSON-LD Product schema para SEO */}
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
              url: "https://tripcazador.com/agencia/vuelo",
            },
          }),
        }}
      />
      <AgenciaProductPageClient product={product} />
    </main>
  );
}
