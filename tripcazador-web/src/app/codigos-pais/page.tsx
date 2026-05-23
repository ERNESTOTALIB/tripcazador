/**
 * /codigos-pais — SSS444 (23 may 2026)
 *
 * Hub vertical /codigos-pais/[iso]. Lookup compacto por país top.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { CODIGOS_PAIS_CATALOG } from "@/lib/codigos_pais_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Códigos por país: huso, divisa, prefijo, enchufe | TripCazador",
  description:
    "Lookup rápido por país: huso horario, divisa, idioma, prefijo telefónico, tipo de enchufe, conducción, visa. 15 países top.",
  alternates: { canonical: `${SITE_URL}/codigos-pais` },
  openGraph: {
    title: "Códigos por país TripCazador",
    description: "Información esencial por país en un lookup compacto.",
    url: `${SITE_URL}/codigos-pais`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function CodigosPaisHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🌍 Códigos por país
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Lookup compacto: huso horario, divisa, idioma, prefijo, enchufe,
          conducción y visa para {CODIGOS_PAIS_CATALOG.length} países top.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {CODIGOS_PAIS_CATALOG.map((c) => (
          <Link
            key={c.iso}
            href={`/codigos-pais/${c.iso}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {c.emoji} {c.name}
              </h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                {c.iso.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div>
                <span className="text-slate-500">Huso:</span>{" "}
                <span className="text-white">{c.timezone}</span>
              </div>
              <div>
                <span className="text-slate-500">Divisa:</span>{" "}
                <span className="text-white">{c.currency.code}</span>
              </div>
              <div>
                <span className="text-slate-500">Prefijo:</span>{" "}
                <span className="font-mono text-white">{c.phonePrefix}</span>
              </div>
              <div>
                <span className="text-slate-500">Visa:</span>{" "}
                <span className={c.visa === "no-required" || c.visa === "schengen" ? "text-emerald-300" : "text-amber-300"}>
                  {c.visa === "no-required" ? "No req." : c.visa === "schengen" ? "Schengen" : c.visa === "evisa" ? "eVisa" : c.visa === "on-arrival" ? "VOA" : "Embajada"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
