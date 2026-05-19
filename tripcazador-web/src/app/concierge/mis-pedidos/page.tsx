import type { Metadata } from "next";
import { ConciergeMyOrdersClient } from "@/components/ConciergeMyOrdersClient";

export const metadata: Metadata = {
  title: "Mis pedidos Concierge — TripCazador",
  description:
    "Revisa el estado de tus pedidos Concierge y accede a los planes entregados.",
  robots: { index: false, follow: false },
  // SSS329 M3: meta referrer no-referrer para que clicks en links externos
  // desde el portal no leak el ?token=... vía Referer header.
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default function ConciergeMisPedidosPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token || "";
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <ConciergeMyOrdersClient initialToken={token} />
      </div>
    </main>
  );
}
