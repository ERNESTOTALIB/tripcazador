/**
 * premium_digest_scorer.ts — SSS312 fix (19 may 2026)
 *
 * Extraído de /api/premium/weekly-digest/route.ts porque Next.js
 * no permite exports custom desde route.ts files (solo HTTP methods +
 * runtime/dynamic). Tener `export function scoreDeal` allí rompía
 * el build de Vercel SILENCIOSAMENTE (workflow reportaba success pero
 * deployment serving el último build válido — todas las pages SSS301+
 * faltaban en PROD).
 *
 * scoreDeal() es pure function — ranking personalizado para Premium
 * weekly-digest según alerts + saved_searches del customer.
 */

export interface DealLite {
  id?: string;
  origin?: string;
  destination?: string;
  city_from?: string;
  city_to?: string;
  price_eur?: number;
  cabin?: string;
  airline?: string;
  date_out?: string;
  date_ret?: string;
  savings_pct?: number;
  booking_url?: string;
}

export interface PersonalizedDeal extends DealLite {
  match_score: number;
  why_matched: string[];
}

export interface ScorerAlert {
  origin?: string;
  destination?: string;
  max_price: number;
  cabin?: string;
  origins?: string[];
}

export interface ScorerSearch {
  origin?: string;
  destination?: string;
  airlines: string[];
  cabin: string;
  max_price?: number;
}

export function scoreDeal(
  deal: DealLite,
  alerts: ScorerAlert[],
  searches: ScorerSearch[],
): PersonalizedDeal {
  let score = 0;
  const reasons: string[] = [];

  // Alerts match: precio bajo cap + ruta
  for (const a of alerts) {
    if (deal.price_eur && deal.price_eur <= a.max_price) {
      const originsMatch =
        a.origins && a.origins.length > 0
          ? Boolean(deal.origin && a.origins.includes(deal.origin))
          : !a.origin || deal.origin === a.origin;
      const destMatch = !a.destination || deal.destination === a.destination;
      const cabinMatch = !a.cabin || deal.cabin === a.cabin;
      if (originsMatch && destMatch && cabinMatch) {
        score += 5;
        reasons.push(`matchea tu alerta ≤${a.max_price}€`);
        break; // 1 alerta basta para puntuar
      }
    }
  }

  // Saved searches match: ruta + cabin + airline
  for (const s of searches) {
    let hit = false;
    if (s.origin && deal.origin === s.origin) { score += 3; reasons.push(`origen ${s.origin}`); hit = true; }
    if (s.destination && deal.destination === s.destination) { score += 3; reasons.push(`destino ${s.destination}`); hit = true; }
    if (s.airlines.length && deal.airline && s.airlines.includes(deal.airline)) { score += 2; reasons.push(`aerolínea ${deal.airline}`); hit = true; }
    if (s.cabin !== "any" && deal.cabin === s.cabin) { score += 1; reasons.push(`clase ${s.cabin}`); hit = true; }
    if (typeof s.max_price === "number" && deal.price_eur && deal.price_eur <= s.max_price) {
      score += 2; reasons.push(`≤${s.max_price}€ guardado`); hit = true;
    }
    if (hit) break;
  }

  return {
    ...deal,
    match_score: score,
    why_matched: reasons,
  };
}
