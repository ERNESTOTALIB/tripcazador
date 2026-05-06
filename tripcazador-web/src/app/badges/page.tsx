import type { Metadata } from "next";
import { BadgesGrid } from "@/components/BadgesGrid";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Mis badges — TripCazador",
  description: "Tu colección de badges, racha de visitas diarias y progreso en TripCazador.",
  alternates: { canonical: "/badges" },
};

export const dynamic = "force-static";

export default function BadgesPage() {
  return (
    <>
      <SectionHero
        title="Tus badges"
        subtitle="Desbloquea badges por usar TripCazador. Visita diariamente, guarda favoritos, planifica viajes, comparte con amigos."
        size="compact"
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BadgesGrid />
      </main>
    </>
  );
}
