/**
 * /conferencias — SSS440 (23 may 2026)
 *
 * Hub vertical /conferencias/[slug]. 8 conferencias tech/business.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { CONFERENCIAS_CATALOG } from "@/lib/conferencias_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "8 conferencias tech top: vuelos + hotel + tips",
  description:
    "MWC Barcelona, Web Summit Lisboa, AWS re:Invent, Google I/O, WWDC, Slush, Dreamforce, South Summit. Cómo viajar a cada una desde España.",
  alternates: { canonical: `${SITE_URL}/conferencias` },
  openGraph: {
    title: "Conferencias tech: cómo viajar",
    description: "Vuelos, hotel y tips para 8 conferencias top.",
    url: `${SITE_URL}/conferencias`,
    type: "website",
  },
};

export const revalidate = 86400;

const SECTOR_LABELS: Record<string, string> = {
  tech: "Tecnología",
  startup: "Startups",
  cloud: "Cloud",
  business: "Business",
  developer: "Developers",
};

export default function ConferenciasHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🎤 Conferencias tech &amp; business
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {CONFERENCIAS_CATALOG.length} conferencias top con datos prácticos para
          viajeros profesionales: fechas, vuelo desde España, hotel zona y tips
          de networking.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {CONFERENCIAS_CATALOG.map((c) => (
          <Link
            key={c.slug}
            href={`/conferencias/${c.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {c.emoji} {c.name}
              </h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                {c.iata}
              </span>
            </div>
            <p className="text-xs text-slate-400">{c.city} · {c.dates}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Sector:</span>{" "}
                <span className="text-white">{SECTOR_LABELS[c.sector] || c.sector}</span>
              </div>
              <div>
                <span className="text-slate-500">Asistentes:</span>{" "}
                <span className="text-white">{(c.attendees / 1000).toFixed(0)}k</span>
              </div>
              <div>
                <span className="text-slate-500">Ticket €:</span>{" "}
                <span className="text-white">{c.ticketPriceEur}</span>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-400">{c.summary}</p>
            <div className="mt-3 text-xs text-amber-400">Ver guía →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
