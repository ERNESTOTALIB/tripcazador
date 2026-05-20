/**
 * visa_requirements.ts — SSS367 (21 may 2026)
 *
 * Catálogo de requisitos visado para pasaporte español. Source data
 * verificada mayo 2026 de Schengen + ministerio exteriores. Update
 * cuando haya cambios significativos.
 *
 * Tipos:
 *   - none: no se necesita (Schengen + UK + many Latam + Japón etc)
 *   - eta: autorización electrónica online (USA ESTA, UK ETA, Canadá eTA, Japan eTA)
 *   - voa: visa on arrival (Indonesia, Turquía)
 *   - eVisa: e-visa online antes de viajar (India, Vietnam)
 *   - sticker: visado físico en embajada (China, Rusia, Cuba en muchos casos)
 *
 * Pasaporte ES = uno de los 5 más fuertes del mundo (164+ países sin visa).
 */

export type VisaType = "none" | "eta" | "voa" | "evisa" | "sticker";

export interface VisaRequirement {
  country_code: string; // ISO 3166-1 alpha-2
  country_name_es: string;
  visa_type: VisaType;
  max_stay_days?: number; // días máximos sin visa
  notes_es: string;
  applies_to_passport: "ES" | "all_eu";
  application_url?: string;
  cost_eur?: number;
  processing_days?: number;
  popular_destinations: string[]; // IATAs principales del país
}

export const VISA_REQUIREMENTS: VisaRequirement[] = [
  // Europa Schengen — none
  {
    country_code: "PT",
    country_name_es: "Portugal",
    visa_type: "none",
    notes_es: "Libre circulación Schengen. Solo DNI.",
    applies_to_passport: "all_eu",
    popular_destinations: ["LIS", "OPO"],
  },
  {
    country_code: "FR",
    country_name_es: "Francia",
    visa_type: "none",
    notes_es: "Libre circulación Schengen. Solo DNI.",
    applies_to_passport: "all_eu",
    popular_destinations: ["CDG", "ORY", "NCE"],
  },
  // USA — ESTA
  {
    country_code: "US",
    country_name_es: "Estados Unidos",
    visa_type: "eta",
    max_stay_days: 90,
    notes_es: "ESTA obligatorio. Aplicar al menos 72h antes del vuelo. Válido 2 años.",
    applies_to_passport: "ES",
    application_url: "https://esta.cbp.dhs.gov/",
    cost_eur: 21,
    processing_days: 2,
    popular_destinations: ["JFK", "LAX", "MIA", "ORD", "SFO"],
  },
  // UK — ETA
  {
    country_code: "GB",
    country_name_es: "Reino Unido",
    visa_type: "eta",
    max_stay_days: 180,
    notes_es: "ETA UK obligatorio desde abril 2025. Aplicar al menos 48h antes.",
    applies_to_passport: "ES",
    application_url: "https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta",
    cost_eur: 12,
    processing_days: 2,
    popular_destinations: ["LHR", "LGW", "EDI", "MAN"],
  },
  // Canadá — eTA
  {
    country_code: "CA",
    country_name_es: "Canadá",
    visa_type: "eta",
    max_stay_days: 180,
    notes_es: "eTA Canadá obligatorio. Aplicar 24h antes del vuelo. Válido 5 años.",
    applies_to_passport: "ES",
    application_url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html",
    cost_eur: 5,
    processing_days: 1,
    popular_destinations: ["YYZ", "YUL", "YVR"],
  },
  // Japón
  {
    country_code: "JP",
    country_name_es: "Japón",
    visa_type: "none",
    max_stay_days: 90,
    notes_es: "Sin visa para estancias <90 días con pasaporte español. eTA Japón opcional para fast-track.",
    applies_to_passport: "ES",
    popular_destinations: ["NRT", "HND", "KIX"],
  },
  // China — visa
  {
    country_code: "CN",
    country_name_es: "China",
    visa_type: "sticker",
    notes_es: "Visa turística L. Embajada Madrid/Barcelona. Vigencia 3 meses. Excepción: 144h transit sin visa en BJ/SH/CAN.",
    applies_to_passport: "ES",
    cost_eur: 99,
    processing_days: 5,
    popular_destinations: ["PEK", "PVG", "CAN"],
  },
  // India — e-Visa
  {
    country_code: "IN",
    country_name_es: "India",
    visa_type: "evisa",
    max_stay_days: 30,
    notes_es: "e-Visa online 100% digital. Apply 4 días antes mínimo.",
    applies_to_passport: "ES",
    application_url: "https://indianvisaonline.gov.in/evisa/",
    cost_eur: 25,
    processing_days: 4,
    popular_destinations: ["DEL", "BOM"],
  },
  // Vietnam — e-Visa
  {
    country_code: "VN",
    country_name_es: "Vietnam",
    visa_type: "evisa",
    max_stay_days: 90,
    notes_es: "e-Visa Vietnam multi-entry desde agosto 2023. 25-50€ según single/multi.",
    applies_to_passport: "ES",
    application_url: "https://evisa.xuatnhapcanh.gov.vn/",
    cost_eur: 25,
    processing_days: 3,
    popular_destinations: ["SGN", "HAN", "DAD"],
  },
  // Tailandia
  {
    country_code: "TH",
    country_name_es: "Tailandia",
    visa_type: "none",
    max_stay_days: 60,
    notes_es: "60 días sin visa para pasaporte ES desde julio 2024. Hasta 30 días previo.",
    applies_to_passport: "ES",
    popular_destinations: ["BKK", "HKT", "CNX"],
  },
  // Indonesia — VoA
  {
    country_code: "ID",
    country_name_es: "Indonesia",
    visa_type: "voa",
    max_stay_days: 30,
    notes_es: "Visa on arrival 30 días, renovable a 60. Bali, Yakarta, Surabaya tienen ventanilla.",
    applies_to_passport: "ES",
    cost_eur: 33,
    popular_destinations: ["DPS", "CGK"],
  },
  // Turquía
  {
    country_code: "TR",
    country_name_es: "Turquía",
    visa_type: "none",
    max_stay_days: 90,
    notes_es: "90 días sin visa para pasaporte ES desde 2023.",
    applies_to_passport: "ES",
    popular_destinations: ["IST", "SAW"],
  },
  // Marruecos
  {
    country_code: "MA",
    country_name_es: "Marruecos",
    visa_type: "none",
    max_stay_days: 90,
    notes_es: "90 días sin visa.",
    applies_to_passport: "ES",
    popular_destinations: ["RAK", "CMN", "FEZ"],
  },
  // Egipto
  {
    country_code: "EG",
    country_name_es: "Egipto",
    visa_type: "voa",
    max_stay_days: 30,
    notes_es: "Visa on arrival 30 días en aeropuertos principales. Alternativa: e-Visa online.",
    applies_to_passport: "ES",
    cost_eur: 25,
    application_url: "https://visa2egypt.gov.eg/",
    popular_destinations: ["CAI"],
  },
  // México
  {
    country_code: "MX",
    country_name_es: "México",
    visa_type: "none",
    max_stay_days: 180,
    notes_es: "Hasta 180 días sin visa.",
    applies_to_passport: "ES",
    popular_destinations: ["MEX", "CUN"],
  },
  // Argentina
  {
    country_code: "AR",
    country_name_es: "Argentina",
    visa_type: "none",
    max_stay_days: 90,
    notes_es: "90 días sin visa.",
    applies_to_passport: "ES",
    popular_destinations: ["EZE"],
  },
  // Brasil
  {
    country_code: "BR",
    country_name_es: "Brasil",
    visa_type: "none",
    max_stay_days: 90,
    notes_es: "90 días sin visa para pasaporte ES.",
    applies_to_passport: "ES",
    popular_destinations: ["GRU", "GIG"],
  },
  // Cuba — visado/tarjeta turística
  {
    country_code: "CU",
    country_name_es: "Cuba",
    visa_type: "sticker",
    max_stay_days: 90,
    notes_es: "Tarjeta turística obligatoria (no visa stick pero similar). Compra en aerolínea o embajada. ~25-50€.",
    applies_to_passport: "ES",
    cost_eur: 40,
    popular_destinations: ["HAV"],
  },
  // Australia — eVisitor
  {
    country_code: "AU",
    country_name_es: "Australia",
    visa_type: "eta",
    max_stay_days: 90,
    notes_es: "eVisitor (subclass 651) online gratis para pasaporte ES.",
    applies_to_passport: "ES",
    application_url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/evisitor-651",
    cost_eur: 0,
    processing_days: 1,
    popular_destinations: ["SYD", "MEL"],
  },
  // Emiratos
  {
    country_code: "AE",
    country_name_es: "Emiratos Árabes Unidos",
    visa_type: "none",
    max_stay_days: 90,
    notes_es: "90 días sin visa (extensible).",
    applies_to_passport: "ES",
    popular_destinations: ["DXB", "AUH"],
  },
];

export function findVisaForIata(iata: string): VisaRequirement | undefined {
  return VISA_REQUIREMENTS.find((v) => v.popular_destinations.includes(iata.toUpperCase()));
}

export function findVisaForCountry(countryCode: string): VisaRequirement | undefined {
  return VISA_REQUIREMENTS.find((v) => v.country_code === countryCode.toUpperCase());
}

export function getAllVisaCountries(): string[] {
  return VISA_REQUIREMENTS.map((v) => v.country_code.toLowerCase());
}
