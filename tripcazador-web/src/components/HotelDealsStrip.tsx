/**
 * HotelDealsStrip.tsx — YYY06 (May 2026)
 *
 * Strip horizontal de 4-6 hoteles "bajada de precio" para insertar en
 * homepage. Aprovecha HOTEL_SEED ya cableado a Booking.com con AID afiliado.
 *
 * Conversión esperada: 2-4% click-through home→Booking. Comisión Booking 4-7%.
 *
 * Server component (no JS extra al bundle).
 */

import Link from "next/link";
import { Bed } from "lucide-react";
import { HOTEL_SEED } from "@/lib/hotel_seed";

// BBBB01 — categoría → emoji fallback grande cuando la imagen Unsplash falla.
const CATEGORY_EMOJI: Record<string, string> = {
  beach: "🏖️",
  city: "🏙️",
  luxury: "✨",
  family: "👨‍👩‍👧",
  budget: "💰",
};

// BBBB01 — gradient hero por categoría: si la imagen no carga, renderizamos
// un gradient suave con el emoji de la categoría como background.
const CATEGORY_GRADIENT: Record<string, string> = {
  beach: "from-cyan-500/40 to-blue-700/40",
  city: "from-purple-600/40 to-indigo-800/40",
  luxury: "from-amber-500/40 to-orange-700/40",
  family: "from-emerald-500/40 to-teal-700/40",
  budget: "from-gray-500/40 to-gray-700/40",
};

export function HotelDealsStrip() {
  // Selecciona top 6 con mejor savings_pct (los hotel deals ya pasaron filtro
  // calidad/estrellas en hotel_seed; aquí solo priorizamos descuento).
  const top = [...HOTEL_SEED]
    .filter((h) => (h.savings_pct ?? 0) >= 15)
    .sort((a, b) => (b.savings_pct ?? 0) - (a.savings_pct ?? 0))
    .slice(0, 6);

  if (top.length === 0) return null;

  return (
    <section
      aria-label="Hoteles con bajada de precio"
      className="py-10 sm:py-12"
    >
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Bed size={24} className="text-amber-400" />
            Hoteles con bajada de precio
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Top 6 hoteles 4-5★ con descuentos detectados esta semana
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
        {top.map((h) => {
          const url = h.booking_url || "/hoteles";
          const img = h.image_url || "";
          // BBBB01: derivar categoría desde tags. Si no, "city" default.
          const categoryRaw = (h.tags || []).find((t) =>
            ["beach", "city", "luxury", "family", "budget"].includes(t),
          );
          const category = categoryRaw || "city";
          const fallbackEmoji = CATEGORY_EMOJI[category] || "🏨";
          const gradientCls = CATEGORY_GRADIENT[category] || CATEGORY_GRADIENT.city;
          return (
            <a
              key={h.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="group block rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 transition-shadow hover:shadow-lg hover:shadow-amber-500/10 border border-gray-800 hover:border-amber-500/40"
            >
              <div className={`relative aspect-[4/3] bg-gradient-to-br ${gradientCls}`}>
                {/* BBBB01: <img> con onError → muestra emoji fallback (no <Image>
                    de Next.js porque su mecanismo de fallback no funciona en
                    SSR + unoptimized para URLs externas que devuelven 404). */}
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={h.headline || h.city_to || "Hotel"}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Imagen rota → ocultar y dejar el gradient + emoji
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                {/* Fallback layer: emoji centrado, siempre presente debajo de la
                    img. Si la img no carga / display:none, este queda visible. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center text-5xl opacity-90 select-none"
                >
                  {fallbackEmoji}
                </div>
                {(h.savings_pct ?? 0) > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-black z-10">
                    -{Math.round(h.savings_pct ?? 0)}%
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <div className="text-xs text-gray-400 truncate">{h.city_to}</div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <div className="text-base font-bold text-white">
                    {Math.round(h.price_eur)}€
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
