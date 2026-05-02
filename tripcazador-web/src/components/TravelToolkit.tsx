import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PARTNERS, type TravelPartner } from "@/lib/travel_partners";

/**
 * TravelToolkit — fase lll LLL2 (May 2026)
 *
 * Sección reutilizable que surface 3-4 partners afiliados en páginas
 * contextuales (destinos, deals/[id], blog post de ciudad).
 *
 * Por defecto muestra: Booking + GYG + eSIM + Insurance.
 * Variants:
 *   - "destination" → todos los anteriores
 *   - "compact"     → solo 3 (Booking, GYG, Insurance)
 *   - "transport"   → trenes/buses/coche (para blog posts EU)
 */

interface Props {
  variant?: "destination" | "compact" | "transport";
  city?: string;
  country?: string;
}

const VARIANT_SLUGS: Record<NonNullable<Props["variant"]>, string[]> = {
  destination: ["booking", "getyourguide", "holafly", "heymondo"],
  compact: ["booking", "getyourguide", "heymondo"],
  transport: ["discovercars", "trainline", "omio"],
};

export function TravelToolkit({ variant = "destination", city, country }: Props) {
  const slugs = VARIANT_SLUGS[variant];
  const partners = slugs
    .map((s) => PARTNERS.find((p) => p.slug === s))
    .filter((p): p is TravelPartner => Boolean(p));

  if (partners.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-gray-900 to-gray-950 p-5 sm:p-6"
      aria-labelledby="travel-toolkit-heading"
      data-testid="travel-toolkit"
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <h2 id="travel-toolkit-heading" className="text-lg sm:text-xl font-bold text-white">
          🧰 Para tu viaje{city ? ` a ${city}` : ""}
        </h2>
        <Link
          href="/como-viajar"
          className="text-xs text-amber-300 hover:text-amber-200 font-semibold whitespace-nowrap"
        >
          Ver guía completa →
        </Link>
      </header>

      <p className="text-sm text-gray-400 mb-4">
        Las herramientas que necesitas además del vuelo. Booking, tours, datos y seguro.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {partners.map((p) => {
          const url = p.affiliateUrl();
          // Para destinos, intenta enriquecer con city/country
          let finalUrl = url;
          if (city && p.slug === "getyourguide") {
            finalUrl += `&q=${encodeURIComponent(city)}`;
          }
          if (country && p.slug === "holafly") {
            const slugCountry = country.toLowerCase().replace(/[^a-z0-9]/g, "-");
            finalUrl = url.replace("https://esim.holafly.com/", `https://esim.holafly.com/destinations/${slugCountry}/`);
          }

          return (
            <a
              key={p.slug}
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="group flex flex-col gap-2 p-4 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/40 hover:border-amber-500/30 transition-all min-h-[100px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.emoji}</span>
                <span className="font-bold text-white">{p.name}</span>
              </div>
              <p className="text-xs text-gray-400 flex-1">{p.shortDescription}</p>
              <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold group-hover:text-amber-200">
                {p.ctaLabel}
                <ExternalLink size={10} />
              </div>
            </a>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-gray-500 text-center">
        Enlaces de afiliado · Mismo precio para ti
      </p>
    </section>
  );
}
