/**
 * /feed — fase qqq5
 *
 * Index de todos los route_groups. Hub de descubrimiento por intent.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ROUTE_GROUPS, summarizeGroups } from "@/lib/route_groups";
import { diversifyDeals } from "@/lib/seed_diversifier";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Feeds curados — TripCazador",
  description: "Descubre vuelos por intent: weekend escape, business class deals, error fares, Asia, Latam, África safari y más.",
  alternates: { canonical: "/feed" },
};

export default function FeedIndexPage() {
  const all = diversifyDeals([]);
  const summary = summarizeGroups(all);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Feeds curados</h1>
        <p className="mt-2 text-lg text-neutral-600">
          Descubre ofertas filtradas por tipo de viaje. Cada feed es una selección
          curada del catálogo total ({all.length} ofertas activas).
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summary.map(({ meta, count, samples }) => (
          <Link
            key={meta.id}
            href={`/feed/${meta.id}`}
            className="rounded-xl border border-neutral-200 bg-white p-5 hover:border-amber-400 hover:shadow-lg transition"
          >
            <div className="text-3xl">{meta.emoji}</div>
            <h2 className="mt-2 text-xl font-semibold">{meta.label}</h2>
            <p className="mt-1 text-sm text-neutral-600">{meta.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500">{count} ofertas</span>
              <span className="text-sm text-amber-700 font-medium">Ver →</span>
            </div>
            {samples.length > 0 && (
              <ul className="mt-3 border-t border-neutral-100 pt-3 text-xs text-neutral-500 space-y-1">
                {samples.map((s) => (
                  <li key={s.id} className="truncate">
                    · {s.city_from} → {s.city_to} desde {s.price_eur}€
                  </li>
                ))}
              </ul>
            )}
          </Link>
        ))}
      </section>
    </main>
  );
}
