import type { Metadata } from "next";
import { PremiumDigestClient } from "@/components/PremiumDigestClient";

export const metadata: Metadata = {
  title: "Tu digest semanal — TripCazador Premium",
  description:
    "Top 5 deals personalizados según tus alertas y búsquedas guardadas. Llega también a tu email cada domingo.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PremiumDigestPanelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PremiumDigestClient />
      </div>
    </main>
  );
}
