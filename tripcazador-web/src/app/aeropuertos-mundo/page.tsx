/**
 * /aeropuertos-mundo — SSS445 (23 may 2026)
 *
 * Hub vertical /aeropuertos-mundo/[iata]. Top 20 aeropuertos
 * internacionales — complementa /aeropuertos (ES only).
 */
import Link from "next/link";
import type { Metadata } from "next";
import { AIRPORTS_WORLD } from "@/lib/airports_world_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Top 20 aeropuertos del mundo: terminales y tránsito",
  description:
    "CDG, LHR, FRA, AMS, JFK, LAX, NRT, HND, ICN, SIN, DXB, DOH y más. Terminales, tips de tránsito y conexiones desde España.",
  alternates: { canonical: `${SITE_URL}/aeropuertos-mundo` },
  openGraph: {
    title: "Top 20 aeropuertos del mundo",
    description: "Terminales, tránsito y conexiones desde España.",
    url: `${SITE_URL}/aeropuertos-mundo`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function AeropuertosMundoHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🌐 Top 20 aeropuertos del mundo
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Datos de tránsito por terminales para los aeropuertos internacionales
          más usados. Complementa{" "}
          <Link href="/aeropuertos" className="text-amber-400 hover:underline">
            /aeropuertos
          </Link>{" "}
          (15 hubs España).
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {AIRPORTS_WORLD.map((a) => (
          <Link
            key={a.iata}
            href={`/aeropuertos-mundo/${a.iata.toLowerCase()}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">
                {a.emoji} {a.city}
              </h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                {a.iata}
              </span>
            </div>
            <p className="text-xs text-slate-400">{a.country} · {a.paxMillions}M pax/año</p>
            <p className="mt-2 line-clamp-2 text-xs text-slate-300">{a.transitTip}</p>
            <div className="mt-2 text-xs text-amber-400">Ver →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
