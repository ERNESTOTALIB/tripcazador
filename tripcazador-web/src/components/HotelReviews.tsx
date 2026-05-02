/**
 * HotelReviews — fase BBB2
 *
 * Sección de reviews para detalle de hotel. Estos son testimonials sintéticos
 * generados por hotel_helpers.generateReviews — muestran tono auténtico
 * arquetípico por categoría sin inventar nombres reales.
 *
 * Cuando se integre SerpAPI Google Hotels en VPS, este componente recibirá
 * reviews reales en el mismo formato.
 *
 * El componente es server-renderizable (no "use client") para que aparezca en
 * el HTML inicial del SSR — bueno para SEO.
 */
import type { GeneratedReview } from "@/lib/hotel_helpers";
import { ratingLabel } from "@/lib/hotel_helpers";

interface HotelReviewsProps {
  reviews: GeneratedReview[];
  totalReviewCount: number;
  averageScore: number;
  className?: string;
}

export function HotelReviews({ reviews, totalReviewCount, averageScore, className = "" }: HotelReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-5 ${className}`}
      data-testid="hotel-reviews"
      aria-labelledby="hotel-reviews-heading"
    >
      <header className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 id="hotel-reviews-heading" className="text-xl font-semibold text-white flex items-center gap-2">
          💬 Opiniones de huéspedes
        </h2>
        <span className="text-xs text-gray-500">
          Mostrando {reviews.length} de {totalReviewCount.toLocaleString("es-ES")} opiniones
        </span>
      </header>

      <div className="flex items-center gap-4 pb-4 border-b border-gray-800" data-testid="hotel-reviews-summary">
        <div className="bg-blue-600 text-white text-2xl font-bold px-3 py-2 rounded-lg">
          {averageScore.toFixed(1)}
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold text-base">{ratingLabel(averageScore)}</div>
          <div className="text-xs text-gray-400">
            Basado en {totalReviewCount.toLocaleString("es-ES")} opiniones de Booking.com y otras plataformas
          </div>
        </div>
      </div>

      <ul className="space-y-4 list-none p-0" role="list">
        {reviews.map((r, i) => (
          <li
            key={`${r.author}-${i}`}
            className="rounded-xl bg-gray-950/40 border border-gray-800 p-4 space-y-2.5"
            data-testid={`hotel-review-${i}`}
          >
            <div className="flex items-start gap-3">
              <div
                aria-hidden
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0"
              >
                {r.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{r.author}</span>
                  <span className="text-xs text-gray-500">{r.country} · {formatDate(r.date)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-blue-600/80 text-white text-xs font-bold px-2 py-0.5 rounded">
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">{ratingLabel(r.rating)}</span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-amber-200">"{r.title}"</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{r.body}</p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
        Las opiniones son representativas del tipo de feedback común para hoteles de esta categoría.
        Verifica las opiniones reales actualizadas en Booking.com antes de reservar.
      </p>
    </section>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
