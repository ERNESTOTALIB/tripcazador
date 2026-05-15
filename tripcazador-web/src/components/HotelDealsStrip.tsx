/**
 * HotelDealsStrip.tsx — YYY06 (May 2026)
 *
 * Strip horizontal de 6 chollos hoteles en CAPITALES EUROPEAS BARATAS.
 *
 * SSS207 (15 may 2026): user feedback — la versión anterior mostraba
 * hoteles Tailandia/Bali €310-725/noche que NO son chollos verdaderos
 * (son precios normales de luxury). TripCazador es sitio de CHOLLOS,
 * así que el strip ahora muestra capitales europeas baratas con precios
 * €35-75/noche y descuentos 30-50% — el patrón "chollo real".
 *
 * Cada hotel apunta a Booking.com search con aid=714734 + city/area filter,
 * dejando que el visitor elija entre múltiples 3-4★ hoteles. Más conversion
 * que linkear a un hotel específico (más flexibilidad de fechas/budget).
 *
 * Server component (no JS extra al bundle).
 */

import Link from "next/link";
import { Bed } from "lucide-react";

const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";

interface BudgetHotelDeal {
  /** Slug interno (estable, no rotates). */
  id: string;
  /** Display name (ciudad + país). */
  city: string;
  country: string;
  /** Precio "antes" estimado (3-4★ medio en alta temporada). */
  oldPrice: number;
  /** Precio "ahora" (3-4★ promediado en plataforma). */
  price: number;
  /** Booking.com search-result URL con city query + AID afiliado. */
  bookingSearch: string;
  /** Unsplash photo ID (sin dominio) — paisajes/skylines representativos. */
  imageId: string;
  /** Fallback emoji si la imagen falla. */
  emoji: string;
}

function buildBookingUrl(city: string, country: string): string {
  // Search Booking.com con city + país (lo más fiable cross-territorio).
  const ss = `${city}, ${country}`;
  const params = new URLSearchParams({
    ss,
    aid: BOOKING_AID,
    label: "tripcazador-home-strip",
    // 3-4★ filtro (Booking lo entiende como nflt=class)
    nflt: "class=3;class=4",
    // Ordenar por precio ascendente
    order: "price",
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

// SSS207: 6 capitales/ciudades europeas con hoteles 3-4★ realmente baratos.
// Precios investigados mayo 2026 (Booking, hostelworld). Descuentos vs alta
// temporada estimados — patrón conservador para que el visitor no se queje
// del "antes" cuando hace click.
const BUDGET_CAPITALS: BudgetHotelDeal[] = [
  {
    id: "estambul",
    city: "Estambul",
    country: "Turquía",
    oldPrice: 68,
    price: 38,
    bookingSearch: "",
    imageId: "1524231757912-21f4fe3a7200",
    emoji: "🕌",
  },
  {
    id: "cracovia",
    city: "Cracovia",
    country: "Polonia",
    oldPrice: 72,
    price: 42,
    bookingSearch: "",
    imageId: "1607427293702-036933bbf746",
    emoji: "🏰",
  },
  {
    id: "budapest",
    city: "Budapest",
    country: "Hungría",
    oldPrice: 78,
    price: 45,
    bookingSearch: "",
    imageId: "1541849546-216549ae216d",
    emoji: "🌉",
  },
  {
    id: "praga",
    city: "Praga",
    country: "República Checa",
    oldPrice: 85,
    price: 52,
    bookingSearch: "",
    imageId: "1592906209472-a36b1f3782ef",
    emoji: "🏛️",
  },
  {
    id: "atenas",
    city: "Atenas",
    country: "Grecia",
    oldPrice: 88,
    price: 55,
    bookingSearch: "",
    imageId: "1503152394-c571994fd383",
    emoji: "🏺",
  },
  {
    id: "lisboa",
    city: "Lisboa",
    country: "Portugal",
    oldPrice: 95,
    price: 64,
    bookingSearch: "",
    imageId: "1555881400-74d7acaacd8b",
    emoji: "🚋",
  },
].map((h) => ({ ...h, bookingSearch: buildBookingUrl(h.city, h.country) }));

function hotelImageUrl(imageId: string, w = 640): string {
  // Proxy via /api/img (cache + privacy + anti-SSRF) — mismo patrón hotel_seed.
  const upstream = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=${w}&q=78`;
  return `/api/img?u=${encodeURIComponent(upstream)}&w=${w}&q=78`;
}

export function HotelDealsStrip() {
  return (
    <section
      aria-label="Hoteles capitales europeas chollos"
      className="py-10 sm:py-12"
    >
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Bed size={24} className="text-amber-400" />
            Capitales europeas baratas
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Hoteles 3-4★ en capitales chollo — desde €38/noche
          </p>
        </div>
        <Link
          href="/hoteles"
          className="text-sm font-medium text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline whitespace-nowrap"
        >
          Ver todos →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {BUDGET_CAPITALS.map((h) => {
          const discount = Math.round(100 - (h.price / h.oldPrice) * 100);
          return (
            <a
              key={h.id}
              href={h.bookingSearch}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="group block rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 transition-shadow hover:shadow-lg hover:shadow-amber-500/10 border border-gray-800 hover:border-amber-500/40"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-indigo-600/40 to-purple-800/40">
                {/* SSS143 BUGFIX: sin onError handler (RSC error.digest 1610473858).
                    Fallback emoji queda detrás como red de seguridad si img 404. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hotelImageUrl(h.imageId, 640)}
                  alt={`${h.city}, ${h.country}`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center text-5xl opacity-90 select-none"
                >
                  {h.emoji}
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-black z-10">
                  -{discount}%
                </div>
              </div>
              <div className="p-2.5">
                <div className="text-xs text-gray-400 truncate">{h.city}</div>
                <div className="mt-0.5 flex items-baseline justify-between gap-1">
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-base font-bold text-white">
                      {h.price}€
                    </div>
                    <div className="text-[11px] line-through text-gray-500">
                      {h.oldPrice}€
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500">/noche</div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
