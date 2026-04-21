/**
 * search-groups.ts
 * ────────────────
 * Utilidades puras para SearchBar. Se extrajeron del componente para:
 *  - poder testearlas con Vitest sin montar React,
 *  - aislar la data de grupos de aeropuertos de la UI.
 *
 * Reglas:
 *  - Nada de "use client" / hooks / JSX aquí.
 *  - Cualquier función nueva debe ser determinista y sin side-effects.
 */

export type AirportGroup = {
  slug: string; // id estable (ES, DE, DACH…)
  label: string; // lo que ve el usuario ("España (9 aeropuertos)")
  short: string; // prefijo para el input (ES, DACH…)
  aliases: string[]; // lo que escribe el usuario (debe normalizarse)
  iatas: string[]; // aeropuertos reales para la búsqueda
};

// Grupos expansibles → N aeropuertos. Cuando el usuario escoge un grupo
// en el autocomplete, el input guarda `GRP:<slug>` y en submit se lanzan
// N búsquedas en paralelo (una por IATA).
export const AIRPORT_GROUPS: AirportGroup[] = [
  {
    slug: "ES",
    label: "España — todos los aeropuertos principales",
    short: "España",
    aliases: ["espana", "spain", "esp", "iberia", "peninsula iberica"],
    iatas: ["MAD", "BCN", "AGP", "VLC", "SVQ", "BIO", "PMI", "IBZ", "TFS", "LPA", "ALC"],
  },
  {
    slug: "DE",
    label: "Alemania — FRA/MUC/BER/HAM/DUS/STR",
    short: "Alemania",
    aliases: ["alemania", "germany", "deutschland", "ger"],
    iatas: ["FRA", "MUC", "BER", "HAM", "DUS", "STR", "CGN"],
  },
  {
    slug: "CH",
    label: "Suiza — ZRH/GVA/BSL/BRN",
    short: "Suiza",
    aliases: ["suiza", "switzerland", "schweiz", "helvetia"],
    iatas: ["ZRH", "GVA", "BSL", "BRN"],
  },
  {
    slug: "AT",
    label: "Austria — VIE/SZG/INN",
    short: "Austria",
    aliases: ["austria", "osterreich", "wien"],
    iatas: ["VIE", "SZG", "INN"],
  },
  {
    slug: "DACH",
    label: "DACH — Alemania + Austria + Suiza",
    short: "DACH",
    aliases: ["dach", "centroeuropa", "central europe"],
    iatas: ["FRA", "MUC", "ZRH", "VIE", "BER", "HAM", "GVA", "BSL", "SZG", "BRN", "STR"],
  },
  {
    slug: "IT",
    label: "Italia — FCO/MXP/BLQ/VCE/NAP",
    short: "Italia",
    aliases: ["italia", "italy", "italiano"],
    iatas: ["FCO", "MXP", "LIN", "BLQ", "VCE", "NAP", "BRI"],
  },
  {
    slug: "FR",
    label: "Francia — CDG/ORY/NCE/LYS/MRS",
    short: "Francia",
    aliases: ["francia", "france", "paris"],
    iatas: ["CDG", "ORY", "NCE", "LYS", "MRS", "TLS", "BOD"],
  },
  {
    slug: "PT",
    label: "Portugal — LIS/OPO/FAO",
    short: "Portugal",
    aliases: ["portugal", "lisboa"],
    iatas: ["LIS", "OPO", "FAO"],
  },
  {
    slug: "UK",
    label: "Reino Unido — LHR/LGW/STN/LTN/MAN/EDI",
    short: "Reino Unido",
    aliases: ["uk", "inglaterra", "england", "britain", "reino unido", "londres", "london"],
    iatas: ["LHR", "LGW", "STN", "LTN", "MAN", "EDI", "BHX"],
  },
  {
    slug: "NL",
    label: "Países Bajos — AMS/EIN/RTM",
    short: "Países Bajos",
    aliases: ["paises bajos", "holanda", "netherlands", "ams"],
    iatas: ["AMS", "EIN", "RTM"],
  },
  {
    slug: "SCAN",
    label: "Escandinavia — CPH/ARN/OSL/HEL",
    short: "Escandinavia",
    aliases: ["escandinavia", "nordic", "nordicos", "paises nordicos", "scandinavia"],
    iatas: ["CPH", "ARN", "OSL", "HEL", "GOT", "BGO"],
  },
  {
    slug: "GR",
    label: "Grecia — ATH/HER/SKG/JMK/JTR",
    short: "Grecia",
    aliases: ["grecia", "greece", "greek", "islas griegas", "cycladas"],
    iatas: ["ATH", "HER", "SKG", "JMK", "JTR", "RHO", "CFU"],
  },
  {
    slug: "US",
    label: "EEUU — JFK/LAX/MIA/ORD/SFO/BOS",
    short: "EEUU",
    aliases: ["eeuu", "usa", "united states", "estados unidos"],
    iatas: ["JFK", "EWR", "LAX", "MIA", "ORD", "SFO", "BOS", "IAD", "DFW", "SEA"],
  },
  {
    slug: "SEA",
    label: "Sudeste asiático — BKK/HKT/SIN/DPS/KUL",
    short: "Sudeste asiático",
    aliases: ["sudeste asiatico", "asia sudeste", "sea", "southeast asia", "tailandia", "bali", "indonesia"],
    iatas: ["BKK", "HKT", "DMK", "SIN", "DPS", "CGK", "KUL"],
  },
  {
    slug: "JP",
    label: "Japón — NRT/HND/KIX/NGO",
    short: "Japón",
    aliases: ["japon", "japan", "nippon", "tokio", "tokyo"],
    iatas: ["NRT", "HND", "KIX", "NGO", "FUK"],
  },
  {
    slug: "CARIB",
    label: "Caribe — HAV/SDQ/PUJ/CUN/MBJ",
    short: "Caribe",
    aliases: ["caribe", "caribbean", "cuba", "republica dominicana", "riviera maya"],
    iatas: ["HAV", "SDQ", "PUJ", "CUN", "MBJ", "NAS"],
  },
  {
    slug: "MA",
    label: "Marruecos — CMN/RAK/FEZ/AGA",
    short: "Marruecos",
    aliases: ["marruecos", "morocco", "marrakech", "casablanca"],
    iatas: ["CMN", "RAK", "FEZ", "AGA", "TNG"],
  },
  {
    slug: "SAM",
    label: "Sudamérica — EZE/SCL/GRU/BOG/LIM",
    short: "Sudamérica",
    aliases: ["sudamerica", "latinoamerica", "south america", "latam"],
    iatas: ["EZE", "SCL", "GRU", "GIG", "BOG", "LIM", "UIO", "MVD"],
  },
];

/**
 * Si el input tiene el formato `GRP:<slug>` devuelve el grupo; si no, null.
 * El componente guarda este prefijo en el input cuando el usuario selecciona
 * un grupo del autocomplete, para que el submit sepa expandirlo.
 */
export function matchGroupInput(input: string): AirportGroup | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.startsWith("GRP:")) {
    const slug = trimmed.slice(4);
    return AIRPORT_GROUPS.find((g) => g.slug === slug) ?? null;
  }
  return null;
}

/**
 * Distancia de Levenshtein con corte superior (`max`). Para inputs de usuario
 * en un autocomplete con cientos de items no queremos recalcular el array
 * completo en cada tecla — cortamos en cuanto sabemos que la distancia ya
 * superó el umbral tolerable. El 2 por defecto perdona typos de 1-2 chars
 * pero evita matches accidentales en strings muy distintas.
 */
export function fuzzyDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Normaliza un string para matching: lowercase + strip de diacríticos +
 * mapeo de ligaduras/caracteres no-NFD que aparecen en topónimos europeos.
 *
 * Ejemplo: "España" → "espana", "München" → "munchen".
 *
 * Unicode NFD separa la base del combining mark, y `[\u0300-\u036f]` matchea
 * el rango de marcas combinantes (acentos, cedillas, tildes). Pero algunos
 * glifos no se descomponen en NFD y hay que mapearlos a mano:
 *   ß (U+00DF eszett) → "ss"  ("Straße" → "strasse")
 *   ł/Ł (U+0142/U+0141)        → "l"     ("Łódź" → "lodz")
 *   œ/Œ (U+0153/U+0152)        → "oe"    ("Œuvre" → "oeuvre")
 *   æ/Æ (U+00E6/U+00C6)        → "ae"    ("Ærø" → "aero")
 *   ø/Ø (U+00F8/U+00D8)        → "o"     ("København" → "kobenhavn")
 *   đ/Đ (U+0111/U+0110)        → "d"     ("Split Đakovo" → "split dakovo")
 *
 * Este mapeo es clave para autocompletes de aeropuertos europeos, donde el
 * usuario puede escribir tanto la forma local ("Köln") como la transliterada
 * ("Koeln") o la internacional ("Cologne"), y esperamos que todas resuelvan
 * al mismo IATA.
 */
const LIGATURE_MAP: Record<string, string> = {
  ß: "ss",
  ł: "l",
  ø: "o",
  æ: "ae",
  œ: "oe",
  đ: "d",
};

export function normalizeInput(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ßłøæœđ]/g, (ch) => LIGATURE_MAP[ch] ?? ch);
}
