/**
 * /equipaje/[aerolinea] — SSS289 (17 may 2026)
 *
 * High-intent SEO long-tail. Queries como:
 *  - "ryanair equipaje de mano dimensiones"
 *  - "easyjet medidas maleta cabina"
 *  - "vueling cuanto cobra maleta"
 *
 * 10 aerolíneas (FR, VY, U2, IB, W6, LH, AF, KL, DY, QR).
 * Cada landing: tabla dimensiones + reglas + gate fine + tips + PremiumCTA.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BAGGAGE_RULES, getBaggageBySlug } from "@/lib/baggage_rules";
import { JsonLd } from "@/components/JsonLd";
import { PremiumInlineCTA } from "@/components/PremiumInlineCTA";

const SITE = "https://tripcazador.com";

export function generateStaticParams() {
  return BAGGAGE_RULES.map((r) => ({ aerolinea: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { aerolinea: string };
}): Promise<Metadata> {
  const r = getBaggageBySlug(params.aerolinea);
  if (!r) return { title: "Aerolínea no encontrada | TripCazador" };
  const title = `${r.name} equipaje de mano: dimensiones, peso y precios 2026 | TripCazador`;
  const description = `Guía completa equipaje ${r.name}: bolso pequeño ${r.personalItem.dimensions}, cabina ${r.cabin.dimensions} ${r.cabin.weight}, gate fine €${r.gateFine.amountEur}. Tips cazador.`.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/equipaje/${params.aerolinea}` },
    openGraph: {
      title: `${r.emoji} Equipaje ${r.name} — guía 2026`,
      description,
      url: `${SITE}/equipaje/${params.aerolinea}`,
      siteName: "TripCazador",
      type: "article",
      locale: "es_ES",
    },
  };
}

export const revalidate = 86400;

export default function BaggagePage({
  params,
}: {
  params: { aerolinea: string };
}) {
  const r = getBaggageBySlug(params.aerolinea);
  if (!r) return notFound();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Equipaje", item: `${SITE}/equipaje` },
      { "@type": "ListItem", position: 3, name: r.name, item: `${SITE}/equipaje/${params.aerolinea}` },
    ],
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <JsonLd data={breadcrumb} />

      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span>/</span>
          <Link href="/equipaje" className="hover:text-white">Equipaje</Link>
          <span>/</span>
          <span className="text-white">{r.name}</span>
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{r.emoji}</div>
          <div>
            <h1 className="text-4xl font-bold text-white">
              Equipaje {r.name}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Dimensiones, peso, sanciones y tips · Actualizado {r.lastUpdated}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Tabla resumen</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-white">Tipo</th>
                <th className="px-4 py-3 text-left text-white">Dimensiones</th>
                <th className="px-4 py-3 text-left text-white">Peso máx</th>
                <th className="px-4 py-3 text-left text-white">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="px-4 py-3 font-semibold text-white">{r.personalItem.name}</td>
                <td className="px-4 py-3 text-gray-300">{r.personalItem.dimensions}</td>
                <td className="px-4 py-3 text-gray-300">{r.personalItem.weight || "Sin límite específico"}</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">Gratis</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-white">Trolley cabina</td>
                <td className="px-4 py-3 text-gray-300">{r.cabin.dimensions}</td>
                <td className="px-4 py-3 text-gray-300">{r.cabin.weight}</td>
                <td className="px-4 py-3 text-gray-300">
                  {r.cabin.feeFromEur === 0 ? (
                    <span className="text-emerald-400 font-semibold">Incluido</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Desde €{r.cabin.feeFromEur}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-white">Maleta facturada</td>
                <td className="px-4 py-3 text-gray-300">Variable</td>
                <td className="px-4 py-3 text-gray-300">{r.checked.weight}</td>
                <td className="px-4 py-3 text-gray-300">
                  {r.checked.feeFromEur === 0 ? (
                    <span className="text-emerald-400 font-semibold">Incluido</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Desde €{r.checked.feeFromEur}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-400">
          <strong>Cabina:</strong> {r.cabin.feeNote}
          <br />
          <strong>Facturada:</strong> {r.checked.feeNote}
        </div>
      </section>

      {r.gateFine.amountEur > 0 && (
        <section className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-rose-400 mb-2">
            ⚠ Sanción gate: €{r.gateFine.amountEur}
          </h2>
          <p className="text-gray-300">{r.gateFine.description}</p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Tips cazador {r.name}</h2>
        <ul className="space-y-2">
          {r.tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 flex-shrink-0">▸</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-2">vs competencia</h2>
        <p className="text-gray-300 text-sm">{r.comparison}</p>
      </section>

      <PremiumInlineCTA
        source={`equipaje-${r.slug}`}
        variant="card"
        title="Vuela con menos equipaje, gasta menos en extras"
        subtitle="Premium incluye filtros pro (busca solo error fares con cabina incluida) + alertas SMS · €9.99/mes · 7 días gratis"
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Reglas de otras aerolíneas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {BAGGAGE_RULES.filter((other) => other.slug !== r.slug).map((other) => (
            <Link
              key={other.slug}
              href={`/equipaje/${other.slug}`}
              className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-xl p-3 text-center transition-colors"
            >
              <div className="text-2xl">{other.emoji}</div>
              <div className="text-sm font-semibold text-white mt-1">{other.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
