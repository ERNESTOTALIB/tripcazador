/**
 * /preparar-viaje — SSS436 (23 may 2026)
 *
 * Hub vertical /preparar-viaje/[destino] — checklist pre-trip por
 * destino (visa, seguro, eSIM, equipaje, adaptador eléctrico, etc.).
 */
import Link from "next/link";
import type { Metadata } from "next";
import { DESTINOS_CATALOG } from "@/lib/destinos_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Preparar viaje: checklist pre-trip por destino | TripCazador",
  description:
    "Checklist completa antes de viajar: visa, seguro, eSIM, adaptador eléctrico, equipaje. Una guía por cada destino popular.",
  alternates: { canonical: `${SITE_URL}/preparar-viaje` },
  openGraph: {
    title: "Preparar viaje: checklist pre-trip",
    description: "Lo que necesitas antes de cada viaje.",
    url: `${SITE_URL}/preparar-viaje`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function PrepararViajeHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🎒 Prepara tu viaje
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Checklist pre-trip por destino: visa, seguro, eSIM, adaptador
          eléctrico, equipaje y consejos prácticos. {DESTINOS_CATALOG.length}{" "}
          destinos cubiertos.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DESTINOS_CATALOG.map((d) => (
          <Link
            key={d.slug}
            href={`/preparar-viaje/${d.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">
                {d.emoji} {d.name}
              </h2>
              <span className="text-xs text-slate-400">{d.country}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className={`rounded px-1.5 py-0.5 ${d.visa === "schengen" || d.visa === "no-required" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                {d.visa === "schengen" ? "Schengen" : d.visa === "no-required" ? "Sin visa" : d.visa === "evisa" ? "eVisa" : d.visa === "on-arrival" ? "VOA" : "Embajada"}
              </span>
              <span className={`rounded px-1.5 py-0.5 ${d.esim === "essential" ? "bg-amber-500/10 text-amber-300" : "bg-slate-700 text-slate-300"}`}>
                eSIM {d.esim}
              </span>
            </div>
            <div className="mt-2 text-xs text-amber-400">Ver checklist →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
