"use client";

/**
 * EsimBanner — fase kkk KKK3 (May 2026)
 *
 * Banner discreto promocionando eSIM para el destino del viaje (Holafly o
 * Airalo afiliado). Conversion alta porque es "must-have" del viajero
 * internacional. Comisión típica: 5-7% del paquete (€1-3 por orden).
 *
 * Implementación:
 *  - Si NEXT_PUBLIC_HOLAFLY_REF está seteado: link directo con ref code.
 *  - Fallback: link a holafly.com con utm tracking propio.
 *
 * Por qué este patrón funciona: 90% de viajeros internacionales pagan
 * roaming caro o se quedan sin internet. eSIM (no SIM física) se activa
 * con QR — perfecto para usuarios mobile que ya están en TripCazador.
 *
 * Usage: en /destinos/[slug], /deals/[id], y blog posts de viajes.
 */
import { Smartphone, ExternalLink } from "lucide-react";
import { tcTrack } from "@/lib/track_client";

const HOLAFLY_REF = process.env.NEXT_PUBLIC_HOLAFLY_REF || "";

interface Props {
  countryName?: string;
  countryCode?: string; // ISO-3166-1 alpha-2 (e.g. "JP", "TH")
}

export function EsimBanner({ countryName, countryCode }: Props) {
  const country = countryName || (countryCode ? countryCode : "tu destino");
  const slug = countryName
    ? countryName.toLowerCase().replace(/[^a-z0-9]/g, "-")
    : countryCode?.toLowerCase() || "";

  // Holafly URL pattern: https://esim.holafly.com/destinations/{country-slug}/
  const baseUrl = slug
    ? `https://esim.holafly.com/destinations/${slug}/`
    : "https://esim.holafly.com/";
  const refParam = HOLAFLY_REF ? `?ref=${HOLAFLY_REF}&utm_source=tripcazador&utm_medium=affiliate` : "?utm_source=tripcazador&utm_medium=affiliate";
  const url = `${baseUrl}${refParam}`;

  return (
    <aside
      role="complementary"
      aria-label={`eSIM data para ${country}`}
      className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 to-gray-900 p-4 sm:p-5"
      data-testid="esim-banner"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-violet-500/15 inline-flex items-center justify-center">
          <Smartphone size={24} className="text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
            Datos para {country} desde €5
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
            eSIM con activación instantánea por QR. Sin tarjeta física, sin roaming caro.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 min-h-[40px] rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs sm:text-sm transition-colors"
          onClick={() => trackEsim(country)}
        >
          Ver planes
          <ExternalLink size={12} />
        </a>
      </div>
    </aside>
  );
}

function trackEsim(country: string) {
  if (typeof window === "undefined") return;
  // SSS185: AMBOS — GA4 (visible en dashboard) y /api/p (AdBlocker-resistant)
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", "affiliate_click", { provider: "holafly", country });
  }
  tcTrack("deal_click", { partner: "holafly", country, source: "esim_banner" });
}
