/**
 * HotelCard — fase yy YY2
 *
 * Tarjeta para hoteles con:
 *  - Imagen Unsplash via /api/img proxy (whitelisted, anti-SSRF)
 *  - Rating circle estilo Booking (8.7, 9.2…)
 *  - Estrellas amber
 *  - Categoría badge (Beach / City / Luxury / Family)
 *  - Highlight (Spa, vistas al mar, etc)
 *  - Precio por noche destacado + total 5 noches
 *  - Link interno a /hoteles/[slug] + CTA externo "Reservar en Booking"
 *
 * Reemplaza al HotelCard inline en /hoteles/page.tsx que era texto-only.
 */
import Link from "next/link";
import { safeExternalUrl, type Deal } from "@/lib/api";
import { HotelImage } from "@/components/HotelImage";

interface HotelCardProps {
  hotel: Deal & {
    hotel_slug?: string;
    hotel_category?: string;
    review_score?: number;
    review_count?: number;
    highlight?: string;
    emoji?: string;
  };
  eager?: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  beach:  { label: "Playa",   bg: "bg-cyan-500/15",   fg: "text-cyan-200" },
  city:   { label: "Ciudad",  bg: "bg-violet-500/15", fg: "text-violet-200" },
  luxury: { label: "Lujo",    bg: "bg-amber-500/15",  fg: "text-amber-200" },
  family: { label: "Familia", bg: "bg-emerald-500/15", fg: "text-emerald-200" },
  budget: { label: "Económico", bg: "bg-gray-500/15", fg: "text-gray-200" },
};

function ratingLabel(score: number): string {
  if (score >= 9.5) return "Excepcional";
  if (score >= 9.0) return "Magnífico";
  if (score >= 8.5) return "Muy bueno";
  if (score >= 8.0) return "Bien";
  return "Aceptable";
}

export function HotelCard({ hotel, eager = false }: HotelCardProps) {
  const ppn = hotel.price_per_night ?? hotel.price_eur / Math.max(hotel.nights, 1);
  const tags = hotel.tags ?? [];
  const starsTag = tags.find((t) => t.endsWith("-stars"));
  const stars = starsTag ? parseInt(starsTag.split("-")[0], 10) : 0;
  const cat = hotel.hotel_category ?? tags.find((t) =>
    ["beach", "city", "luxury", "family", "budget"].includes(t),
  );
  const catMeta = cat ? CATEGORY_LABELS[cat] : null;
  const score = hotel.review_score;
  const reviews = hotel.review_count;
  const slug = hotel.hotel_slug;
  const detailHref = slug ? `/hoteles/${slug}` : null;

  return (
    <article className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-700 transition-colors group">
      {/* Imagen */}
      {hotel.image_url ? (
        <Link
          href={detailHref ?? "#"}
          aria-label={`Ver detalles de ${hotel.airline_name}`}
          className="relative block aspect-[16/10] overflow-hidden bg-gray-800"
        >
          <HotelImage
            src={hotel.image_url}
            alt={`${hotel.airline_name} en ${hotel.city_to}`}
            loading={eager ? "eager" : "lazy"}
            fallbackSeed={hotel.hotel_slug || hotel.airline_name || hotel.id}
            fallbackEmoji={hotel.emoji}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {hotel.emoji && (
            <span className="absolute top-3 left-3 text-2xl drop-shadow-lg">
              {hotel.emoji}
            </span>
          )}
          {catMeta && (
            <span
              className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full backdrop-blur-md ${catMeta.bg} ${catMeta.fg} border border-white/10`}
            >
              {catMeta.label}
            </span>
          )}
          {/* Rating circle Booking-style */}
          {score !== undefined && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-md">
                {score.toFixed(1)}
              </span>
              <span className="text-xs text-white/90 font-semibold drop-shadow">
                {ratingLabel(score)}
                {reviews !== undefined && (
                  <span className="text-white/70 ml-1">· {reviews.toLocaleString("es-ES")} opiniones</span>
                )}
              </span>
            </div>
          )}
        </Link>
      ) : null}

      <div className="p-5 flex-1 space-y-2.5">
        {/* Estrellas */}
        {stars > 0 && (
          <div className="flex items-center gap-1 text-amber-400 text-sm" aria-label={`${stars} estrellas`}>
            {"★".repeat(stars)}
            <span className="text-gray-500 ml-1">{"★".repeat(5 - stars)}</span>
          </div>
        )}

        {/* Nombre */}
        <h2 className="text-white font-semibold text-lg leading-tight line-clamp-2">
          {detailHref ? (
            <Link href={detailHref} className="hover:text-amber-300 focus:text-amber-300 focus:outline-none">
              {hotel.airline_name}
            </Link>
          ) : (
            hotel.airline_name
          )}
        </h2>

        {/* Localización */}
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span>📍</span>
          <span>{hotel.city_to}, {hotel.country_to}</span>
        </div>

        {/* Highlight */}
        {hotel.highlight && (
          <p className="text-xs text-gray-300 italic">
            ✨ {hotel.highlight}
          </p>
        )}

        {/* Precio destacado */}
        <div className="pt-1">
          <div className="text-3xl font-bold text-white">
            {ppn.toFixed(0)}€
            <span className="text-sm text-gray-400 font-normal"> / noche</span>
          </div>
          <div className="text-xs text-gray-500">
            {hotel.price_eur.toFixed(0)}€ por {hotel.nights} noches
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 border-t border-gray-800">
        {detailHref ? (
          <Link
            href={detailHref}
            className="text-center py-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Ver detalles
          </Link>
        ) : (
          <span className="text-center py-3 text-sm font-semibold text-gray-500">—</span>
        )}
        <a
          href={safeExternalUrl(hotel.booking_url)}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="text-center py-3 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors"
          data-tc-event="hotel_booking_click"
          data-tc-hotel-slug={slug}
        >
          Reservar →
        </a>
      </div>
    </article>
  );
}
