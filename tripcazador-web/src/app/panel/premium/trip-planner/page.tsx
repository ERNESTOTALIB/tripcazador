import type { Metadata } from "next";
import { PremiumTripPlannerClient } from "@/components/PremiumTripPlannerClient";

export const metadata: Metadata = {
  title: "Trip planner combo vuelo + hotel — TripCazador Premium",
  description:
    "Plan tu viaje combinando los mejores vuelos con hoteles per night. Sólo Premium.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PremiumTripPlannerPanelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PremiumTripPlannerClient />
      </div>
    </main>
  );
}
