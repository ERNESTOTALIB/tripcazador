/**
 * /check-in — SSS427 (23 may 2026)
 *
 * Hub vertical /check-in/[aerolinea]. Lista 15 aerolíneas con
 * resumen de su política de check-in.
 *
 * SEO: "check-in aerolíneas", "como hacer check-in online".
 */
import Link from "next/link";
import type { Metadata } from "next";
import { CHECK_IN_RULES } from "@/lib/check_in_rules";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Check-in por aerolínea: cuándo abre, fees y tips | TripCazador",
  description:
    "Guías completas de check-in para 15 aerolíneas: cuándo abre online, fee mostrador, ventana de cierre, boarding pass digital y errores típicos.",
  alternates: { canonical: `${SITE_URL}/check-in` },
  openGraph: {
    title: "Check-in por aerolínea",
    description: "Información práctica de check-in para 15 aerolíneas.",
    url: `${SITE_URL}/check-in`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function CheckInHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🛫 Check-in por aerolínea
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Cuándo abre el online, fee del mostrador, cuándo cierra el boarding —
          {CHECK_IN_RULES.length} guías por aerolínea con tips para no pagar penalizaciones.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CHECK_IN_RULES.map((rule) => (
          <Link
            key={rule.slug}
            href={`/check-in/${rule.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white">
                {rule.emoji} {rule.name}
              </h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                {rule.code}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Online abre:</span>
                <span className="text-slate-200">{rule.online.opens.split("/")[0].trim()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fee mostrador:</span>
                <span className={rule.airportCheckIn.feeEur > 0 ? "font-bold text-red-300" : "text-emerald-300"}>
                  {rule.airportCheckIn.feeEur > 0 ? `€${rule.airportCheckIn.feeEur}` : "Gratis"}
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-amber-400">Ver guía →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
