/**
 * /equipaje — SSS289 (17 may 2026)
 *
 * Index de equipaje por aerolínea. Listado de 10 aerolíneas con preview
 * de bolso pequeño + gate fine.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { BAGGAGE_RULES } from "@/lib/baggage_rules";
import { JsonLd } from "@/components/JsonLd";

const SITE = "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Equipaje aerolíneas 2026: dimensiones, peso y gate fees | TripCazador",
  description:
    "Guía completa equipaje 10 aerolíneas: Ryanair, Vueling, easyJet, Iberia, Wizz, Lufthansa, KLM, Air France, Norwegian, Qatar. Dimensiones, peso, sanciones y tips cazador.",
  alternates: { canonical: "/equipaje" },
};

export const revalidate = 86400;

export default function EquipajeIndexPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guías equipaje aerolíneas TripCazador",
    numberOfItems: BAGGAGE_RULES.length,
    itemListElement: BAGGAGE_RULES.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/equipaje/${r.slug}`,
      name: `Equipaje ${r.name}`,
    })),
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={itemList} />

      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span>/</span>
          <span className="text-white">Equipaje</span>
        </nav>
        <div className="text-5xl">🧳</div>
        <h1 className="text-4xl font-bold text-white">Equipaje por aerolínea 2026</h1>
        <p className="text-gray-300 max-w-2xl text-lg">
          {BAGGAGE_RULES.length} aerolíneas con guías completas: dimensiones bolso pequeño y cabina, peso máximo, sanciones por exceder y tips para evitar el gate fee.
        </p>
      </header>

      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BAGGAGE_RULES.map((r) => (
            <Link
              key={r.slug}
              href={`/equipaje/${r.slug}`}
              className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl p-5 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{r.emoji}</span>
                  <h2 className="text-xl font-bold text-white">{r.name}</h2>
                </div>
                {r.gateFine.amountEur > 0 && (
                  <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full font-semibold">
                    Gate fee €{r.gateFine.amountEur}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>
                  <span className="text-gray-500">Bolso pequeño:</span> {r.personalItem.dimensions}
                </div>
                <div>
                  <span className="text-gray-500">Cabina:</span> {r.cabin.dimensions} · {r.cabin.weight}
                  {r.cabin.feeFromEur > 0 && (
                    <span className="text-amber-400 ml-1">€{r.cabin.feeFromEur}+</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-amber-400 font-semibold">
                Ver guía completa →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-bold text-white">Consejo cazador 💡</h2>
        <p className="text-sm text-gray-300">
          Los gate fees pueden costar €50-80 — más de lo que pagaste por el vuelo low-cost. Verifica las dimensiones EXACTAS de tu bolso lleno (no vacío) antes de salir de casa. Si tu trolley va a ser fronterizo, considera pagar el extra €8-15 al hacer checkin online (siempre más barato que en gate).
        </p>
      </section>
    </div>
  );
}
