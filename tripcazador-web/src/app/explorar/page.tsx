import type { Metadata } from "next";
import { BudgetExplorer } from "@/components/BudgetExplorer";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Explora destinos por presupuesto — TripCazador",
  description: "Selecciona tu presupuesto y descubre qué destinos caben dentro. Slider €100-€2000, filtro por origen.",
  alternates: { canonical: "/explorar" },
};

export const dynamic = "force-static";

export default function ExplorarPage() {
  return (
    <>
      <SectionHero title="¿Qué cabe en tu presupuesto?" subtitle="Mueve el slider y descubre los destinos que tu bolsillo puede pagar hoy." size="compact" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BudgetExplorer />
      </main>
    </>
  );
}
