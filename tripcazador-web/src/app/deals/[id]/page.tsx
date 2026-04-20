import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getDeal,
  getDeals,
  getPriceHistory,
  formatDate,
  formatDuration,
  getCabinLabel,
  getClassificationColor,
  type Deal,
} from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";
import { ShareButtons } from "@/components/ShareButtons";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";

// ISR: revalidar cada 5 min
export const revalidate = 300;

// ──────────────────────────────────────────────────────────────
// Metadata dinámica (SEO + OG + Twitter)
// ──────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const deal = await getDeal(params.id);
  if (!deal) {
    return {
      title: "Deal no encontrado",
      description: "La oferta que buscas ya no está disponible o ha expirado.",
    };
  }

  const title = `${deal.city_from} → ${deal.city_to} desde ${Math.round(
    deal.price_eur,
  )}€ — ${getCabinLabel(deal.cabin)}`;

  const savings =
    deal.savings_pct > 0 ? ` (${deal.savings_pct.toFixed(0)}% menos)` : "";
  const description = `Vuelo ${deal.airline_name || deal.airline} ${
    deal.city_from
  } → ${deal.city_to}, ${deal.country_to}${
    deal.nights > 0 ? `, ${deal.nights} noches` : ""
  }. ${formatDate(deal.date_out)}${
    deal.date_ret ? ` → ${formatDate(deal.date_ret)}` : ""
  }${savings}. Reserva directa en la aerolínea.`;

  const canonical = `/deals/${deal.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      // Nota: NO seteamos `images` aquí — dejamos que la convención de
      // archivo `opengraph-image.tsx` en esta misma carpeta inyecte el PNG
      // dinámico generado con next/og (precio grande, ciudades, ahorro).
      // Mucho mejor CTR en WhatsApp/Telegram que una foto genérica.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      // Igual que arriba: convención de archivo se encarga del image.
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────────────────
export default async function DealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const deal = await getDeal(params.id);
  if (!deal) {
    notFound();
  }

  // Cargar deals similares + historial de precios en paralelo
  const [similarData, priceHistory] = await Promise.all([
    getDeals({ region: deal.region, limit: 12 }),
    getPriceHistory({
      origin: deal.origin,
      destination: deal.destination,
      cabin: deal.cabin,
      days: 90,
    }),
  ]);
  const similar = similarData.deals
    .filter((d) => d.id !== deal.id && d.destination === deal.destination)
    .slice(0, 6);
  // Si no hay misma ciudad, relajamos a mismo país
  const fallbackSimilar =
    similar.length > 0
      ? similar
      : similarData.deals
          .filter(
            (d) => d.id !== deal.id && d.country_to === deal.country_to,
          )
          .slice(0, 6);

  const classColor = getClassificationColor(deal.classification);
  const isCritical =
    deal.classification === "CRÍTICO" || deal.classification === "ERROR";

  // URLs absolutas requeridas por los validators de Google Rich Results.
  const SITE = "https://tripcazador.com";
  const dealCanonical = `${SITE}/deals/${deal.id}`;

  // JSON-LD: Product + Offer (esquema bendecido por Google para rich
  // snippets de productos/ofertas con precio). Incluimos sku, seller,
  // itemCondition y priceValidUntil para cumplir con los requisitos
  // obligatorios + recomendados.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": dealCanonical,
    name: `Vuelo ${deal.city_from} → ${deal.city_to}`,
    description: deal.headline || `Vuelo ${deal.origin} → ${deal.destination}`,
    sku: deal.id,
    brand: {
      "@type": "Brand",
      name: deal.airline_name || deal.airline,
    },
    category: "Travel > Flights",
    offers: {
      "@type": "Offer",
      url: dealCanonical,
      priceCurrency: "EUR",
      price: deal.price_eur.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      validFrom: deal.found_at,
      validThrough: deal.expires_at,
      priceValidUntil: deal.expires_at,
      seller: {
        "@type": "Organization",
        name: deal.airline_name || deal.airline,
      },
    },
  };
  if (deal.image_url) {
    (jsonLd as { image?: string }).image = deal.image_url;
  }

  // Schema Flight complementario — ayuda a motores de búsqueda a entender
  // que esto es un vuelo específico entre dos aeropuertos.
  const flightLd = {
    "@context": "https://schema.org",
    "@type": "Flight",
    flightNumber: undefined, // no lo tenemos granular; omitido intencionalmente
    provider: {
      "@type": "Airline",
      name: deal.airline_name || deal.airline,
      iataCode: deal.airline,
    },
    departureAirport: {
      "@type": "Airport",
      iataCode: deal.origin,
      name: deal.city_from,
    },
    arrivalAirport: {
      "@type": "Airport",
      iataCode: deal.destination,
      name: deal.city_to,
    },
    departureTime: deal.date_out,
    arrivalTime: deal.date_ret || undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: `${SITE}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Deals",
        item: `${SITE}/deals`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${deal.city_from} → ${deal.city_to}`,
        item: dealCanonical,
      },
    ],
  };

  return (
    <div className="space-y-10">
      <JsonLd data={[jsonLd, flightLd, breadcrumbLd]} />

      {/* ─────────── Breadcrumb ─────────── */}
      <nav className="text-xs text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">
          Inicio
        </Link>{" "}
        <span className="mx-1">/</span>
        <Link href="/deals" className="hover:text-amber-400">
          Deals
        </Link>{" "}
        <span className="mx-1">/</span>
        <span className="text-gray-300">
          {deal.origin} → {deal.destination}
        </span>
      </nav>

      {/* ─────────── Hero ─────────── */}
      <section
        className={`relative overflow-hidden rounded-2xl border ${
          isCritical
            ? "border-red-500/30 ring-1 ring-red-500/20"
            : "border-gray-800"
        }`}
      >
        {deal.image_url && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deal.image_url}
              alt={deal.city_to}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-gray-950/40" />
          </div>
        )}

        <div className="relative p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classColor}`}
            >
              {deal.classification === "CRÍTICO"
                ? "🔥 Error Fare"
                : deal.classification === "ERROR"
                  ? "⚡ Posible Error"
                  : deal.classification === "ANOMALÍA"
                    ? "⚠️ Anomalía"
                    : "💰 Oferta"}
            </span>
            {deal.verified && (
              <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs">
                ✔ Verificado en {deal.sources?.length || 2}+ fuentes
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 text-xs">
              ⭐ Score {deal.score.toFixed(0)}
            </span>
            <ExpiryCountdown
              expiresAt={deal.expires_at}
              foundAt={deal.found_at}
              critical={isCritical}
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            {deal.city_from}{" "}
            <span className="text-gray-500">→</span>{" "}
            <span className="text-amber-400">{deal.city_to}</span>
          </h1>
          <p className="mt-2 text-gray-400 text-lg">
            {deal.country_to} · {getCabinLabel(deal.cabin)} ·{" "}
            {deal.airline_name || deal.airline}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                Precio total
              </div>
              <div className="text-5xl md:text-6xl font-bold text-white">
                {Math.round(deal.price_eur)}
                <span className="text-amber-400">€</span>
              </div>
              {deal.savings_pct > 0 && (
                <div className="mt-1 text-amber-400 font-semibold">
                  -{deal.savings_pct.toFixed(0)}%
                  {deal.savings_eur > 0 &&
                    ` · ahorras ~${Math.round(deal.savings_eur)}€`}
                </div>
              )}
            </div>

            <a
              href={deal.booking_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base transition-all ${
                isCritical
                  ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white hover:bg-gray-100 text-black"
              }`}
            >
              Reservar en {deal.airline_name || deal.airline} →
            </a>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Te abrimos la búsqueda en {deal.airline_name || deal.airline}. El
            precio puede cambiar — confirma antes de pagar.
          </p>

          <div className="mt-5 pt-5 border-t border-white/10">
            <ShareButtons
              url={`/deals/${deal.id}`}
              title={`Chollo ${deal.city_from} → ${deal.city_to} desde ${Math.round(
                deal.price_eur,
              )}€ en TripCazador`}
              label={`Compartir oferta ${deal.city_from} a ${deal.city_to}`}
            />
          </div>
        </div>
      </section>

      {/* ─────────── Detalles ─────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DetailCard
          label="Fechas"
          value={
            <>
              <div>{formatDate(deal.date_out)}</div>
              {deal.date_ret && (
                <div className="text-gray-400">→ {formatDate(deal.date_ret)}</div>
              )}
              {deal.nights > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {deal.nights} noches
                </div>
              )}
            </>
          }
        />
        <DetailCard
          label="Ruta"
          value={
            <>
              <div className="font-mono text-amber-400 text-lg">
                {deal.origin} → {deal.destination}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {deal.stops === 0
                  ? "✈️ Directo"
                  : `🔄 ${deal.stops} escala${deal.stops > 1 ? "s" : ""}`}
              </div>
              {deal.duration_min > 0 && (
                <div className="text-xs text-gray-500">
                  Duración: {formatDuration(deal.duration_min)}
                </div>
              )}
            </>
          }
        />
        <DetailCard
          label="Cabina"
          value={
            <>
              <div className="text-lg text-white font-semibold">
                {getCabinLabel(deal.cabin)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {deal.distance_category &&
                  `Vuelo de ${deal.distance_category} recorrido`}
              </div>
            </>
          }
        />
      </section>

      {/* ─────────── Tags & fuentes ─────────── */}
      {(deal.tags?.length > 0 || deal.main_reason) && (
        <section className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Por qué es un chollo
          </h2>
          {deal.main_reason && (
            <p className="text-gray-300 mb-4">{deal.main_reason}</p>
          )}
          {deal.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deal.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-800 rounded-lg text-xs text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─────────── Historial de precios (si hay datos) ─────────── */}
      <PriceHistoryChart history={priceHistory} currentPrice={deal.price_eur} />

      {/* ─────────── Mapa (si hay coordenadas) ─────────── */}
      {deal.lat && deal.lon && (
        <section className="rounded-2xl overflow-hidden border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Ubicación · {deal.city_to}
            </h2>
          </div>
          <div className="aspect-[21/9] bg-gray-900">
            {/* OpenStreetMap embed, sin tracking ni API key */}
            <iframe
              title={`Mapa de ${deal.city_to}`}
              className="w-full h-full"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                deal.lon - 2
              }%2C${deal.lat - 1.5}%2C${deal.lon + 2}%2C${
                deal.lat + 1.5
              }&layer=mapnik&marker=${deal.lat}%2C${deal.lon}`}
            />
          </div>
        </section>
      )}

      {/* ─────────── Deals similares ─────────── */}
      {fallbackSimilar.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            Otras ofertas a {deal.city_to || deal.country_to}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fallbackSimilar.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}

      {/* ─────────── Metadata footer ─────────── */}
      <section className="text-xs text-gray-500 border-t border-gray-800 pt-6">
        <p>
          Deal ID: <span className="font-mono">{deal.id}</span> · Encontrado:{" "}
          {deal.found_at
            ? new Date(deal.found_at).toLocaleString("es-ES")
            : "—"}
          {deal.expires_at &&
            ` · Vigencia prevista: ${new Date(deal.expires_at).toLocaleDateString("es-ES")}`}
        </p>
        {deal.sources?.length > 0 && (
          <p className="mt-1">Fuentes: {deal.sources.join(", ")}</p>
        )}
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
function DetailCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-5">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </div>
      <div className="text-white">{value}</div>
    </div>
  );
}
