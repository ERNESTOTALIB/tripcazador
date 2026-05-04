/**
 * recommendations.ts — fase SSS64 (May 2026)
 *
 * Recomendador "porque te gustó X, te puede gustar Y" basado en clusters
 * de destinos por similitud (región/clima/precio/duración vuelo).
 *
 * No usa ML — match heurístico determinístico:
 *   - Clúster geográfico (mismo grupo regional → similitud alta)
 *   - Rango de precios solapado (±30%)
 *   - Tipo de viaje compatible (city/beach/luxury/family)
 *
 * Uso típico:
 *   import { getRecommendations } from "@/lib/recommendations";
 *   const recs = getRecommendations({ favoriteIatas: ["BKK", "DPS"], limit: 6 });
 */

interface DestinationFeature {
  iata: string;
  city: string;
  country: string;
  cluster: string;       // "asia_se" | "asia_e" | "caribbean" | "med_eu" | "north_eu" | "americas_n" | "americas_s" | "africa" | "oceania"
  type: ("city" | "beach" | "luxury" | "family" | "adventure" | "cultural")[];
  priceTier: 1 | 2 | 3;  // 1=barato, 2=medio, 3=caro (rango de vuelo desde España)
  flightHrsFromES: number;
}

const DESTINATIONS: DestinationFeature[] = [
  // Asia SE
  { iata: "BKK", city: "Bangkok", country: "Tailandia", cluster: "asia_se", type: ["city", "cultural"], priceTier: 2, flightHrsFromES: 13 },
  { iata: "DPS", city: "Bali", country: "Indonesia", cluster: "asia_se", type: ["beach", "luxury", "cultural"], priceTier: 2, flightHrsFromES: 17 },
  { iata: "HKT", city: "Phuket", country: "Tailandia", cluster: "asia_se", type: ["beach", "luxury"], priceTier: 2, flightHrsFromES: 14 },
  { iata: "SGN", city: "Ho Chi Minh", country: "Vietnam", cluster: "asia_se", type: ["city", "cultural"], priceTier: 2, flightHrsFromES: 14 },
  { iata: "MNL", city: "Manila", country: "Filipinas", cluster: "asia_se", type: ["beach", "city"], priceTier: 2, flightHrsFromES: 16 },
  { iata: "SIN", city: "Singapur", country: "Singapur", cluster: "asia_se", type: ["city", "luxury"], priceTier: 3, flightHrsFromES: 13 },
  { iata: "KUL", city: "Kuala Lumpur", country: "Malasia", cluster: "asia_se", type: ["city", "cultural"], priceTier: 2, flightHrsFromES: 13 },
  // Asia E
  { iata: "NRT", city: "Tokio", country: "Japón", cluster: "asia_e", type: ["city", "cultural", "luxury"], priceTier: 3, flightHrsFromES: 14 },
  { iata: "ICN", city: "Seúl", country: "Corea del Sur", cluster: "asia_e", type: ["city", "cultural"], priceTier: 3, flightHrsFromES: 12 },
  { iata: "HKG", city: "Hong Kong", country: "Hong Kong", cluster: "asia_e", type: ["city", "luxury"], priceTier: 3, flightHrsFromES: 12 },
  // Caribbean / Centroamérica
  { iata: "CUN", city: "Cancún", country: "México", cluster: "caribbean", type: ["beach", "family"], priceTier: 2, flightHrsFromES: 11 },
  { iata: "PUJ", city: "Punta Cana", country: "República Dominicana", cluster: "caribbean", type: ["beach", "luxury", "family"], priceTier: 2, flightHrsFromES: 9 },
  { iata: "HAV", city: "La Habana", country: "Cuba", cluster: "caribbean", type: ["city", "cultural"], priceTier: 2, flightHrsFromES: 10 },
  { iata: "SXM", city: "St Maarten", country: "St Maarten", cluster: "caribbean", type: ["beach", "luxury"], priceTier: 3, flightHrsFromES: 10 },
  // Mediterráneo
  { iata: "PMI", city: "Mallorca", country: "España", cluster: "med_eu", type: ["beach", "family"], priceTier: 1, flightHrsFromES: 1 },
  { iata: "AGP", city: "Málaga", country: "España", cluster: "med_eu", type: ["beach", "city"], priceTier: 1, flightHrsFromES: 1 },
  { iata: "ATH", city: "Atenas", country: "Grecia", cluster: "med_eu", type: ["city", "cultural"], priceTier: 1, flightHrsFromES: 4 },
  { iata: "JTR", city: "Santorini", country: "Grecia", cluster: "med_eu", type: ["beach", "luxury"], priceTier: 2, flightHrsFromES: 4 },
  { iata: "FCO", city: "Roma", country: "Italia", cluster: "med_eu", type: ["city", "cultural"], priceTier: 1, flightHrsFromES: 3 },
  { iata: "LIS", city: "Lisboa", country: "Portugal", cluster: "med_eu", type: ["city", "cultural"], priceTier: 1, flightHrsFromES: 1 },
  { iata: "IST", city: "Estambul", country: "Turquía", cluster: "med_eu", type: ["city", "cultural"], priceTier: 1, flightHrsFromES: 4 },
  // Europa Norte
  { iata: "KEF", city: "Reikiavik", country: "Islandia", cluster: "north_eu", type: ["adventure"], priceTier: 2, flightHrsFromES: 5 },
  { iata: "OSL", city: "Oslo", country: "Noruega", cluster: "north_eu", type: ["city", "adventure"], priceTier: 2, flightHrsFromES: 4 },
  { iata: "ARN", city: "Estocolmo", country: "Suecia", cluster: "north_eu", type: ["city"], priceTier: 2, flightHrsFromES: 4 },
  { iata: "CPH", city: "Copenhague", country: "Dinamarca", cluster: "north_eu", type: ["city"], priceTier: 2, flightHrsFromES: 3 },
  // América Norte
  { iata: "JFK", city: "Nueva York", country: "Estados Unidos", cluster: "americas_n", type: ["city", "luxury"], priceTier: 3, flightHrsFromES: 8 },
  { iata: "LAX", city: "Los Ángeles", country: "Estados Unidos", cluster: "americas_n", type: ["city", "beach"], priceTier: 3, flightHrsFromES: 12 },
  { iata: "MIA", city: "Miami", country: "Estados Unidos", cluster: "americas_n", type: ["beach", "city", "luxury"], priceTier: 3, flightHrsFromES: 10 },
  // América Sur
  { iata: "EZE", city: "Buenos Aires", country: "Argentina", cluster: "americas_s", type: ["city", "cultural"], priceTier: 3, flightHrsFromES: 13 },
  { iata: "LIM", city: "Lima", country: "Perú", cluster: "americas_s", type: ["city", "cultural", "adventure"], priceTier: 3, flightHrsFromES: 13 },
  { iata: "GIG", city: "Río de Janeiro", country: "Brasil", cluster: "americas_s", type: ["beach", "city"], priceTier: 3, flightHrsFromES: 11 },
  // África
  { iata: "RAK", city: "Marrakech", country: "Marruecos", cluster: "africa", type: ["city", "cultural"], priceTier: 1, flightHrsFromES: 3 },
  { iata: "CAI", city: "El Cairo", country: "Egipto", cluster: "africa", type: ["cultural"], priceTier: 2, flightHrsFromES: 5 },
  { iata: "JNB", city: "Johannesburgo", country: "Sudáfrica", cluster: "africa", type: ["adventure"], priceTier: 3, flightHrsFromES: 12 },
  // Oceanía
  { iata: "SYD", city: "Sídney", country: "Australia", cluster: "oceania", type: ["city", "beach"], priceTier: 3, flightHrsFromES: 22 },
];

interface RecOptions {
  favoriteIatas: string[];
  limit?: number;
  excludeIatas?: string[];
}

interface Recommendation {
  iata: string;
  city: string;
  country: string;
  reason: string;
  score: number;
}

/**
 * Computes similarity score 0-100 between two destinations.
 *  - Same cluster: +50
 *  - Adjacent cluster (med_eu↔north_eu, americas_n↔americas_s): +20
 *  - Type overlap: +10 per match (max 30)
 *  - Same priceTier: +15
 *  - Flight time similar (±3h): +10
 */
const ADJACENT_CLUSTERS: Record<string, string[]> = {
  asia_se: ["asia_e"],
  asia_e: ["asia_se"],
  caribbean: ["americas_n", "americas_s"],
  med_eu: ["north_eu", "africa"],
  north_eu: ["med_eu"],
  americas_n: ["caribbean"],
  americas_s: ["caribbean"],
  africa: ["med_eu"],
  oceania: ["asia_se"],
};

function similarity(a: DestinationFeature, b: DestinationFeature): number {
  if (a.iata === b.iata) return 100;
  let score = 0;
  if (a.cluster === b.cluster) score += 50;
  else if ((ADJACENT_CLUSTERS[a.cluster] || []).includes(b.cluster)) score += 20;

  const overlapTypes = a.type.filter((t) => b.type.includes(t)).length;
  score += Math.min(overlapTypes * 10, 30);

  if (a.priceTier === b.priceTier) score += 15;
  if (Math.abs(a.flightHrsFromES - b.flightHrsFromES) <= 3) score += 10;
  return score;
}

function explainReason(seed: DestinationFeature, target: DestinationFeature): string {
  if (seed.cluster === target.cluster) {
    return `Mismo perfil regional que ${seed.city}`;
  }
  const overlapTypes = seed.type.filter((t) => target.type.includes(t));
  if (overlapTypes.includes("beach")) return `Otra opción de playa similar a ${seed.city}`;
  if (overlapTypes.includes("luxury")) return `Lujo en otro destino, como ${seed.city}`;
  if (overlapTypes.includes("city")) return `Capital con vibe parecido a ${seed.city}`;
  if (overlapTypes.includes("cultural")) return `Cultural y patrimonial, como ${seed.city}`;
  return `Compatible con tu interés en ${seed.city}`;
}

export function getRecommendations({
  favoriteIatas,
  limit = 6,
  excludeIatas = [],
}: RecOptions): Recommendation[] {
  if (favoriteIatas.length === 0) return [];
  const seeds = favoriteIatas
    .map((iata) => DESTINATIONS.find((d) => d.iata === iata.toUpperCase()))
    .filter((d): d is DestinationFeature => Boolean(d));
  if (seeds.length === 0) return [];

  const exclude = new Set([
    ...favoriteIatas.map((s) => s.toUpperCase()),
    ...excludeIatas.map((s) => s.toUpperCase()),
  ]);

  const scoreMap = new Map<string, { dest: DestinationFeature; score: number; bestSeed: DestinationFeature }>();
  for (const candidate of DESTINATIONS) {
    if (exclude.has(candidate.iata)) continue;
    let bestScore = 0;
    let bestSeed: DestinationFeature = seeds[0];
    for (const seed of seeds) {
      const s = similarity(seed, candidate);
      if (s > bestScore) {
        bestScore = s;
        bestSeed = seed;
      }
    }
    if (bestScore > 30) {
      scoreMap.set(candidate.iata, { dest: candidate, score: bestScore, bestSeed });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ dest, score, bestSeed }) => ({
      iata: dest.iata,
      city: dest.city,
      country: dest.country,
      reason: explainReason(bestSeed, dest),
      score,
    }));
}

export function getDestinationFeature(iata: string): DestinationFeature | null {
  return DESTINATIONS.find((d) => d.iata === iata.toUpperCase()) ?? null;
}

export function listAllClusters(): string[] {
  return Array.from(new Set(DESTINATIONS.map((d) => d.cluster)));
}
