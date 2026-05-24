/**
 * /tarjetas-viaje — SSS452 (23 may 2026)
 *
 * Comparativa tarjetas viaje: Revolut, Wise, N26, BBVA Aqua, Vivid,
 * Openbank Open Debit.
 *
 * SEO: "mejor tarjeta para viajar", "tarjeta sin comisiones extranjero",
 * "revolut vs wise", "tarjeta para sacar dinero en el extranjero".
 *
 * Info-only — sin links afiliados directos (algunas tienen referral
 * programs públicos pero requieren cuenta para enlazar).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { TRAVEL_CARDS_CATALOG } from "@/lib/travel_cards_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  neobanco: { label: "Neobanco", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  tradicional: { label: "Banco tradicional", color: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
  fintech: { label: "Fintech", color: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
};

export const metadata: Metadata = {
  title: "Mejor tarjeta para viajar: comparativa 2026",
  description:
    "Revolut vs Wise vs N26 vs BBVA Aqua vs Vivid vs Openbank. Comisiones FX, retiradas ATM, cuota mensual y pros/cons. Sin trampas.",
  alternates: { canonical: `${SITE_URL}/tarjetas-viaje` },
  openGraph: {
    title: "Mejor tarjeta para viajar",
    description: "Comparativa de 6 tarjetas top con fees reales.",
    url: `${SITE_URL}/tarjetas-viaje`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function TarjetasViajePage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tarjetas viaje", item: `${SITE_URL}/tarjetas-viaje` },
    ],
  };

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Tarjetas viaje</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">💳</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Mejor tarjeta para viajar
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {TRAVEL_CARDS_CATALOG.length} tarjetas top comparadas: comisiones FX,
          retiradas ATM, cuota mensual y pros/cons. Sin links afiliados.
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-slate-300">
        <h2 className="text-base font-bold text-amber-300">⚡ TL;DR — Recomendación rápida</h2>
        <ul className="mt-2 space-y-1">
          <li>
            • <strong>Viajero frecuente con stocks/crypto interés:</strong> Revolut Premium (€7.99/mes con lounge access + seguro viaje)
          </li>
          <li>
            • <strong>Transparencia + transferencias internacionales:</strong> Wise (sin cuota, fees explícitos)
          </li>
          <li>
            • <strong>Cuenta bancaria UE pura + viajes ocasionales:</strong> N26 You (€9.90/mes con seguro incluido) o BBVA Aqua (cajeros Garanti/Mexico gratis)
          </li>
          <li>
            • <strong>Solo necesitas alternativa para extranjero:</strong> Vivid Standard o Openbank Open Debit (ambos gratis)
          </li>
        </ul>
      </section>

      <section className="space-y-6">
        {TRAVEL_CARDS_CATALOG.map((c) => {
          const typeBadge = TYPE_LABEL[c.type];
          return (
            <article
              key={c.slug}
              className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {c.emoji} {c.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">{c.coverage}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-bold ${typeBadge.color}`}
                >
                  {typeBadge.label}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                  <div className="text-xs uppercase text-slate-500">Cuota mensual</div>
                  <div className="mt-1 text-sm font-bold text-white">{c.monthlyFee}</div>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                  <div className="text-xs uppercase text-slate-500">Comisión FX</div>
                  <div className="mt-1 text-sm font-bold text-white">{c.fxFee}</div>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                  <div className="text-xs uppercase text-slate-500">Retiradas ATM</div>
                  <div className="mt-1 text-sm font-bold text-white">{c.atmFee}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs uppercase text-emerald-300">✓ Pros</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-200">
                    {c.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">+</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs uppercase text-red-300">✗ Cons</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-200">
                    {c.cons.map((co, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-400">-</span>
                        <span>{co}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-900/40 p-3 text-xs text-slate-400">
                <strong className="text-slate-300">Características clave:</strong>{" "}
                {c.features.join(" · ")}
              </div>

              {c.signupNote && (
                <p className="mt-3 text-xs text-slate-500">{c.signupNote}</p>
              )}

              <a
                href={c.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-amber-400 hover:underline"
              >
                Web oficial {c.name} →
              </a>
            </article>
          );
        })}
      </section>

      <section className="mt-10 rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-sm text-slate-300">
        <h2 className="text-base font-bold text-white">📝 Cómo elegir</h2>
        <ol className="mt-2 space-y-1 list-decimal pl-5">
          <li>Si viajas frecuente fuera UE: prioriza FX 0% (Revolut, N26, Vivid).</li>
          <li>Si necesitas retiradas ATM grandes: limite gratis mensual importante (N26 You, Revolut Premium).</li>
          <li>Si quieres cuenta bancaria UE pura: N26 o BBVA/Openbank (regulados).</li>
          <li>Si necesitas seguro viaje incluido: Revolut Premium o N26 You.</li>
        </ol>
      </section>

      <footer className="mt-8 text-xs text-slate-500">
        Datos verificados {TRAVEL_CARDS_CATALOG[0].lastVerified}. Las comisiones
        cambian frecuentemente — confirma en la web oficial de cada tarjeta antes
        de abrir cuenta.
      </footer>
    </main>
  );
}
