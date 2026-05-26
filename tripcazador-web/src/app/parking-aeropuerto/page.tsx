import type { Metadata } from "next";
import Link from "next/link";
import { PARKING_AEROPUERTOS } from "@/lib/parking_aeropuerto_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Parking aeropuerto España 2026: 15 aeropuertos comparativa precios",
  description: "Precios parking 15 aeropuertos ES. AENA, larga estancia, concertados Parclick. Desde 8€/día. Comparativa actualizada + tips ahorro.",
  alternates: { canonical: `${SITE_URL}/parking-aeropuerto` },
};

export default function ParkingHubPage() {
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Parking aeropuerto", url: "/parking-aeropuerto" },
  ]);
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <header className="mb-8 text-center">
        <div className="text-5xl">🅿️✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Parking aeropuerto España</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {PARKING_AEROPUERTOS.length} aeropuertos con precio día, semana y tipos
          (AENA, larga estancia, concertado con shuttle, valet). Tips de ahorro.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PARKING_AEROPUERTOS.map((p) => {
          const cheapest = [...p.options].sort((a, b) => a.diaEur - b.diaEur)[0];
          return (
            <Link key={p.iata} href={`/parking-aeropuerto/${p.iata.toLowerCase()}`} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 transition-colors hover:border-amber-500/40">
              <div className="flex items-baseline justify-between">
                <h2 className="font-bold text-white">{p.iata} {p.ciudad}</h2>
                <span className="text-xs text-slate-500">{p.options.length} opciones</span>
              </div>
              <p className="mt-1 text-xs text-amber-300">Desde {cheapest.diaEur} €/día</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
