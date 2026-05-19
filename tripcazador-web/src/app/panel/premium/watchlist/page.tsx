import type { Metadata } from "next";
import { PremiumWatchlistClient } from "@/components/PremiumWatchlistClient";

export const metadata: Metadata = {
  title: "Watch deals — TripCazador Premium",
  description:
    "Gestiona los deals que estás vigilando. Te avisamos cuando el precio baje.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PremiumWatchlistPanelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PremiumWatchlistClient />
      </div>
    </main>
  );
}
