"use client";

/**
 * AffiliateCrossSell — SSS336 (20 may 2026)
 *
 * Bloques de cross-sell de afiliados en deal detail:
 *  - Holafly eSIM (long-haul international)
 *  - Heymondo seguro viaje
 *  - GetYourGuide tours destino
 *  - Parclick / Aena parking aeropuerto origen
 *
 * Solo se mostran si el destino aplica (long-haul = eSIM, etc) y si
 * los affiliate IDs están configurados. Sin IDs → fallback link genérico
 * para preservar el lugar y dejar UX consistente.
 *
 * Tracking: tcTrack en cada click con partner identifiable.
 */

import { Bed, Globe, MapPin, Shield, Car, ExternalLink } from "lucide-react";
import { tcTrack } from "@/lib/track_client";

// Affiliate IDs / programs — se pueden override por env
const HOLAFLY_REF = process.env.NEXT_PUBLIC_HOLAFLY_REF || "tripcazador";
const HEYMONDO_REF = process.env.NEXT_PUBLIC_HEYMONDO_REF || "tripcazador";
const GYG_PARTNER_ID = process.env.NEXT_PUBLIC_GYG_PARTNER || "tripcazador";
const PARCLICK_REF = process.env.NEXT_PUBLIC_PARCLICK_REF || "tripcazador";

interface AffiliateCrossSellProps {
  origin?: string; // IATA origen (ES)
  destination?: string; // IATA destino
  cityTo?: string; // nombre ciudad destino
  countryTo?: string;
  dateOut?: string;
  dateRet?: string;
  /** Cuántas noches estimadas — usado para nights count */
  nights?: number;
}

/** Destinos largo recorrido donde eSIM aporta valor (no UE roaming gratis) */
const ESIM_DESTINATIONS = new Set([
  "USA", "Estados Unidos", "Japón", "Tailandia", "Indonesia", "Vietnam",
  "China", "Corea del Sur", "Marruecos", "Turquía", "Brasil", "Argentina",
  "México", "Cuba", "Egipto", "India", "Sudáfrica", "Emiratos", "EAU",
  "Filipinas", "Singapur", "Malasia", "Camboya", "Australia", "Nueva Zelanda",
]);

function isLongHaul(countryTo?: string): boolean {
  if (!countryTo) return false;
  return ESIM_DESTINATIONS.has(countryTo);
}

export function AffiliateCrossSell({
  origin,
  destination,
  cityTo,
  countryTo,
  dateOut,
  dateRet,
  nights = 7,
}: AffiliateCrossSellProps) {
  const cityDisplay = cityTo || destination || "tu destino";
  const longHaul = isLongHaul(countryTo);

  // URLs afiliado con tracking
  const holaflyUrl = `https://esim.holafly.com/?ref=${HOLAFLY_REF}&utm_source=tripcazador&utm_medium=cross_sell&utm_campaign=deal_detail`;
  const heymondoUrl = `https://www.heymondo.com/?ref=${HEYMONDO_REF}&utm_source=tripcazador&utm_medium=cross_sell&utm_campaign=deal_detail`;
  const gygUrl = `https://www.getyourguide.com/${encodeURIComponent(
    (cityDisplay || "").toLowerCase().replace(/\s+/g, "-"),
  )}-lXX/?partner_id=${GYG_PARTNER_ID}&utm_source=tripcazador&utm_medium=cross_sell`;
  const parclickUrl = origin
    ? `https://parclick.es/parking-aeropuerto-${origin.toLowerCase()}?ref=${PARCLICK_REF}&utm_source=tripcazador`
    : null;

  function track(partner: string) {
    tcTrack("affiliate_click", {
      partner,
      destination: destination || "",
      country: countryTo || "",
      source: "deal_detail",
    });
  }

  return (
    <aside
      aria-label="Servicios para tu viaje"
      className="my-6 rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">
        Completa tu viaje
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Seguro viaje (siempre relevante) */}
        <a
          href={heymondoUrl}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          onClick={() => track("heymondo")}
          className="flex items-start gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/40 transition"
        >
          <Shield size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm flex items-center gap-1">
              Seguro de viaje <ExternalLink size={11} className="text-gray-500" />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Heymondo · desde 1,87€/día · cobertura COVID
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">5% descuento exclusivo</div>
          </div>
        </a>

        {/* eSIM solo long-haul */}
        {longHaul && (
          <a
            href={holaflyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            onClick={() => track("holafly")}
            className="flex items-start gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-cyan-500/40 transition"
          >
            <Globe size={20} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm flex items-center gap-1">
                eSIM datos {cityDisplay} <ExternalLink size={11} className="text-gray-500" />
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Holafly · sin roaming · activa en 5min
              </div>
              <div className="text-[11px] text-cyan-300 mt-1">
                Desde 4€ · 5GB/día
              </div>
            </div>
          </a>
        )}

        {/* GetYourGuide tours */}
        {cityDisplay && (
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            onClick={() => track("getyourguide")}
            className="flex items-start gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition"
          >
            <MapPin size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm flex items-center gap-1">
                Tours en {cityDisplay} <ExternalLink size={11} className="text-gray-500" />
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                GetYourGuide · cancelación gratis
              </div>
              <div className="text-[11px] text-amber-300 mt-1">
                Free walking + actividades top
              </div>
            </div>
          </a>
        )}

        {/* Parking aeropuerto origen */}
        {parclickUrl && (
          <a
            href={parclickUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            onClick={() => track("parclick")}
            className="flex items-start gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-fuchsia-500/40 transition"
          >
            <Car size={20} className="text-fuchsia-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm flex items-center gap-1">
                Parking aeropuerto {origin} <ExternalLink size={11} className="text-gray-500" />
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Parclick · hasta 70% más barato que Aena
              </div>
              <div className="text-[11px] text-fuchsia-300 mt-1">
                Desde 4€/día
              </div>
            </div>
          </a>
        )}
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        ✱ Estos enlaces son afiliados — el precio que pagas no cambia, pero
        TripCazador recibe una pequeña comisión que nos permite seguir
        cazando chollos para ti.
      </p>
    </aside>
  );
}

// SSS336: silencia warnings de props reservadas para uso futuro
// (date_out, date_ret y nights se pasarán a Holafly/GYG en v2 cuando
// soporten preselección de fechas en su URL params).
type _ReservedFutureProps = Pick<AffiliateCrossSellProps, "dateOut" | "dateRet" | "nights">;
const _RESERVED_FUTURE: _ReservedFutureProps = { dateOut: undefined, dateRet: undefined, nights: undefined };
void _RESERVED_FUTURE;
