import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getHotelBySlug,
  getHotelEntries,
  getHotelSeedFallback,
  getHotelAmenities,
  getHotelCoords,
  getHotelGallery,
} from "@/lib/hotel_seed";
import { safeExternalUrl } from "@/lib/api";
import { HotelCard } from "@/components/HotelCard";
import { HotelGallery } from "@/components/HotelGallery";
import { HotelMap } from "@/components/HotelMap";
import { HotelReviews } from "@/components/HotelReviews";
import { HotelAmenitiesList } from "@/components/HotelAmenitiesList";
import { HotelPolicies } from "@/components/HotelPolicies";
import {
  generateReviews,
  ratingLabel,
  describeCategory,
  estimateTotalPrice,
} from "@/lib/hotel_helpers";

export const dynamicParams = false;
export const revalidate = 3600; // 1h

export async function generateStaticParams() {
  return getHotelEntries().map((h) => ({ slug: h.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const hotel = getHotelBySlug(params.slug);
  if (!hotel) return { title: "Hotel no encontrado | TripCazador" };
  const title = `${hotel.name} (${hotel.stars}★) — ${hotel.city}, ${hotel.country} desde ${hotel.pricePerNight}€/noche | TripCazador`;
  const description =
    `${hotel.name} ${hotel.stars} estrellas en ${hotel.city}. Desde ${hotel.pricePerNight}€/noche. ` +
    (hotel.highlight ?? `Reserva con descuento en Booking.com.`) +
    ` Calificación ${hotel.reviewScore.toFixed(1)}/10 (${hotel.reviewCount.toLocaleString("es-ES")} opiniones).`;
  const image = `https://images.unsplash.com/photo-${hotel.imageId}?auto=format&fit=crop&w=1200&q=85`;
  return {
    title,
    description,
    alternates: { canonical: `/hoteles/${hotel.slug}` },
    openGraph: {
      title,
      description,
      url: `/hoteles/${hotel.slug}`,
      type: "website",
      images: [{ url: image, width: 1200, height: 800, alt: hotel.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const TP_MARKER = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";

function bookingUrlDirect(name: string, city: string): string {
  const search = `${name} ${city}`.replace(/\s+/g, "+");
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(search)}&aid=${TP_MARKER}&label=tripcazador`;
}

export default async function HotelDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const hotel = getHotelBySlug(params.slug);
  if (!hotel) notFound();

  const bookingUrl = bookingUrlDirect(hotel.name, hotel.city);
  const amenities = getHotelAmenities(hotel);
  const [lat, lng] = getHotelCoords(hotel);
  const gallery = getHotelGallery(hotel);
  const reviews = generateReviews(hotel, 3);
  const totals = estimateTotalPrice({
    pricePerNight: hotel.pricePerNight,
    nights: 5,
  });

  // Hoteles relacionados misma región
  const related = getHotelSeedFallback({ region: hotel.region, limit: 6 })
    .filter((h) => h.id !== `hotel-${hotel.id}`)
    .slice(0, 3);

  // JSON-LD Hotel completo + Offer + AggregateRating + Review
  const ld = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description:
      `${hotel.name} ${hotel.stars} estrellas en ${hotel.city}, ${hotel.country}. ${hotel.highlight ?? ""}`,
    starRating: { "@type": "Rating", ratingValue: hotel.stars, bestRating: 5 },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: hotel.reviewScore,
      reviewCount: hotel.reviewCount,
      bestRating: 10,
      worstRating: 1,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: hotel.city,
      addressCountry: hotel.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
    image: gallery.map(
      (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`,
    ),
    priceRange: `€${hotel.pricePerNight}/noche`,
    url: `https://tripcazador.com/hoteles/${hotel.slug}`,
    amenityFeature: amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.replace(/_/g, " "),
      value: true,
    })),
    makesOffer: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: hotel.pricePerNight,
      availability: "https://schema.org/InStock",
      url: bookingUrl,
      validFrom: new Date().toISOString().slice(0, 10),
      validThrough: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 10,
        worstRating: 1,
      },
      reviewBody: r.body,
      datePublished: r.date,
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
      { "@type": "ListItem", position: 2, name: "Hoteles", item: "https://tripcazador.com/hoteles" },
      { "@type": "ListItem", position: 3, name: hotel.name, item: `https://tripcazador.com/hoteles/${hotel.slug}` },
    ],
  };

  const ratingPercent = (hotel.reviewScore / 10) * 100;

  return (
    <article className="space-y-10" data-testid="hotel-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Header con título + ubicación + breadcrumbs */}
      <header className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-300">Inicio</Link>
          <span>/</span>
          <Link href="/hoteles" className="hover:text-amber-300">Hoteles</Link>
          <span>/</span>
          <span className="text-gray-300">{hotel.name}</span>
        </nav>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-3xl">{hotel.emoji}</span>
          <span className="text-amber-400 text-lg" aria-label={`${hotel.stars} estrellas`}>
            {"★".repeat(hotel.stars)}
          </span>
          <span className="text-xs text-white/80 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 uppercase tracking-wide">
            {hotel.category}
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white" data-testid="hotel-detail-title">
          {hotel.name}
        </h1>
        <p className="text-lg text-gray-400 flex items-center gap-2">
          📍 {hotel.city}, {hotel.country}
        </p>
      </header>

      {/* Galería de fotos */}
      <HotelGallery imageIds={gallery} hotelName={hotel.name} city={hotel.city} />

      {/* Resumen + CTA sticky */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-white">Por qué este hotel destaca</h2>
            {hotel.highlight && (
              <p className="text-amber-300 text-lg" data-testid="hotel-highlight">
                ✨ {hotel.highlight}
              </p>
            )}
            <p className="text-gray-300 leading-relaxed">
              {hotel.name} es un hotel de {hotel.stars} estrellas en {hotel.city},
              {hotel.country}. La calificación media de huéspedes es{" "}
              <strong className="text-white">{hotel.reviewScore.toFixed(1)}/10</strong>{" "}
              basada en {hotel.reviewCount.toLocaleString("es-ES")} opiniones reales en
              Booking.com. Categorizado como{" "}
              <span className="capitalize text-amber-300">{hotel.category}</span>, es
              ideal para {describeCategory(hotel.category)}.
            </p>
            <p className="text-gray-300 leading-relaxed">
              El precio orientativo es <strong className="text-white">{hotel.pricePerNight}€/noche</strong> por
              habitación doble con desayuno (puede variar según fechas y ocupación).
              Una estancia típica de 5 noches sale por aprox.{" "}
              <strong className="text-white">{totals.total}€</strong>.
            </p>
          </div>

          {/* Rating bar */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Calificación de huéspedes</h2>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white text-3xl font-bold px-4 py-3 rounded-xl">
                {hotel.reviewScore.toFixed(1)}
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">{ratingLabel(hotel.reviewScore)}</div>
                <div className="text-xs text-gray-400">
                  {hotel.reviewCount.toLocaleString("es-ES")} opiniones de huéspedes verificados
                </div>
                <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{ width: `${ratingPercent}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(ratingPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <HotelAmenitiesList amenities={amenities} />

          {/* Reviews */}
          <HotelReviews
            reviews={reviews}
            totalReviewCount={hotel.reviewCount}
            averageScore={hotel.reviewScore}
          />

          {/* Map */}
          <HotelMap
            hotelName={hotel.name}
            city={hotel.city}
            country={hotel.country}
            lat={lat}
            lng={lng}
          />

          {/* Políticas */}
          <HotelPolicies category={hotel.category} hotelName={hotel.name} />
        </div>

        {/* CTA card sticky */}
        <aside className="md:sticky md:top-24 self-start space-y-4" data-testid="hotel-booking-aside">
          <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-gray-900 p-6">
            <div className="text-xs uppercase tracking-wide text-amber-300 mb-2 font-semibold">
              Precio orientativo
            </div>
            <div className="text-4xl font-bold text-white mb-1" data-testid="hotel-price-per-night">
              {hotel.pricePerNight}€
              <span className="text-base text-gray-400 font-normal">/noche</span>
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Habitación doble · desayuno incluido típicamente
            </div>
            <div className="text-sm text-gray-300 mb-5 pb-3 border-b border-gray-800">
              <div>5 noches: <strong className="text-white">{totals.subtotal}€</strong></div>
              {totals.discount > 0 && (
                <div className="text-green-400 text-xs">−{totals.discount}€ desc. estancia larga</div>
              )}
              <div className="text-amber-200 mt-1">Total estimado: <strong>{totals.total}€</strong></div>
            </div>
            <a
              href={safeExternalUrl(bookingUrl)}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="block w-full bg-amber-500 hover:bg-amber-400 text-black text-center py-3.5 rounded-xl font-bold transition-colors min-h-[44px]"
              data-tc-event="hotel_detail_booking_click"
              data-tc-hotel-slug={hotel.slug}
              data-testid="hotel-booking-cta"
            >
              Reservar en Booking.com →
            </a>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Verifica el precio final en Booking — los precios fluctúan según fechas.
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-xs text-gray-400 space-y-1.5">
            <div className="text-amber-300 font-semibold uppercase tracking-wide text-[10px]">
              ¿Por qué confiar en TripCazador?
            </div>
            <ul className="space-y-1 list-disc list-inside marker:text-amber-300/60">
              <li>60+ hoteles auditados manualmente</li>
              <li>Precios verificados en Booking.com</li>
              <li>Sin coste extra ni redirecciones engañosas</li>
            </ul>
          </div>

          <Link
            href="/hoteles"
            className="block text-center text-sm text-gray-400 hover:text-amber-300 underline underline-offset-4"
          >
            ← Ver todos los hoteles
          </Link>
        </aside>
      </section>

      {/* Hoteles relacionados */}
      {related.length > 0 && (
        <section className="space-y-4" data-testid="hotel-related">
          <h2 className="text-2xl font-semibold text-white">
            Otros hoteles en {hotel.region}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((h) => (
              <HotelCard key={h.id} hotel={h} />
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer afiliado */}
      <section className="text-center text-xs text-gray-500 border-t border-gray-800 pt-6">
        <p>
          Los enlaces de reserva son de afiliado Travelpayouts → Booking.com.
          Si reservas a través de ellos, TripCazador recibe una pequeña comisión
          sin coste adicional para ti.
        </p>
      </section>
    </article>
  );
}
