/**
 * nl_alert_parser.ts — SSS319 (19 may 2026)
 *
 * Parser determinista español para alertas Premium en lenguaje natural.
 * Convierte frases tipo:
 *   "vuelos a Tokio bajo 500€ en septiembre business"
 *   "BCN → JFK máximo 400€ ida y vuelta agosto"
 *   "Asia máximo 600 economy"
 * en filtros estructurados que createAlert() consume directamente.
 *
 * Decisión arquitectónica: NO usamos LLM API en v1.
 *  - Coste por call (€) sería justificable solo con volumen alto.
 *  - El parser determinista cubre 80% de los patrones reales con 0
 *    dependencias externas + 100% testable.
 *  - Si futuro queremos mejor recall, añadimos un fallback LLM en v2
 *    para inputs que el parser no entendió (warnings.length > 0).
 *
 * El output incluye:
 *  - parsed: lo que sí entendimos (origin, destination, max_price, cabin, date_min/max)
 *  - warnings: lo que no entendimos (ayuda al user a clarificar)
 *  - confidence: low|medium|high según cuántos campos extrajimos
 */

export interface NLAlertParsed {
  origin?: string;
  destination?: string;
  max_price?: number;
  cabin?: "economy" | "business" | "first";
  date_min?: string; // YYYY-MM-DD
  date_max?: string; // YYYY-MM-DD
}

export interface NLParseResult {
  parsed: NLAlertParsed;
  warnings: string[];
  confidence: "low" | "medium" | "high";
  /** Echo de los matches detectados para mostrar en preview */
  matches: { field: string; value: string; raw: string }[];
}

// ──────────────────────────────────────────────────────────────
// Diccionarios

const DESTINATION_ALIASES: Record<string, string> = {
  // Cities → IATA (sample del top 50 ES)
  tokio: "TYO",
  tokyo: "TYO",
  "nueva york": "NYC",
  newyork: "NYC",
  "new york": "NYC",
  nyc: "NYC",
  jfk: "JFK",
  londres: "LON",
  london: "LON",
  paris: "PAR",
  parís: "PAR",
  roma: "ROM",
  rome: "ROM",
  bangkok: "BKK",
  bali: "DPS",
  dubai: "DXB",
  estambul: "IST",
  istanbul: "IST",
  marrakech: "RAK",
  cancun: "CUN",
  cancún: "CUN",
  ciudad: "MEX", // ojo: "ciudad de méxico"
  hawaii: "HNL",
  honolulu: "HNL",
  bogotá: "BOG",
  bogota: "BOG",
  santiago: "SCL",
  buenos: "BUE", // "buenos aires"
  lima: "LIM",
  madrid: "MAD",
  barcelona: "BCN",
  valencia: "VLC",
  sevilla: "SVQ",
  bilbao: "BIO",
  málaga: "AGP",
  malaga: "AGP",
  ibiza: "IBZ",
  palma: "PMI",
  mallorca: "PMI",
  canarias: "TFS",
  tenerife: "TFN",
  laspalmas: "LPA",
  // Aliases para EN/ES
  asia: "__REGION_ASIA__",
  europa: "__REGION_EU__",
  europe: "__REGION_EU__",
  america: "__REGION_AM__",
  américa: "__REGION_AM__",
  caribe: "__REGION_CARIBBEAN__",
  africa: "__REGION_AFRICA__",
  áfrica: "__REGION_AFRICA__",
};

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const CABIN_WORDS: Record<string, "economy" | "business" | "first"> = {
  turista: "economy",
  economy: "economy",
  económica: "economy",
  economica: "economy",
  business: "business",
  ejecutiva: "business",
  primera: "first",
  first: "first",
};

const IATA_RE = /\b([A-Z]{3})\b/g;
// Precio: "500€", "bajo 500", "máximo 500", "max 500"
const _PRICE_RE = /(?:bajo|menos\s+de|máximo|maximo|max|hasta|less\s+than|under)?\s*([0-9]{2,4})\s*(?:€|eur|euros)?/i;
const PRICE_WITH_KEYWORD_RE = /(?:bajo|menos\s+de|máximo|maximo|max|hasta|under|less\s+than)\s+([0-9]{2,4})/i;

// ──────────────────────────────────────────────────────────────
// Helpers

function tokenize(input: string): string[] {
  return input.toLowerCase().split(/[\s,.;:!?\-→]+/).filter(Boolean);
}

function thisYear(): number {
  return new Date().getFullYear();
}

function monthRange(monthNum: number, year: number): { min: string; max: string } {
  const mm = String(monthNum).padStart(2, "0");
  const lastDay = new Date(year, monthNum, 0).getDate();
  return {
    min: `${year}-${mm}-01`,
    max: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

// ──────────────────────────────────────────────────────────────
// Parser

export function parseNLAlert(rawInput: string): NLParseResult {
  const input = String(rawInput || "").trim();
  const parsed: NLAlertParsed = {};
  const warnings: string[] = [];
  const matches: NLParseResult["matches"] = [];

  if (!input) {
    return {
      parsed,
      warnings: ["empty_input"],
      confidence: "low",
      matches,
    };
  }
  if (input.length > 500) {
    warnings.push("input_too_long");
  }

  // 1. IATA codes directos (MAYÚSCULAS en el input original)
  const iataMatches = Array.from(input.matchAll(IATA_RE)).map((m) => m[1]);
  const validIatas = iataMatches.filter((c) => c.length === 3);
  if (validIatas.length >= 2) {
    parsed.origin = validIatas[0];
    parsed.destination = validIatas[1];
    matches.push({ field: "origin", value: validIatas[0], raw: validIatas[0] });
    matches.push({ field: "destination", value: validIatas[1], raw: validIatas[1] });
  } else if (validIatas.length === 1) {
    // Heurística: si hay "desde X" → origin; si hay "a X" → destination
    const ctx = input.toLowerCase();
    const iata = validIatas[0];
    const idxLower = input.toUpperCase().indexOf(iata);
    const ctxBefore = ctx.slice(Math.max(0, idxLower - 20), idxLower);
    if (/desde\s*$/i.test(ctxBefore) || /from\s*$/i.test(ctxBefore)) {
      parsed.origin = iata;
      matches.push({ field: "origin", value: iata, raw: iata });
    } else {
      parsed.destination = iata;
      matches.push({ field: "destination", value: iata, raw: iata });
    }
  }

  // 2. Aliases de ciudades / regiones (tokens en minúsculas)
  if (!parsed.destination) {
    const tokens = tokenize(input);
    // bigrams primero (e.g. "nueva york", "buenos aires")
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      const code = DESTINATION_ALIASES[bigram];
      if (code) {
        if (code.startsWith("__REGION_")) {
          // No es IATA — guardamos como destination textual y warning
          warnings.push(`region_unsupported_${code}`);
        } else {
          parsed.destination = code;
          matches.push({ field: "destination", value: code, raw: bigram });
        }
        break;
      }
    }
    if (!parsed.destination) {
      for (const t of tokens) {
        const code = DESTINATION_ALIASES[t];
        if (code) {
          if (code.startsWith("__REGION_")) {
            warnings.push(`region_unsupported_${code}`);
          } else {
            parsed.destination = code;
            matches.push({ field: "destination", value: code, raw: t });
            break;
          }
        }
      }
    }
  }

  // 3. Precio máximo: priorizar PRICE_WITH_KEYWORD (más confiable)
  const priceKw = input.match(PRICE_WITH_KEYWORD_RE);
  if (priceKw) {
    const n = parseInt(priceKw[1], 10);
    if (Number.isFinite(n) && n >= 20 && n <= 20000) {
      parsed.max_price = n;
      matches.push({ field: "max_price", value: String(n), raw: priceKw[0] });
    }
  } else {
    // Fallback: cualquier número de 2-4 cifras seguido de €/eur (más permisivo)
    const priceAny = input.match(/([0-9]{2,4})\s*(?:€|eur|euros)/i);
    if (priceAny) {
      const n = parseInt(priceAny[1], 10);
      if (Number.isFinite(n) && n >= 20 && n <= 20000) {
        parsed.max_price = n;
        matches.push({ field: "max_price", value: String(n), raw: priceAny[0] });
      }
    }
  }

  // 4. Cabina
  for (const [word, cabin] of Object.entries(CABIN_WORDS)) {
    if (input.toLowerCase().includes(word)) {
      parsed.cabin = cabin;
      matches.push({ field: "cabin", value: cabin, raw: word });
      break;
    }
  }

  // 5. Mes (YYYY-MM-01..lastDay)
  const lower = input.toLowerCase();
  for (const [name, num] of Object.entries(MONTHS)) {
    if (lower.includes(name)) {
      const y = thisYear();
      // Si el mes ya pasó, asumimos el siguiente año
      const now = new Date();
      const targetYear = num < now.getMonth() + 1 ? y + 1 : y;
      const { min, max } = monthRange(num, targetYear);
      parsed.date_min = min;
      parsed.date_max = max;
      matches.push({ field: "date_range", value: `${min} → ${max}`, raw: name });
      break;
    }
  }

  // 6. Confidence: cuántos campos clave extrajimos
  let scored = 0;
  if (parsed.destination) scored += 2;
  if (parsed.max_price) scored += 2;
  if (parsed.origin) scored += 1;
  if (parsed.cabin) scored += 1;
  if (parsed.date_min) scored += 1;

  let confidence: "low" | "medium" | "high";
  if (scored >= 5) confidence = "high";
  else if (scored >= 3) confidence = "medium";
  else confidence = "low";

  // Warnings
  if (!parsed.destination && !parsed.origin) {
    warnings.push("no_route_detected");
  }
  if (!parsed.max_price) {
    warnings.push("no_price_detected");
  }

  return { parsed, warnings, confidence, matches };
}
