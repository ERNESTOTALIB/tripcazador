/**
 * /aerolineas-bandera — SSS449 (23 may 2026)
 *
 * Hub vertical /aerolineas-bandera/[iso] — flag carriers por país.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { FLAG_CARRIERS_CATALOG } from "@/lib/flag_carriers_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

const ALLIANCE_LABEL: Record<string, string> = {
  oneworld: "oneworld",
  star: "Star Alliance",
  skyteam: "SkyTeam",
  none: "Sin alianza global",
};

export const metadata: Metadata = {
  title: "Aerolíneas bandera por país: flag carriers | TripCazador",
  description:
    "20 países y sus aerolíneas bandera. Iberia (España), Air France, Lufthansa, BA, Turkish, Emirates, JAL/ANA, Qatar y más con alianzas globales.",
  alternates: { canonical: `${SITE_URL}/aerolineas-bandera` },
  openGraph: {
    title: "Aerolíneas bandera por país",
    description: "Flag carriers + alianzas globales.",
    url: `${SITE_URL}/aerolineas-bandera`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function FlagCarriersHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🏴 Aerolíneas bandera por país
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {FLAG_CARRIERS_CATALOG.length} países y sus flag carriers + alianzas
          globales (oneworld, Star Alliance, SkyTeam).
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {FLAG_CARRIERS_CATALOG.map((c) => (
          <Link
            key={c.iso}
            href={`/aerolineas-bandera/${c.iso}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">
                {c.emoji} {c.country}
              </h2>
              {c.alliance && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                  {ALLIANCE_LABEL[c.alliance]?.split(" ")[0]}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-amber-200">
              {c.primary.name} ({c.primary.iata})
            </p>
            <p className="text-xs text-slate-400">Hub: {c.primary.hub}</p>
            {c.secondary.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                +{c.secondary.length} secundarias
              </p>
            )}
          </Link>
        ))}
      </section>
    </main>
  );
}
