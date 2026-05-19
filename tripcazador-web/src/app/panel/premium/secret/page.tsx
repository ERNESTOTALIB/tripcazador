import type { Metadata } from "next";
import { PremiumSecretDealsClient } from "@/components/PremiumSecretDealsClient";

export const metadata: Metadata = {
  title: "Secret deals — TripCazador Premium",
  description:
    "Error fares y deals CRÍTICOS solo para Premium durante las primeras 24h. Después pasan a /deals público.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PremiumSecretDealsPanelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <PremiumSecretDealsClient />
      </div>
    </main>
  );
}
