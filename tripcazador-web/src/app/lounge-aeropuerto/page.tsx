import type { Metadata } from "next";
import Link from "next/link";
import { LOUNGES } from "@/lib/lounges_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Salas VIP aeropuerto España 2026: 12 hubs, Priority Pass, day pass",
  description: "Lounges de aeropuertos ES: Madrid, Barcelona, Málaga, Palma, Bilbao... Cómo acceder con Priority Pass, Iberia Plus, day-pass walk-in desde 27€.",
  alternates: { canonical: `${SITE_URL}/lounge-aeropuerto` },
};

export default function LoungeHubIndex() {
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Lounges aeropuerto", url: "/lounge-aeropuerto" },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <header className="mb-8 text-center">
        <div className="text-5xl">🛋️✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Salas VIP de aeropuertos España
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {LOUNGES.length} aeropuertos con guía detallada de lounges: acceso por
          tarjeta crédito (Priority Pass), status aerolínea (Iberia Plus Oro),
          business class o day-pass walk-in.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LOUNGES.map((h) => {
          const cheapest = [...h.lounges]
            .filter((l) => l.dayPassEur)
            .sort((a, b) => (a.dayPassEur ?? 0) - (b.dayPassEur ?? 0))[0];
          return (
            <Link
              key={h.iata}
              href={`/lounge-aeropuerto/${h.iata.toLowerCase()}`}
              className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 transition-colors hover:border-amber-500/40"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-bold text-white">{h.iata} {h.ciudad}</h2>
                <span className="text-xs text-slate-500">{h.lounges.length} lounges</span>
              </div>
              {cheapest && (
                <p className="mt-1 text-xs text-amber-300">
                  Desde {cheapest.dayPassEur} € walk-in
                </p>
              )}
            </Link>
          );
        })}
      </section>
    </main>
  );
}
