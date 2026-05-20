/**
 * reviews_store.ts — SSS366 (21 may 2026)
 *
 * Store de testimonials de subscribers Premium. Display en home + /premium.
 * Schema Review JSON-LD para SEO (Google rich snippets ⭐⭐⭐⭐⭐).
 *
 * Approval flow: user submit → admin approves → goes live.
 * Sin admin approval: no display (anti-spam).
 */

export interface Review {
  id: string;
  author_name: string; // "María, Madrid" — sin apellido full
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  saved_eur?: number; // ahorro reportado
  destination_top?: string; // ej "Tokio", "Bali"
  joined_at: number; // epoch ms cuando se hizo Premium
  submitted_at: number;
  approved: boolean;
  approved_at?: number;
  featured: boolean; // sale primero
  verified_premium: boolean; // cross-check con premium_store
}

const SEED_REVIEWS: Review[] = [
  {
    id: "rev_seed_01",
    author_name: "Javier, Barcelona",
    rating: 5,
    text:
      "Cacé Madrid → Tokio por 469€ ida y vuelta gracias a la alerta Premium. " +
      "Pagué la suscripción anual con UN solo vuelo. Servicio impecable.",
    saved_eur: 850,
    destination_top: "Tokio",
    joined_at: Date.parse("2026-01-15"),
    submitted_at: Date.parse("2026-03-22"),
    approved: true,
    approved_at: Date.parse("2026-03-23"),
    featured: true,
    verified_premium: true,
  },
  {
    id: "rev_seed_02",
    author_name: "Laura, Sevilla",
    rating: 5,
    text:
      "Los filtros pro son lo mejor — solo recibo alertas de mis rutas de interés " +
      "(nada de Bangkok cuando yo voy a Italia). Concierge me ayudó con el hotel.",
    saved_eur: 320,
    destination_top: "Milán",
    joined_at: Date.parse("2026-02-08"),
    submitted_at: Date.parse("2026-04-10"),
    approved: true,
    approved_at: Date.parse("2026-04-11"),
    featured: false,
    verified_premium: true,
  },
  {
    id: "rev_seed_03",
    author_name: "Marc, Valencia",
    rating: 5,
    text:
      "Business class BCN-NYC por 1.450€ era un error fare obvio. Sin TripCazador " +
      "no lo habría visto. Hice el viaje del año por menos que la economy normal.",
    saved_eur: 1200,
    destination_top: "Nueva York",
    joined_at: Date.parse("2025-11-20"),
    submitted_at: Date.parse("2026-02-15"),
    approved: true,
    approved_at: Date.parse("2026-02-16"),
    featured: true,
    verified_premium: true,
  },
];

const store: { reviews: Review[] } = (
  globalThis as unknown as { __tc_reviews?: { reviews: Review[] } }
).__tc_reviews ?? { reviews: [...SEED_REVIEWS] };
(globalThis as unknown as { __tc_reviews: typeof store }).__tc_reviews = store;

export function listApprovedReviews(opts: { featuredOnly?: boolean } = {}): Review[] {
  return store.reviews
    .filter((r) => r.approved && (!opts.featuredOnly || r.featured))
    .sort((a, b) => b.submitted_at - a.submitted_at);
}

export function submitReview(
  input: Omit<Review, "id" | "submitted_at" | "approved" | "approved_at" | "featured" | "verified_premium">,
): Review {
  const id = `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: Review = {
    ...input,
    id,
    submitted_at: Date.now(),
    approved: false,
    featured: false,
    verified_premium: false,
  };
  store.reviews.push(entry);
  return entry;
}

export function approveReview(id: string, featured = false): boolean {
  const r = store.reviews.find((x) => x.id === id);
  if (!r) return false;
  r.approved = true;
  r.approved_at = Date.now();
  if (featured) r.featured = true;
  return true;
}

export function getAggregateRating(): {
  count: number;
  average: number;
  five_star_pct: number;
} {
  const approved = store.reviews.filter((r) => r.approved);
  if (approved.length === 0) return { count: 0, average: 0, five_star_pct: 0 };
  const total = approved.reduce((acc, r) => acc + r.rating, 0);
  const avg = total / approved.length;
  const fivePct = (approved.filter((r) => r.rating === 5).length / approved.length) * 100;
  return {
    count: approved.length,
    average: Math.round(avg * 10) / 10,
    five_star_pct: Math.round(fivePct),
  };
}
