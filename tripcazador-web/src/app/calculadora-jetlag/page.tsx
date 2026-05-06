import type { Metadata } from "next";
import { JetLagCalculator } from "@/components/JetLagCalculator";
import { SectionHero } from "@/components/SectionHero";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Calculadora de jet lag — Plan recuperación por destino",
  description: "Calcula la severidad del jet lag, hora de llegada local y plan de recuperación con luz, cafeína y melatonina. Datos científicos.",
  alternates: { canonical: "/calculadora-jetlag" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function JetLagPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Calculadora de jet lag",
    url: "https://tripcazador.com/calculadora-jetlag",
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };
  return (
    <>
      <SectionHero title="Calculadora de jet lag" subtitle="Predice severidad del jet lag y plan de recuperación: luz, café, melatonina." size="compact" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <JetLagCalculator />
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
