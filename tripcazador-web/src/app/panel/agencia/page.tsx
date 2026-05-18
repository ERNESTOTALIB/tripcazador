import type { Metadata } from "next";
import { AgenciaPanelClient } from "@/components/AgenciaPanelClient";

export const metadata: Metadata = {
  title: "Mis tickets Agencia — TripCazador",
  description: "Gestión de tus tickets de Agencia + reclamar garantía mejor precio.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AgenciaPanelPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <AgenciaPanelClient />
      </div>
    </main>
  );
}
