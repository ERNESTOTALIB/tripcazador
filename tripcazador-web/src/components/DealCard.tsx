"use client";

import { Deal, formatDate, formatDuration, getCabinLabel, getClassificationColor, safeExternalUrl, safeImageUrl } from "@/lib/api";
import { Plane, Clock, MapPin, Star, ExternalLink, CheckCircle } from "lucide-react";
import Image from "next/image";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";
import { ShareDealInline } from "@/components/ShareDealInline";
import { FavoriteButton } from "@/components/FavoriteButton";

interface DealCardProps {
  deal: Deal;
  featured?: boolean;
}

/**
 * Mapping IATA → foto Unsplash (URL directa). Bug fase-ee:
 * el FastAPI seed devolvía `image_url=""` y DealCard renderizaba gradiente.
 * Ahora usamos URLs Unsplash curadas (estables, sin API key, no deprecated).
 */
const DEST_IMAGES: Record<string, string> = {
  // España
  MAD: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80",
  BCN: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
  PMI: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=800&q=80",
  AGP: "https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&w=800&q=80",
  IBZ: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
  // Europa
  LIS: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80",
  CDG: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
  ORY: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
  FCO: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
  MXP: "https://images.unsplash.com/photo-1520440229-6469a149ac59?auto=format&fit=crop&w=800&q=80",
  AMS: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80",
  LHR: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  DUB: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80",
  ATH: "https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=800&q=80",
  IST: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80",
  PRG: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80",
  BUD: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80",
  VIE: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80",
  BER: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=800&q=80",
  MUC: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
  FRA: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
  ZRH: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
  GVA: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
  CPH: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=80",
  KEF: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?auto=format&fit=crop&w=800&q=80",
  // Asia
  NRT: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
  HND: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
  ICN: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80",
  BKK: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
  DPS: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  SIN: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
  HKG: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=800&q=80",
  DXB: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
  // América
  JFK: "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?auto=format&fit=crop&w=800&q=80",
  LAX: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=800&q=80",
  MIA: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=800&q=80",
  CUN: "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?auto=format&fit=crop&w=800&q=80",
  MEX: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80",
  EZE: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=800&q=80",
  GIG: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80",
  // África
  CMN: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80",
  RAK: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80",
  CAI: "https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=800&q=80",
  // Default genérico
  _DEFAULT: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
};

function dealHeroImage(deal: Deal): string {
  const fromApi = safeImageUrl(deal.image_url);
  if (fromApi) return fromApi;
  const dest = (deal.destination || "").toUpperCase();
  return DEST_IMAGES[dest] || DEST_IMAGES._DEFAULT;
}

export function DealCard({ deal, featured = false }: DealCardProps) {
  const {
    headline,
    origin,
    destination,
    city_from,
    city_to,
    country_to,
    price_eur,
    savings_pct,
    savings_eur,
    date_out,
    date_ret,
    nights,
    cabin,
    airline_name,
    stops,
    duration_min,
    classification,
    score,
    image_url,
    booking_url,
    verified,
    tags,
    expires_at,
    found_at,
  } = deal;

  const classColor = getClassificationColor(classification);
  const isCritical = classification === "CRÍTICO" || classification === "ERROR";

  return (
    <div
      className={`
        group relative flex flex-col rounded-xl overflow-hidden border card-hover
        glass
        ${featured
          ? "border-amber-500/50 shadow-amber-500/10 shadow-lg glow-amber"
          : "border-gray-800 hover:border-gray-700"}
        ${isCritical ? "ring-1 ring-red-500/20" : ""}
      `}
    >
      {/* Imagen de fondo: usa image_url del API si existe, si no fallback Unsplash.
          featured = eager (above the fold), resto lazy (deferred scroll). */}
      <div className="relative h-36 overflow-hidden">
        {/* C5: AVIF preferred + JPG fallback. Unsplash URL admite ?fm=avif y ?w=NNN.
            srcset 400w/800w para mobile/desktop. sizes "400px" porque la card
            mide ≤400px en cualquier viewport. */}
        {(() => {
          const baseUrl = dealHeroImage(deal);
          const isUnsplash = baseUrl.includes("images.unsplash.com");
          const buildVariant = (fmt: string, w: number) => {
            if (!isUnsplash) return baseUrl;
            // Strip existing format/width params
            const clean = baseUrl.replace(/[?&]fm=[^&]*/g, "").replace(/[?&]w=[^&]*/g, "");
            const sep = clean.includes("?") ? "&" : "?";
            return `${clean}${sep}fm=${fmt}&w=${w}&q=78&auto=format&fit=crop`;
          };
          return (
            <picture>
              {isUnsplash && (
                <source
                  type="image/avif"
                  srcSet={`${buildVariant("avif", 400)} 400w, ${buildVariant("avif", 800)} 800w`}
                  sizes="(max-width: 640px) 100vw, 400px"
                />
              )}
              {isUnsplash && (
                <source
                  type="image/webp"
                  srcSet={`${buildVariant("webp", 400)} 400w, ${buildVariant("webp", 800)} 800w`}
                  sizes="(max-width: 640px) 100vw, 400px"
                />
              )}
              <img
                src={isUnsplash ? buildVariant("jpg", 800) : baseUrl}
                alt={city_to}
                loading={featured ? "eager" : "lazy"}
                fetchPriority={featured ? "high" : "auto"}
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-70"
                onError={(e) => {
                  const t = e.currentTarget;
                  t.style.display = "none";
                  const parent = t.parentElement;
                  if (parent && !parent.querySelector(".fallback-gradient")) {
                    const fallback = document.createElement("div");
                    fallback.className = "fallback-gradient w-full h-full bg-gradient-to-br from-gray-800 to-gray-900";
                    parent.insertBefore(fallback, t);
                  }
                }}
              />
            </picture>
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

        {/* Badge de clasificación */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${classColor}`}>
            {classification === "CRÍTICO" ? "🔥 Error Fare" :
             classification === "ERROR" ? "⚡ Posible Error" :
             classification === "ANOMALÍA" ? "⚠️ Anomalía" : "💰 Oferta"}
          </span>
        </div>

        {/* III1 — Heart favorite, junto al badge */}
        <FavoriteButton
          variant="card"
          deal={{
            id: String(deal.id),
            origin,
            destination,
            city_to,
            country_to,
            price_eur,
            date_out,
            date_ret,
            cabin,
            classification,
            airline_name,
          }}
        />

        {/* Badge verificado — SSS20 movido a bottom-left para liberar top-right (heart) */}
        {verified && (
          <div className="absolute bottom-3 left-3">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
              <CheckCircle size={10} />
              2+ fuentes
            </span>
          </div>
        )}

        {/* Score */}
        <div className="absolute bottom-3 right-3">
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <Star size={10} fill="currentColor" />
            {score.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Ruta */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-amber-400 font-bold">{origin}</span>
          <div className="flex-1 flex items-center gap-1">
            <div className="h-px flex-1 bg-gray-700" />
            <Plane size={12} className="text-gray-500 rotate-90" />
            <div className="h-px flex-1 bg-gray-700" />
          </div>
          <span className="font-mono text-white font-bold">{destination}</span>
        </div>

        {/* Ciudad destino */}
        <div>
          <h3 className="text-white font-semibold leading-tight">
            {city_to}
            {country_to && (
              <span className="text-gray-400 font-normal text-sm ml-1">
                · {country_to}
              </span>
            )}
          </h3>
        </div>

        {/* Precio */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-white">
              {price_eur.toFixed(0)}€
            </div>
            <div className="text-xs text-gray-400">
              {getCabinLabel(cabin)}
              {nights > 0 && ` · ${nights} noches`}
            </div>
          </div>
          {savings_pct > 0 && (
            <div className="text-right">
              <div className="text-amber-400 font-semibold text-sm">
                -{savings_pct.toFixed(0)}%
              </div>
              {savings_eur > 0 && (
                <div className="text-xs text-gray-500">
                  ahorras {savings_eur.toFixed(0)}€
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalles vuelo */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          {date_out && (
            <span className="flex items-center gap-1">
              📅 {formatDate(date_out)}
              {date_ret && ` → ${formatDate(date_ret)}`}
            </span>
          )}
          <span>
            {stops === 0 ? "✈️ Directo" : `🔄 ${stops} escala${stops > 1 ? "s" : ""}`}
          </span>
          {duration_min > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDuration(duration_min)}
            </span>
          )}
          {airline_name && (
            <span className="text-gray-500">{airline_name}</span>
          )}
        </div>

        {/* Urgencia: contador de expiración */}
        {(expires_at || found_at) && (
          <div className="flex">
            <ExpiryCountdown
              expiresAt={expires_at}
              foundAt={found_at}
              critical={isCritical}
            />
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA — fase ii: copy diferente según destino del link */}
        {(() => {
          const url = booking_url || "";
          const isMetasearch =
            url.includes("skyscanner.es") ||
            url.includes("kayak.es") ||
            url.includes("aviasales.es");
          const ctaLabel = isMetasearch
            ? `Buscar en ${airline_name || "Skyscanner"}`
            : `Reservar en ${airline_name || "aerolínea"}`;
          return (
            <>
              <a
                href={safeExternalUrl(booking_url)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={`
                  mt-auto flex items-center justify-center gap-2 py-3 px-4 rounded-lg min-h-[44px]
                  font-semibold text-sm transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
                  ${isCritical
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-gray-700 hover:bg-gray-600 text-white"}
                `}
                onClick={() => {
                  // GA4 (consent-gated en el sitio)
                  if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
                    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag("event", "deal_click", {
                      deal_id: deal.id,
                      destination: destination,
                      price: price_eur,
                      classification: classification,
                      direct_airline: !isMetasearch,
                    });
                  }
                  // Server-side track (alimenta /panel — fase ss-SS4)
                  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
                    const body = new Blob(
                      [
                        JSON.stringify({
                          type: "booking_redirect",
                          meta: {
                            deal_id: String(deal.id || ""),
                            destination: String(destination || ""),
                            origin: String(origin || ""),
                            airline: String(airline_name || ""),
                            price: Number(price_eur || 0),
                            cabin: String(deal.cabin || ""),
                            direct_airline: !isMetasearch,
                          },
                        }),
                      ],
                      { type: "application/json" },
                    );
                    try {
                      navigator.sendBeacon("/api/track", body);
                    } catch {
                      /* no-op */
                    }
                  }
                }}
              >
                {ctaLabel}
                <ExternalLink size={14} />
              </a>
              {/* Disclaimer: precios pueden variar al hacer click */}
              <p className="mt-2 text-[11px] text-gray-500 leading-tight">
                Precio aproximado del último escaneo. Confirma en la web de la
                aerolínea — el precio final puede variar.
              </p>
            </>
          );
        })()}

        {/* C2: share inline (WhatsApp / Telegram / native) */}
        <ShareDealInline
          dealId={deal.id}
          headline={deal.headline}
          origin={origin}
          destination={destination}
          price={price_eur}
        />
      </div>
    </div>
  );
}

// Versión lista (horizontal) para la página /deals
export function DealRow({ deal }: { deal: Deal }) {
  const { origin, destination, city_to, country_to, price_eur, savings_pct, date_out, date_ret,
          cabin, airline_name, stops, classification, score, booking_url, verified } = deal;

  void score; void verified;

  const classColor = getClassificationColor(classification);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl glass card-hover border border-gray-800 group">
      {/* III1 — Heart favorite */}
      <FavoriteButton
        variant="row"
        className="shrink-0"
        deal={{
          id: String(deal.id),
          origin,
          destination,
          city_to,
          country_to,
          price_eur,
          date_out,
          date_ret,
          cabin,
          classification,
          airline_name,
        }}
      />

      {/* Ruta */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="font-mono text-amber-400 font-bold text-sm">{origin}</span>
        <Plane size={12} className="text-gray-500 rotate-90" />
        <span className="font-mono text-white font-bold text-sm">{destination}</span>
      </div>

      {/* Ciudad + clase */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{city_to}</div>
        <div className="text-xs text-gray-400">
          {getCabinLabel(cabin)} · {stops === 0 ? "Directo" : `${stops} escala`}
          {airline_name && ` · ${airline_name}`}
        </div>
        {/* III3 — internal links cruzados (SEO + UX). JJJ5: collapse en xs. */}
        <div className="deal-row-internal-links text-[11px] text-gray-500 mt-1 flex flex-wrap gap-2">
          <a
            href={`/deals?destination=${encodeURIComponent(destination || "")}`}
            className="hover:text-amber-300 underline-offset-2 hover:underline"
          >
            Más a {city_to || destination} →
          </a>
          <a
            href={`/deals?origin=${encodeURIComponent(origin || "")}`}
            className="hover:text-amber-300 underline-offset-2 hover:underline"
          >
            Desde {origin} →
          </a>
        </div>
      </div>

      {/* Fechas */}
      <div className="text-xs text-gray-400 hidden sm:block">
        {date_out && formatDate(date_out)}
        {date_ret && <div>{formatDate(date_ret)}</div>}
      </div>

      {/* Badge */}
      <div className="hidden md:block">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${classColor}`}>
          {classification}
        </span>
      </div>

      {/* Precio */}
      <div className="text-right min-w-[80px]">
        <div className="text-xl font-bold text-white">{price_eur.toFixed(0)}€</div>
        {savings_pct > 0 && (
          <div className="text-xs text-amber-400">-{savings_pct.toFixed(0)}%</div>
        )}
      </div>

      {/* CTA */}
      <a
        href={safeExternalUrl(booking_url)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex items-center gap-1 px-4 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        Ver
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
