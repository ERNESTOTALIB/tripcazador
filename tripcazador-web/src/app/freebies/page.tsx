/**
 * /freebies — SSS429 (23 may 2026)
 *
 * Hub lead magnets — 4 guías PDF gated por email.
 *
 * SEO: "guia gratis vuelos", "checklist equipaje ryanair pdf",
 * "guia error fares pdf".
 */
import Link from "next/link";
import type { Metadata } from "next";
import { FREEBIES_CATALOG } from "@/lib/freebies_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Guías gratis TripCazador (4 PDFs)",
  description:
    "4 guías gratis para cazar chollos, viajar con equipaje low-cost sin penalizaciones, tramitar visados express y entender el servicio Concierge.",
  alternates: { canonical: `${SITE_URL}/freebies` },
  openGraph: {
    title: "Guías gratis TripCazador",
    description: "Lead magnets gratuitos sobre error fares, equipaje, visados, Concierge.",
    url: `${SITE_URL}/freebies`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function FreebiesHubPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🎁 Guías gratis
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {FREEBIES_CATALOG.length} PDFs cortos con lo esencial sobre error
          fares, equipaje low-cost, visados express y nuestro servicio Concierge.
          Te lo enviamos por email tras confirmar tu suscripción.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {FREEBIES_CATALOG.map((f) => {
          const comingSoon = f.delivery.kind === "coming_soon";
          return (
            <Link
              key={f.slug}
              href={`/freebies/${f.slug}`}
              className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-3xl">{f.emoji}</div>
                {comingSoon && (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                    Próximamente
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{f.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{f.subtitle}</p>
              {f.pages !== undefined && (
                <p className="mt-2 text-xs text-slate-500">
                  PDF · {f.pages} páginas
                </p>
              )}
              <div className="mt-4 text-xs text-amber-400">
                {comingSoon ? "Apuntarse a la lista de espera →" : "Descargar gratis →"}
              </div>
            </Link>
          );
        })}
      </section>

      <p className="mt-10 text-center text-xs text-slate-500">
        Al suscribirte, te añadimos a nuestra newsletter de chollos. Sin spam.
        Puedes darte de baja en cualquier momento.
      </p>
    </main>
  );
}
