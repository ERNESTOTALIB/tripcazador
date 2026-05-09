/**
 * iata_city.ts — AAAA01 (May 2026)
 *
 * Mapping fallback IATA → nombre ciudad ES + país. Se usa para enriquecer
 * deals cuando el worker devuelve city_to=IATA-code o country_to vacío
 * (caso típico: rutas LATAM internas que no estaban en el catálogo principal).
 *
 * Cobertura LATAM/Europa/Asia/USA mínima — sólo IATAs detectados como
 * problemáticos en /api/deals + códigos comunes que faltaban.
 *
 * Fuente: extraído manualmente del catálogo OpenFlights filtrando city codes
 * (SAO/RIO/IGU son metropolitan codes, no airport codes — IATA define ambos).
 */

export interface IataCity {
  city: string;
  country: string;
  region: string;
}

export const IATA_CITY_FALLBACK: Record<string, IataCity> = {
  // ─── LATAM Brasil ───────────────────────────────────────────────────
  SAO: { city: "São Paulo", country: "Brasil", region: "América Sur" },
  GRU: { city: "São Paulo Guarulhos", country: "Brasil", region: "América Sur" },
  CGH: { city: "São Paulo Congonhas", country: "Brasil", region: "América Sur" },
  VCP: { city: "Campinas", country: "Brasil", region: "América Sur" },
  RIO: { city: "Río de Janeiro", country: "Brasil", region: "América Sur" },
  GIG: { city: "Río de Janeiro Galeão", country: "Brasil", region: "América Sur" },
  SDU: { city: "Río de Janeiro Santos Dumont", country: "Brasil", region: "América Sur" },
  BSB: { city: "Brasilia", country: "Brasil", region: "América Sur" },
  CNF: { city: "Belo Horizonte", country: "Brasil", region: "América Sur" },
  BHZ: { city: "Belo Horizonte", country: "Brasil", region: "América Sur" },
  POA: { city: "Porto Alegre", country: "Brasil", region: "América Sur" },
  REC: { city: "Recife", country: "Brasil", region: "América Sur" },
  SSA: { city: "Salvador de Bahía", country: "Brasil", region: "América Sur" },
  FOR: { city: "Fortaleza", country: "Brasil", region: "América Sur" },
  CWB: { city: "Curitiba", country: "Brasil", region: "América Sur" },
  FLN: { city: "Florianópolis", country: "Brasil", region: "América Sur" },
  IGU: { city: "Foz do Iguaçu", country: "Brasil", region: "América Sur" },
  IGR: { city: "Iguazú (Argentina)", country: "Argentina", region: "América Sur" },
  VIX: { city: "Vitória", country: "Brasil", region: "América Sur" },
  MAO: { city: "Manaos", country: "Brasil", region: "América Sur" },
  NAT: { city: "Natal", country: "Brasil", region: "América Sur" },
  CGR: { city: "Campo Grande", country: "Brasil", region: "América Sur" },
  GYN: { city: "Goiania", country: "Brasil", region: "América Sur" },

  // ─── LATAM Argentina/Chile/Uruguay ──────────────────────────────────
  EZE: { city: "Buenos Aires Ezeiza", country: "Argentina", region: "América Sur" },
  AEP: { city: "Buenos Aires Aeroparque", country: "Argentina", region: "América Sur" },
  BUE: { city: "Buenos Aires", country: "Argentina", region: "América Sur" },
  COR: { city: "Córdoba (Argentina)", country: "Argentina", region: "América Sur" },
  MDZ: { city: "Mendoza", country: "Argentina", region: "América Sur" },
  BRC: { city: "Bariloche", country: "Argentina", region: "América Sur" },
  USH: { city: "Ushuaia", country: "Argentina", region: "América Sur" },
  IGZ: { city: "Iguazú", country: "Argentina", region: "América Sur" },
  CPC: { city: "San Martín de los Andes", country: "Argentina", region: "América Sur" },
  SCL: { city: "Santiago de Chile", country: "Chile", region: "América Sur" },
  IPC: { city: "Isla de Pascua", country: "Chile", region: "América Sur" },
  PUQ: { city: "Punta Arenas", country: "Chile", region: "América Sur" },
  MVD: { city: "Montevideo", country: "Uruguay", region: "América Sur" },

  // ─── LATAM Colombia/Perú/Ecuador/Venezuela/Bolivia/Paraguay ─────────
  BOG: { city: "Bogotá", country: "Colombia", region: "América Sur" },
  MDE: { city: "Medellín", country: "Colombia", region: "América Sur" },
  CTG: { city: "Cartagena", country: "Colombia", region: "América Sur" },
  CLO: { city: "Cali", country: "Colombia", region: "América Sur" },
  LIM: { city: "Lima", country: "Perú", region: "América Sur" },
  CUZ: { city: "Cuzco", country: "Perú", region: "América Sur" },
  AQP: { city: "Arequipa", country: "Perú", region: "América Sur" },
  IQT: { city: "Iquitos", country: "Perú", region: "América Sur" },
  TPP: { city: "Tarapoto", country: "Perú", region: "América Sur" },
  UIO: { city: "Quito", country: "Ecuador", region: "América Sur" },
  GYE: { city: "Guayaquil", country: "Ecuador", region: "América Sur" },
  CCS: { city: "Caracas", country: "Venezuela", region: "América Sur" },
  LPB: { city: "La Paz", country: "Bolivia", region: "América Sur" },
  VVI: { city: "Santa Cruz (Bolivia)", country: "Bolivia", region: "América Sur" },
  ASU: { city: "Asunción", country: "Paraguay", region: "América Sur" },

  // ─── LATAM México/CentroAmérica/Caribe ──────────────────────────────
  MEX: { city: "Ciudad de México", country: "México", region: "América Norte" },
  CUN: { city: "Cancún", country: "México", region: "América Norte" },
  GDL: { city: "Guadalajara", country: "México", region: "América Norte" },
  MTY: { city: "Monterrey", country: "México", region: "América Norte" },
  MID: { city: "Mérida (México)", country: "México", region: "América Norte" },
  TIJ: { city: "Tijuana", country: "México", region: "América Norte" },
  PVR: { city: "Puerto Vallarta", country: "México", region: "América Norte" },
  SJD: { city: "Los Cabos", country: "México", region: "América Norte" },
  SJO: { city: "San José (Costa Rica)", country: "Costa Rica", region: "América Central" },
  PTY: { city: "Ciudad de Panamá", country: "Panamá", region: "América Central" },
  GUA: { city: "Ciudad de Guatemala", country: "Guatemala", region: "América Central" },
  HAV: { city: "La Habana", country: "Cuba", region: "Caribe" },
  PUJ: { city: "Punta Cana", country: "República Dominicana", region: "Caribe" },
  SDQ: { city: "Santo Domingo", country: "República Dominicana", region: "Caribe" },
  AUA: { city: "Aruba", country: "Aruba", region: "Caribe" },
  CUR: { city: "Curaçao", country: "Curaçao", region: "Caribe" },
  NAS: { city: "Nasáu", country: "Bahamas", region: "Caribe" },
  MBJ: { city: "Montego Bay", country: "Jamaica", region: "Caribe" },
  KIN: { city: "Kingston", country: "Jamaica", region: "Caribe" },

  // ─── España (por si llegan IATAs sin mapear desde alguna fuente) ────
  MAD: { city: "Madrid", country: "España", region: "Europa" },
  BCN: { city: "Barcelona", country: "España", region: "Europa" },
  AGP: { city: "Málaga", country: "España", region: "Europa" },
  PMI: { city: "Palma de Mallorca", country: "España", region: "Europa" },
  VLC: { city: "Valencia", country: "España", region: "Europa" },
  SVQ: { city: "Sevilla", country: "España", region: "Europa" },
  BIO: { city: "Bilbao", country: "España", region: "Europa" },
  TFS: { city: "Tenerife Sur", country: "España", region: "Europa" },
  TFN: { city: "Tenerife Norte", country: "España", region: "Europa" },
  LPA: { city: "Las Palmas", country: "España", region: "Europa" },
  ALC: { city: "Alicante", country: "España", region: "Europa" },
  IBZ: { city: "Ibiza", country: "España", region: "Europa" },
  MAH: { city: "Menorca", country: "España", region: "Europa" },
};

/**
 * Set de IATAs origin EU usados como filtro "rutas relevantes a viajero ES/EU".
 * Incluye España + capitales y hubs principales EU + UK + DACH + nórdicos.
 */
export const EU_ORIGINS = new Set<string>([
  // España
  "MAD", "BCN", "AGP", "PMI", "VLC", "SVQ", "BIO", "TFS", "TFN", "LPA",
  "ALC", "IBZ", "MAH", "GRO", "REU", "ZAZ", "VGO", "SCQ", "OVD", "MJV",
  "ACE", "FUE", "MLN", "RJL", "BJZ",
  // UK / Irlanda
  "LHR", "LGW", "STN", "LTN", "LCY", "MAN", "BHX", "EDI", "GLA", "BRS",
  "DUB", "ORK", "SNN",
  // Francia
  "CDG", "ORY", "BVA", "NCE", "MRS", "LYS", "TLS", "BOD", "NTE", "MPL",
  // Italia
  "FCO", "CIA", "MXP", "LIN", "BGY", "VCE", "BLQ", "FLR", "NAP", "PMO",
  "CTA", "BRI", "TRN",
  // Alemania
  "FRA", "MUC", "DUS", "TXL", "BER", "HAM", "STR", "CGN", "HAJ", "NUE",
  // Países Bajos / Bélgica / Luxemburgo
  "AMS", "EIN", "RTM", "BRU", "CRL", "ANR", "LUX",
  // Portugal
  "LIS", "OPO", "FAO", "FNC", "PDL", "PXO",
  // Suiza / Austria
  "ZRH", "GVA", "BSL", "BRN", "VIE", "SZG", "INN", "GRZ",
  // Escandinavia / Báltico
  "CPH", "BLL", "ARN", "GOT", "OSL", "BGO", "TRD", "HEL", "TLL", "RIX", "VNO",
  // Europa Este
  "WAW", "KRK", "GDN", "WRO", "PRG", "BRQ", "BUD", "OTP", "SOF", "BEG",
  "TGD", "TIA", "SKP", "SJJ",
  // Grecia / Chipre / Malta
  "ATH", "SKG", "HER", "RHO", "JTR", "MLA", "LCA", "PFO",
  // Islandia
  "KEF", "AEY",
  // Norte África (relevante para viajero ES)
  "RAK", "CMN", "AGA", "TNG", "FEZ", "OUD", "TUN", "DJE", "ALG", "ORN",
  "CAI", "HRG", "SSH",
]);

/**
 * Enriquece un deal: si city_to/city_from están vacíos o coinciden con el
 * IATA code, los reemplaza por el nombre del catálogo. Idem country_to.
 */
export function enrichDealLocations<
  T extends {
    origin?: string | null;
    destination?: string | null;
    city_from?: string | null;
    city_to?: string | null;
    country_to?: string | null;
    region?: string | null;
  }
>(deal: T): T {
  const result = { ...deal };

  const origin = (deal.origin || "").toUpperCase().trim();
  const destination = (deal.destination || "").toUpperCase().trim();

  // Fix city_from si está vacío o = IATA
  const fromInfo = origin ? IATA_CITY_FALLBACK[origin] : null;
  const cityFromIsIata =
    !deal.city_from ||
    (deal.city_from.length === 3 && deal.city_from.toUpperCase() === origin);
  if (cityFromIsIata && fromInfo) {
    result.city_from = fromInfo.city;
  }

  // Fix city_to + country_to + region si city_to está vacío o = IATA
  const toInfo = destination ? IATA_CITY_FALLBACK[destination] : null;
  const cityToIsIata =
    !deal.city_to ||
    (deal.city_to.length === 3 && deal.city_to.toUpperCase() === destination);
  if (cityToIsIata && toInfo) {
    result.city_to = toInfo.city;
  }
  if (!deal.country_to && toInfo) {
    result.country_to = toInfo.country;
  }
  if ((!deal.region || deal.region === "Internacional") && toInfo) {
    result.region = toInfo.region;
  }

  return result;
}

/**
 * True si la ruta tiene origen reconocido como EU/España. Usar para filtrar
 * deals "relevantes" a usuarios de tripcazador.com (web ES) y evitar mostrar
 * vuelos LATAM-internos como destacados.
 */
export function hasEuOrigin(deal: { origin?: string | null }): boolean {
  const origin = (deal?.origin || "").toUpperCase().trim();
  return EU_ORIGINS.has(origin);
}
