import type { Metadata } from "next";
import { WrappedView } from "@/components/WrappedView";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "TripCazador Wrapped — Tu año en chollos",
  description: "Recap personal de tu actividad en TripCazador: destinos buscados, favoritos guardados y dinero ahorrado este año.",
  alternates: { canonical: "/wrapped" },
};

export const dynamic = "force-static";

export default function WrappedPage() {
  return (
    <>
      <SectionHero title="Tu Wrapped" subtitle="Recap personal del año en TripCazador. 100% local — tus datos no salen de tu navegador." size="compact" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <WrappedView />
      </main>
    </>
  );
}
