"use client";

import { Deal, formatDate, formatDuration, getCabinLabel, getClassificationColor } from "@/lib/api";
import { Plane, Clock, MapPin, Star, ExternalLink, CheckCircle } from "lucide-react";
import Image from "next/image";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";

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
      <div className="relative h-36 overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={city_to}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

        {/* Badge de clasificación */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${classColor}`}>
            {classification === "CRÍTICO" ? "🔥 Error Fare" :
             classification === "ERROR" ? "⚡ Posible Error" :
             classification === "ANOMALÍA" ? "⚠️ Anomalía" : "💰 Oferta"}
          </span>
        </div>

        {/* Badge verificado */}
        {verified && (
          <div className="absolute top-3 right-3">
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
            // Track click para analytics
            if (typeof window !== "undefined" && (window as any).gtag) {
              (window as any).gtag("event", "deal_click", {
                deal_id: deal.id,
                destination: destination,
                price: price_eur,
                classification: classification,
              });
            }
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
  const { origin, destination, city_to, price_eur, savings_pct, date_out, date_ret,
          cabin, airline_name, stops, classification, score, booking_url, verified } = deal;

  const classColor = getClassificationColor(classification);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl glass card-hover border border-gray-800 group">
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
        href={booking_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-all shrink-0"
      >
        Ver
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
