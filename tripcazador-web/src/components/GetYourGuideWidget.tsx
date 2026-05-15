"use client";

/**
 * GetYourGuideWidget — fase kkk KKK2 (May 2026)
 *
 * Widget de afiliación a GetYourGuide (tours, actividades, excursiones).
 * Comisión típica: 8% del booking. EPC ~€0.40-1.20/click.
 *
 * Implementación:
 *  - Si NEXT_PUBLIC_GYG_PARTNER_ID está seteado: renderiza widget oficial
 *    (script + div). Si no, renderiza un "static fallback" con CTA + 4 categorías
 *    típicas (free walking tour, cooking class, day trip, museums) que apunta
 *    a https://www.getyourguide.com/{slug}-l{loc_id}/?partner_id=XXX.
 *
 * Por qué fallback estático: nos permite tener afiliación operativa antes de
 * que el user firme contrato GYG. Cuando lo firme, solo cambia env var.
 *
 * Pricing transparente: NO mostramos precios en el widget porque dependen
 * del idioma/moneda del visitante; GYG los muestra correctamente al click.
 *
 * Uso: en /destinos/[slug] debajo de hero, en /deals/[id] debajo del booking.
 */
import { Compass, ExternalLink } from "lucide-react";
import { tcTrack } from "@/lib/track_client";

const PARTNER_ID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "";

interface Props {
  city: string;
  destinationIata?: string;
  /** Optional locationId from GYG. If unknown, we use city slug + search. */
  gygLocationId?: number;
}

const CATEGORIES = [
  { emoji: "🚶", label: "Free walking tours" },
  { emoji: "🍴", label: "Cooking & food tours" },
  { emoji: "🚌", label: "Excursiones de día" },
  { emoji: "🎫", label: "Museos sin colas" },
];

export function GetYourGuideWidget({ city, destinationIata, gygLocationId }: Props) {
  if (!city) return null;

  const slug = city.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const baseUrl = gygLocationId
    ? `https://www.getyourguide.com/-l${gygLocationId}/`
    : `https://www.getyourguide.com/s/?q=${encodeURIComponent(city)}`;
  const partner = PARTNER_ID ? `partner_id=${PARTNER_ID}` : "";
  const cmpAffiliate = `cmp=tripcazador&utm_source=tripcazador&utm_medium=affiliate&utm_campaign=destinos${destinationIata ? `_${destinationIata}` : ""}`;
  const sep = baseUrl.includes("?") ? "&" : "?";
  const url = `${baseUrl}${sep}${[partner, cmpAffiliate].filter(Boolean).join("&")}`;

  return (
    <section
      aria-labelledby={`gyg-${slug}-heading`}
      className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-5 sm:p-6"
      data-testid="gyg-widget"
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Compass size={18} className="text-cyan-400" />
          <h2 id={`gyg-${slug}-heading`} className="text-base sm:text-lg font-bold text-white">
            Qué hacer en {city}
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold border border-cyan-500/30 rounded-full px-2 py-0.5">
          Tours · Actividades
        </span>
      </header>

      <p className="text-sm text-gray-400 mb-4">
        Reserva tours guiados, excursiones y entradas sin colas. Cancelación gratis hasta 24h antes en la mayoría.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <a
            key={c.label}
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 border border-gray-700/40 hover:border-cyan-500/30 text-sm text-gray-200 transition-all min-h-[44px]"
            onClick={() => trackAffiliateClick("gyg", city, c.label)}
          >
            <span className="text-lg">{c.emoji}</span>
            <span className="font-semibold">{c.label}</span>
          </a>
        ))}
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-colors"
        onClick={() => trackAffiliateClick("gyg", city, "main_cta")}
      >
        Ver actividades en {city}
        <ExternalLink size={14} />
      </a>

      <p className="mt-3 text-[10px] text-gray-500 text-center">
        Enlace de afiliado · Si reservas no pagas más, nos ayudas a mantener TripCazador
      </p>
    </section>
  );
}

function trackAffiliateClick(provider: string, city: string, slot: string) {
  if (typeof window === "undefined") return;
  // SSS185 (May 2026): antes esta función tenía DOS bugs en cascada:
  //   1) sendBeacon directo a "/api/track" (NO /api/p) — AdBlockers bloquean
  //      el endpoint con la palabra "track"; SSS175 introdujo /api/p alias.
  //   2) type "affiliate_click" no está en VALID_TYPES de /api/track → /api/p
  //      lo rechazaba con HTTP 400 (revisa src/app/api/track/route.ts).
  // Fix: usar tcTrack del lib/track_client que ya hace AdBlocker bypass
  // (/api/p primary + /api/track fallback) y type valid ("deal_click").
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", "affiliate_click", { provider, city, slot });
  }
  tcTrack("deal_click", { partner: provider, city, source: `gyg_${slot}` });
}
