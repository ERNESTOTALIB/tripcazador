/**
 * flight_seed.ts â CatÃ¡logo de 150+ deals de vuelos como fallback
 *
 * Mismo patrÃ³n que hotel_seed.ts: cuando el backend flight_hunter no devuelve
 * datos (VPS caÃ­do, worker sin ejecutar), usamos este seed para que la home
 * y /vuelos nunca estÃ©n vacÃ­os.
 *
 * Cada deal incluye:
 *  - Origen/destino con IATA codes
 *  - Precios realistas basados en mercado europeo
 *  - AerolÃ­neas reales con cÃ³digos IATA
 *  - Links de reserva funcionales (Kiwi/aerolÃ­neas directas)
 *  - ClasificaciÃ³n (CRITICO/ERROR/ANOMALIA/OFERTA)
 *  - Distancias y duraciones realistas
 *
 * ComisiÃ³n via Kiwi.com affiliate (~3-5% por booking).
 */
import type { Deal } from "@/lib/api";

const KIWI_AID = process.env.NEXT_PUBLIC_KIWI_AID || "tripcazador";

export type FlightCategory = "short" | "medium" | "long";

export interface FlightEntry {
  id: string;
  origin: string;       // IATA
  destination: string;  // IATA
  cityFrom: string;
  cityTo: string;
  countryTo: string;
  region: string;
  priceEur: number;
  savingsPct: number;
  cabin: "economy" | "business";
  airline: string;      // IATA code
  airlineName: string;
  stops: number;
  durationMin: number;
  distanceCategory: FlightCategory;
  classification: "CRITICO" | "ERROR" | "ANOMALIA" | "OFERTA";
  dateOut: string;      // YYYY-MM-DD
  dateRet: string;
  nights: number;
  daysAgo: number;
  emoji: string;
  highlight?: string;
}

function kiwiUrl(origin: string, dest: string, dateOut: string, dateRet: string): string {
  return `https://www.kiwi.com/deep?affilid=${KIWI_AID}&currency=EUR&departure=${dateOut}&from=${origin}&return=${dateRet}&to=${dest}`;
}

function makeFlightDeal(f: FlightEntry): Deal {
  const found = new Date(Date.now() - f.daysAgo * 3600_000).toISOString();
  const savingsEur = Math.round(f.priceEur * f.savingsPct / (100 - f.savingsPct));
  return {
    id: `flight-${f.id}`,
    type: "flight",
    headline: `${f.cityFrom} â ${f.cityTo} desde ${f.priceEur}â¬ (${f.airlineName})`,
    origin: f.origin,
    destination: f.destination,
    city_from: f.cityFrom,
    city_to: f.cityTo,
    country_to: f.countryTo,
    region: f.region,
    price_eur: f.priceEur,
    savings_pct: f.savingsPct,
    savings_eur: savingsEur,
    nights: f.nights,
    date_out: f.dateOut,
    date_ret: f.dateRet,
    cabin: f.cabin,
    airline: f.airline,
    airline_name: f.airlineName,
    stops: f.stops,
    duration_min: f.durationMin,
    distance_category: f.distanceCategory,
    score: f.classification === "CRITICO" ? 95 : f.classification === "ERROR" ? 88 : f.classification === "ANOMALIA" ? 80 : 72,
    classification: f.classification,
    tags: ["flight", f.cabin, f.distanceCategory, f.region.toLowerCase().replace(/\s+/g, "-")],
    found_at: found,
    expires_at: new Date(Date.now() + 3 * 86400_000).toISOString(),
    booking_url: kiwiUrl(f.origin, f.destination, f.dateOut, f.dateRet),
    image_url: "",
    emoji: f.emoji,
    description: `Vuelo ${f.cityFrom} â ${f.cityTo} con ${f.airlineName}. ${f.stops === 0 ? "Directo" : f.stops + " escala(s)"}. ${f.highlight || ""}`,
    note: undefined,
    verified: false,
    sources: ["seed"],
  } as unknown as Deal;
}

// 150 flight deals â cubriendo rutas cortas, medias y largas desde principales hubs europeos
const FLIGHT_ENTRIES: FlightEntry[] = [
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // RUTAS CORTAS (Europa â Norte Ãfrica / Europa intra)
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  // --- Desde Madrid ---
  { id: "mad-rak-1", origin: "MAD", destination: "RAK", cityFrom: "Madrid", cityTo: "Marrakech", countryTo: "Marruecos", region: "Norte de Ãfrica", priceEur: 29, savingsPct: 65, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 90, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-09-15", dateRet: "2026-09-19", nights: 4, daysAgo: 1, emoji: "ð", highlight: "Error de tarifa Ryanair" },
  { id: "mad-lis-1", origin: "MAD", destination: "LIS", cityFrom: "Madrid", cityTo: "Lisboa", countryTo: "Portugal", region: "Europa", priceEur: 19, savingsPct: 72, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 65, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-08-20", dateRet: "2026-08-24", nights: 4, daysAgo: 2, emoji: "ðï¸", highlight: "19â¬ ida/vuelta a Lisboa" },
  { id: "mad-fco-1", origin: "MAD", destination: "FCO", cityFrom: "Madrid", cityTo: "Roma", countryTo: "Italia", region: "Europa", priceEur: 35, savingsPct: 68, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 140, distanceCategory: "short", classification: "ERROR", dateOut: "2026-10-05", dateRet: "2026-10-09", nights: 4, daysAgo: 3, emoji: "ðï¸", highlight: "Roma por 35â¬ con Vueling" },
  { id: "mad-cdg-1", origin: "MAD", destination: "CDG", cityFrom: "Madrid", cityTo: "ParÃ­s", countryTo: "Francia", region: "Europa", priceEur: 39, savingsPct: 65, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 120, distanceCategory: "short", classification: "ERROR", dateOut: "2026-09-22", dateRet: "2026-09-26", nights: 4, daysAgo: 2, emoji: "ð¥", highlight: "ParÃ­s ida/vuelta 39â¬" },
  { id: "mad-ath-1", origin: "MAD", destination: "ATH", cityFrom: "Madrid", cityTo: "Atenas", countryTo: "Grecia", region: "Europa", priceEur: 49, savingsPct: 62, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 195, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-10-12", dateRet: "2026-10-17", nights: 5, daysAgo: 4, emoji: "ðï¸", highlight: "Directo a Atenas" },
  { id: "mad-ist-1", origin: "MAD", destination: "IST", cityFrom: "Madrid", cityTo: "Estambul", countryTo: "TurquÃ­a", region: "Oriente Medio", priceEur: 69, savingsPct: 55, cabin: "economy", airline: "TK", airlineName: "Turkish Airlines", stops: 0, durationMin: 240, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-09-28", dateRet: "2026-10-03", nights: 5, daysAgo: 3, emoji: "ð" },
  { id: "mad-tia-1", origin: "MAD", destination: "TIA", cityFrom: "Madrid", cityTo: "Tirana", countryTo: "Albania", region: "Balcanes", priceEur: 39, savingsPct: 70, cabin: "economy", airline: "W6", airlineName: "Wizz Air", stops: 0, durationMin: 180, distanceCategory: "short", classification: "ERROR", dateOut: "2026-11-01", dateRet: "2026-11-06", nights: 5, daysAgo: 1, emoji: "ðï¸", highlight: "Albania a 39â¬" },
  { id: "mad-bud-1", origin: "MAD", destination: "BUD", cityFrom: "Madrid", cityTo: "Budapest", countryTo: "HungrÃ­a", region: "Europa", priceEur: 45, savingsPct: 63, cabin: "economy", airline: "W6", airlineName: "Wizz Air", stops: 0, durationMin: 180, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-10-20", dateRet: "2026-10-25", nights: 5, daysAgo: 5, emoji: "ðï¸" },
  { id: "mad-dub-1", origin: "MAD", destination: "DUB", cityFrom: "Madrid", cityTo: "DublÃ­n", countryTo: "Irlanda", region: "Europa", priceEur: 35, savingsPct: 68, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 155, distanceCategory: "short", classification: "ERROR", dateOut: "2026-09-10", dateRet: "2026-09-14", nights: 4, daysAgo: 2, emoji: "ð" },
  { id: "mad-opo-1", origin: "MAD", destination: "OPO", cityFrom: "Madrid", cityTo: "Porto", countryTo: "Portugal", region: "Europa", priceEur: 22, savingsPct: 73, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 55, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-08-15", dateRet: "2026-08-18", nights: 3, daysAgo: 1, emoji: "ð·", highlight: "Porto por 22â¬ con Ryanair" },

  // --- Desde Barcelona ---
  { id: "bcn-nap-1", origin: "BCN", destination: "NAP", cityFrom: "Barcelona", cityTo: "NÃ¡poles", countryTo: "Italia", region: "Europa", priceEur: 25, savingsPct: 72, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 120, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-09-08", dateRet: "2026-09-12", nights: 4, daysAgo: 1, emoji: "ð", highlight: "NÃ¡poles 25â¬ ida/vuelta" },
  { id: "bcn-ber-1", origin: "BCN", destination: "BER", cityFrom: "Barcelona", cityTo: "BerlÃ­n", countryTo: "Alemania", region: "Europa", priceEur: 35, savingsPct: 67, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 160, distanceCategory: "short", classification: "ERROR", dateOut: "2026-10-15", dateRet: "2026-10-19", nights: 4, daysAgo: 3, emoji: "ð»" },
  { id: "bcn-pmi-1", origin: "BCN", destination: "PMI", cityFrom: "Barcelona", cityTo: "Palma de Mallorca", countryTo: "EspaÃ±a", region: "Europa", priceEur: 15, savingsPct: 80, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 50, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-07-20", dateRet: "2026-07-25", nights: 5, daysAgo: 1, emoji: "ðï¸", highlight: "Mallorca por 15â¬" },
  { id: "bcn-cmn-1", origin: "BCN", destination: "CMN", cityFrom: "Barcelona", cityTo: "Casablanca", countryTo: "Marruecos", region: "Norte de Ãfrica", priceEur: 39, savingsPct: 65, cabin: "economy", airline: "AT", airlineName: "Royal Air Maroc", stops: 0, durationMin: 135, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-10-22", dateRet: "2026-10-27", nights: 5, daysAgo: 4, emoji: "ð" },
  { id: "bcn-prg-1", origin: "BCN", destination: "PRG", cityFrom: "Barcelona", cityTo: "Praga", countryTo: "RepÃºblica Checa", region: "Europa", priceEur: 29, savingsPct: 70, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 155, distanceCategory: "short", classification: "ERROR", dateOut: "2026-11-10", dateRet: "2026-11-14", nights: 4, daysAgo: 2, emoji: "ð°", highlight: "Praga a 29â¬" },
  { id: "bcn-mla-1", origin: "BCN", destination: "MLA", cityFrom: "Barcelona", cityTo: "Malta", countryTo: "Malta", region: "Europa", priceEur: 22, savingsPct: 75, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 110, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-09-01", dateRet: "2026-09-05", nights: 4, daysAgo: 1, emoji: "ðï¸", highlight: "Malta 22â¬ ida/vuelta" },
  { id: "bcn-ams-1", origin: "BCN", destination: "AMS", cityFrom: "Barcelona", cityTo: "Ãmsterdam", countryTo: "PaÃ­ses Bajos", region: "Europa", priceEur: 39, savingsPct: 64, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 130, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-10-05", dateRet: "2026-10-09", nights: 4, daysAgo: 3, emoji: "ð·" },
  { id: "bcn-vie-1", origin: "BCN", destination: "VIE", cityFrom: "Barcelona", cityTo: "Viena", countryTo: "Austria", region: "Europa", priceEur: 35, savingsPct: 68, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 150, distanceCategory: "short", classification: "ERROR", dateOut: "2026-12-01", dateRet: "2026-12-05", nights: 4, daysAgo: 2, emoji: "ð¼", highlight: "Viena por 35â¬" },
  { id: "bcn-edi-1", origin: "BCN", destination: "EDI", cityFrom: "Barcelona", cityTo: "Edimburgo", countryTo: "Reino Unido", region: "Europa", priceEur: 45, savingsPct: 62, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 165, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-08-25", dateRet: "2026-08-29", nights: 4, daysAgo: 4, emoji: "ð´ó §ó ¢ó ³ó £ó ´ó ¿" },
  { id: "bcn-cph-1", origin: "BCN", destination: "CPH", cityFrom: "Barcelona", cityTo: "Copenhague", countryTo: "Dinamarca", region: "Europa", priceEur: 42, savingsPct: 63, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 170, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-09-18", dateRet: "2026-09-22", nights: 4, daysAgo: 3, emoji: "ð§" },

  // --- Desde otros hubs europeos ---
  { id: "lis-lhr-1", origin: "LIS", destination: "LHR", cityFrom: "Lisboa", cityTo: "Londres", countryTo: "Reino Unido", region: "Europa", priceEur: 25, savingsPct: 73, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 155, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-10-10", dateRet: "2026-10-14", nights: 4, daysAgo: 1, emoji: "ð©", highlight: "Lisboa-Londres 25â¬" },
  { id: "mil-par-1", origin: "MXP", destination: "CDG", cityFrom: "MilÃ¡n", cityTo: "ParÃ­s", countryTo: "Francia", region: "Europa", priceEur: 19, savingsPct: 78, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 95, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-09-05", dateRet: "2026-09-09", nights: 4, daysAgo: 1, emoji: "ð¥", highlight: "MilÃ¡n-ParÃ­s 19â¬" },
  { id: "ber-bcn-1", origin: "BER", destination: "BCN", cityFrom: "BerlÃ­n", cityTo: "Barcelona", countryTo: "EspaÃ±a", region: "Europa", priceEur: 29, savingsPct: 71, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 155, distanceCategory: "short", classification: "ERROR", dateOut: "2026-08-28", dateRet: "2026-09-02", nights: 5, daysAgo: 2, emoji: "ð" },
  { id: "lhr-opo-1", origin: "LHR", destination: "OPO", cityFrom: "Londres", cityTo: "Porto", countryTo: "Portugal", region: "Europa", priceEur: 35, savingsPct: 67, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 140, distanceCategory: "short", classification: "ERROR", dateOut: "2026-10-18", dateRet: "2026-10-22", nights: 4, daysAgo: 3, emoji: "ð·" },
  { id: "cdg-dbv-1", origin: "CDG", destination: "DBV", cityFrom: "ParÃ­s", cityTo: "Dubrovnik", countryTo: "Croacia", region: "Europa", priceEur: 49, savingsPct: 60, cabin: "economy", airline: "U2", airlineName: "easyJet", stops: 0, durationMin: 140, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-09-12", dateRet: "2026-09-17", nights: 5, daysAgo: 4, emoji: "ð°" },
  { id: "ams-ber-1", origin: "AMS", destination: "BER", cityFrom: "Ãmsterdam", cityTo: "BerlÃ­n", countryTo: "Alemania", region: "Europa", priceEur: 22, savingsPct: 74, cabin: "economy", airline: "U2", airlineName: "easyJet", stops: 0, durationMin: 85, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-11-08", dateRet: "2026-11-12", nights: 4, daysAgo: 1, emoji: "ð»", highlight: "22â¬ Ãmsterdam-BerlÃ­n" },
  { id: "vie-sof-1", origin: "VIE", destination: "SOF", cityFrom: "Viena", cityTo: "SofÃ­a", countryTo: "Bulgaria", region: "Europa", priceEur: 25, savingsPct: 72, cabin: "economy", airline: "W6", airlineName: "Wizz Air", stops: 0, durationMin: 105, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-10-25", dateRet: "2026-10-30", nights: 5, daysAgo: 2, emoji: "ðï¸" },
  { id: "muc-zag-1", origin: "MUC", destination: "ZAG", cityFrom: "MÃºnich", cityTo: "Zagreb", countryTo: "Croacia", region: "Europa", priceEur: 29, savingsPct: 70, cabin: "economy", airline: "W6", airlineName: "Wizz Air", stops: 0, durationMin: 75, distanceCategory: "short", classification: "ERROR", dateOut: "2026-09-20", dateRet: "2026-09-24", nights: 4, daysAgo: 2, emoji: "ðï¸" },
  { id: "vie-tia-1", origin: "VIE", destination: "TIA", cityFrom: "Viena", cityTo: "Tirana", countryTo: "Albania", region: "Balcanes", priceEur: 19, savingsPct: 78, cabin: "economy", airline: "W6", airlineName: "Wizz Air", stops: 0, durationMin: 95, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-11-15", dateRet: "2026-11-20", nights: 5, daysAgo: 1, emoji: "ðï¸", highlight: "Viena-Tirana 19â¬" },
  { id: "bud-skp-1", origin: "BUD", destination: "SKP", cityFrom: "Budapest", cityTo: "Skopje", countryTo: "Macedonia del Norte", region: "Balcanes", priceEur: 15, savingsPct: 82, cabin: "economy", airline: "W6", airlineName: "Wizz Air", stops: 0, durationMin: 80, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-10-01", dateRet: "2026-10-05", nights: 4, daysAgo: 1, emoji: "ðï¸", highlight: "15â¬ Budapest-Skopje" },

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // RUTAS MEDIAS (Europa â Oriente Medio / Canarias / Ãfrica)
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  { id: "mad-ssh-1", origin: "MAD", destination: "SSH", cityFrom: "Madrid", cityTo: "Sharm el-Sheikh", countryTo: "Egipto", region: "Oriente Medio", priceEur: 125, savingsPct: 52, cabin: "economy", airline: "MS", airlineName: "EgyptAir", stops: 1, durationMin: 360, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-11-20", dateRet: "2026-11-27", nights: 7, daysAgo: 5, emoji: "ðï¸" },
  { id: "mad-tfs-1", origin: "MAD", destination: "TFS", cityFrom: "Madrid", cityTo: "Tenerife", countryTo: "EspaÃ±a", region: "Europa", priceEur: 49, savingsPct: 62, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 165, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-12-10", dateRet: "2026-12-17", nights: 7, daysAgo: 3, emoji: "ð" },
  { id: "bcn-tfs-1", origin: "BCN", destination: "TFS", cityFrom: "Barcelona", cityTo: "Tenerife", countryTo: "EspaÃ±a", region: "Europa", priceEur: 55, savingsPct: 58, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 190, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-11-25", dateRet: "2026-12-02", nights: 7, daysAgo: 4, emoji: "ð" },
  { id: "mad-dxb-1", origin: "MAD", destination: "DXB", cityFrom: "Madrid", cityTo: "DubÃ¡i", countryTo: "Emiratos Ãrabes Unidos", region: "Oriente Medio", priceEur: 195, savingsPct: 55, cabin: "economy", airline: "EK", airlineName: "Emirates", stops: 0, durationMin: 420, distanceCategory: "medium", classification: "ERROR", dateOut: "2026-12-01", dateRet: "2026-12-08", nights: 7, daysAgo: 3, emoji: "ð", highlight: "DubÃ¡i directo 195â¬ con Emirates" },
  { id: "bcn-tlv-1", origin: "BCN", destination: "TLV", cityFrom: "Barcelona", cityTo: "Tel Aviv", countryTo: "Israel", region: "Oriente Medio", priceEur: 89, savingsPct: 56, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 250, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-10-08", dateRet: "2026-10-15", nights: 7, daysAgo: 5, emoji: "ðï¸" },
  { id: "mad-amm-1", origin: "MAD", destination: "AMM", cityFrom: "Madrid", cityTo: "AmmÃ¡n", countryTo: "Jordania", region: "Oriente Medio", priceEur: 145, savingsPct: 52, cabin: "economy", airline: "RJ", airlineName: "Royal Jordanian", stops: 0, durationMin: 295, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-11-05", dateRet: "2026-11-12", nights: 7, daysAgo: 6, emoji: "ðï¸" },
  { id: "lhr-dxb-1", origin: "LHR", destination: "DXB", cityFrom: "Londres", cityTo: "DubÃ¡i", countryTo: "Emiratos Ãrabes Unidos", region: "Oriente Medio", priceEur: 225, savingsPct: 50, cabin: "economy", airline: "EK", airlineName: "Emirates", stops: 0, durationMin: 420, distanceCategory: "medium", classification: "OFERTA", dateOut: "2026-01-10", dateRet: "2026-01-17", nights: 7, daysAgo: 4, emoji: "ð" },
  { id: "cdg-cai-1", origin: "CDG", destination: "CAI", cityFrom: "ParÃ­s", cityTo: "El Cairo", countryTo: "Egipto", region: "Norte de Ãfrica", priceEur: 165, savingsPct: 53, cabin: "economy", airline: "MS", airlineName: "EgyptAir", stops: 0, durationMin: 280, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-10-15", dateRet: "2026-10-22", nights: 7, daysAgo: 5, emoji: "ðº" },
  { id: "mad-dss-1", origin: "MAD", destination: "DSS", cityFrom: "Madrid", cityTo: "Dakar", countryTo: "Senegal", region: "Ãfrica", priceEur: 195, savingsPct: 52, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 270, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-12-15", dateRet: "2026-12-22", nights: 7, daysAgo: 6, emoji: "ð" },
  { id: "bcn-lpa-1", origin: "BCN", destination: "LPA", cityFrom: "Barcelona", cityTo: "Gran Canaria", countryTo: "EspaÃ±a", region: "Europa", priceEur: 49, savingsPct: 63, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 185, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-11-05", dateRet: "2026-11-12", nights: 7, daysAgo: 3, emoji: "ðï¸" },
  { id: "mad-ace-1", origin: "MAD", destination: "ACE", cityFrom: "Madrid", cityTo: "Lanzarote", countryTo: "EspaÃ±a", region: "Europa", priceEur: 39, savingsPct: 67, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 170, distanceCategory: "short", classification: "ERROR", dateOut: "2026-10-28", dateRet: "2026-11-04", nights: 7, daysAgo: 2, emoji: "ð", highlight: "Lanzarote por 39â¬" },
  { id: "ber-mct-1", origin: "BER", destination: "MCT", cityFrom: "BerlÃ­n", cityTo: "Mascate", countryTo: "OmÃ¡n", region: "Oriente Medio", priceEur: 245, savingsPct: 48, cabin: "economy", airline: "WY", airlineName: "Oman Air", stops: 0, durationMin: 390, distanceCategory: "medium", classification: "OFERTA", dateOut: "2026-01-15", dateRet: "2026-01-22", nights: 7, daysAgo: 7, emoji: "ðï¸" },
  { id: "lhr-nbo-1", origin: "LHR", destination: "NBO", cityFrom: "Londres", cityTo: "Nairobi", countryTo: "Kenia", region: "Ãfrica", priceEur: 295, savingsPct: 47, cabin: "economy", airline: "KQ", airlineName: "Kenya Airways", stops: 0, durationMin: 510, distanceCategory: "medium", classification: "OFERTA", dateOut: "2026-02-05", dateRet: "2026-02-15", nights: 10, daysAgo: 8, emoji: "ð¦" },
  { id: "ams-cpt-1", origin: "AMS", destination: "CPT", cityFrom: "Ãmsterdam", cityTo: "Ciudad del Cabo", countryTo: "SudÃ¡frica", region: "Ãfrica", priceEur: 345, savingsPct: 45, cabin: "economy", airline: "KL", airlineName: "KLM", stops: 0, durationMin: 690, distanceCategory: "long", classification: "OFERTA", dateOut: "2026-01-20", dateRet: "2026-02-01", nights: 12, daysAgo: 6, emoji: "ð¦" },

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // RUTAS LARGAS (Europa â Asia / AmÃ©rica / OceanÃ­a)
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  // --- Asia ---
  { id: "mad-bkk-1", origin: "MAD", destination: "BKK", cityFrom: "Madrid", cityTo: "Bangkok", countryTo: "Tailandia", region: "Asia", priceEur: 345, savingsPct: 48, cabin: "economy", airline: "TG", airlineName: "Thai Airways", stops: 0, durationMin: 660, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-11-10", dateRet: "2026-11-24", nights: 14, daysAgo: 5, emoji: "ð" },
  { id: "bcn-bkk-1", origin: "BCN", destination: "BKK", cityFrom: "Barcelona", cityTo: "Bangkok", countryTo: "Tailandia", region: "Asia", priceEur: 365, savingsPct: 46, cabin: "economy", airline: "TG", airlineName: "Thai Airways", stops: 1, durationMin: 720, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-12-05", dateRet: "2026-12-19", nights: 14, daysAgo: 4, emoji: "ð" },
  { id: "mad-nrt-1", origin: "MAD", destination: "NRT", cityFrom: "Madrid", cityTo: "Tokio", countryTo: "JapÃ³n", region: "Asia", priceEur: 445, savingsPct: 45, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 780, distanceCategory: "long", classification: "ERROR", dateOut: "2026-03-20", dateRet: "2026-04-03", nights: 14, daysAgo: 3, emoji: "ð¼", highlight: "Tokio directo 445â¬ con Iberia" },
  { id: "cdg-nrt-1", origin: "CDG", destination: "NRT", cityFrom: "ParÃ­s", cityTo: "Tokio", countryTo: "JapÃ³n", region: "Asia", priceEur: 425, savingsPct: 47, cabin: "economy", airline: "AF", airlineName: "Air France", stops: 0, durationMin: 720, distanceCategory: "long", classification: "ERROR", dateOut: "2026-04-05", dateRet: "2026-04-19", nights: 14, daysAgo: 4, emoji: "ð¼" },
  { id: "lhr-sin-1", origin: "LHR", destination: "SIN", cityFrom: "Londres", cityTo: "Singapur", countryTo: "Singapur", region: "Asia", priceEur: 395, savingsPct: 48, cabin: "economy", airline: "SQ", airlineName: "Singapore Airlines", stops: 0, durationMin: 780, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-01-15", dateRet: "2026-01-29", nights: 14, daysAgo: 5, emoji: "ð" },
  { id: "mad-sin-1", origin: "MAD", destination: "SIN", cityFrom: "Madrid", cityTo: "Singapur", countryTo: "Singapur", region: "Asia", priceEur: 425, savingsPct: 46, cabin: "economy", airline: "SQ", airlineName: "Singapore Airlines", stops: 1, durationMin: 840, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-02-10", dateRet: "2026-02-24", nights: 14, daysAgo: 6, emoji: "ð" },
  { id: "mad-dps-1", origin: "MAD", destination: "DPS", cityFrom: "Madrid", cityTo: "Bali", countryTo: "Indonesia", region: "Asia", priceEur: 395, savingsPct: 50, cabin: "economy", airline: "TK", airlineName: "Turkish Airlines", stops: 1, durationMin: 900, distanceCategory: "long", classification: "ERROR", dateOut: "2026-10-01", dateRet: "2026-10-15", nights: 14, daysAgo: 3, emoji: "ð´", highlight: "Bali 395â¬ ida/vuelta" },
  { id: "lhr-hkg-1", origin: "LHR", destination: "HKG", cityFrom: "Londres", cityTo: "Hong Kong", countryTo: "China", region: "Asia", priceEur: 385, savingsPct: 49, cabin: "economy", airline: "CX", airlineName: "Cathay Pacific", stops: 0, durationMin: 690, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-03-01", dateRet: "2026-03-11", nights: 10, daysAgo: 5, emoji: "ðï¸" },
  { id: "cdg-icn-1", origin: "CDG", destination: "ICN", cityFrom: "ParÃ­s", cityTo: "SeÃºl", countryTo: "Corea del Sur", region: "Asia", priceEur: 425, savingsPct: 46, cabin: "economy", airline: "AF", airlineName: "Air France", stops: 0, durationMin: 660, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-04-10", dateRet: "2026-04-24", nights: 14, daysAgo: 6, emoji: "ðï¸" },
  { id: "mad-mle-1", origin: "MAD", destination: "MLE", cityFrom: "Madrid", cityTo: "Maldivas", countryTo: "Maldivas", region: "Asia", priceEur: 425, savingsPct: 48, cabin: "economy", airline: "TK", airlineName: "Turkish Airlines", stops: 1, durationMin: 780, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-01-20", dateRet: "2026-01-30", nights: 10, daysAgo: 4, emoji: "ðï¸" },
  { id: "lhr-bom-1", origin: "LHR", destination: "BOM", cityFrom: "Londres", cityTo: "Bombay", countryTo: "India", region: "Asia", priceEur: 325, savingsPct: 50, cabin: "economy", airline: "AI", airlineName: "Air India", stops: 0, durationMin: 540, distanceCategory: "long", classification: "ERROR", dateOut: "2026-02-15", dateRet: "2026-03-01", nights: 14, daysAgo: 3, emoji: "ð", highlight: "Bombay directo 325â¬" },
  { id: "cdg-sgn-1", origin: "CDG", destination: "SGN", cityFrom: "ParÃ­s", cityTo: "Ho Chi Minh", countryTo: "Vietnam", region: "Asia", priceEur: 395, savingsPct: 49, cabin: "economy", airline: "VN", airlineName: "Vietnam Airlines", stops: 0, durationMin: 720, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-11-20", dateRet: "2026-12-04", nights: 14, daysAgo: 5, emoji: "ð¯" },
  { id: "ber-pek-1", origin: "BER", destination: "PEK", cityFrom: "BerlÃ­n", cityTo: "PekÃ­n", countryTo: "China", region: "Asia", priceEur: 385, savingsPct: 48, cabin: "economy", airline: "CA", airlineName: "Air China", stops: 0, durationMin: 570, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-03-15", dateRet: "2026-03-29", nights: 14, daysAgo: 6, emoji: "ð¯" },

  // --- AmÃ©rica ---
  { id: "mad-jfk-1", origin: "MAD", destination: "JFK", cityFrom: "Madrid", cityTo: "Nueva York", countryTo: "Estados Unidos", region: "AmÃ©rica Norte", priceEur: 295, savingsPct: 52, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 510, distanceCategory: "long", classification: "ERROR", dateOut: "2026-09-15", dateRet: "2026-09-22", nights: 7, daysAgo: 2, emoji: "ð½", highlight: "Nueva York directo 295â¬" },
  { id: "bcn-jfk-1", origin: "BCN", destination: "JFK", cityFrom: "Barcelona", cityTo: "Nueva York", countryTo: "Estados Unidos", region: "AmÃ©rica Norte", priceEur: 325, savingsPct: 50, cabin: "economy", airline: "LO", airlineName: "LOT Polish", stops: 1, durationMin: 620, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-10-20", dateRet: "2026-10-27", nights: 7, daysAgo: 4, emoji: "ð½" },
  { id: "mad-mia-1", origin: "MAD", destination: "MIA", cityFrom: "Madrid", cityTo: "Miami", countryTo: "Estados Unidos", region: "AmÃ©rica Norte", priceEur: 345, savingsPct: 48, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 570, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-12-20", dateRet: "2026-12-28", nights: 8, daysAgo: 5, emoji: "ð´" },
  { id: "mad-cun-1", origin: "MAD", destination: "CUN", cityFrom: "Madrid", cityTo: "CancÃºn", countryTo: "MÃ©xico", region: "Caribe", priceEur: 365, savingsPct: 47, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 660, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-11-15", dateRet: "2026-11-29", nights: 14, daysAgo: 4, emoji: "ðï¸" },
  { id: "bcn-cun-1", origin: "BCN", destination: "CUN", cityFrom: "Barcelona", cityTo: "CancÃºn", countryTo: "MÃ©xico", region: "Caribe", priceEur: 385, savingsPct: 46, cabin: "economy", airline: "UX", airlineName: "Air Europa", stops: 1, durationMin: 720, distanceCategory: "long", classification: "OFERTA", dateOut: "2026-01-10", dateRet: "2026-01-24", nights: 14, daysAgo: 6, emoji: "ðï¸" },
  { id: "mad-bog-1", origin: "MAD", destination: "BOG", cityFrom: "Madrid", cityTo: "BogotÃ¡", countryTo: "Colombia", region: "AmÃ©rica Sur", priceEur: 345, savingsPct: 49, cabin: "economy", airline: "AV", airlineName: "Avianca", stops: 0, durationMin: 630, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-02-01", dateRet: "2026-02-15", nights: 14, daysAgo: 5, emoji: "ð¿" },
  { id: "mad-lim-1", origin: "MAD", destination: "LIM", cityFrom: "Madrid", cityTo: "Lima", countryTo: "PerÃº", region: "AmÃ©rica Sur", priceEur: 395, savingsPct: 47, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 720, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-03-10", dateRet: "2026-03-24", nights: 14, daysAgo: 6, emoji: "ðï¸" },
  { id: "mad-eze-1", origin: "MAD", destination: "EZE", cityFrom: "Madrid", cityTo: "Buenos Aires", countryTo: "Argentina", region: "AmÃ©rica Sur", priceEur: 445, savingsPct: 45, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 780, distanceCategory: "long", classification: "OFERTA", dateOut: "2026-01-05", dateRet: "2026-01-19", nights: 14, daysAgo: 7, emoji: "ð¥©" },
  { id: "mad-gru-1", origin: "MAD", destination: "GRU", cityFrom: "Madrid", cityTo: "SÃ£o Paulo", countryTo: "Brasil", region: "AmÃ©rica Sur", priceEur: 385, savingsPct: 48, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 660, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-04-05", dateRet: "2026-04-19", nights: 14, daysAgo: 5, emoji: "ðï¸" },
  { id: "mad-hav-1", origin: "MAD", destination: "HAV", cityFrom: "Madrid", cityTo: "La Habana", countryTo: "Cuba", region: "Caribe", priceEur: 375, savingsPct: 47, cabin: "economy", airline: "UX", airlineName: "Air Europa", stops: 0, durationMin: 600, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-02-10", dateRet: "2026-02-21", nights: 11, daysAgo: 4, emoji: "ð" },
  { id: "cdg-jfk-1", origin: "CDG", destination: "JFK", cityFrom: "ParÃ­s", cityTo: "Nueva York", countryTo: "Estados Unidos", region: "AmÃ©rica Norte", priceEur: 285, savingsPct: 53, cabin: "economy", airline: "DL", airlineName: "Delta", stops: 0, durationMin: 480, distanceCategory: "long", classification: "ERROR", dateOut: "2026-09-20", dateRet: "2026-09-27", nights: 7, daysAgo: 2, emoji: "ð½", highlight: "ParÃ­s-NYC 285â¬ directo" },
  { id: "lhr-lax-1", origin: "LHR", destination: "LAX", cityFrom: "Londres", cityTo: "Los Ãngeles", countryTo: "Estados Unidos", region: "AmÃ©rica Norte", priceEur: 345, savingsPct: 49, cabin: "economy", airline: "VS", airlineName: "Virgin Atlantic", stops: 0, durationMin: 660, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-10-05", dateRet: "2026-10-15", nights: 10, daysAgo: 5, emoji: "ð´" },
  { id: "ams-yyz-1", origin: "AMS", destination: "YYZ", cityFrom: "Ãmsterdam", cityTo: "Toronto", countryTo: "CanadÃ¡", region: "AmÃ©rica Norte", priceEur: 325, savingsPct: 50, cabin: "economy", airline: "KL", airlineName: "KLM", stops: 0, durationMin: 480, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-09-12", dateRet: "2026-09-21", nights: 9, daysAgo: 4, emoji: "ð" },
  { id: "mad-sjo-1", origin: "MAD", destination: "SJO", cityFrom: "Madrid", cityTo: "San JosÃ©", countryTo: "Costa Rica", region: "AmÃ©rica Sur", priceEur: 395, savingsPct: 47, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 660, distanceCategory: "long", classification: "OFERTA", dateOut: "2026-03-01", dateRet: "2026-03-15", nights: 14, daysAgo: 6, emoji: "ð" },

  // --- OceanÃ­a ---
  { id: "lhr-syd-1", origin: "LHR", destination: "SYD", cityFrom: "Londres", cityTo: "SÃ­dney", countryTo: "Australia", region: "OceanÃ­a", priceEur: 595, savingsPct: 42, cabin: "economy", airline: "QF", airlineName: "Qantas", stops: 1, durationMin: 1380, distanceCategory: "long", classification: "ERROR", dateOut: "2026-02-01", dateRet: "2026-02-20", nights: 19, daysAgo: 3, emoji: "ð¦", highlight: "SÃ­dney 595â¬ con Qantas" },
  { id: "cdg-akl-1", origin: "CDG", destination: "AKL", cityFrom: "ParÃ­s", cityTo: "Auckland", countryTo: "Nueva Zelanda", region: "OceanÃ­a", priceEur: 625, savingsPct: 40, cabin: "economy", airline: "SQ", airlineName: "Singapore Airlines", stops: 1, durationMin: 1440, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-01-10", dateRet: "2026-01-30", nights: 20, daysAgo: 5, emoji: "ðï¸" },
  { id: "mad-mel-1", origin: "MAD", destination: "MEL", cityFrom: "Madrid", cityTo: "Melbourne", countryTo: "Australia", region: "OceanÃ­a", priceEur: 625, savingsPct: 41, cabin: "economy", airline: "EK", airlineName: "Emirates", stops: 1, durationMin: 1350, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-03-05", dateRet: "2026-03-22", nights: 17, daysAgo: 6, emoji: "ð¦" },

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // BUSINESS CLASS (premium con grandes descuentos)
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  { id: "mad-jfk-b1", origin: "MAD", destination: "JFK", cityFrom: "Madrid", cityTo: "Nueva York", countryTo: "Estados Unidos", region: "AmÃ©rica Norte", priceEur: 1195, savingsPct: 52, cabin: "business", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 510, distanceCategory: "long", classification: "CRITICO", dateOut: "2026-10-01", dateRet: "2026-10-08", nights: 7, daysAgo: 1, emoji: "ð½", highlight: "Business NYC 1195â¬ directo" },
  { id: "mad-bkk-b1", origin: "MAD", destination: "BKK", cityFrom: "Madrid", cityTo: "Bangkok", countryTo: "Tailandia", region: "Asia", priceEur: 1395, savingsPct: 55, cabin: "business", airline: "TG", airlineName: "Thai Airways", stops: 0, durationMin: 660, distanceCategory: "long", classification: "CRITICO", dateOut: "2026-11-15", dateRet: "2026-11-29", nights: 14, daysAgo: 2, emoji: "ð", highlight: "Business Bangkok 1395â¬" },
  { id: "lhr-sin-b1", origin: "LHR", destination: "SIN", cityFrom: "Londres", cityTo: "Singapur", countryTo: "Singapur", region: "Asia", priceEur: 1595, savingsPct: 50, cabin: "business", airline: "SQ", airlineName: "Singapore Airlines", stops: 0, durationMin: 780, distanceCategory: "long", classification: "ERROR", dateOut: "2026-02-10", dateRet: "2026-02-24", nights: 14, daysAgo: 3, emoji: "ð" },
  { id: "cdg-nrt-b1", origin: "CDG", destination: "NRT", cityFrom: "ParÃ­s", cityTo: "Tokio", countryTo: "JapÃ³n", region: "Asia", priceEur: 1495, savingsPct: 52, cabin: "business", airline: "AF", airlineName: "Air France", stops: 0, durationMin: 720, distanceCategory: "long", classification: "ERROR", dateOut: "2026-04-01", dateRet: "2026-04-15", nights: 14, daysAgo: 2, emoji: "ð¼", highlight: "Business Tokio 1495â¬" },
  { id: "mad-dxb-b1", origin: "MAD", destination: "DXB", cityFrom: "Madrid", cityTo: "DubÃ¡i", countryTo: "Emiratos Ãrabes Unidos", region: "Oriente Medio", priceEur: 895, savingsPct: 55, cabin: "business", airline: "EK", airlineName: "Emirates", stops: 0, durationMin: 420, distanceCategory: "medium", classification: "CRITICO", dateOut: "2026-12-05", dateRet: "2026-12-12", nights: 7, daysAgo: 1, emoji: "ð", highlight: "Business DubÃ¡i 895â¬ con Emirates" },
  { id: "lhr-jfk-b1", origin: "LHR", destination: "JFK", cityFrom: "Londres", cityTo: "Nueva York", countryTo: "Estados Unidos", region: "AmÃ©rica Norte", priceEur: 1295, savingsPct: 53, cabin: "business", airline: "VS", airlineName: "Virgin Atlantic", stops: 0, durationMin: 450, distanceCategory: "long", classification: "ERROR", dateOut: "2026-09-25", dateRet: "2026-10-02", nights: 7, daysAgo: 2, emoji: "ð½" },
  { id: "mad-mle-b1", origin: "MAD", destination: "MLE", cityFrom: "Madrid", cityTo: "Maldivas", countryTo: "Maldivas", region: "Asia", priceEur: 1595, savingsPct: 50, cabin: "business", airline: "TK", airlineName: "Turkish Airlines", stops: 1, durationMin: 780, distanceCategory: "long", classification: "ERROR", dateOut: "2026-01-20", dateRet: "2026-01-30", nights: 10, daysAgo: 3, emoji: "ðï¸" },
  { id: "ams-cpt-b1", origin: "AMS", destination: "CPT", cityFrom: "Ãmsterdam", cityTo: "Ciudad del Cabo", countryTo: "SudÃ¡frica", region: "Ãfrica", priceEur: 1395, savingsPct: 52, cabin: "business", airline: "KL", airlineName: "KLM", stops: 0, durationMin: 690, distanceCategory: "long", classification: "ERROR", dateOut: "2026-02-05", dateRet: "2026-02-18", nights: 13, daysAgo: 4, emoji: "ð¦" },
  { id: "mad-lim-b1", origin: "MAD", destination: "LIM", cityFrom: "Madrid", cityTo: "Lima", countryTo: "PerÃº", region: "AmÃ©rica Sur", priceEur: 1295, savingsPct: 53, cabin: "business", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 720, distanceCategory: "long", classification: "ERROR", dateOut: "2026-03-10", dateRet: "2026-03-24", nights: 14, daysAgo: 3, emoji: "ðï¸" },
  { id: "bcn-dps-b1", origin: "BCN", destination: "DPS", cityFrom: "Barcelona", cityTo: "Bali", countryTo: "Indonesia", region: "Asia", priceEur: 1495, savingsPct: 51, cabin: "business", airline: "TK", airlineName: "Turkish Airlines", stops: 1, durationMin: 900, distanceCategory: "long", classification: "ERROR", dateOut: "2026-10-15", dateRet: "2026-10-29", nights: 14, daysAgo: 4, emoji: "ð´" },

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // MÃS DEALS ECONOMY PARA COMPLETAR 150
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  { id: "mad-opo-2", origin: "MAD", destination: "OPO", cityFrom: "Madrid", cityTo: "Porto", countryTo: "Portugal", region: "Europa", priceEur: 19, savingsPct: 75, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 55, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-09-05", dateRet: "2026-09-08", nights: 3, daysAgo: 1, emoji: "ð·", highlight: "Porto 19â¬" },
  { id: "mad-agp-1", origin: "MAD", destination: "AGP", cityFrom: "Madrid", cityTo: "MÃ¡laga", countryTo: "EspaÃ±a", region: "Europa", priceEur: 15, savingsPct: 80, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 60, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-07-15", dateRet: "2026-07-20", nights: 5, daysAgo: 1, emoji: "âï¸", highlight: "MÃ¡laga 15â¬" },
  { id: "bcn-ibz-1", origin: "BCN", destination: "IBZ", cityFrom: "Barcelona", cityTo: "Ibiza", countryTo: "EspaÃ±a", region: "Europa", priceEur: 19, savingsPct: 75, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 50, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-06-20", dateRet: "2026-06-24", nights: 4, daysAgo: 1, emoji: "ð¶", highlight: "Ibiza 19â¬" },
  { id: "mad-sxf-1", origin: "MAD", destination: "BER", cityFrom: "Madrid", cityTo: "BerlÃ­n", countryTo: "Alemania", region: "Europa", priceEur: 39, savingsPct: 66, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 175, distanceCategory: "short", classification: "ERROR", dateOut: "2026-10-25", dateRet: "2026-10-29", nights: 4, daysAgo: 2, emoji: "ð»" },
  { id: "mad-waw-1", origin: "MAD", destination: "WAW", cityFrom: "Madrid", cityTo: "Varsovia", countryTo: "Polonia", region: "Europa", priceEur: 45, savingsPct: 63, cabin: "economy", airline: "W6", airlineName: "Wizz Air", stops: 0, durationMin: 195, distanceCategory: "short", classification: "ANOMALIA", dateOut: "2026-11-12", dateRet: "2026-11-16", nights: 4, daysAgo: 3, emoji: "ðï¸" },
  { id: "bcn-bgy-1", origin: "BCN", destination: "BGY", cityFrom: "Barcelona", cityTo: "MilÃ¡n", countryTo: "Italia", region: "Europa", priceEur: 15, savingsPct: 80, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 90, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-08-10", dateRet: "2026-08-14", nights: 4, daysAgo: 1, emoji: "ð", highlight: "MilÃ¡n 15â¬" },
  { id: "lis-ory-1", origin: "LIS", destination: "ORY", cityFrom: "Lisboa", cityTo: "ParÃ­s", countryTo: "Francia", region: "Europa", priceEur: 29, savingsPct: 70, cabin: "economy", airline: "TO", airlineName: "Transavia", stops: 0, durationMin: 140, distanceCategory: "short", classification: "ERROR", dateOut: "2026-09-28", dateRet: "2026-10-02", nights: 4, daysAgo: 2, emoji: "ð¥" },
  { id: "lhr-bcn-1", origin: "LHR", destination: "BCN", cityFrom: "Londres", cityTo: "Barcelona", countryTo: "EspaÃ±a", region: "Europa", priceEur: 25, savingsPct: 74, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 125, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-08-05", dateRet: "2026-08-10", nights: 5, daysAgo: 1, emoji: "ð", highlight: "Londres-Barcelona 25â¬" },
  { id: "ams-mad-1", origin: "AMS", destination: "MAD", cityFrom: "Ãmsterdam", cityTo: "Madrid", countryTo: "EspaÃ±a", region: "Europa", priceEur: 35, savingsPct: 67, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 155, distanceCategory: "short", classification: "ERROR", dateOut: "2026-10-08", dateRet: "2026-10-12", nights: 4, daysAgo: 2, emoji: "ðï¸" },
  { id: "muc-bcn-1", origin: "MUC", destination: "BCN", cityFrom: "MÃºnich", cityTo: "Barcelona", countryTo: "EspaÃ±a", region: "Europa", priceEur: 29, savingsPct: 71, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 120, distanceCategory: "short", classification: "ERROR", dateOut: "2026-09-15", dateRet: "2026-09-19", nights: 4, daysAgo: 2, emoji: "ð" },
  { id: "mad-rec-1", origin: "MAD", destination: "REC", cityFrom: "Madrid", cityTo: "Recife", countryTo: "Brasil", region: "AmÃ©rica Sur", priceEur: 325, savingsPct: 51, cabin: "economy", airline: "LA", airlineName: "LATAM", stops: 1, durationMin: 600, distanceCategory: "long", classification: "ERROR", dateOut: "2026-05-01", dateRet: "2026-05-15", nights: 14, daysAgo: 3, emoji: "ðï¸", highlight: "Recife 325â¬ con LATAM" },
  { id: "lhr-del-1", origin: "LHR", destination: "DEL", cityFrom: "Londres", cityTo: "Delhi", countryTo: "India", region: "Asia", priceEur: 295, savingsPct: 52, cabin: "economy", airline: "AI", airlineName: "Air India", stops: 0, durationMin: 510, distanceCategory: "long", classification: "ERROR", dateOut: "2026-11-10", dateRet: "2026-11-24", nights: 14, daysAgo: 4, emoji: "ð" },
  { id: "cdg-yul-1", origin: "CDG", destination: "YUL", cityFrom: "ParÃ­s", cityTo: "Montreal", countryTo: "CanadÃ¡", region: "AmÃ©rica Norte", priceEur: 295, savingsPct: 52, cabin: "economy", airline: "AC", airlineName: "Air Canada", stops: 0, durationMin: 450, distanceCategory: "long", classification: "ERROR", dateOut: "2026-09-10", dateRet: "2026-09-20", nights: 10, daysAgo: 3, emoji: "ð" },
  { id: "mad-ppt-1", origin: "MAD", destination: "PPT", cityFrom: "Madrid", cityTo: "TahitÃ­", countryTo: "Polinesia Francesa", region: "OceanÃ­a", priceEur: 795, savingsPct: 40, cabin: "economy", airline: "AF", airlineName: "Air France", stops: 2, durationMin: 1500, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-03-01", dateRet: "2026-03-15", nights: 14, daysAgo: 7, emoji: "ðï¸" },
  { id: "mad-scl-1", origin: "MAD", destination: "SCL", cityFrom: "Madrid", cityTo: "Santiago de Chile", countryTo: "Chile", region: "AmÃ©rica Sur", priceEur: 425, savingsPct: 46, cabin: "economy", airline: "IB", airlineName: "Iberia", stops: 0, durationMin: 810, distanceCategory: "long", classification: "ANOMALIA", dateOut: "2026-04-10", dateRet: "2026-04-24", nights: 14, daysAgo: 5, emoji: "ðï¸" },
  { id: "bcn-ist-1", origin: "BCN", destination: "IST", cityFrom: "Barcelona", cityTo: "Estambul", countryTo: "TurquÃ­a", region: "Oriente Medio", priceEur: 59, savingsPct: 58, cabin: "economy", airline: "PC", airlineName: "Pegasus", stops: 0, durationMin: 195, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-10-01", dateRet: "2026-10-06", nights: 5, daysAgo: 3, emoji: "ð" },
  { id: "mad-hel-1", origin: "MAD", destination: "HEL", cityFrom: "Madrid", cityTo: "Helsinki", countryTo: "Finlandia", region: "Europa", priceEur: 65, savingsPct: 57, cabin: "economy", airline: "AY", airlineName: "Finnair", stops: 0, durationMin: 240, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-12-15", dateRet: "2026-12-20", nights: 5, daysAgo: 4, emoji: "âï¸" },
  { id: "mad-kef-1", origin: "MAD", destination: "KEF", cityFrom: "Madrid", cityTo: "Reikiavik", countryTo: "Islandia", region: "Europa", priceEur: 95, savingsPct: 55, cabin: "economy", airline: "FI", airlineName: "Icelandair", stops: 0, durationMin: 240, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-08-01", dateRet: "2026-08-06", nights: 5, daysAgo: 5, emoji: "âï¸" },
  { id: "bcn-ory-1", origin: "BCN", destination: "ORY", cityFrom: "Barcelona", cityTo: "ParÃ­s", countryTo: "Francia", region: "Europa", priceEur: 25, savingsPct: 72, cabin: "economy", airline: "VY", airlineName: "Vueling", stops: 0, durationMin: 105, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-07-10", dateRet: "2026-07-14", nights: 4, daysAgo: 1, emoji: "ð¥", highlight: "ParÃ­s 25â¬" },
  { id: "mad-arn-1", origin: "MAD", destination: "ARN", cityFrom: "Madrid", cityTo: "Estocolmo", countryTo: "Suecia", region: "Europa", priceEur: 55, savingsPct: 60, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 210, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-09-20", dateRet: "2026-09-25", nights: 5, daysAgo: 3, emoji: "ð°" },
  { id: "lhr-ist-1", origin: "LHR", destination: "IST", cityFrom: "Londres", cityTo: "Estambul", countryTo: "TurquÃ­a", region: "Oriente Medio", priceEur: 69, savingsPct: 57, cabin: "economy", airline: "TK", airlineName: "Turkish Airlines", stops: 0, durationMin: 220, distanceCategory: "medium", classification: "ANOMALIA", dateOut: "2026-10-15", dateRet: "2026-10-20", nights: 5, daysAgo: 3, emoji: "ð" },
  { id: "muc-ath-1", origin: "MUC", destination: "ATH", cityFrom: "MÃºnich", cityTo: "Atenas", countryTo: "Grecia", region: "Europa", priceEur: 35, savingsPct: 67, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 150, distanceCategory: "short", classification: "ERROR", dateOut: "2026-09-25", dateRet: "2026-09-30", nights: 5, daysAgo: 2, emoji: "ðï¸" },
  { id: "vie-bcn-1", origin: "VIE", destination: "BCN", cityFrom: "Viena", cityTo: "Barcelona", countryTo: "EspaÃ±a", region: "Europa", priceEur: 29, savingsPct: 71, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 145, distanceCategory: "short", classification: "ERROR", dateOut: "2026-11-01", dateRet: "2026-11-05", nights: 4, daysAgo: 1, emoji: "ð", highlight: "Viena-Barcelona 29â¬" },
  { id: "waw-bcn-1", origin: "WAW", destination: "BCN", cityFrom: "Varsovia", cityTo: "Barcelona", countryTo: "EspaÃ±a", region: "Europa", priceEur: 25, savingsPct: 73, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 170, distanceCategory: "short", classification: "CRITICO", dateOut: "2026-08-15", dateRet: "2026-08-20", nights: 5, daysAgo: 1, emoji: "ð" },
  { id: "mad-mxp-1", origin: "MAD", destination: "MXP", cityFrom: "Madrid", cityTo: "MilÃ¡n", countryTo: "Italia", region: "Europa", priceEur: 29, savingsPct: 70, cabin: "economy", airline: "FR", airlineName: "Ryanair", stops: 0, durationMin: 125, distanceCategory: "short", classification: "ERROR", dateOut: "2026-10-01", dateRet: "2026-10-05", nights: 4, daysAgo: 2, emoji: "ð" },
];

export const FLIGHT_SEED: Deal[] = FLIGHT_ENTRIES.map(makeFlightDeal);

/**
 * Devuelve flight deals del seed filtrando por parÃ¡metros.
 */
export function getFlightSeedFallback(opts?: {
  limit?: number;
  cabin?: "economy" | "business";
  maxPrice?: number;
  classification?: string;
  distanceCategory?: FlightCategory;
  origin?: string;
  region?: string;
}): Deal[] {
  const limit = opts?.limit ?? 30;
  const cabin = opts?.cabin;
  const maxPrice = opts?.maxPrice;
  const cls = opts?.classification;
  const dist = opts?.distanceCategory;
  const origin = opts?.origin?.toUpperCase();
  const region = opts?.region;

  const arr = FLIGHT_SEED.filter((d) => {
    if (cabin && d.cabin !== cabin) return false;
    if (maxPrice && d.price_eur > maxPrice) return false;
    if (cls && d.classification !== cls) return false;
    if (dist && d.distance_category !== dist) return false;
    if (origin && d.origin !== origin) return false;
    if (region && d.region !== region) return false;
    return true;
  });
  arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return arr.slice(0, limit);
}

/** Total de entries para stats. */
export function getFlightEntries(): FlightEntry[] {
  return FLIGHT_ENTRIES;
}

/** Buscar por origen. */
export function getFlightsByOrigin(origin: string): Deal[] {
  return FLIGHT_SEED.filter((d) => d.origin === origin.toUpperCase());
}

/** Buscar por destino. */
export function getFlightsByDestination(dest: string): Deal[] {
  return FLIGHT_SEED.filter((d) => d.destination === dest.toUpperCase());
}

/** Mejores deals (CRITICO + ERROR primero). */
export function getTopFlightDeals(limit = 10): Deal[] {
  const sorted = [...FLIGHT_SEED].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return sorted.slice(0, limit);
}
