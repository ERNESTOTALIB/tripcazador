import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getHotelEntries } from "@/lib/hotel_seed";
import { JsonLd } from "@/components/JsonLd";

type Params = { city: string };

const TP_MARKER = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";

function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function citiesIndex(): Map<string, { city: string; country: string; entries: ReturnType<typeof getHotelEntries> }> {
  const out = new Map<string, { city: string; country: string; entries: ReturnType<typeof getHotelEntries> }>();
  for (const h of getHotelEntries()) {
    const slug = citySlug(h.city);
    if (!slug) continue;
    if (!out.has(slug)) {
      out.set(slug, { city: h.city, country: h.country, entries: [] });
    }
    out.get(slug)!.entries.push(h);
  }
  return out;
}

export async function generateStaticParams(): Promise<Params[]> {
  const idx = citiesIndex();
  return Array.from(idx.keys()).map((city) => ({ city }));
}

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const idx = citiesIndex();
  const entry = idx.get(params.city);
  if (!entry) return { title: "Ciudad no encontrada" };
  return {
    title: `Hoteles en ${entry.city} 2026 — comparativa cazador`,
    description: `${entry.entries.length} hoteles en ${entry.city} (${entry.country}) seleccionados por valor: precio, ubicación, reviews. Cazador de ofertas en tiempo real.`,
    alternates: { canonical: `/hoteles/ciudad/${params.city}` },
  };
}

export default function HotelesCiudadPage({ params }: { params: Params }) {
  const idx = citiesIndex();
  const entry = idx.get(params.city);
  if (!entry) notFound();

  const sorted = [...entry.entries].sort(
    (a, b) => b.reviewScore - a.reviewScore,
  );
  const minPrice = Math.min(...sorted.map((h) => h.pricePerNight));
  const avgScore =
    sorted.reduce((s, h) => s + h.reviewScore, 0) / sorted.length;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: sorted.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: h.name,
      url: `https://tripcazador.com/hoteles/${h.slug}`,
    })),
  };

  function bookingSearchUrl(city: string): string {
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
      city,
    )}&aid=${TP_MARKER}&label=tripcazador-ciudad`;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <JsonLd data={itemListSchema} />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">
          Inicio
        </Link>{" "}
        ›{" "}
        <Link href="/hoteles" className="hover:text-amber-400">
          Hoteles
        </Link>{" "}
        › {entry.city}
      </nav>

      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Hoteles en {entry.city}
        </h1>
        <p className="mt-3 text-gray-300 text-lg">
          {sorted.length} hoteles seleccionados en {entry.city} ({entry.country}){" "}
          desde €{minPrice}/noche. Score medio {avgScore.toFixed(1)}/10 según
          reviews verificadas.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={bookingSearchUrl(entry.city)}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg"
          >
            Buscar todos los hoteles en {entry.city} →
          </a>
        </div>
      </header>

      <section className="space-y-3">
        {sorted.map((h) => (
          <Link
            key={h.id}
            href={`/hoteles/${h.slug}`}
            className="flex items-center gap-4 rounded-xl border border-gray-800 hover:border-amber-500/40 p-4 bg-gray-900/40 hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center text-2xl">
              {h.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">{h.name}</h3>
                <span className="text-xs text-amber-400" aria-hidden="true">
                  {"★".repeat(h.stars)}
                </span>
              </div>
              {h.highlight && (
                <p className="mt-0.5 text-xs text-gray-400 truncate">
                  {h.highlight}
                </p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span className="text-amber-300 font-mono font-bold">
                  {h.reviewScore.toFixed(1)}/10
                </span>
                <span>·</span>
                <span>{h.reviewCount.toLocaleString("es-ES")} reviews</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-base font-bold text-white">
                €{h.pricePerNight}
              </div>
              <div className="text-[10px] text-gray-500">/noche</div>
            </div>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-base font-bold text-white mb-3">
          Otras ciudades populares
        </h2>
        <div className="flex flex-wrap gap-2">
          {Array.from(idx.entries())
            .filter(([slug]) => slug !== params.city)
            .slice(0, 12)
            .map(([slug, e]) => (
              <Link
                key={slug}
                href={`/hoteles/ciudad/${slug}`}
                className="px-3 py-1.5 text-xs rounded-full bg-gray-900/60 hover:bg-gray-800 text-gray-300 hover:text-amber-300 border border-gray-800"
              >
                {e.city} ({e.entries.length})
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
