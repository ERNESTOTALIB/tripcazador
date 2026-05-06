import type { Metadata } from "next";
import { CreatorsDashboardClient } from "@/components/CreatorsClient";

export const metadata: Metadata = {
  title: "Dashboard Creator — TripCazador",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CreatorsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-amber-400 mb-6">Dashboard Creator</h1>
      <CreatorsDashboardClient initialToken={sp.token} />
    </main>
  );
}
