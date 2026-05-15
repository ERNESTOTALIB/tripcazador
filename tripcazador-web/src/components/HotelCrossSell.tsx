"use client";
/**
 * HotelCrossSell.tsx — YYY02 (May 2026)
 *
 * CTA cross-sell de hotel insertado en páginas de destino (deal detail,
 * blog post, /destinos/[slug]). Lleva a Booking.com con aid=AID afiliado.
 *
 * SSS145 (11 may 2026): añadido "use client". El componente usa
 * onClick={handleClick} para tracking afiliado (líneas 142 + 171). Sin
 * "use client" era un Server Component con event handler JSX = mismo bug
 * que tiró /destinos hoy (error.digest 1610473858). Detectado por linter
 * scripts/check-rsc-event-handlers.mjs antes de llegar a prod.
 *
 * Comisión Booking via Travelpayouts: ~4-7% del valor de reserva.
 * Conversión esperada cross-sell vuelo→hotel: 5-8% de los clicks.
 *
 * Uso:
 *   <HotelCrossSell city="Lisboa" iata="LIS" dateOut="2026-06-15" nights={2} />
 *
 * Si el destino no se reconoce, devuelve null (no renderiza).
 */

import { Bed, ExternalLink } from "lucide-react";
import { tcTrack } from "@/lib/track_client";

const TP_MARKER = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";

/** Precio "desde" estimado por ciudad (mid-tier, 2 noches). Solo para copy. */
const PRICE_HINTS: Record<string, number> = {
  // Spain
  madrid: 110, barcelona: 130, sevilla: 90, valencia: 90, malaga: 95,
  bilbao: 110, palma: 120, "las palmas": 95, tenerife: 90,
  // EU short-haul
  lisboa: 100, lisbon: 100, porto: 85, paris: 160, london: 180, londres: 180,
  amsterdam: 150, berlin: 110, roma: 130, rome: 130, milan: 140, milano: 140,
  munich: 140, vienna: 130, viena: 130, praga: 80, prague: 80,
  budapest: 75, krakow: 65, cracovia: 65, warsaw: 80, varsovia: 80,
  copenhague: 170, copenhagen: 170, estocolmo: 150, stockholm: 150,
  oslo: 170, helsinki: 130, dublin: 130, edinburgh: 140, edimburgo: 140,
  // long-haul
  bangkok: 70, tokio: 130, tokyo: 130, "nueva york": 200, "new york": 200,
  dubai: 130, dubái: 130, singapore: 140, singapur: 140,
  bali: 60, denpasar: 60, marrakech: 60, marrakesh: 60, estambul: 80,
  istanbul: 80, "rio de janeiro": 90, río: 90, "buenos aires": 70,
  "mexico city": 80, "ciudad de méxico": 80, mexico: 80,
  reikiavik: 200, reykjavik: 200, "ho chi minh": 50, hanoi: 50,
};

export interface HotelCrossSellProps {
  /** Nombre de ciudad para mostrar al usuario (ej "Lisboa"). */
  city?: string;
  /** Código IATA si lo conocemos. Opcional, sólo se usa para fallback. */
  iata?: string;
  /** Fecha de checkin formato YYYY-MM-DD. Opcional. */
  dateOut?: string;
  /** Noches a sugerir en el copy. Default 2. */
  nights?: number;
  /** Variante visual: "card" (default, en /deals/[id]) o "inline" (en blog). */
  variant?: "card" | "inline";
  /** Override locale del CTA (es/en). Default "es". */
  locale?: "es" | "en";
}

function priceHint(city: string): number {
  const key = (city || "").toLowerCase().trim();
  return PRICE_HINTS[key] || 80; // fallback genérico
}

function bookingSearchUrl(city: string, dateOut?: string, nights = 2): string {
  const params = new URLSearchParams();
  params.set("ss", city);
  params.set("aid", TP_MARKER);
  params.set("label", "tripcazador-crosssell");
  if (dateOut && /^\d{4}-\d{2}-\d{2}$/.test(dateOut)) {
    params.set("checkin", dateOut);
    // checkout = dateOut + nights
    const d = new Date(dateOut);
    d.setUTCDate(d.getUTCDate() + nights);
    params.set("checkout", d.toISOString().slice(0, 10));
  }
  params.set("group_adults", "2");
  params.set("no_rooms", "1");
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

const COPY = {
  es: {
    headline: (city: string) => `🏨 Hoteles en ${city}`,
    subheadline: (price: number, nights: number) =>
      `${nights} noches desde ${price}€ — combina con tu vuelo`,
    cta: "Ver hoteles disponibles",
    inlineLine: (city: string, price: number, nights: number) =>
      `¿Vas a ${city}? Hoteles ${nights} noches desde €${price} — `,
    inlineCta: "ver disponibilidad →",
  },
  en: {
    headline: (city: string) => `🏨 Hotels in ${city}`,
    subheadline: (price: number, nights: number) =>
      `${nights} nights from €${price} — bundle with your flight`,
    cta: "See available hotels",
    inlineLine: (city: string, price: number, nights: number) =>
      `Going to ${city}? Hotels for ${nights} nights from €${price} — `,
    inlineCta: "check availability →",
  },
};

export function HotelCrossSell({
  city,
  iata,
  dateOut,
  nights = 2,
  variant = "card",
  locale = "es",
}: HotelCrossSellProps) {
  const cityClean = (city || iata || "").trim();
  if (!cityClean) return null;

  const t = COPY[locale];
  const price = priceHint(cityClean);
  const url = bookingSearchUrl(cityClean, dateOut, nights);

  function handleClick() {
    if (typeof window === "undefined") return;
    // SSS185 (May 2026): emit a AMBOS — GA4 (gtag) y server-side /api/p
    // (tcTrack). gtag se pierde con AdBlocker (25% users), tcTrack sobrevive.
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      try {
        w.gtag("event", "hotel_crosssell_click", {
          city: cityClean,
          variant,
          locale,
        });
      } catch {
        /* swallow */
      }
    }
    // server-side mirror (AdBlocker-resistant via /api/p endpoint)
    tcTrack("deal_click", {
      partner: "booking",
      city: cityClean,
      variant,
      locale,
      source: "hotel_crosssell",
    });
  }

  if (variant === "inline") {
    return (
      <p className="my-4 text-sm text-gray-700 dark:text-gray-300 border-l-4 border-amber-400 pl-4 py-2 bg-amber-50/40 dark:bg-amber-900/10 rounded-r">
        <Bed size={14} className="inline mr-1 -mt-0.5" />
        {t.inlineLine(cityClean, price, nights)}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="text-amber-700 dark:text-amber-300 underline hover:text-amber-800 font-medium"
          onClick={handleClick}
        >
          {t.inlineCta}
        </a>
      </p>
    );
  }

  // Default: card variant.
  return (
    <aside
      aria-label={t.headline(cityClean)}
      className="my-6 rounded-xl border border-amber-300/30 bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-900/20 dark:to-amber-800/10 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-2xl">
          🏨
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-amber-50">
            {t.headline(cityClean)}
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {t.subheadline(price, nights)}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            onClick={handleClick}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
          >
            {t.cta}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </aside>
  );
}
