import type { Metadata } from "next";
import { PremiumSavedSearchesClient } from "@/components/PremiumSavedSearchesClient";

export const metadata: Metadata = {
  title: "Mis búsquedas guardadas — TripCazador Premium",
  description: "Gestiona tus búsquedas Premium guardadas — reabre filtros pro en 1 click.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PremiumSavedSearchesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PremiumSavedSearchesClient />
      </div>
    </main>
  );
}
