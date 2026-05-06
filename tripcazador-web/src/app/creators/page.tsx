import type { Metadata } from "next";
import { CreatorsSignupForm } from "@/components/CreatorsClient";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Programa Creators — Comisiones del 4-8% en TripCazador",
  description:
    "Genera ingresos compartiendo TripCazador con tu audiencia. Link único, dashboard en tiempo real, payout mensual desde 25€.",
  alternates: { canonical: "/creators" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function CreatorsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "TripCazador Creators Program",
    serviceType: "Affiliate program",
    provider: { "@type": "Organization", name: "TripCazador" },
    areaServed: "Worldwide",
  };
  return (
    <>
      <SectionHero
        title="Programa Creators"
        subtitle="Comparte tu pasión por viajar y monetiza tu audiencia. Comisiones del 4-8% en cada reserva. Sin mínimos de seguidores."
        badge="Hasta 8% por venta"
        size="compact"
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[1fr_1fr] gap-6">
        <CreatorsSignupForm />
        <div className="panel space-y-4">
          <h2 className="text-xl font-bold text-amber-400">¿Cómo funciona?</h2>
          <ol className="space-y-3 text-sm text-gray-200">
            <li>
              <strong className="text-amber-400">1.</strong> Te registras con tu handle preferido y obtienes un link
              único <code className="text-xs bg-slate-800 px-1 rounded">tripcazador.com/?ref=tu_handle</code>
            </li>
            <li>
              <strong className="text-amber-400">2.</strong> Compartes el link en tus redes, blog, descripción de
              videos. Cada visita queda registrada con cookie de 30 días.
            </li>
            <li>
              <strong className="text-amber-400">3.</strong> Si tu audiencia reserva (vuelo, hotel, tour, eSIM,
              seguro), tú cobras una comisión de la nuestra: 4% reservas Booking, 6% GetYourGuide, 8% Heymondo.
            </li>
            <li>
              <strong className="text-amber-400">4.</strong> Ves todo en tu dashboard en tiempo real. Cuando llegas a
              25€ acumulados, pagamos por transferencia o PayPal el día 1 del mes siguiente.
            </li>
          </ol>
          <div className="bg-amber-400/10 border border-amber-400/40 rounded-lg p-3 text-sm text-amber-200">
            💡 Mejor tip: incluye el link en una guía concreta (ej: "Cómo organizar 10 días en Tailandia bajo
            500€") en lugar de promo genérica. Convierte 8-12× más.
          </div>
        </div>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
