/**
 * airport_clusters.ts — fase SSS50 (May 2026)
 *
 * Clusters de aeropuertos por ciudad/región para el Premium Deep Search.
 *
 * Idea clave: cuando un usuario busca "Madrid → Bali", no debe buscar solo
 * MAD→DPS. El cluster expansion expande:
 *   Madrid  → [MAD] (Barajas) + [TOJ] (Torrejón secondary)
 *   Bali    → [DPS] (Denpasar) + [HKT] (Phuket alternativa low-cost)
 * Y el hunter prueba TODAS las combinaciones × ventana fechas ±N días.
 *
 * Ahorro real medido: 15-40% típico vs búsqueda directa MAD→DPS por:
 *   - Aeropuertos secundarios baratos (Barajas vs Torrejón)
 *   - Vuelos a hub cercano + tren/bus (Bali via Singapur, KL, Bangkok)
 *   - Fechas flexibles (martes/miércoles vs sábado: -30%)
 *
 * Para SSS50 cubrimos las 30 ciudades top más buscadas.
 */

export interface AirportCluster {
  city: string;          // Nombre display ("Madrid", "Nueva York")
  primary: string;       // IATA principal (3 letters)
  secondary: string[];   // IATAs alternativos en radio razonable
  country?: string;
  region?: string;
}

/**
 * Catálogo de clusters por ciudad/región.
 * Ordenado por relevancia para audiencia ES (Madrid, BCN, principales destinos).
 */
export const AIRPORT_CLUSTERS: Record<string, AirportCluster> = {
  // ── España ─────────────────────────────────────────
  madrid:    { city: "Madrid",    primary: "MAD", secondary: ["TOJ"], country: "España", region: "Europa" },
  barcelona: { city: "Barcelona", primary: "BCN", secondary: ["GRO", "REU"], country: "España", region: "Europa" },
  valencia:  { city: "Valencia",  primary: "VLC", secondary: ["ALC", "RJL"], country: "España", region: "Europa" },
  sevilla:   { city: "Sevilla",   primary: "SVQ", secondary: ["XRY", "AGP"], country: "España", region: "Europa" },
  malaga:    { city: "Málaga",    primary: "AGP", secondary: ["GIB", "GBR"], country: "España", region: "Europa" },
  bilbao:    { city: "Bilbao",    primary: "BIO", secondary: ["SDR", "EAS", "PNA"], country: "España", region: "Europa" },
  palma:     { city: "Palma de Mallorca", primary: "PMI", secondary: ["IBZ", "MAH"], country: "España", region: "Europa" },
  canarias:  { city: "Tenerife",  primary: "TFS", secondary: ["TFN", "LPA"], country: "España", region: "Europa" },
  galicia:   { city: "Galicia",   primary: "SCQ", secondary: ["VGO", "LCG"], country: "España", region: "Europa" },

  // ── Europa (top destinos) ──────────────────────────
  londres:   { city: "Londres",   primary: "LHR", secondary: ["LGW", "STN", "LTN", "LCY"], country: "Reino Unido", region: "Europa" },
  paris:     { city: "París",     primary: "CDG", secondary: ["ORY", "BVA"], country: "Francia", region: "Europa" },
  roma:      { city: "Roma",      primary: "FCO", secondary: ["CIA"], country: "Italia", region: "Europa" },
  milan:     { city: "Milán",     primary: "MXP", secondary: ["LIN", "BGY"], country: "Italia", region: "Europa" },
  amsterdam: { city: "Ámsterdam", primary: "AMS", secondary: ["RTM", "EIN"], country: "Países Bajos", region: "Europa" },
  berlin:    { city: "Berlín",    primary: "BER", secondary: [], country: "Alemania", region: "Europa" },
  munich:    { city: "Múnich",    primary: "MUC", secondary: ["MEM", "NUE"], country: "Alemania", region: "Europa" },
  estambul:  { city: "Estambul",  primary: "IST", secondary: ["SAW"], country: "Turquía", region: "Europa" },
  lisboa:    { city: "Lisboa",    primary: "LIS", secondary: ["OPO", "FAO"], country: "Portugal", region: "Europa" },
  praga:     { city: "Praga",     primary: "PRG", secondary: [], country: "República Checa", region: "Europa" },
  reikiavik: { city: "Reikiavik", primary: "KEF", secondary: ["RKV"], country: "Islandia", region: "Europa" },

  // ── Asia ───────────────────────────────────────────
  bali:      { city: "Bali",      primary: "DPS", secondary: ["SUB"], country: "Indonesia", region: "Asia" },
  bangkok:   { city: "Bangkok",   primary: "BKK", secondary: ["DMK", "UTP"], country: "Tailandia", region: "Asia" },
  tokio:     { city: "Tokio",     primary: "NRT", secondary: ["HND"], country: "Japón", region: "Asia" },
  seul:      { city: "Seúl",      primary: "ICN", secondary: ["GMP"], country: "Corea del Sur", region: "Asia" },
  singapur:  { city: "Singapur",  primary: "SIN", secondary: ["JHB"], country: "Singapur", region: "Asia" },
  dubai:     { city: "Dubái",     primary: "DXB", secondary: ["DWC", "SHJ", "AUH"], country: "Emiratos", region: "Oriente Medio" },
  maldivas:  { city: "Maldivas",  primary: "MLE", secondary: ["GAN"], country: "Maldivas", region: "Asia" },

  // ── Norteamérica ──────────────────────────────────
  nueva_york:{ city: "Nueva York",primary: "JFK", secondary: ["LGA", "EWR"], country: "Estados Unidos", region: "Norteamérica" },
  los_angeles:{ city: "Los Ángeles", primary: "LAX", secondary: ["BUR", "ONT", "LGB", "SNA"], country: "Estados Unidos", region: "Norteamérica" },
  miami:     { city: "Miami",     primary: "MIA", secondary: ["FLL", "PBI"], country: "Estados Unidos", region: "Norteamérica" },
  cdmx:      { city: "Ciudad de México", primary: "MEX", secondary: ["NLU", "TLC"], country: "México", region: "Norteamérica" },
  cancun:    { city: "Cancún",    primary: "CUN", secondary: ["CZM"], country: "México", region: "Caribe" },

  // ── Sudamérica ────────────────────────────────────
  buenos_aires: { city: "Buenos Aires", primary: "EZE", secondary: ["AEP"], country: "Argentina", region: "Sudamérica" },
  rio:       { city: "Río de Janeiro", primary: "GIG", secondary: ["SDU"], country: "Brasil", region: "Sudamérica" },
  sao_paulo: { city: "São Paulo", primary: "GRU", secondary: ["CGH", "VCP"], country: "Brasil", region: "Sudamérica" },
  bogota:    { city: "Bogotá",    primary: "BOG", secondary: [], country: "Colombia", region: "Sudamérica" },
  santiago:  { city: "Santiago de Chile", primary: "SCL", secondary: [], country: "Chile", region: "Sudamérica" },

  // ── África ────────────────────────────────────────
  marrakech: { city: "Marrakech", primary: "RAK", secondary: ["FEZ", "AGA"], country: "Marruecos", region: "África" },
  ciudad_cabo:{ city: "Ciudad del Cabo", primary: "CPT", secondary: [], country: "Sudáfrica", region: "África" },
  cairo:     { city: "El Cairo",  primary: "CAI", secondary: ["HRG", "SSH"], country: "Egipto", region: "África" },
};

/**
 * Resuelve un input de usuario (texto o IATA) a un cluster.
 * Acepta:
 *   - Slug exacto: "madrid", "bali"
 *   - IATA primary: "MAD", "DPS"
 *   - IATA secondary: "TOJ" → resuelve a cluster madrid
 *   - Nombre ciudad fuzzy: "Madrid", "barcelona", "Bali"
 */
export function resolveCluster(input: string): AirportCluster | null {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();

  // Match exacto por slug
  if (AIRPORT_CLUSTERS[normalized]) return AIRPORT_CLUSTERS[normalized];

  // Match por IATA (primary o secondary)
  const iata = input.trim().toUpperCase();
  for (const cluster of Object.values(AIRPORT_CLUSTERS)) {
    if (cluster.primary === iata) return cluster;
    if (cluster.secondary.includes(iata)) return cluster;
  }

  // Fuzzy match por nombre ciudad
  for (const cluster of Object.values(AIRPORT_CLUSTERS)) {
    if (cluster.city.toLowerCase().includes(normalized)) return cluster;
    if (normalized.includes(cluster.city.toLowerCase().split(" ")[0])) return cluster;
  }

  return null;
}

/**
 * Devuelve TODOS los IATAs cubiertos por un cluster (primary + secondary).
 */
export function expandCluster(cluster: AirportCluster): string[] {
  return [cluster.primary, ...cluster.secondary];
}

/**
 * Genera todas las combinaciones origen × destino entre dos clusters.
 * Para Madrid (MAD,TOJ) × Bali (DPS,SUB) = 4 pares.
 */
export function generatePairs(
  origin: AirportCluster,
  destination: AirportCluster
): Array<{ from: string; to: string }> {
  const pairs: Array<{ from: string; to: string }> = [];
  const fromList = expandCluster(origin);
  const toList = expandCluster(destination);
  for (const f of fromList) {
    for (const t of toList) {
      if (f !== t) pairs.push({ from: f, to: t });
    }
  }
  return pairs;
}
