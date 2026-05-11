import Link from "next/link";
import type { Metadata } from "next";
import { CUANDO_VIAJAR_DESTINOS, sweetSpotMonth } from "@/lib/cuando_viajar";

export const metadata: Metadata = {
  title: "Cuándo viajar — Mejor mes por destino 2026 | TripCazador",
  description:
    "¿Cuándo viajar a Tailandia, Japón, Bali, Maldivas, Islandia, Marruecos, Vietnam, Costa Rica? Tabla mes a mes con precios, clima, crowds y sweet spot cazador honesto.",
  alternates: { canonical: "/cuando-viajar" },
  openGraph: {
    title: "Cuándo viajar — Mejor mes por destino 2026",
    description:
      "Calendario mes a mes con precios, clima y veredicto cazador para 8 destinos top.",
    type: "website",
    url: "https://tripcazador.com/cuando-viajar",
  },
};

export const revalidate = 86400;

export default function CuandoViajarIndex() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cuándo viajar — mejor mes por destino",
    numberOfItems: CUANDO_VIAJAR_DESTINOS.length,
    itemListElement: CUANDO_VIAJAR_DESTINOS.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/cuando-viajar/${d.slug}`,
      name: `Cuándo viajar a ${d.name}`,
    })),
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>{" "}
        › Cuándo viajar
      </nav>

      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          ¿Cuándo viajar? Mejor mes por destino
        </h1>
        <p className="mt-3 text-gray-300 text-lg">
          Calendario mes a mes con precio relativo, clima real, crowds y
          veredicto cazador. El sweet spot suele <em>no</em> ser el mes pico:
          casi siempre hay un mes adyacente con clima idéntico y -30% precio.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CUANDO_VIAJAR_DESTINOS.map((d) => {
          const sweet = sweetSpotMonth(d);
          return (
            <Link
              key={d.slug}
              href={`/cuando-viajar/${d.slug}`}
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 p-5 bg-gray-900/40 hover:bg-gray-900/70 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" aria-hidden="true">
                  {d.emoji}
                </span>
                <h2 className="text-lg font-bold text-white">{d.name}</h2>
                <span className="text-xs text-gray-500">{d.countryEmoji}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                {d.bestSeason}
              </p>
              {sweet && (
                <div className="text-[11px] text-amber-300 font-mono">
                  Sweet spot cazador: <strong>{sweet.name}</strong> ({sweet.price} · {sweet.score}/10)
                </div>
              )}
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="text-base font-bold text-amber-300 mb-2">
          Cómo leemos cada calendario
        </h2>
        <ul className="text-sm text-gray-300 space-y-1.5">
          <li>· <strong>Precio</strong>: € (mínimo) a €€€€ (pico). Vuelos + hoteles + tours combinados.</li>
          <li>· <strong>Clima</strong>: temperatura diurna media + días con lluvia.</li>
          <li>· <strong>Crowds</strong>: de &ldquo;vacío&rdquo; a &ldquo;saturado&rdquo; (afecta colas + reservas anticipadas).</li>
          <li>· <strong>Score</strong>: 1-10, ponderado con todo lo anterior.</li>
          <li>· <strong>Sweet spot cazador</strong>: mes con mejor score ajustado por precio (no siempre el pico).</li>
        </ul>
      </section>
    </main>
  );
}
