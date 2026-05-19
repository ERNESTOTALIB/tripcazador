import type { Metadata } from "next";
import { PremiumHotelWatchlistClient } from "@/components/PremiumHotelWatchlistClient";

export const metadata: Metadata = {
  title: "Hotel watch — TripCazador Premium",
  description:
    "Gestiona los hoteles que estás vigilando. Te avisamos cuando el precio per night baje.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PremiumHotelWatchlistPanelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PremiumHotelWatchlistClient />
      </div>
    </main>
  );
}
