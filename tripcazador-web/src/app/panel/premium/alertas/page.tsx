import type { Metadata } from "next";
import { PremiumAlertsManagerClient } from "@/components/PremiumAlertsManagerClient";

export const metadata: Metadata = {
  title: "Mis alertas Premium — TripCazador",
  description: "Gestiona tus alertas Premium ilimitadas con polling 5 min.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PremiumAlertsPanelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PremiumAlertsManagerClient />
      </div>
    </main>
  );
}
