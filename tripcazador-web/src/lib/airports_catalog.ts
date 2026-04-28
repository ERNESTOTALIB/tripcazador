/**
 * airports_catalog.ts — fase kk K3
 *
 * Catálogo curado de aeropuertos top global con metadata para fuzzy search.
 * Cada entrada: IATA, ciudad, país, alias regionales, lat/lon (futuro mapa).
 *
 * Para producción a escala, usar /api/airports backend con base completa
 * (~5000 aeropuertos). Este catálogo cubre los 80 más buscados — suficiente
 * para autocomplete en tiempo real.
 */

export interface AirportEntry {
  iata: string;
  city: string;
  country: string;
  region: "Europa" | "América Norte" | "América Sur" | "Caribe" | "Asia" | "África" | "Oriente Medio" | "Oceanía";
  /** alias adicionales para fuzzy match, ej: ["barajas", "adolfo suárez"] */
  aliases?: string[];
  emoji?: string;
}

export const AIRPORTS_CATALOG: AirportEntry[] = [
  // España
  { iata: "MAD", city: "Madrid", country: "España", region: "Europa", aliases: ["barajas", "adolfo suarez"], emoji: "🇪🇸" },
  { iata: "BCN", city: "Barcelona", country: "España", region: "Europa", aliases: ["el prat"], emoji: "🇪🇸" },
  { iata: "AGP", city: "Málaga", country: "España", region: "Europa", aliases: ["costa del sol"], emoji: "🇪🇸" },
  { iata: "VLC", city: "Valencia", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "SVQ", city: "Sevilla", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "PMI", city: "Palma de Mallorca", country: "España", region: "Europa", aliases: ["mallorca"], emoji: "🇪🇸" },
  { iata: "BIO", city: "Bilbao", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "LPA", city: "Las Palmas", country: "España", region: "Europa", aliases: ["gran canaria"], emoji: "🇪🇸" },
  { iata: "TFS", city: "Tenerife Sur", country: "España", region: "Europa", aliases: ["tenerife"], emoji: "🇪🇸" },
  { iata: "TFN", city: "Tenerife Norte", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "IBZ", city: "Ibiza", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "MAH", city: "Menorca", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "ACE", city: "Lanzarote", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "FUE", city: "Fuerteventura", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "SCQ", city: "Santiago de Compostela", country: "España", region: "Europa", aliases: ["santiago"], emoji: "🇪🇸" },
  { iata: "OVD", city: "Asturias", country: "España", region: "Europa", aliases: ["oviedo"], emoji: "🇪🇸" },
  { iata: "SDR", city: "Santander", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "ALC", city: "Alicante", country: "España", region: "Europa", aliases: ["elche"], emoji: "🇪🇸" },
  { iata: "MJV", city: "Murcia", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "ZAZ", city: "Zaragoza", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "GRX", city: "Granada", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "VGO", city: "Vigo", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "REU", city: "Reus", country: "España", region: "Europa", emoji: "🇪🇸" },
  { iata: "GRO", city: "Gerona", country: "España", region: "Europa", aliases: ["girona"], emoji: "🇪🇸" },
  { iata: "XRY", city: "Jerez", country: "España", region: "Europa", emoji: "🇪🇸" },

  // Europa
  { iata: "CDG", city: "París", country: "Francia", region: "Europa", aliases: ["paris", "charles de gaulle"], emoji: "🇫🇷" },
  { iata: "ORY", city: "París Orly", country: "Francia", region: "Europa", aliases: ["paris orly"], emoji: "🇫🇷" },
  { iata: "BVA", city: "Beauvais", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "NCE", city: "Niza", country: "Francia", region: "Europa", aliases: ["nice"], emoji: "🇫🇷" },
  { iata: "LYS", city: "Lyon", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "MRS", city: "Marsella", country: "Francia", region: "Europa", aliases: ["marseille"], emoji: "🇫🇷" },
  { iata: "TLS", city: "Toulouse", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "BOD", city: "Burdeos", country: "Francia", region: "Europa", aliases: ["bordeaux"], emoji: "🇫🇷" },
  { iata: "NTE", city: "Nantes", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "BIQ", city: "Biarritz", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "LHR", city: "Londres Heathrow", country: "Reino Unido", region: "Europa", aliases: ["londres", "london"], emoji: "🇬🇧" },
  { iata: "LGW", city: "Londres Gatwick", country: "Reino Unido", region: "Europa", aliases: ["gatwick"], emoji: "🇬🇧" },
  { iata: "STN", city: "Londres Stansted", country: "Reino Unido", region: "Europa", aliases: ["stansted"], emoji: "🇬🇧" },
  { iata: "LTN", city: "Londres Luton", country: "Reino Unido", region: "Europa", aliases: ["luton"], emoji: "🇬🇧" },
  { iata: "LCY", city: "Londres City", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "MAN", city: "Manchester", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "BHX", city: "Birmingham", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "LPL", city: "Liverpool", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "BRS", city: "Bristol", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "LBA", city: "Leeds", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "NCL", city: "Newcastle", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "EDI", city: "Edimburgo", country: "Reino Unido", region: "Europa", aliases: ["edinburgh"], emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { iata: "GLA", city: "Glasgow", country: "Reino Unido", region: "Europa", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { iata: "BFS", city: "Belfast", country: "Reino Unido", region: "Europa", emoji: "🇬🇧" },
  { iata: "DUB", city: "Dublín", country: "Irlanda", region: "Europa", aliases: ["dublin"], emoji: "🇮🇪" },
  { iata: "ORK", city: "Cork", country: "Irlanda", region: "Europa", emoji: "🇮🇪" },
  { iata: "SNN", city: "Shannon", country: "Irlanda", region: "Europa", emoji: "🇮🇪" },
  { iata: "FRA", city: "Fráncfort", country: "Alemania", region: "Europa", aliases: ["frankfurt"], emoji: "🇩🇪" },
  { iata: "MUC", city: "Múnich", country: "Alemania", region: "Europa", aliases: ["munich", "munchen"], emoji: "🇩🇪" },
  { iata: "BER", city: "Berlín", country: "Alemania", region: "Europa", aliases: ["berlin"], emoji: "🇩🇪" },
  { iata: "DUS", city: "Düsseldorf", country: "Alemania", region: "Europa", emoji: "🇩🇪" },
  { iata: "HAM", city: "Hamburgo", country: "Alemania", region: "Europa", emoji: "🇩🇪" },
  { iata: "STR", city: "Stuttgart", country: "Alemania", region: "Europa", emoji: "🇩🇪" },
  { iata: "CGN", city: "Colonia", country: "Alemania", region: "Europa", aliases: ["cologne", "köln"], emoji: "🇩🇪" },
  { iata: "HHN", city: "Frankfurt Hahn", country: "Alemania", region: "Europa", emoji: "🇩🇪" },
  { iata: "NUE", city: "Núremberg", country: "Alemania", region: "Europa", aliases: ["nuremberg"], emoji: "🇩🇪" },
  { iata: "LEJ", city: "Leipzig", country: "Alemania", region: "Europa", emoji: "🇩🇪" },
  { iata: "AMS", city: "Ámsterdam", country: "Países Bajos", region: "Europa", aliases: ["amsterdam", "schiphol"], emoji: "🇳🇱" },
  { iata: "BRU", city: "Bruselas", country: "Bélgica", region: "Europa", aliases: ["brussels"], emoji: "🇧🇪" },
  { iata: "ZRH", city: "Zúrich", country: "Suiza", region: "Europa", aliases: ["zurich"], emoji: "🇨🇭" },
  { iata: "GVA", city: "Ginebra", country: "Suiza", region: "Europa", aliases: ["geneva"], emoji: "🇨🇭" },
  { iata: "BSL", city: "Basilea", country: "Suiza", region: "Europa", aliases: ["basel"], emoji: "🇨🇭" },
  { iata: "VIE", city: "Viena", country: "Austria", region: "Europa", aliases: ["vienna", "wien"], emoji: "🇦🇹" },
  { iata: "FCO", city: "Roma Fiumicino", country: "Italia", region: "Europa", aliases: ["roma", "rome"], emoji: "🇮🇹" },
  { iata: "MXP", city: "Milán Malpensa", country: "Italia", region: "Europa", aliases: ["milan", "milano"], emoji: "🇮🇹" },
  { iata: "BGY", city: "Bérgamo", country: "Italia", region: "Europa", aliases: ["bergamo"], emoji: "🇮🇹" },
  { iata: "VCE", city: "Venecia", country: "Italia", region: "Europa", aliases: ["venice"], emoji: "🇮🇹" },
  { iata: "NAP", city: "Nápoles", country: "Italia", region: "Europa", aliases: ["napoli"], emoji: "🇮🇹" },
  { iata: "CIA", city: "Roma Ciampino", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "LIN", city: "Milán Linate", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "BLQ", city: "Bolonia", country: "Italia", region: "Europa", aliases: ["bologna"], emoji: "🇮🇹" },
  { iata: "FLR", city: "Florencia", country: "Italia", region: "Europa", aliases: ["florence", "firenze"], emoji: "🇮🇹" },
  { iata: "PSA", city: "Pisa", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "PMO", city: "Palermo", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "CTA", city: "Catania", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "BRI", city: "Bari", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "VRN", city: "Verona", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "TRN", city: "Turín", country: "Italia", region: "Europa", aliases: ["turin", "torino"], emoji: "🇮🇹" },
  { iata: "CAG", city: "Cagliari", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "LIS", city: "Lisboa", country: "Portugal", region: "Europa", aliases: ["lisbon"], emoji: "🇵🇹" },
  { iata: "OPO", city: "Oporto", country: "Portugal", region: "Europa", aliases: ["porto"], emoji: "🇵🇹" },
  { iata: "FNC", city: "Funchal Madeira", country: "Portugal", region: "Europa", aliases: ["madeira"], emoji: "🇵🇹" },
  { iata: "ATH", city: "Atenas", country: "Grecia", region: "Europa", aliases: ["athens"], emoji: "🇬🇷" },
  { iata: "JMK", city: "Mykonos", country: "Grecia", region: "Europa", emoji: "🇬🇷" },
  { iata: "JTR", city: "Santorini", country: "Grecia", region: "Europa", emoji: "🇬🇷" },
  { iata: "HER", city: "Heraklion", country: "Grecia", region: "Europa", aliases: ["creta", "crete"], emoji: "🇬🇷" },
  { iata: "RHO", city: "Rodas", country: "Grecia", region: "Europa", aliases: ["rhodes"], emoji: "🇬🇷" },
  { iata: "CFU", city: "Corfú", country: "Grecia", region: "Europa", aliases: ["corfu"], emoji: "🇬🇷" },
  { iata: "MLA", city: "Malta", country: "Malta", region: "Europa", emoji: "🇲🇹" },
  { iata: "LCA", city: "Larnaca", country: "Chipre", region: "Europa", aliases: ["cyprus"], emoji: "🇨🇾" },
  { iata: "PRG", city: "Praga", country: "Chequia", region: "Europa", aliases: ["prague"], emoji: "🇨🇿" },
  { iata: "BUD", city: "Budapest", country: "Hungría", region: "Europa", emoji: "🇭🇺" },
  { iata: "WAW", city: "Varsovia", country: "Polonia", region: "Europa", aliases: ["warsaw"], emoji: "🇵🇱" },
  { iata: "KRK", city: "Cracovia", country: "Polonia", region: "Europa", aliases: ["krakow"], emoji: "🇵🇱" },
  { iata: "OTP", city: "Bucarest", country: "Rumanía", region: "Europa", aliases: ["bucharest"], emoji: "🇷🇴" },
  { iata: "SOF", city: "Sofía", country: "Bulgaria", region: "Europa", emoji: "🇧🇬" },
  { iata: "TIA", city: "Tirana", country: "Albania", region: "Europa", emoji: "🇦🇱" },
  { iata: "BEG", city: "Belgrado", country: "Serbia", region: "Europa", aliases: ["belgrade"], emoji: "🇷🇸" },
  { iata: "SKG", city: "Tesalónica", country: "Grecia", region: "Europa", aliases: ["thessaloniki"], emoji: "🇬🇷" },
  { iata: "LJU", city: "Liubliana", country: "Eslovenia", region: "Europa", aliases: ["ljubljana"], emoji: "🇸🇮" },
  { iata: "ZAG", city: "Zagreb", country: "Croacia", region: "Europa", emoji: "🇭🇷" },
  { iata: "TLL", city: "Tallin", country: "Estonia", region: "Europa", aliases: ["tallinn"], emoji: "🇪🇪" },
  { iata: "RIX", city: "Riga", country: "Letonia", region: "Europa", emoji: "🇱🇻" },
  { iata: "VNO", city: "Vilna", country: "Lituania", region: "Europa", aliases: ["vilnius"], emoji: "🇱🇹" },
  { iata: "ARN", city: "Estocolmo", country: "Suecia", region: "Europa", aliases: ["stockholm"], emoji: "🇸🇪" },
  { iata: "CPH", city: "Copenhague", country: "Dinamarca", region: "Europa", aliases: ["copenhagen"], emoji: "🇩🇰" },
  { iata: "OSL", city: "Oslo", country: "Noruega", region: "Europa", emoji: "🇳🇴" },
  { iata: "BGO", city: "Bergen", country: "Noruega", region: "Europa", emoji: "🇳🇴" },
  { iata: "TRD", city: "Trondheim", country: "Noruega", region: "Europa", emoji: "🇳🇴" },
  { iata: "GOT", city: "Gotemburgo", country: "Suecia", region: "Europa", aliases: ["gothenburg"], emoji: "🇸🇪" },
  { iata: "HEL", city: "Helsinki", country: "Finlandia", region: "Europa", emoji: "🇫🇮" },
  { iata: "KEF", city: "Reikiavik", country: "Islandia", region: "Europa", aliases: ["reykjavik"], emoji: "🇮🇸" },
  { iata: "DBV", city: "Dubrovnik", country: "Croacia", region: "Europa", emoji: "🇭🇷" },
  { iata: "SPU", city: "Split", country: "Croacia", region: "Europa", emoji: "🇭🇷" },

  // América Norte
  { iata: "JFK", city: "Nueva York JFK", country: "Estados Unidos", region: "América Norte", aliases: ["new york", "nyc", "ny"], emoji: "🇺🇸" },
  { iata: "LGA", city: "Nueva York LaGuardia", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "EWR", city: "Newark", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "LAX", city: "Los Ángeles", country: "Estados Unidos", region: "América Norte", aliases: ["la", "los angeles"], emoji: "🇺🇸" },
  { iata: "SFO", city: "San Francisco", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "ORD", city: "Chicago", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "MIA", city: "Miami", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "BOS", city: "Boston", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "SEA", city: "Seattle", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "DFW", city: "Dallas", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "ATL", city: "Atlanta", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "LAS", city: "Las Vegas", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "MCO", city: "Orlando", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "IAD", city: "Washington Dulles", country: "Estados Unidos", region: "América Norte", aliases: ["washington dc"], emoji: "🇺🇸" },
  { iata: "DCA", city: "Washington Reagan", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "PHL", city: "Filadelfia", country: "Estados Unidos", region: "América Norte", aliases: ["philadelphia"], emoji: "🇺🇸" },
  { iata: "DTW", city: "Detroit", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "MSP", city: "Minneapolis", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "DEN", city: "Denver", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "PHX", city: "Phoenix", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "SAN", city: "San Diego", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "AUS", city: "Austin", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "TPA", city: "Tampa", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "FLL", city: "Fort Lauderdale", country: "Estados Unidos", region: "América Norte", emoji: "🇺🇸" },
  { iata: "HNL", city: "Honolulu", country: "Estados Unidos", region: "América Norte", aliases: ["hawaii"], emoji: "🇺🇸" },
  { iata: "ANC", city: "Anchorage", country: "Estados Unidos", region: "América Norte", aliases: ["alaska"], emoji: "🇺🇸" },
  { iata: "YYZ", city: "Toronto", country: "Canadá", region: "América Norte", emoji: "🇨🇦" },
  { iata: "YUL", city: "Montreal", country: "Canadá", region: "América Norte", emoji: "🇨🇦" },
  { iata: "YVR", city: "Vancouver", country: "Canadá", region: "América Norte", emoji: "🇨🇦" },
  { iata: "YYC", city: "Calgary", country: "Canadá", region: "América Norte", emoji: "🇨🇦" },
  { iata: "YOW", city: "Ottawa", country: "Canadá", region: "América Norte", emoji: "🇨🇦" },

  // Caribe + Centroamérica
  { iata: "CUN", city: "Cancún", country: "México", region: "Caribe", emoji: "🇲🇽" },
  { iata: "MEX", city: "Ciudad de México", country: "México", region: "América Norte", aliases: ["mexico df", "df"], emoji: "🇲🇽" },
  { iata: "PUJ", city: "Punta Cana", country: "República Dominicana", region: "Caribe", emoji: "🇩🇴" },
  { iata: "HAV", city: "La Habana", country: "Cuba", region: "Caribe", aliases: ["havana"], emoji: "🇨🇺" },
  { iata: "SJU", city: "San Juan", country: "Puerto Rico", region: "Caribe", emoji: "🇵🇷" },
  { iata: "MBJ", city: "Montego Bay", country: "Jamaica", region: "Caribe", emoji: "🇯🇲" },
  { iata: "NAS", city: "Nassau", country: "Bahamas", region: "Caribe", emoji: "🇧🇸" },
  { iata: "AUA", city: "Aruba", country: "Aruba", region: "Caribe", emoji: "🇦🇼" },
  { iata: "CUR", city: "Curazao", country: "Curazao", region: "Caribe", aliases: ["curacao"], emoji: "🇨🇼" },
  { iata: "BGI", city: "Barbados", country: "Barbados", region: "Caribe", emoji: "🇧🇧" },
  { iata: "GUA", city: "Ciudad de Guatemala", country: "Guatemala", region: "Caribe", aliases: ["guatemala"], emoji: "🇬🇹" },
  { iata: "SJO", city: "San José", country: "Costa Rica", region: "Caribe", aliases: ["costa rica"], emoji: "🇨🇷" },
  { iata: "PTY", city: "Ciudad de Panamá", country: "Panamá", region: "Caribe", aliases: ["panama"], emoji: "🇵🇦" },
  { iata: "SAL", city: "San Salvador", country: "El Salvador", region: "Caribe", emoji: "🇸🇻" },

  // Sudamérica
  { iata: "EZE", city: "Buenos Aires", country: "Argentina", region: "América Sur", aliases: ["bs as", "buenos aires"], emoji: "🇦🇷" },
  { iata: "GRU", city: "São Paulo", country: "Brasil", region: "América Sur", aliases: ["sao paulo"], emoji: "🇧🇷" },
  { iata: "GIG", city: "Río de Janeiro", country: "Brasil", region: "América Sur", aliases: ["rio"], emoji: "🇧🇷" },
  { iata: "LIM", city: "Lima", country: "Perú", region: "América Sur", emoji: "🇵🇪" },
  { iata: "BOG", city: "Bogotá", country: "Colombia", region: "América Sur", emoji: "🇨🇴" },
  { iata: "SCL", city: "Santiago de Chile", country: "Chile", region: "América Sur", aliases: ["santiago"], emoji: "🇨🇱" },
  { iata: "MVD", city: "Montevideo", country: "Uruguay", region: "América Sur", emoji: "🇺🇾" },
  { iata: "UIO", city: "Quito", country: "Ecuador", region: "América Sur", emoji: "🇪🇨" },
  { iata: "GYE", city: "Guayaquil", country: "Ecuador", region: "América Sur", emoji: "🇪🇨" },
  { iata: "ASU", city: "Asunción", country: "Paraguay", region: "América Sur", aliases: ["asuncion"], emoji: "🇵🇾" },
  { iata: "VVI", city: "Santa Cruz", country: "Bolivia", region: "América Sur", emoji: "🇧🇴" },
  { iata: "LPB", city: "La Paz", country: "Bolivia", region: "América Sur", emoji: "🇧🇴" },
  { iata: "BSB", city: "Brasilia", country: "Brasil", region: "América Sur", emoji: "🇧🇷" },
  { iata: "FOR", city: "Fortaleza", country: "Brasil", region: "América Sur", emoji: "🇧🇷" },
  { iata: "SSA", city: "Salvador", country: "Brasil", region: "América Sur", emoji: "🇧🇷" },
  { iata: "REC", city: "Recife", country: "Brasil", region: "América Sur", emoji: "🇧🇷" },
  { iata: "AEP", city: "Buenos Aires Aeroparque", country: "Argentina", region: "América Sur", emoji: "🇦🇷" },
  { iata: "MDZ", city: "Mendoza", country: "Argentina", region: "América Sur", emoji: "🇦🇷" },
  { iata: "CTG", city: "Cartagena", country: "Colombia", region: "América Sur", emoji: "🇨🇴" },
  { iata: "MDE", city: "Medellín", country: "Colombia", region: "América Sur", aliases: ["medellin"], emoji: "🇨🇴" },
  { iata: "CCS", city: "Caracas", country: "Venezuela", region: "América Sur", emoji: "🇻🇪" },

  // Asia
  { iata: "NRT", city: "Tokio Narita", country: "Japón", region: "Asia", aliases: ["tokyo"], emoji: "🇯🇵" },
  { iata: "HND", city: "Tokio Haneda", country: "Japón", region: "Asia", aliases: ["tokyo", "tokio"], emoji: "🇯🇵" },
  { iata: "KIX", city: "Osaka", country: "Japón", region: "Asia", emoji: "🇯🇵" },
  { iata: "ICN", city: "Seúl", country: "Corea del Sur", region: "Asia", aliases: ["seoul"], emoji: "🇰🇷" },
  { iata: "PEK", city: "Pekín", country: "China", region: "Asia", aliases: ["beijing"], emoji: "🇨🇳" },
  { iata: "PVG", city: "Shanghái", country: "China", region: "Asia", aliases: ["shanghai"], emoji: "🇨🇳" },
  { iata: "HKG", city: "Hong Kong", country: "Hong Kong", region: "Asia", emoji: "🇭🇰" },
  { iata: "SIN", city: "Singapur", country: "Singapur", region: "Asia", aliases: ["singapore"], emoji: "🇸🇬" },
  { iata: "BKK", city: "Bangkok", country: "Tailandia", region: "Asia", aliases: ["thai", "thailand"], emoji: "🇹🇭" },
  { iata: "HKT", city: "Phuket", country: "Tailandia", region: "Asia", aliases: ["thai", "thailand"], emoji: "🇹🇭" },
  { iata: "DPS", city: "Bali Denpasar", country: "Indonesia", region: "Asia", aliases: ["bali"], emoji: "🇮🇩" },
  { iata: "KUL", city: "Kuala Lumpur", country: "Malasia", region: "Asia", emoji: "🇲🇾" },
  { iata: "SGN", city: "Saigón", country: "Vietnam", region: "Asia", aliases: ["ho chi minh"], emoji: "🇻🇳" },
  { iata: "HAN", city: "Hanói", country: "Vietnam", region: "Asia", aliases: ["hanoi"], emoji: "🇻🇳" },
  { iata: "DEL", city: "Delhi", country: "India", region: "Asia", emoji: "🇮🇳" },
  { iata: "BOM", city: "Bombay", country: "India", region: "Asia", aliases: ["mumbai"], emoji: "🇮🇳" },
  { iata: "MLE", city: "Maldivas Malé", country: "Maldivas", region: "Asia", aliases: ["maldives"], emoji: "🇲🇻" },
  { iata: "CMB", city: "Colombo", country: "Sri Lanka", region: "Asia", emoji: "🇱🇰" },
  { iata: "TPE", city: "Taipéi", country: "Taiwán", region: "Asia", emoji: "🇹🇼" },
  { iata: "CGK", city: "Yakarta", country: "Indonesia", region: "Asia", aliases: ["jakarta"], emoji: "🇮🇩" },
  { iata: "MNL", city: "Manila", country: "Filipinas", region: "Asia", emoji: "🇵🇭" },
  { iata: "CEB", city: "Cebú", country: "Filipinas", region: "Asia", aliases: ["cebu"], emoji: "🇵🇭" },
  { iata: "PNH", city: "Phnom Penh", country: "Camboya", region: "Asia", emoji: "🇰🇭" },
  { iata: "REP", city: "Siem Reap", country: "Camboya", region: "Asia", aliases: ["angkor"], emoji: "🇰🇭" },
  { iata: "VTE", city: "Vientián", country: "Laos", region: "Asia", aliases: ["vientiane"], emoji: "🇱🇦" },
  { iata: "RGN", city: "Yangon", country: "Myanmar", region: "Asia", aliases: ["rangún"], emoji: "🇲🇲" },
  { iata: "KTM", city: "Katmandú", country: "Nepal", region: "Asia", aliases: ["kathmandu"], emoji: "🇳🇵" },
  { iata: "BLR", city: "Bangalore", country: "India", region: "Asia", aliases: ["bengaluru"], emoji: "🇮🇳" },
  { iata: "MAA", city: "Chennai", country: "India", region: "Asia", aliases: ["madras"], emoji: "🇮🇳" },
  { iata: "GOI", city: "Goa", country: "India", region: "Asia", emoji: "🇮🇳" },
  { iata: "CCU", city: "Calcuta", country: "India", region: "Asia", aliases: ["kolkata"], emoji: "🇮🇳" },
  { iata: "CAN", city: "Cantón", country: "China", region: "Asia", aliases: ["guangzhou"], emoji: "🇨🇳" },
  { iata: "SZX", city: "Shenzhen", country: "China", region: "Asia", emoji: "🇨🇳" },
  { iata: "CTU", city: "Chengdu", country: "China", region: "Asia", emoji: "🇨🇳" },
  { iata: "ULN", city: "Ulán Bator", country: "Mongolia", region: "Asia", aliases: ["ulaanbaatar"], emoji: "🇲🇳" },
  { iata: "TAS", city: "Taskent", country: "Uzbekistán", region: "Asia", aliases: ["tashkent"], emoji: "🇺🇿" },
  { iata: "ALA", city: "Almaty", country: "Kazajistán", region: "Asia", emoji: "🇰🇿" },

  // Oriente Medio
  { iata: "DXB", city: "Dubái", country: "EAU", region: "Oriente Medio", aliases: ["dubai"], emoji: "🇦🇪" },
  { iata: "AUH", city: "Abu Dhabi", country: "EAU", region: "Oriente Medio", emoji: "🇦🇪" },
  { iata: "DOH", city: "Doha", country: "Qatar", region: "Oriente Medio", emoji: "🇶🇦" },
  { iata: "IST", city: "Estambul", country: "Turquía", region: "Asia", aliases: ["istanbul"], emoji: "🇹🇷" },
  { iata: "TLV", city: "Tel Aviv", country: "Israel", region: "Oriente Medio", emoji: "🇮🇱" },
  { iata: "AMM", city: "Ammán", country: "Jordania", region: "Oriente Medio", emoji: "🇯🇴" },
  { iata: "RUH", city: "Riad", country: "Arabia Saudí", region: "Oriente Medio", aliases: ["riyadh"], emoji: "🇸🇦" },
  { iata: "JED", city: "Yeda", country: "Arabia Saudí", region: "Oriente Medio", aliases: ["jeddah", "meca"], emoji: "🇸🇦" },
  { iata: "KWI", city: "Kuwait", country: "Kuwait", region: "Oriente Medio", emoji: "🇰🇼" },
  { iata: "BAH", city: "Baréin", country: "Baréin", region: "Oriente Medio", aliases: ["bahrain"], emoji: "🇧🇭" },
  { iata: "MCT", city: "Mascate", country: "Omán", region: "Oriente Medio", aliases: ["muscat"], emoji: "🇴🇲" },
  { iata: "BEY", city: "Beirut", country: "Líbano", region: "Oriente Medio", emoji: "🇱🇧" },
  { iata: "SAW", city: "Estambul Sabiha", country: "Turquía", region: "Asia", aliases: ["sabiha gokcen"], emoji: "🇹🇷" },
  { iata: "AYT", city: "Antalya", country: "Turquía", region: "Asia", emoji: "🇹🇷" },
  { iata: "ESB", city: "Ankara", country: "Turquía", region: "Asia", emoji: "🇹🇷" },

  // África
  { iata: "RAK", city: "Marrakech", country: "Marruecos", region: "África", emoji: "🇲🇦" },
  { iata: "CMN", city: "Casablanca", country: "Marruecos", region: "África", emoji: "🇲🇦" },
  { iata: "RBA", city: "Rabat", country: "Marruecos", region: "África", emoji: "🇲🇦" },
  { iata: "CAI", city: "El Cairo", country: "Egipto", region: "África", aliases: ["cairo"], emoji: "🇪🇬" },
  { iata: "SSH", city: "Sharm El Sheikh", country: "Egipto", region: "Oriente Medio", emoji: "🇪🇬" },
  { iata: "JNB", city: "Johannesburgo", country: "Sudáfrica", region: "África", aliases: ["johannesburg"], emoji: "🇿🇦" },
  { iata: "CPT", city: "Cape Town", country: "Sudáfrica", region: "África", aliases: ["ciudad del cabo"], emoji: "🇿🇦" },
  { iata: "NBO", city: "Nairobi", country: "Kenia", region: "África", emoji: "🇰🇪" },
  { iata: "ADD", city: "Adís Abeba", country: "Etiopía", region: "África", emoji: "🇪🇹" },
  { iata: "TNR", city: "Antananarivo", country: "Madagascar", region: "África", emoji: "🇲🇬" },
  { iata: "DKR", city: "Dakar", country: "Senegal", region: "África", emoji: "🇸🇳" },
  { iata: "LOS", city: "Lagos", country: "Nigeria", region: "África", emoji: "🇳🇬" },
  { iata: "ABV", city: "Abuya", country: "Nigeria", region: "África", aliases: ["abuja"], emoji: "🇳🇬" },
  { iata: "ACC", city: "Acra", country: "Ghana", region: "África", aliases: ["accra"], emoji: "🇬🇭" },
  { iata: "DAR", city: "Dar es Salaam", country: "Tanzania", region: "África", emoji: "🇹🇿" },
  { iata: "ZNZ", city: "Zanzíbar", country: "Tanzania", region: "África", aliases: ["zanzibar"], emoji: "🇹🇿" },
  { iata: "JRO", city: "Kilimanjaro", country: "Tanzania", region: "África", aliases: ["arusha", "safari"], emoji: "🇹🇿" },
  { iata: "EBB", city: "Entebbe", country: "Uganda", region: "África", emoji: "🇺🇬" },
  { iata: "LUN", city: "Lusaka", country: "Zambia", region: "África", emoji: "🇿🇲" },
  { iata: "MRU", city: "Mauricio", country: "Mauricio", region: "África", aliases: ["mauritius"], emoji: "🇲🇺" },
  { iata: "SEZ", city: "Seychelles", country: "Seychelles", region: "África", emoji: "🇸🇨" },
  { iata: "TUN", city: "Túnez", country: "Túnez", region: "África", aliases: ["tunis"], emoji: "🇹🇳" },
  { iata: "ALG", city: "Argel", country: "Argelia", region: "África", aliases: ["alger", "algiers"], emoji: "🇩🇿" },

  // Oceanía
  { iata: "SYD", city: "Sídney", country: "Australia", region: "Oceanía", aliases: ["sydney"], emoji: "🇦🇺" },
  { iata: "MEL", city: "Melbourne", country: "Australia", region: "Oceanía", emoji: "🇦🇺" },
  { iata: "BNE", city: "Brisbane", country: "Australia", region: "Oceanía", emoji: "🇦🇺" },
  { iata: "AKL", city: "Auckland", country: "Nueva Zelanda", region: "Oceanía", emoji: "🇳🇿" },
  { iata: "PER", city: "Perth", country: "Australia", region: "Oceanía", emoji: "🇦🇺" },
  { iata: "ADL", city: "Adelaide", country: "Australia", region: "Oceanía", emoji: "🇦🇺" },
  { iata: "CNS", city: "Cairns", country: "Australia", region: "Oceanía", emoji: "🇦🇺" },
  { iata: "OOL", city: "Gold Coast", country: "Australia", region: "Oceanía", emoji: "🇦🇺" },
  { iata: "CHC", city: "Christchurch", country: "Nueva Zelanda", region: "Oceanía", emoji: "🇳🇿" },
  { iata: "WLG", city: "Wellington", country: "Nueva Zelanda", region: "Oceanía", emoji: "🇳🇿" },
  { iata: "NAN", city: "Nadi", country: "Fiyi", region: "Oceanía", aliases: ["fiji"], emoji: "🇫🇯" },
  { iata: "PPT", city: "Tahití Papeete", country: "Polinesia Francesa", region: "Oceanía", emoji: "🇵🇫" },
];

// Index para país → aeropuertos (para sugerir todos los aeropuertos de un país)
const COUNTRY_INDEX = new Map<string, AirportEntry[]>();
for (const a of AIRPORTS_CATALOG) {
  const k = a.country.toLowerCase();
  if (!COUNTRY_INDEX.has(k)) COUNTRY_INDEX.set(k, []);
  COUNTRY_INDEX.get(k)!.push(a);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .trim();
}

/**
 * fuzzySearchAirports — busca por IATA exacto, luego ciudad/país/alias.
 * Devuelve top N ordenados por score.
 */
export function fuzzySearchAirports(query: string, limit = 18): AirportEntry[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  // Score: 100 IATA exacto, 90 ciudad startsWith, 70 ciudad contiene, 50 país, 40 alias
  const scored: Array<{ a: AirportEntry; score: number }> = [];
  for (const a of AIRPORTS_CATALOG) {
    const iataN = a.iata.toLowerCase();
    const cityN = normalize(a.city);
    const countryN = normalize(a.country);
    let score = 0;
    if (iataN === q) score = 100;
    else if (iataN.startsWith(q) && q.length >= 2) score = 95;
    else if (cityN === q) score = 95;
    else if (cityN.startsWith(q)) score = 90;
    else if (cityN.includes(q)) score = 70;
    else if (countryN === q) score = 80; // país exacto
    else if (countryN.startsWith(q)) score = 60;
    else if (countryN.includes(q)) score = 50;
    else if (a.aliases?.some((al) => normalize(al).includes(q))) score = 40;
    if (score > 0) scored.push({ a, score });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((s) => s.a);
}

export function getAirportsByCountry(country: string): AirportEntry[] {
  return COUNTRY_INDEX.get(country.toLowerCase()) || [];
}

export function getAirportByIata(iata: string): AirportEntry | undefined {
  const k = iata.toUpperCase();
  return AIRPORTS_CATALOG.find((a) => a.iata === k);
}
