"use client";

/**
 * CarbonOffsetCard — SSS370 (21 may 2026)
 *
 * Card que muestra CO2 estimado del vuelo + CTA para compensar via Wren.
 * Para usar en /deals/[id] o cualquier landing que tenga origin/destination.
 *
 * Audience eco-conscious lo aprecia. Comisión 10-15% para TripCazador
 * por cada offset vendido.
 */

import { useMemo } from "react";
import { calculateOffset, getOffsetCheckoutUrl, type CabinClass } from "@/lib/carbon_offset";
import { tcTrack } from "@/lib/track_client";

interface Props {
  origin: string;
  destination: string;
  roundTrip?: boolean;
  cabinClass?: CabinClass;
  flightPriceEur?: number;
  dealId?: string;
  variant?: "card" | "compact";
}

export function CarbonOffsetCard({
  origin,
  destination,
  roundTrip = true,
  cabinClass = "economy",
  flightPriceEur,
  dealId,
  variant = "card",
}: Props) {
  const estimate = useMemo(
    () =>
      calculateOffset({
        origin,
        destination,
        roundTrip,
        cabinClass,
        flightPriceEur,
      }),
    [origin, destination, roundTrip, cabinClass, flightPriceEur],
  );

  if (!estimate) return null;

  const checkoutUrl = getOffsetCheckoutUrl(estimate, dealId);

  function onClick() {
    tcTrack("carbon_offset_click", {
      destination,
      co2_kg: estimate!.co2_kg,
      offset_eur: estimate!.offset_cost_eur,
    });
  }

  if (variant === "compact") {
    return (
      <a
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
        className="block p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500/60 transition"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">🌱</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Compensa {estimate.co2_kg} kg CO2 · {estimate.offset_cost_eur}€
            </p>
            <p className="text-xs text-emerald-300/80">
              via Wren · plantación de árboles
            </p>
          </div>
          <div className="text-emerald-400">→</div>
        </div>
      </a>
    );
  }

  return (
    <aside
      aria-label="Compensación CO2"
      className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl" aria-hidden="true">🌱</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white">Compensar la huella CO2</h3>
          <p className="text-sm text-gray-300 mt-1">
            Tu vuelo {origin} ↔ {destination} {roundTrip ? "(i/v)" : "(ida)"} emite
            aproximadamente{" "}
            <strong className="text-emerald-300">{estimate.co2_kg} kg</strong> de CO2
            ({estimate.distance_km.toLocaleString()} km en clase{" "}
            {estimate.cabin_class.replace("_", " ")}).
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-bold text-emerald-300">
              {estimate.offset_cost_eur}€
            </span>
            {estimate.offset_pct_of_flight && estimate.offset_pct_of_flight > 0 && (
              <span className="text-xs text-gray-400">
                ≈ {estimate.offset_pct_of_flight}% del precio del vuelo
              </span>
            )}
          </div>

          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={onClick}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm"
          >
            🌳 Compensar via Wren
            <span aria-hidden="true">→</span>
          </a>

          <p className="text-[10px] text-gray-500 mt-3">
            ✱ Cálculos basados en metodología ICAO. Wren reforesta + protege
            ecosistemas en países en desarrollo. Pequeña comisión a TripCazador
            sin coste extra para ti.
          </p>
        </div>
      </div>
    </aside>
  );
}
