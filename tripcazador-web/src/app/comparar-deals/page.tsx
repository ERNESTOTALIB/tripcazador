/**
 * /comparar-deals — SSS467 (24 may 2026)
 *
 * Landing stub para comparator side-by-side. Server-rendered con 8 deals
 * top + UI client (próxima iter) para pick 2-3 y compare.
 *
 * v1: lista 8 deals reales con stat panel. v2 (futuro): checkbox + URL
 * state ?ids=A,B,C y vista comparator.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getDeals, type Deal } from "@/lib/api";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Comparador de chollos lado a lado | TripCazador",
  description:
    "Compara 2-3 chollos de vuelo en paralelo: precio, escalas, aerolínea, fechas. Encuentra el mejor para tu fecha.",
  alternates: { canonical: `${SITE_URL}/comparar-deals` },
  openGraph: {
    title: "Comparador chollos TripCazador",
    description: "Side-by-side 2-3 deals.",
    url: `${SITE_URL}/comparar-deals`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function CompararDealsPage() {
  let deals: Deal[] = [];
  try {
    const data = await getDeals({ limit: 8 });
    deals = data.deals || [];
  } catch {
    deals = [];
  }

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Comparar chollos", url: "/comparar-deals" },
  ]);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="mb-8 text-center">
        <div className="text-5xl">🆚</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Comparador de chollos
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Los 8 mejores chollos del motor TripCazador agrupados para que veas
          rápido qué destinos están en mejor precio ahora.
        </p>
      </header>

      <section className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/40">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Destino</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Ahorro</th>
              <th className="px-4 py-3 text-left">Fechas</th>
              <th className="px-4 py-3 text-left">Aerolínea</th>
              <th className="px-4 py-3 text-center">Ver</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No hay deals disponibles ahora. Vuelve en unos minutos.
                </td>
              </tr>
            ) : (
              deals.map((d) => (
                <tr key={d.id} className="border-t border-slate-700">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">
                      {d.origin || "—"} → {d.city_to || d.destination || "—"}
                    </div>
                    <div className="text-xs text-slate-400">{d.country_to || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    {Math.round(d.price_eur || 0)}€
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(d.savings_pct ?? 0) > 0 ? (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                        -{Math.round(d.savings_pct || 0)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {d.date_out || "—"}
                    {d.date_ret ? ` → ${d.date_ret}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {d.airline_name || d.airline || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/deals/${d.id}`}
                      className="text-xs font-bold text-amber-400 hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center text-sm text-slate-300">
        <p>
          ¿Quieres alertas en tiempo real cuando un destino baje de tu precio
          objetivo? Premium hace exactamente eso.
        </p>
        <Link
          href="/premium"
          className="mt-3 inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Ver Premium →
        </Link>
      </section>

      <footer className="mt-8 text-center text-xs text-slate-500">
        Deals actualizados cada 5 min. Los precios cambian rápido — confirma en
        la web de la aerolínea antes de reservar.
      </footer>
    </main>
  );
}
