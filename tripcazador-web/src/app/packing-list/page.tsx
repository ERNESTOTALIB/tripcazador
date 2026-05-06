import type { Metadata } from "next";
import { PackingListClient } from "@/components/PackingListClient";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Generador de packing list — TripCazador",
  description: "Lista personalizada de qué meter en la maleta. Por destino, días, actividades y tipo de viajero. Marca check items según los empaques.",
  alternates: { canonical: "/packing-list" },
};

export const dynamic = "force-static";

export default function PackingPage() {
  return (
    <>
      <SectionHero title="Generador de packing list" subtitle="Dinos a dónde vas y qué vas a hacer. Te decimos exactamente qué meter en la maleta." size="compact" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PackingListClient />
      </main>
    </>
  );
}
