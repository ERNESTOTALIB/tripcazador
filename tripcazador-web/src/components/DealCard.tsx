"use client";

import { Deal, formatDate, formatDuration, getCabinLabel, getClassificationColor } from "@/lib/api";
import { Plane, Clock, Star, ExternalLink, CheckCircle } from "lucide-react";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";
import { FavoriteButton } from "@/components/FavoriteButton";
import { track } from "@/lib/analytics";

interface DealCardProps {
  deal: Deal;
  featured?: boolean;
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
      {/* Imagen de fondo */}
      <div className={`relative overflow-hidden ${featured ? "h-56" : "h-44"}`}>
        {image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image_url}
            alt={`${city_to}${country_to ? ", " + country_to : ""}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 flex items-center justify-center">
            <Plane size={48} className="text-gray-700 rotate-45" />
          </div>
        )}
        {/* Overlay degradado + tinte cálido */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-900/20 mix-blend-multiply" />

        {/* Badge de clasificación */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${classColor}`}>
            {classification === "CRÍTICO" ? "🔥 Error Fare" :
             classification === "ERROR" ? "⚡ Posible Error" :
             classification === "ANOMALÍA" ? "⚠️ Anomalía" : "💰 Oferta"}
          </span>
        </div>

        {/* Badges esquina superior derecha: verificado + favorito */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {verified && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
              <CheckCircle size={10} />
              2+ fuentes
            </span>
          )}
          <FavoriteButton dealId={deal.id} size={14} />
        </div>

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

        {/* CTA */}
        <a
          href={booking_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`
            mt-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
            font-semibold text-sm transition-all duration-200
            ${isCritical
              ? "bg-amber-500 hover:bg-amber-400 text-black"
              : "bg-gray-700 hover:bg-gray-600 text-white"}
          `}
          onClick={() => {
            // Evento tipado — emite tanto a GA4 como a Plausible si están presentes.
            // `result_clicked` captura el id + posición en la lista; `booking_url_opened`
            // captura la salida del funnel de conversión (click hacia Booking/aerolínea).
            track({
              name: "result_clicked",
              params: {
                deal_id: deal.id,
                origin,
                destination,
                price_eur,
              },
            });
            track({
              name: "booking_url_opened",
              params: {
                source: "deal_card",
                destination,
                price_eur,
                airline: airline_name || undefined,
              },
            });
          }}
        >
          Ver oferta
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

// Versión lista (horizontal) para la página /deals
export function DealRow({ deal }: { deal: Deal }) {
  const { origin, destination, city_to, country_to, price_eur, savings_pct, date_out, date_ret,
          cabin, airline_name, stops, classification, score, booking_url, verified, image_url } = deal;

  const classColor = getClassificationColor(classification);

  return (
    <div className="flex items-stretch gap-0 rounded-xl glass card-hover border border-gray-800 group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative w-24 sm:w-32 shrink-0 overflow-hidden bg-gray-900">
        {image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image_url}
            alt={city_to}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Plane size={22} className="text-gray-600 rotate-45" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/60 pointer-events-none" />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 items-center gap-4 p-4 min-w-0">
      {/* Ruta */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="font-mono text-amber-400 font-bold text-sm">{origin}</span>
        <Plane size={12} className="text-gray-500 rotate-90" />
        <span className="font-mono text-white font-bold text-sm">{destination}</span>
      </div>

      {/* Ciudad + clase */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">
          {city_to}{country_to && <span className="text-gray-400 font-normal"> · {country_to}</span>}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {getCabinLabel(cabin)} · {stops === 0 ? "Directo" : `${stops} escala`}
          {airline_name && ` · ${airline_name}`}
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

      {/* Favorito + CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <FavoriteButton dealId={deal.id} size={14} />
        <a
          href={booking_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-all"
          onClick={() => {
            track({
              name: "result_clicked",
              params: { deal_id: deal.id, origin, destination, price_eur },
            });
            track({
              name: "booking_url_opened",
              params: {
                source: "deal_card",
                destination,
                price_eur,
                airline: airline_name || undefined,
              },
            });
          }}
        >
          Ver
          <ExternalLink size={12} />
        </a>
      </div>
      </div>
    </div>
  );
}
