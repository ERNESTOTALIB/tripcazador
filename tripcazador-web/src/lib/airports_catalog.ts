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

// Tipo Region — string en runtime para evitar TS2590 con 6000+ entries
// (la unión literal × 6000 elementos rebasa el límite del checker).
// Se valida en bash via /tmp/build_catalog.mjs antes de generar este archivo.
export type Region = string;

export interface AirportEntry {
  iata: string;
  city: string;
  country: string;
  region: Region;
  /** alias adicionales para fuzzy match, ej: ["barajas", "adolfo suárez"] */
  aliases?: string[];
  emoji?: string;
}

export const AIRPORTS_CATALOG = ([
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
  { iata: "ZAD", city: "Zadar", country: "Croacia", region: "Europa", emoji: "🇭🇷" },
  { iata: "PUY", city: "Pula", country: "Croacia", region: "Europa", emoji: "🇭🇷" },
  { iata: "TIV", city: "Tivat", country: "Montenegro", region: "Europa", emoji: "🇲🇪" },
  { iata: "TGD", city: "Podgorica", country: "Montenegro", region: "Europa", emoji: "🇲🇪" },

  // Europa — secundarios Alemania (CCC1)
  { iata: "FKB", city: "Karlsruhe Baden-Baden", country: "Alemania", region: "Europa", aliases: ["baden baden", "baden-baden", "karlsruhe", "soellingen"], emoji: "🇩🇪" },
  { iata: "FMM", city: "Memmingen", country: "Alemania", region: "Europa", aliases: ["münchen-west", "allgäu"], emoji: "🇩🇪" },
  { iata: "FDH", city: "Friedrichshafen", country: "Alemania", region: "Europa", aliases: ["bodensee", "lago constanza"], emoji: "🇩🇪" },
  { iata: "NRN", city: "Düsseldorf Weeze", country: "Alemania", region: "Europa", aliases: ["weeze", "niederrhein"], emoji: "🇩🇪" },
  { iata: "DTM", city: "Dortmund", country: "Alemania", region: "Europa", emoji: "🇩🇪" },
  { iata: "BRE", city: "Bremen", country: "Alemania", region: "Europa", emoji: "🇩🇪" },
  { iata: "HAJ", city: "Hannover", country: "Alemania", region: "Europa", aliases: ["hanover"], emoji: "🇩🇪" },
  { iata: "FMO", city: "Münster Osnabrück", country: "Alemania", region: "Europa", aliases: ["munster", "osnabruck"], emoji: "🇩🇪" },
  { iata: "PAD", city: "Paderborn Lippstadt", country: "Alemania", region: "Europa", aliases: ["paderborn"], emoji: "🇩🇪" },
  { iata: "SCN", city: "Saarbrücken", country: "Alemania", region: "Europa", aliases: ["saarbrucken"], emoji: "🇩🇪" },
  { iata: "RLG", city: "Rostock Laage", country: "Alemania", region: "Europa", aliases: ["rostock"], emoji: "🇩🇪" },
  { iata: "ERF", city: "Erfurt Weimar", country: "Alemania", region: "Europa", aliases: ["erfurt"], emoji: "🇩🇪" },

  // Europa — secundarios Italia (CCC1)
  { iata: "AHO", city: "Alguer", country: "Italia", region: "Europa", aliases: ["alghero", "cerdena", "sardinia"], emoji: "🇮🇹" },
  { iata: "BDS", city: "Brindisi", country: "Italia", region: "Europa", aliases: ["puglia"], emoji: "🇮🇹" },
  { iata: "TPS", city: "Trapani", country: "Italia", region: "Europa", aliases: ["sicilia oeste"], emoji: "🇮🇹" },
  { iata: "TRS", city: "Trieste", country: "Italia", region: "Europa", aliases: ["friuli"], emoji: "🇮🇹" },
  { iata: "AOI", city: "Ancona", country: "Italia", region: "Europa", aliases: ["marche"], emoji: "🇮🇹" },
  { iata: "RMI", city: "Rímini", country: "Italia", region: "Europa", aliases: ["rimini", "riviera romagnola"], emoji: "🇮🇹" },
  { iata: "PMF", city: "Parma", country: "Italia", region: "Europa", emoji: "🇮🇹" },
  { iata: "PEG", city: "Perugia", country: "Italia", region: "Europa", aliases: ["umbria"], emoji: "🇮🇹" },
  { iata: "OLB", city: "Olbia", country: "Italia", region: "Europa", aliases: ["costa esmeralda", "sardinia norte"], emoji: "🇮🇹" },

  // Europa — secundarios Francia (CCC1)
  { iata: "BVA", city: "París Beauvais", country: "Francia", region: "Europa", aliases: ["beauvais", "paris beauvais", "tille"], emoji: "🇫🇷" },
  { iata: "LIL", city: "Lille", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "CFE", city: "Clermont-Ferrand", country: "Francia", region: "Europa", aliases: ["clermont"], emoji: "🇫🇷" },
  { iata: "BES", city: "Brest", country: "Francia", region: "Europa", aliases: ["bretagne"], emoji: "🇫🇷" },
  { iata: "RNS", city: "Rennes", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "MPL", city: "Montpellier", country: "Francia", region: "Europa", emoji: "🇫🇷" },
  { iata: "AJA", city: "Ajaccio", country: "Francia", region: "Europa", aliases: ["corcega", "corsica"], emoji: "🇫🇷" },
  { iata: "BIA", city: "Bastia", country: "Francia", region: "Europa", aliases: ["corse"], emoji: "🇫🇷" },
  { iata: "PGF", city: "Perpiñán", country: "Francia", region: "Europa", aliases: ["perpignan"], emoji: "🇫🇷" },
  { iata: "SXB", city: "Estrasburgo", country: "Francia", region: "Europa", aliases: ["strasbourg"], emoji: "🇫🇷" },
  { iata: "FNI", city: "Nimes", country: "Francia", region: "Europa", aliases: ["nimes camargue"], emoji: "🇫🇷" },
  { iata: "TLN", city: "Tolón Hyères", country: "Francia", region: "Europa", aliases: ["toulon", "hyeres"], emoji: "🇫🇷" },

  // Europa — secundarios Reino Unido / Irlanda (CCC1)
  { iata: "ABZ", city: "Aberdeen", country: "Reino Unido", region: "Europa", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { iata: "INV", city: "Inverness", country: "Reino Unido", region: "Europa", aliases: ["highlands"], emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { iata: "BHD", city: "Belfast City", country: "Reino Unido", region: "Europa", emoji: "🏴󠁧󠁢" },
  { iata: "EXT", city: "Exeter", country: "Reino Unido", region: "Europa", aliases: ["devon"], emoji: "🏴󠁧󠁢" },
  { iata: "CWL", city: "Cardiff", country: "Reino Unido", region: "Europa", aliases: ["wales", "gales"], emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { iata: "EMA", city: "East Midlands", country: "Reino Unido", region: "Europa", aliases: ["nottingham", "derby"], emoji: "🏴󠁧󠁢" },
  { iata: "SEN", city: "Londres Southend", country: "Reino Unido", region: "Europa", aliases: ["southend"], emoji: "🏴󠁧󠁢" },
  { iata: "DSA", city: "Doncaster Sheffield", country: "Reino Unido", region: "Europa", emoji: "🏴󠁧󠁢" },
  { iata: "KIR", city: "Kerry", country: "Irlanda", region: "Europa", aliases: ["killarney"], emoji: "🇮🇪" },
  { iata: "NOC", city: "Knock Ireland West", country: "Irlanda", region: "Europa", aliases: ["knock"], emoji: "🇮🇪" },

  // Europa — secundarios Bélgica/Países Bajos (CCC1)
  { iata: "CRL", city: "Bruselas Charleroi", country: "Bélgica", region: "Europa", aliases: ["charleroi", "brussels south"], emoji: "🇧🇪" },
  { iata: "ANR", city: "Amberes", country: "Bélgica", region: "Europa", aliases: ["antwerp", "anvers"], emoji: "🇧🇪" },
  { iata: "EIN", city: "Eindhoven", country: "Países Bajos", region: "Europa", emoji: "🇳🇱" },
  { iata: "RTM", city: "Rotterdam", country: "Países Bajos", region: "Europa", emoji: "🇳🇱" },

  // Europa — secundarios Escandinavia/Báltico (CCC1)
  { iata: "BLL", city: "Billund", country: "Dinamarca", region: "Europa", aliases: ["legoland"], emoji: "🇩🇰" },
  { iata: "AAL", city: "Aalborg", country: "Dinamarca", region: "Europa", aliases: ["aalborg"], emoji: "🇩🇰" },
  { iata: "AAR", city: "Aarhus", country: "Dinamarca", region: "Europa", emoji: "🇩🇰" },
  { iata: "MMX", city: "Malmö", country: "Suecia", region: "Europa", aliases: ["malmo"], emoji: "🇸🇪" },
  { iata: "NYO", city: "Estocolmo Skavsta", country: "Suecia", region: "Europa", aliases: ["nykoping", "skavsta"], emoji: "🇸🇪" },
  { iata: "TMP", city: "Tampere", country: "Finlandia", region: "Europa", emoji: "🇫🇮" },
  { iata: "OUL", city: "Oulu", country: "Finlandia", region: "Europa", emoji: "🇫🇮" },
  { iata: "RVN", city: "Rovaniemi Laponia", country: "Finlandia", region: "Europa", aliases: ["lapland", "santa"], emoji: "🇫🇮" },
  { iata: "TOS", city: "Tromsø", country: "Noruega", region: "Europa", aliases: ["tromso", "auroras boreales"], emoji: "🇳🇴" },
  { iata: "SVG", city: "Stavanger", country: "Noruega", region: "Europa", emoji: "🇳🇴" },

  // Europa — secundarios Grecia + islas (CCC1)
  { iata: "KGS", city: "Kos", country: "Grecia", region: "Europa", emoji: "🇬🇷" },
  { iata: "ZTH", city: "Zante", country: "Grecia", region: "Europa", aliases: ["zakynthos", "zakinthos"], emoji: "🇬🇷" },
  { iata: "PVK", city: "Préveza Lefkada", country: "Grecia", region: "Europa", aliases: ["preveza", "lefkada"], emoji: "🇬🇷" },
  { iata: "CHQ", city: "Chania Creta", country: "Grecia", region: "Europa", aliases: ["chania", "la canea"], emoji: "🇬🇷" },
  { iata: "VOL", city: "Volos", country: "Grecia", region: "Europa", aliases: ["pelion", "skiathos near"], emoji: "🇬🇷" },
  { iata: "JSI", city: "Skiathos", country: "Grecia", region: "Europa", emoji: "🇬🇷" },
  { iata: "EFL", city: "Cefalonia", country: "Grecia", region: "Europa", aliases: ["kefalonia"], emoji: "🇬🇷" },

  // Europa — secundarios Bulgaria/Rumanía/Eslovaquia/Bosnia (CCC1)
  { iata: "VAR", city: "Varna", country: "Bulgaria", region: "Europa", aliases: ["mar negro"], emoji: "🇧🇬" },
  { iata: "BOJ", city: "Burgas", country: "Bulgaria", region: "Europa", aliases: ["sunny beach"], emoji: "🇧🇬" },
  { iata: "CLJ", city: "Cluj-Napoca", country: "Rumanía", region: "Europa", aliases: ["cluj", "transilvania"], emoji: "🇷🇴" },
  { iata: "TSR", city: "Timișoara", country: "Rumanía", region: "Europa", aliases: ["timisoara"], emoji: "🇷🇴" },
  { iata: "BTS", city: "Bratislava", country: "Eslovaquia", region: "Europa", emoji: "🇸🇰" },
  { iata: "SJJ", city: "Sarajevo", country: "Bosnia y Herzegovina", region: "Europa", emoji: "🇧🇦" },
  { iata: "TZL", city: "Tuzla", country: "Bosnia y Herzegovina", region: "Europa", emoji: "🇧🇦" },
  { iata: "SKP", city: "Skopie", country: "Macedonia del Norte", region: "Europa", aliases: ["skopje"], emoji: "🇲🇰" },
  { iata: "PRN", city: "Pristina", country: "Kosovo", region: "Europa", aliases: ["prishtina"], emoji: "🇽🇰" },
  { iata: "KIV", city: "Chisinau", country: "Moldavia", region: "Europa", aliases: ["chișinău"], emoji: "🇲🇩" },

  // Europa — secundarios Polonia/Chequia/Hungría/Países nórdicos extras (CCC1)
  { iata: "WMI", city: "Varsovia Modlin", country: "Polonia", region: "Europa", aliases: ["modlin", "warsaw modlin"], emoji: "🇵🇱" },
  { iata: "GDN", city: "Gdansk", country: "Polonia", region: "Europa", aliases: ["danzig"], emoji: "🇵🇱" },
  { iata: "POZ", city: "Poznan", country: "Polonia", region: "Europa", emoji: "🇵🇱" },
  { iata: "WRO", city: "Wroclaw", country: "Polonia", region: "Europa", aliases: ["breslavia"], emoji: "🇵🇱" },
  { iata: "KTW", city: "Katowice", country: "Polonia", region: "Europa", emoji: "🇵🇱" },
  { iata: "BRQ", city: "Brno", country: "Chequia", region: "Europa", emoji: "🇨🇿" },
  { iata: "DEB", city: "Debrecen", country: "Hungría", region: "Europa", emoji: "🇭🇺" },

  // Europa — secundarios Turquía costa (CCC1)
  { iata: "BJV", city: "Bodrum", country: "Turquía", region: "Asia", aliases: ["milas-bodrum"], emoji: "🇹🇷" },
  { iata: "DLM", city: "Dalaman", country: "Turquía", region: "Asia", aliases: ["fethiye", "marmaris"], emoji: "🇹🇷" },
  { iata: "ADB", city: "Esmirna", country: "Turquía", region: "Asia", aliases: ["izmir", "smyrna"], emoji: "🇹🇷" },
  { iata: "GZP", city: "Gazipaşa", country: "Turquía", region: "Asia", aliases: ["gazipasa", "alanya"], emoji: "🇹🇷" },
  { iata: "TZX", city: "Trabzon", country: "Turquía", region: "Asia", emoji: "🇹🇷" },

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

] as AirportEntry[]);

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
    .replace(/[-_]+/g, " ")            // dash/underscore \u2192 space (Baden-Baden \u2194 baden baden)
    .replace(/\s+/g, " ")               // collapse spaces
    .trim();
}

/**
 * fuzzySearchAirports — busca por IATA exacto, luego ciudad/país/alias.
 * Devuelve top N ordenados por score.
 */
export function fuzzySearchAirports(query: string, limit = 18): AirportEntry[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  // Si la consulta tiene varios tokens (ej: "frankfurt hahn", "baden baden")
  // exigimos que TODOS aparezcan en algún campo combinado para evitar ruido.
  const tokens = q.split(" ").filter(Boolean);
  const isMultiToken = tokens.length > 1;

  // Sistema de puntuación (más alto = mejor match):
  //   110 IATA exacto                             ("FKB"        → FKB)
  //   100 ciudad exacta                           ("bari"       → BRI)
  //    95 IATA startsWith                          ("FK"         → FKB, FCO…)
  //    92 alias exacto                             ("munchen"    → MUC)
  //    90 ciudad startsWith                        ("baden"      → FKB)
  //    85 alias startsWith                         ("zaki"       → ZTH)
  //    78 país exacto                              ("alemania"   → todos DE)
  //    72 ciudad contiene                          ("frankfurt"  → FRA, HHN)
  //    65 alias contiene                           ("legoland"   → BLL)
  //    60 país startsWith                          ("alem"       → todos DE)
  //    50 país contiene                            ("aleman"     → todos DE)
  //    35 multi-token: todos los tokens aparecen en algún campo
  // Tiebreaker: ciudades más cortas ganan (más específicas).
  const scored: Array<{ a: AirportEntry; score: number; tieLen: number }> = [];
  for (const a of AIRPORTS_CATALOG) {
    const iataN = a.iata.toLowerCase();
    const cityN = normalize(a.city);
    const countryN = normalize(a.country);
    const aliasNs = (a.aliases || []).map((al) => normalize(al));

    let score = 0;
    if (iataN === q) score = 110;
    else if (cityN === q) score = 100;
    else if (iataN.startsWith(q) && q.length >= 2) score = 95;
    else if (aliasNs.some((al) => al === q)) score = 92;
    else if (cityN.startsWith(q)) score = 90;
    else if (aliasNs.some((al) => al.startsWith(q))) score = 85;
    else if (countryN === q) score = 78;
    else if (cityN.includes(q)) score = 72;
    else if (aliasNs.some((al) => al.includes(q))) score = 65;
    else if (countryN.startsWith(q)) score = 60;
    else if (countryN.includes(q)) score = 50;
    else if (isMultiToken) {
      // Match relajado por tokens: todos los tokens en haystack combinado
      const hay = `${iataN} ${cityN} ${countryN} ${aliasNs.join(" ")}`;
      if (tokens.every((t) => hay.includes(t))) score = 35;
    }

    if (score > 0) scored.push({ a, score, tieLen: cityN.length });
  }
  // Sort por score desc, tiebreaker: ciudad más corta primero (más específica)
  scored.sort((x, y) => (y.score - x.score) || (x.tieLen - y.tieLen));
  return scored.slice(0, limit).map((s) => s.a);
}

export function getAirportsByCountry(country: string): AirportEntry[] {
  return COUNTRY_INDEX.get(country.toLowerCase()) || [];
}

export function getAirportByIata(iata: string): AirportEntry | undefined {
  const k = iata.toUpperCase();
  // Buscar primero en curated (eager), luego en bulk (si ya está cargado)
  return (
    AIRPORTS_CATALOG.find((a) => a.iata === k) ||
    BULK_AIRPORTS.find((a) => a.iata === k)
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DDD1 (Apr 2026): bulk catalog (5663 OpenFlights entries) cargado bajo demanda
// para evitar inflar el bundle inicial. AirportCombobox llama a
// `loadBulkAirports()` en el primer focus para que `fuzzySearchAirports()`
// pueda extender la búsqueda al catálogo completo sin penalizar el FCP.
// ────────────────────────────────────────────────────────────────────────────

let BULK_AIRPORTS: AirportEntry[] = [];
let bulkLoadPromise: Promise<AirportEntry[]> | null = null;

/** Estado del carga del bulk catalog (para UI de "cargando aeropuertos exhaustivos…"). */
export function isBulkAirportsLoaded(): boolean {
  return BULK_AIRPORTS.length > 0;
}

/** Devuelve el array bulk si ya está cargado, o vacío si todavía no. No bloquea. */
export function getBulkAirports(): AirportEntry[] {
  return BULK_AIRPORTS;
}

/**
 * Carga `/airports_full.json` (5663 entries) en background. Idempotente —
 * llamadas repetidas comparten la misma promesa y al final la lista en memoria.
 *
 * Usar via `loadBulkAirports().then(...)` o como fire-and-forget desde un
 * useEffect/onFocus.
 */
export function loadBulkAirports(): Promise<AirportEntry[]> {
  if (BULK_AIRPORTS.length > 0) return Promise.resolve(BULK_AIRPORTS);
  if (bulkLoadPromise) return bulkLoadPromise;

  // SSR safety: en server no fetch; ya tenemos curated suficiente para SEO.
  if (typeof fetch === "undefined") return Promise.resolve([]);

  bulkLoadPromise = fetch("/airports_full.json", { cache: "force-cache" })
    .then((r) => (r.ok ? r.json() : []))
    .then((data: AirportEntry[]) => {
      // Dedup contra curated (por seguridad si OpenFlights tuviese overlap)
      const curatedSet = new Set(AIRPORTS_CATALOG.map((a) => a.iata));
      BULK_AIRPORTS = data.filter((a) => !curatedSet.has(a.iata));
      return BULK_AIRPORTS;
    })
    .catch(() => {
      bulkLoadPromise = null; // permite reintento futuro
      return [];
    });

  return bulkLoadPromise;
}

/**
 * Variante extendida de `fuzzySearchAirports` que también busca en el bulk
 * catalog si está cargado. Si no, idéntica a la curated. Mantenemos la API
 * de la función original para retro-compatibilidad — código existente sigue
 * funcionando sin cambios.
 */
export function fuzzySearchAirportsAll(query: string, limit = 18): AirportEntry[] {
  const curatedHits = fuzzySearchAirports(query, limit * 2);
  if (BULK_AIRPORTS.length === 0) return curatedHits.slice(0, limit);

  // Re-aplicar el mismo algoritmo sobre bulk + merge ordenado por score
  // Reutilizamos la lógica embebiéndola in-line (no exportable porque el helper
  // es local). Approach: ejecutar fuzzy contra union temporal.
  const q = query.trim().toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (q.length < 2) return curatedHits.slice(0, limit);
  const tokens = q.split(" ").filter(Boolean);
  const isMultiToken = tokens.length > 1;

  const scored: Array<{ a: AirportEntry; score: number; tieLen: number }> = [];
  // Score curated hits con score mucho más alto para priorizar siempre
  curatedHits.forEach((a, i) => scored.push({ a, score: 1000 - i, tieLen: 0 }));

  for (const a of BULK_AIRPORTS) {
    const iataN = a.iata.toLowerCase();
    const cityN = a.city.toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");
    const countryN = a.country.toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    let score = 0;
    if (iataN === q) score = 110;
    else if (cityN === q) score = 100;
    else if (iataN.startsWith(q) && q.length >= 2) score = 95;
    else if (cityN.startsWith(q)) score = 90;
    else if (countryN === q) score = 78;
    else if (cityN.includes(q)) score = 72;
    else if (countryN.startsWith(q)) score = 60;
    else if (countryN.includes(q)) score = 50;
    else if (isMultiToken) {
      const hay = `${iataN} ${cityN} ${countryN}`;
      if (tokens.every((t) => hay.includes(t))) score = 35;
    }
    if (score > 0) scored.push({ a, score, tieLen: cityN.length });
  }
  scored.sort((x, y) => (y.score - x.score) || (x.tieLen - y.tieLen));
  // Dedup por IATA (curated puede aparecer en ambos)
  const seen = new Set<string>();
  const out: AirportEntry[] = [];
  for (const s of scored) {
    if (seen.has(s.a.iata)) continue;
    seen.add(s.a.iata);
    out.push(s.a);
    if (out.length >= limit) break;
  }
  return out;
}
