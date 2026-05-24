/**
 * /jet-lag — Hub jet lag por ruta. AUDIT-FULL-3 (24 may 2026)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { JETLAG_CATALOG } from "@/lib/jetlag_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Jet lag por ruta: plan recovery día a día",
  description: `Plan recovery jet lag para ${JETLAG_CATALOG.length} rutas long-haul desde España. Pre-viaje, vuelo, llegada y días de adaptación.`,
  alternates: { canonical: `${SITE_URL}/jet-lag` },
  openGraph: {
    title: "Jet lag por ruta: plan recovery día a día",
    description: "Cómo evitar y superar el jet lag en rutas long-haul.",
    url: `${SITE_URL}/jet-lag`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function JetlagHubPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Jet lag por ruta", url: "/jet-lag" },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Jet lag por ruta</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🛬</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Jet lag por ruta
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Plan recovery día a día para {JETLAG_CATALOG.length} rutas long-haul
          desde España. Eastbound (Asia/Oceanía) más duro que westbound (América).
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {JETLAG_CATALOG.map((j) => (
          <Link
            key={j.slug}
            href={`/jet-lag/${j.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-colors hover:border-amber-500/50"
          >
            <h2 className="text-base font-bold text-white">{j.routeName}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
              <span>{j.tzDiffHours}h diff</span>
              <span>· {j.flightHours}h vuelo</span>
              <span>· {j.recoveryDays}d recovery</span>
            </div>
            <p className="mt-2 text-xs text-amber-300 capitalize">{j.direction} · {j.severity}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 text-center">
        <Link
          href="/calculadora-jetlag"
          className="inline-block rounded-lg border border-amber-500/40 px-5 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-500/10"
        >
          ¿Otra ruta? Calculadora interactiva →
        </Link>
      </section>
    </main>
  );
}
