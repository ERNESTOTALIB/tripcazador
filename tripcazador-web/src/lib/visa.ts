/**
 * visa.ts — A6 (May 2026)
 *
 * Requisitos de visado para titulares de pasaporte español a 60+ destinos top.
 * Datos curados de fuentes oficiales (IATA Travel Centre, ministerios) últimos
 * 2026. NO es asesoramiento legal — siempre verificar embajada antes de viajar.
 */

export type VisaRequirement = {
  country: string;
  country_code: string;
  status: "exempt" | "evisa" | "voa" | "visa_required" | "etias";
  duration_days?: number;
  cost_eur?: number;
  apply_url?: string;
  notes?: string;
  passport_validity_months?: number;
};

export const VISA_FROM_ES: VisaRequirement[] = [
  // Schengen — sin visa
  { country: "Francia", country_code: "FR", status: "exempt", notes: "UE/Schengen. DNI suficiente." },
  { country: "Alemania", country_code: "DE", status: "exempt", notes: "UE/Schengen. DNI suficiente." },
  { country: "Italia", country_code: "IT", status: "exempt", notes: "UE/Schengen. DNI suficiente." },
  { country: "Portugal", country_code: "PT", status: "exempt", notes: "UE/Schengen. DNI suficiente." },
  { country: "Países Bajos", country_code: "NL", status: "exempt", notes: "UE/Schengen. DNI suficiente." },
  { country: "Grecia", country_code: "GR", status: "exempt", notes: "UE/Schengen. DNI suficiente." },
  { country: "Croacia", country_code: "HR", status: "exempt", notes: "UE/Schengen desde 2023." },
  { country: "Suiza", country_code: "CH", status: "exempt", notes: "Schengen. DNI suficiente." },
  { country: "Noruega", country_code: "NO", status: "exempt", notes: "Schengen. DNI suficiente." },
  { country: "Islandia", country_code: "IS", status: "exempt", notes: "Schengen. DNI suficiente." },

  // ETIAS pendiente para no-Schengen pero europeos
  { country: "Reino Unido", country_code: "GB", status: "exempt", duration_days: 180, passport_validity_months: 0, notes: "Pasaporte obligatorio (no DNI desde Brexit). ETA UK obligatoria desde 2025: 10£/2 años." },
  { country: "Irlanda", country_code: "IE", status: "exempt", duration_days: 90, notes: "Pasaporte o DNI." },

  // Visa exempt corto plazo (90 días típicamente)
  { country: "Estados Unidos", country_code: "US", status: "etias", duration_days: 90, cost_eur: 21, apply_url: "https://esta.cbp.dhs.gov/", passport_validity_months: 6, notes: "ESTA obligatoria — solicitar 72h antes. Válida 2 años." },
  { country: "Canadá", country_code: "CA", status: "etias", duration_days: 180, cost_eur: 5, apply_url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html", passport_validity_months: 6, notes: "eTA obligatoria — 7CAD, solicitar online minutos antes." },
  { country: "México", country_code: "MX", status: "exempt", duration_days: 180, passport_validity_months: 6, notes: "Recibirás FMM (Forma Migratoria Múltiple) al llegar. Sin coste." },
  { country: "Argentina", country_code: "AR", status: "exempt", duration_days: 90 },
  { country: "Brasil", country_code: "BR", status: "exempt", duration_days: 90 },
  { country: "Chile", country_code: "CL", status: "exempt", duration_days: 90 },
  { country: "Colombia", country_code: "CO", status: "exempt", duration_days: 180 },
  { country: "Perú", country_code: "PE", status: "exempt", duration_days: 183 },
  { country: "Uruguay", country_code: "UY", status: "exempt", duration_days: 90 },
  { country: "Costa Rica", country_code: "CR", status: "exempt", duration_days: 90 },
  { country: "Panamá", country_code: "PA", status: "exempt", duration_days: 180 },
  { country: "Ecuador", country_code: "EC", status: "exempt", duration_days: 90 },
  { country: "Guatemala", country_code: "GT", status: "exempt", duration_days: 90 },

  // Asia
  { country: "Japón", country_code: "JP", status: "exempt", duration_days: 90, passport_validity_months: 0, notes: "Sin visa. Sello al llegar." },
  { country: "Corea del Sur", country_code: "KR", status: "etias", duration_days: 90, cost_eur: 7, apply_url: "https://www.k-eta.go.kr/", notes: "K-ETA obligatoria desde 2021 — 10000 KRW." },
  { country: "Singapur", country_code: "SG", status: "exempt", duration_days: 90 },
  { country: "Hong Kong", country_code: "HK", status: "exempt", duration_days: 90 },
  { country: "Taiwán", country_code: "TW", status: "exempt", duration_days: 90 },
  { country: "Tailandia", country_code: "TH", status: "exempt", duration_days: 30, notes: "Visa-free 30 días por aire." },
  { country: "Malasia", country_code: "MY", status: "exempt", duration_days: 90 },
  { country: "Indonesia (Bali)", country_code: "ID", status: "voa", duration_days: 30, cost_eur: 32, apply_url: "https://molina.imigrasi.go.id/", notes: "VoA 500K IDR pagable en aeropuerto o e-VoA online previa." },
  { country: "Filipinas", country_code: "PH", status: "exempt", duration_days: 30 },
  { country: "Vietnam", country_code: "VN", status: "evisa", duration_days: 90, cost_eur: 23, apply_url: "https://evisa.xuatnhapcanh.gov.vn/", notes: "e-Visa online 25USD, 3 días hábiles." },
  { country: "Camboya", country_code: "KH", status: "evisa", duration_days: 30, cost_eur: 33, apply_url: "https://www.evisa.gov.kh/", notes: "e-Visa 36USD." },
  { country: "Laos", country_code: "LA", status: "voa", duration_days: 30, cost_eur: 35, notes: "VoA en frontera." },
  { country: "Sri Lanka", country_code: "LK", status: "evisa", duration_days: 30, cost_eur: 35, apply_url: "https://www.eta.gov.lk/" },
  { country: "Maldivas", country_code: "MV", status: "voa", duration_days: 30, cost_eur: 0, notes: "Visa gratis al llegar." },
  { country: "India", country_code: "IN", status: "evisa", duration_days: 60, cost_eur: 24, apply_url: "https://indianvisaonline.gov.in/", notes: "e-Visa 25USD, 4 días hábiles. Pasaporte 2 páginas en blanco." },
  { country: "China", country_code: "CN", status: "exempt", duration_days: 30, notes: "Visa-free 30 días desde 2025 para España (negocio/turismo). Antes era visa obligatoria." },
  { country: "Nepal", country_code: "NP", status: "voa", duration_days: 90, cost_eur: 113, notes: "VoA 125USD para 90 días." },

  // Oriente Medio
  { country: "Emiratos Árabes (Dubái)", country_code: "AE", status: "exempt", duration_days: 90, notes: "Visa-free 90 días." },
  { country: "Turquía", country_code: "TR", status: "exempt", duration_days: 90, notes: "Visa-free desde 2020." },
  { country: "Israel", country_code: "IL", status: "exempt", duration_days: 90 },
  { country: "Qatar", country_code: "QA", status: "exempt", duration_days: 90 },
  { country: "Jordania", country_code: "JO", status: "voa", duration_days: 30, cost_eur: 56, apply_url: "https://jordanpass.jo/", notes: "Jordan Pass desde 70JOD incluye visa + 40 atracciones." },
  { country: "Egipto", country_code: "EG", status: "voa", duration_days: 30, cost_eur: 23, apply_url: "https://visa2egypt.gov.eg/", notes: "VoA o e-Visa 25USD." },
  { country: "Arabia Saudí", country_code: "SA", status: "evisa", duration_days: 90, cost_eur: 110, apply_url: "https://visa.visitsaudi.com/" },

  // África
  { country: "Marruecos", country_code: "MA", status: "exempt", duration_days: 90 },
  { country: "Túnez", country_code: "TN", status: "exempt", duration_days: 90 },
  { country: "Sudáfrica", country_code: "ZA", status: "exempt", duration_days: 90 },
  { country: "Kenia", country_code: "KE", status: "evisa", duration_days: 90, cost_eur: 29, apply_url: "https://etakenya.go.ke/", notes: "eTA obligatoria desde 2024." },
  { country: "Tanzania", country_code: "TZ", status: "voa", duration_days: 90, cost_eur: 47 },
  { country: "Botsuana", country_code: "BW", status: "exempt", duration_days: 90 },
  { country: "Namibia", country_code: "NA", status: "exempt", duration_days: 90 },

  // Oceanía
  { country: "Australia", country_code: "AU", status: "etias", duration_days: 90, cost_eur: 13, apply_url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601", notes: "ETA 20AUD, online 1 día." },
  { country: "Nueva Zelanda", country_code: "NZ", status: "etias", duration_days: 90, cost_eur: 12, apply_url: "https://nzeta.immigration.govt.nz/", notes: "NZeTA 17NZD + 35NZD IVL." },

  // Caribe
  { country: "Cuba", country_code: "CU", status: "voa", duration_days: 90, cost_eur: 22, notes: "Tarjeta de turista en aeropuerto/aerolínea ~22€." },
  { country: "República Dominicana", country_code: "DO", status: "exempt", duration_days: 30, cost_eur: 9, notes: "Tarjeta turista 10USD incluida en vuelo desde 2018." },
  { country: "Jamaica", country_code: "JM", status: "exempt", duration_days: 90 },
  { country: "Bahamas", country_code: "BS", status: "exempt", duration_days: 90 },
];

export function getVisaForCountry(countryCode: string): VisaRequirement | undefined {
  return VISA_FROM_ES.find((v) => v.country_code === countryCode.toUpperCase());
}
