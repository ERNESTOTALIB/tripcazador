import { getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { HotelCard } from "@/components/HotelCard";
import { JsonLd } from "@/components/JsonLd";
import { getHotelSeedFallback } from "@/lib/hotel_seed";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GetYourGuideWidget } from "@/components/GetYourGuideWidget";
import { EsimBanner } from "@/components/EsimBanner";
import { TravelInsuranceCTA } from "@/components/TravelInsuranceCTA";
import { TravelToolkit } from "@/components/TravelToolkit";

// Datos de destinos (se puede mover a una BD/CMS)
const DESTINATIONS: Record<string, {
  name: string;
  iata: string[];
  country: string;
  emoji: string;
  description: string;
  bestMonths: string[];
  avgTemp: string;
  flightTime: string;
  tips: string[];
}> = {
  "tanzania": {
    name: "Tanzania",
    iata: ["ZNZ", "DAR", "JRO"],
    country: "Tanzania, África Oriental",
    emoji: "🦁",
    description: "Tanzania es el destino perfecto para combinar safari en el Serengeti con las playas de ensueño de Zanzíbar. Un vuelo, dos experiencias únicas.",
    bestMonths: ["Enero", "Febrero", "Junio", "Julio", "Agosto", "Septiembre", "Octubre"],
    avgTemp: "25-30°C",
    flightTime: "~11h desde Europa (con escala)",
    tips: [
      "Mejor época: Junio-Octubre (temporada seca, mejor para safari)",
      "Zanzíbar: Diciembre-Febrero y Junio-Octubre (fuera de monzones)",
      "Evitar Marzo-Mayo (monzón largo) y Noviembre (monzón corto)",
      "Visado: e-visa online antes de volar (50 USD)",
      "Vacunas: fiebre amarilla recomendada, malaria prophylaxis",
    ],
  },
  "japon": {
    name: "Japón",
    iata: ["NRT", "HND", "KIX"],
    country: "Japón, Asia Oriental",
    emoji: "🗼",
    description: "Error fares a Japón son frecuentes desde Europa. La mejor combinación: vuelos de error + temporada de flores o otoño.",
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    avgTemp: "10-25°C (varía mucho por estación)",
    flightTime: "~12-14h desde Europa",
    tips: [
      "Cerezos (sakura): finales de Marzo - principios de Abril",
      "Otoño (koyo): Octubre - Noviembre (hojas rojas)",
      "Evitar: Agosto (calor extremo y lluvias) y Obon (15 Agosto)",
      "JR Pass: comprar antes de volar, vale la pena si viajas a múltiples ciudades",
      "Error fares frecuentes: ANA, JAL, Air France con escala",
    ],
  },
  "maldivas": {
    name: "Maldivas",
    iata: ["MLE"],
    country: "Maldivas, Océano Índico",
    emoji: "🏝️",
    description: "Los error fares a Maldivas son raros pero existen — especialmente en Business class. El precio normal es alto, lo que hace los errores más llamativos.",
    bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"],
    avgTemp: "28-32°C todo el año",
    flightTime: "~10-12h desde Europa (con escala en DXB o CMB)",
    tips: [
      "Mejor época: Noviembre - Abril (estación seca)",
      "Evitar: Mayo - Octubre (monzones, aunque hay ofertas)",
      "Transporte: seaplanes o lanchas rápidas al resort (reservar con antelación)",
      "Buget travel: guesthouses en islas locales desde 50€/noche",
      "Business class frecuente con Emirates o Qatar (escala DXB/DOH)",
    ],
  },
  "nueva-york": {
    name: "Nueva York",
    iata: ["JFK", "EWR", "LGA"],
    country: "EE.UU., América del Norte",
    emoji: "🗽",
    description: "Nueva York tiene la mayor densidad de error fares transatlánticos. Especialmente en Business con American, Delta o United desde hubs europeos.",
    bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"],
    avgTemp: "0-30°C (varía mucho)",
    flightTime: "~8-9h desde Europa occidental",
    tips: [
      "Mejor época: Primavera (Abril-Mayo) y Otoño (Sep-Oct)",
      "Navidades: muy caras pero mágicas — esperar error fares",
      "ESTA: autorización obligatoria para ciudadanos UE (21 USD)",
      "Business error fares: más frecuentes con DL, AA, UA en BA/CDG/AMS/ZRH",
      "Aeropuertos: JFK más céntrico para Manhattan, EWR más barato",
    ],
  },
  "bali": {
    name: "Bali",
    iata: ["DPS"],
    country: "Indonesia, Asia",
    emoji: "🌴",
    description: "Bali es uno de los destinos más buscados del mundo. Los vuelos desde Europa suelen ser con escala en Singapore, Kuala Lumpur o Doha.",
    bestMonths: ["Mayo", "Junio", "Julio", "Agosto", "Septiembre"],
    avgTemp: "27-32°C",
    flightTime: "~15-17h desde Europa (con escala)",
    tips: [
      "Mejor época: Mayo - Septiembre (estación seca)",
      "Evitar: Enero - Marzo (lluvias, aunque hay chollos)",
      "Ubud para cultura, Seminyak/Canggu para playa y nightlife",
      "Visa on arrival: 35 USD (extendible)",
      "Error fares frecuentes vía SIN (Singapore Airlines) o KUL (AirAsia)",
    ],
  },
  "buenos-aires": {
    name: "Buenos Aires",
    iata: ["EZE", "AEP"],
    country: "Argentina, América del Sur",
    emoji: "🥩",
    description: "Buenos Aires es la capital del tango, el asado y una de las ciudades más europeas de América. Los vuelos desde Europa son frecuentemente fuente de error fares.",
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    avgTemp: "15-28°C (temporada opuesta a Europa)",
    flightTime: "~13-14h desde Europa",
    tips: [
      "Mejor época: Septiembre - Noviembre y Marzo - Mayo (primavera/otoño austral)",
      "Evitar: Enero - Febrero (calor extremo y vacaciones locales)",
      "Aeropuerto: EZE para vuelos internacionales, AEP para vuelos internos",
      "Peso argentino: cambio oficial vs. blue (consultar antes de volar)",
      "Error fares: Iberia, Air France, Aerolíneas Argentinas desde MAD/CDG",
    ],
  },
  "tailandia": {
    name: "Tailandia",
    iata: ["BKK", "DMK", "HKT", "CNX"],
    country: "Tailandia, Sudeste Asiático",
    emoji: "🛕",
    description: "Desde los templos de Bangkok hasta las playas de Phuket y Krabi. Destino asequible con vuelos directos o con escala en Doha/Dubai.",
    bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero"],
    avgTemp: "27-33°C",
    flightTime: "~11-13h desde Europa (con escala)",
    tips: [
      "Mejor época: Noviembre - Febrero (estación seca, menos humedad)",
      "Evitar: Abril (Songkran, precios suben) y Mayo-Oct (monzón)",
      "Visa: hasta 30 días sin visa para ciudadanos UE",
      "Moverse: vuelos internos con AirAsia o Nok Air son baratísimos",
      "Error fares frecuentes con Qatar, Turkish, Emirates",
    ],
  },
  "sudafrica": {
    name: "Sudáfrica",
    iata: ["JNB", "CPT", "DUR"],
    country: "Sudáfrica, África Austral",
    emoji: "🦏",
    description: "Cape Town, Garden Route, Kruger National Park y vinos de Stellenbosch. Business class con Lufthansa y Turkish suele tener buenos chollos.",
    bestMonths: ["Octubre", "Noviembre", "Marzo", "Abril"],
    avgTemp: "15-28°C (estaciones invertidas vs. Europa)",
    flightTime: "~11-13h desde Europa",
    tips: [
      "Mejor época: Oct-Nov y Mar-Abr (primavera/otoño)",
      "Safari: Mayo-Sep (animales concentrados en pozas de agua)",
      "No se necesita visa (hasta 90 días) para ciudadanos UE",
      "Alquiler de coche imprescindible para Garden Route",
      "Business error fares: Lufthansa, Turkish, Qatar vía FRA/IST/DOH",
    ],
  },
  "islandia": {
    name: "Islandia",
    iata: ["KEF", "RKV"],
    country: "Islandia, Europa Norte",
    emoji: "🌋",
    description: "Glaciares, auroras boreales, géiseres y cascadas. Vuelos directos desde hubs europeos con Icelandair o PLAY (la low-cost islandesa).",
    bestMonths: ["Junio", "Julio", "Agosto", "Febrero", "Marzo"],
    avgTemp: "0-15°C (verano), -5-5°C (invierno)",
    flightTime: "~3-4h desde Europa occidental",
    tips: [
      "Verano (Jun-Ago): sol de medianoche, carreteras todas abiertas",
      "Invierno (Feb-Mar): auroras boreales, mejor relación precio/visibilidad",
      "PLAY ofrece vuelos low-cost desde BRU, BSL, AMS, CDG",
      "Alquilar 4x4 si vas en invierno o a tierras altas",
      "Caro en restaurantes; considera Airbnb con cocina",
    ],
  },
  "marruecos": {
    name: "Marruecos",
    iata: ["RAK", "CMN", "AGA", "FEZ", "TNG"],
    country: "Marruecos, Norte de África",
    emoji: "🕌",
    description: "Marrakech, Fez, Chefchaouen y el desierto de Merzouga. Destino perfecto para fin de semana largo desde hubs europeos.",
    bestMonths: ["Marzo", "Abril", "Mayo", "Septiembre", "Octubre", "Noviembre"],
    avgTemp: "15-30°C (varía por región)",
    flightTime: "~3-4h desde Europa",
    tips: [
      "Ryanair, TUI, Air Arabia Maroc con tarifas muy bajas",
      "Evitar Julio-Agosto en Marrakech (45°C, insoportable)",
      "Combina Marrakech + Essaouira para playa y Atlas",
      "Dirham: mejor cambiar en casas de cambio oficiales, no bancos",
      "Sin visa para UE, solo pasaporte válido 3+ meses",
    ],
  },
  "vietnam": {
    name: "Vietnam",
    iata: ["HAN", "SGN", "DAD"],
    country: "Vietnam, Sudeste Asiático",
    emoji: "🍜",
    description: "Hanói, bahía de Halong, Hoi An, Ho Chi Minh y las terrazas de Sapa. Excelente relación calidad/precio en el sudeste asiático.",
    bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero", "Marzo"],
    avgTemp: "20-32°C (varía norte/sur)",
    flightTime: "~13-15h desde Europa (con escala)",
    tips: [
      "Mejor época general: Nov-Mar (seca en casi todo el país)",
      "Norte (Hanoi, Sapa): Oct-Dic (otoño) y Mar-May (primavera)",
      "Sur (Saigón, Mekong): Dic-Abr (seca)",
      "E-visa: tramitar online antes de volar (25 USD, 30 días)",
      "Error fares frecuentes con Qatar, Etihad, Turkish vía DOH/AUH/IST",
    ],
  },
  "costa-rica": {
    name: "Costa Rica",
    iata: ["SJO", "LIR"],
    country: "Costa Rica, América Central",
    emoji: "🦥",
    description: "Pura vida: selva tropical, playas del Pacífico y el Caribe, volcanes activos y una biodiversidad increíble. Ideal para ecoturismo.",
    bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"],
    avgTemp: "22-30°C",
    flightTime: "~13-14h desde Europa (con escala)",
    tips: [
      "Mejor época: Dic-Abr (seca) — alta temporada y precios altos",
      "Mayo-Nov: lluvias pero ofertas de vuelo mucho mejores",
      "SJO cerca de San José, LIR cerca de Guanacaste (playa)",
      "Alquilar 4x4 si planeas explorar la costa Caribe o Monteverde",
      "Error fares: Iberia (MAD), Condor (FRA), Air France (CDG)",
    ],
  },
  // abr-2026z: 6 destinos nuevos para expandir cluster
  "marrakech": {
    name: "Marrakech",
    iata: ["RAK"],
    country: "Marruecos, Norte de África",
    emoji: "🐪",
    description: "La ciudad roja: zocos vibrantes, Jardines Majorelle, riad tradicionales y la cocina marroquí más auténtica. Solo 3h de vuelo desde España.",
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    avgTemp: "15-30°C según mes",
    flightTime: "3h desde Madrid/Barcelona",
    tips: [
      "Mejor época: marzo-mayo y octubre-noviembre (temperatura agradable, sin lluvia)",
      "Evitar julio-agosto (45°C+) y las semanas de Ramadán (servicios reducidos)",
      "Ryanair y easyJet operan rutas directas baratas (€18-65 ida)",
      "Reservar riad en la medina, no hotel grande — experiencia única",
      "Error fares Royal Air Maroc desde MAD via CMN-RAK: €49 visto en 2025",
    ],
  },
  "tokio": {
    name: "Tokio",
    iata: ["NRT", "HND"],
    country: "Japón",
    emoji: "🗼",
    description: "La metrópolis más fascinante del mundo: tradición milenaria mezclada con futuro neón. Sushi de barra, templos zen, Shibuya scramble y trenes bala.",
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    avgTemp: "5-30°C según estación",
    flightTime: "11-13h desde Europa con conexión",
    tips: [
      "Sakura: finales marzo-primera semana abril. Súper turístico y caro.",
      "Momiji (otoño): mediados noviembre. Igual de bonito, menos saturado.",
      "Evitar Golden Week (29 abr-5 may): turismo japonés interno colapsa todo.",
      "JR Pass solo compensa si vas a Kyoto/Osaka. Para Tokio solo, Suica/Pasmo.",
      "Error fares MAD-NRT business: €980 con AF/KLM observado 4 veces en 2024-2025",
    ],
  },
  "reykjavik": {
    name: "Reikiavik",
    iata: ["KEF"],
    country: "Islandia",
    emoji: "🌋",
    description: "Auroras boreales en invierno, geysers y cascadas en verano. Naturaleza salvaje a 3h de Madrid. Capital pequeña con cultura sorprendente.",
    bestMonths: ["Septiembre", "Octubre", "Febrero", "Marzo"],
    avgTemp: "−5 a 15°C según estación",
    flightTime: "4h directo desde Madrid",
    tips: [
      "Auroras: septiembre-marzo, lejos de luz urbana. Apps como My Aurora Forecast",
      "Verano (jun-ago): sol de medianoche, todo abierto, precios pico",
      "Alquila coche al llegar — KEF al centro 50min, transporte público limitado",
      "Comida CARÍSIMA: Kronenbourg €12, hamburguesa €25. Bonus al supermercado",
      "Error fares Icelandair desde MAD/BCN: €120-180 RT visto enero 2025",
    ],
  },
  "singapur": {
    name: "Singapur",
    iata: ["SIN"],
    country: "Singapur, Sudeste Asiático",
    emoji: "🌃",
    description: "Ciudad-estado futurista: hawker centres con estrella Michelin, Marina Bay Sands, Gardens by the Bay. Hub perfecto para combinar con resto del sudeste asiático.",
    bestMonths: ["Febrero", "Marzo", "Abril", "Julio", "Agosto"],
    avgTemp: "26-31°C todo el año",
    flightTime: "13-14h desde Europa con 1 escala",
    tips: [
      "Clima tropical estable: nunca varía mucho. La diferencia es lluvia.",
      "Hawker centres: comida calle de calidad mundial por €3-5. Maxwell, Lau Pa Sat.",
      "MRT (metro) impecable: 2-3 días suficientes para conocer la ciudad",
      "Conviene como stopover: muchos vuelos largo radio paran aquí gratis 24-72h",
      "Error fares Singapore Airlines business: €1900 RT FRA-SIN visto en 2024",
    ],
  },
  "praga": {
    name: "Praga",
    iata: ["PRG"],
    country: "República Checa",
    emoji: "🏰",
    description: "La ciudad de las cien torres: arquitectura gótica, cerveza de pisco rebelde, río Vltava y un casco histórico Patrimonio de la Humanidad.",
    bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"],
    avgTemp: "−2 a 25°C según mes",
    flightTime: "2h 45min desde Madrid",
    tips: [
      "Mercados de Navidad (28 nov-6 ene): mágicos pero turismo masivo",
      "Vuelos directos Ryanair y Wizz desde MAD/BCN €40-75 ida",
      "Tram 22 va por todos los puntos turísticos clásicos por €1.20",
      "Cerveza checa: la mejor del mundo. Pilsner Urquell en Plzeň (1h en tren)",
      "Cuidado con casas de cambio en zona turística: comisiones brutales",
    ],
  },
  "estambul": {
    name: "Estambul",
    iata: ["IST", "SAW"],
    country: "Turquía",
    emoji: "🕌",
    description: "Donde Europa y Asia se encuentran: Hagia Sofía, Gran Bazar, Bósforo y la mejor red largo-radio del mundo. 4h de Madrid pero parece otro continente.",
    bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"],
    avgTemp: "8-30°C según mes",
    flightTime: "4h directo desde Madrid",
    tips: [
      "IST (Istanbul Airport) es el principal. SAW (Sabiha Gökçen) es secundario.",
      "Turkish Airlines: error fares frecuentes IST-Asia/USA, conexión perfecta desde MAD",
      "E-visa pre-vuelo: 50 USD online, evita colas en aeropuerto",
      "Ramadan: muchos restaurantes cerrados durante el día (verifica fechas)",
      "Tarjeta IstanbulKart cubre tranvía, metro, ferry. Inversión inicial mínima",
    ],
  },
  // abr-2026bb: 6 destinos adicionales (target 24)
  "berlin": {
    name: "Berlín",
    iata: ["BER"],
    country: "Alemania",
    emoji: "🐻",
    description: "La capital alternativa de Europa: Memorial del Holocausto, Museum Island, vida nocturna techno y barrios distintos. Solo 3h desde Madrid.",
    bestMonths: ["Mayo", "Junio", "Septiembre"],
    avgTemp: "−2 a 22°C según mes",
    flightTime: "3h desde Madrid/Barcelona",
    tips: [
      "BER (nuevo aeropuerto) reemplazó SXF y TXL desde 2020",
      "Berliner WelcomeCard: transporte público + descuentos museos. Vale la pena",
      "Vida nocturna: Berghain (techno legendario), Kater Blau, About Blank. Llega temprano",
      "Mauer (Muro): East Side Gallery + Checkpoint Charlie + Mauerpark domingo",
      "Easyjet y Ryanair operan rutas baratas MAD-BER y BCN-BER",
    ],
  },
  "atenas": {
    name: "Atenas",
    iata: ["ATH"],
    country: "Grecia",
    emoji: "🏛️",
    description: "Cuna de la democracia: Acrópolis, Plaka, museos arqueológicos y puerta de entrada a las islas griegas (Mykonos, Santorini, Creta).",
    bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"],
    avgTemp: "8-32°C según mes",
    flightTime: "3h 30min desde Madrid",
    tips: [
      "Acrópolis: comprar entrada online, llegar 8am evitar calor + colas",
      "Plaka es muy turística pero auténtica. Anafiotika es el barrio escondido más bonito",
      "Comida griega: souvlaki, mousaka, tzatziki. Restaurante Strofi tiene vista a Acrópolis",
      "Para combinar islas: ferry desde Pireo. Bookear 2 semanas antes en alta temporada",
      "Aegean Airlines y Olympic Air operan vuelos baratos a islas (Santorini, Mykonos)",
    ],
  },
  "dubai": {
    name: "Dubái",
    iata: ["DXB"],
    country: "Emiratos Árabes Unidos",
    emoji: "🏙️",
    description: "Ciudad de los rascacielos: Burj Khalifa, Palm Jumeirah, malls gigantes y un hub intercontinental que conecta Europa con Asia y África.",
    bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero", "Marzo"],
    avgTemp: "20-45°C según mes",
    flightTime: "7h directo desde Madrid",
    tips: [
      "Evitar julio-agosto: 45°C+, mucha humedad, infernal salir del hotel",
      "Visado en aeropuerto: 30 días gratis para españoles. No tramitar antes",
      "Emirates suele tener mejores ofertas business class MAD-DXB que económica",
      "Metro de Dubai: barato, limpio, llega a casi todos los puntos turísticos",
      "Stopover Emirates: si vas a Asia, considera 2-3 noches en Dubai gratis o muy barato",
    ],
  },
  "el-cairo": {
    name: "El Cairo",
    iata: ["CAI"],
    country: "Egipto",
    emoji: "🐫",
    description: "Tradición milenaria: Pirámides de Giza, Esfinge, Museo Egipcio (con momias reales) y bazares como Khan el-Khalili. Patrimonio único en el mundo.",
    bestMonths: ["Octubre", "Noviembre", "Diciembre", "Febrero", "Marzo"],
    avgTemp: "10-38°C según mes",
    flightTime: "4h 30min desde Madrid",
    tips: [
      "Visa egipcia: e-visa online o al llegar (€25). Mejor online para evitar colas",
      "Pirámides: contratar guía oficial. Mucho 'falso guía' dentro del recinto",
      "Combina con Luxor + crucero Nilo. Vuelos internos baratos con EgyptAir",
      "Cuidado con timos en taxis: usa Uber o tarifa pre-acordada",
      "Mejor temporada para clima razonable: octubre-marzo. Verano abrasador (40°C+)",
    ],
  },
  "hong-kong": {
    name: "Hong Kong",
    iata: ["HKG"],
    country: "Hong Kong",
    emoji: "🌃",
    description: "Skyline icónico: Victoria Peak, Star Ferry, mercados nocturnos en Mong Kok, dim sum auténtico y un hub financiero asiático fascinante.",
    bestMonths: ["Octubre", "Noviembre", "Diciembre"],
    avgTemp: "15-32°C según mes",
    flightTime: "12h con escala desde Madrid",
    tips: [
      "Mejor época: octubre-noviembre (clima seco, no humedad). Evitar julio-agosto (tifones)",
      "Octopus Card: tarjeta transporte + tiendas. Imprescindible 1ª día",
      "Dim sum auténtico: Tim Ho Wan (Michelin), Lin Heung Tea House (clásico)",
      "Cathay Pacific tiene buenos precios MAD-HKG via LHR/CDG cuando hay error fares",
      "Combina con Macao: ferry 1h, casinos + arquitectura portuguesa colonial",
    ],
  },
  "sydney": {
    name: "Sídney",
    iata: ["SYD"],
    country: "Australia",
    emoji: "🦘",
    description: "La ciudad más icónica de Australia: Opera House, Harbour Bridge, Bondi Beach, Blue Mountains. Lejos pero memorable.",
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    avgTemp: "10-28°C según mes",
    flightTime: "22-25h con 1-2 escalas desde Madrid",
    tips: [
      "Visa australiana: ETA online (€18). Tramitar 2-3 semanas antes",
      "Vuelos: vía DOH (Qatar) o SIN (Singapore Airlines) son los más eficientes desde MAD",
      "Mejor temporada: primavera austral (oct-nov) o otoño (mar-abr). Evita verano (dic-feb), incendios potenciales",
      "Combinaciones: Sydney + Melbourne (vuelo interno €60) + Great Barrier Reef (Cairns)",
      "Error fares Qatar Airways MAD-SYD business: €1900-2400 RT observado en 2024-2025",
    ],
  },
  // ZZZ02 (May 2026) — Capitales EU faltantes (alto search volume, antes 404).
  "lisboa": {
    name: "Lisboa",
    iata: ["LIS"],
    country: "Portugal, Península Ibérica",
    emoji: "🚋",
    description: "Lisboa es la capital más barata de Europa Occidental. Vuelos error fare desde Madrid/Barcelona bajan a €25-50 round-trip varias veces al año.",
    bestMonths: ["Abril", "Mayo", "Junio", "Septiembre", "Octubre"],
    avgTemp: "13-28°C",
    flightTime: "~1h 30min desde MAD/BCN",
    tips: [
      "Sweet spot reserva: 3-5 semanas antes para weekend",
      "Tram 28 con tarjeta carris (€6 day pass) en lugar de tickets sueltos",
      "Sintra y Cascais 30-40min en tren CP, gita un día perfecta",
      "Pastéis de Belém son la versión auténtica del pastel de nata",
      "Evita Agosto: turismo masivo + olas de calor 35°C+",
    ],
  },
  "paris": {
    name: "París",
    iata: ["CDG", "ORY", "BVA"],
    country: "Francia, Europa Occidental",
    emoji: "🗼",
    description: "París es una de las rutas short-haul más volada en Europa. Error fares con Vueling, easyJet, Air France desde €30 ida (€60-80 RT).",
    bestMonths: ["Abril", "Mayo", "Junio", "Septiembre", "Octubre"],
    avgTemp: "8-22°C",
    flightTime: "~2h",
    tips: [
      "CDG vs ORY vs BVA: BVA Beauvais está a 1h en bus del centro",
      "Museum Pass 2/4/6 días ahorra €30-60 si visitas 4+ museos",
      "Evita agosto: muchos comercios cerrados por vacances",
      "Metro: carnet de 10 tickets más barato que tickets sueltos",
      "Disneyland Paris: tren RER A €8 desde el centro, no taxi",
    ],
  },
  "londres": {
    name: "Londres",
    iata: ["LHR", "LGW", "STN", "LTN", "LCY"],
    country: "Reino Unido, Europa Occidental",
    emoji: "🎡",
    description: "Londres tiene 5 aeropuertos y más opciones low-cost que cualquier ciudad europea. Error fares desde €20 ida con Ryanair/easyJet.",
    bestMonths: ["Mayo", "Junio", "Julio", "Septiembre"],
    avgTemp: "6-22°C",
    flightTime: "~2h 30min",
    tips: [
      "STN más barato pero 1h en tren al centro (£15)",
      "Oyster Card o contactless con tarjeta UE ahorra 50% en transporte",
      "Brexit: pasaporte obligatorio (no DNI) desde 2021",
      "Museos públicos gratis: British, National Gallery, Tate Modern, V&A",
      "Bus turístico privado caro — usa Hop-on Hop-off normal o ruta 11 normal (£2)",
    ],
  },
  "roma": {
    name: "Roma",
    iata: ["FCO", "CIA"],
    country: "Italia, Europa del Sur",
    emoji: "🏛️",
    description: "Roma combina historia (Coliseo, Foro, Vaticano) con gastronomía y vida nocturna. Error fares desde España €40-80 RT con Ryanair, Vueling o Iberia.",
    bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"],
    avgTemp: "10-30°C según mes",
    flightTime: "~2h 30min desde MAD/BCN",
    tips: [
      "FCO vs CIA: FCO mejor conectado al centro (Leonardo Express €14)",
      "Roma Pass 48h €36 incluye transporte + 2 museos free + descuentos",
      "Evita verano (jul-ago): 35°C+ y turismo masivo. Octubre es ideal",
      "Vaticano: reserva online para evitar filas de 2-3h",
      "Comer fuera de zonas turísticas (Trastevere, Testaccio) ahorra 30%",
    ],
  },
  "milan": {
    name: "Milán",
    iata: ["MXP", "LIN", "BGY"],
    country: "Italia, Europa del Sur",
    emoji: "🏛️",
    description: "Milán es el hub de moda + business + Alpes accesibles. Vuelos low-cost frecuentes desde España, error fares €35-70 RT.",
    bestMonths: ["Abril", "Mayo", "Junio", "Septiembre"],
    avgTemp: "5-28°C según mes",
    flightTime: "~2h",
    tips: [
      "BGY (Bergamo) es Ryanair hub, 50min en bus al centro Milán",
      "MXP Malpensa Express tren €13 al centro, mejor que taxi (€90)",
      "Última Cena (Da Vinci): reserva 3+ meses antes online",
      "Alpes lago Como 1h en tren (€7), excursión perfecta",
      "Aperitivo a partir de 18h: bebida + buffet ilimitado por €10-12",
    ],
  },
  "amsterdam": {
    name: "Ámsterdam",
    iata: ["AMS"],
    country: "Países Bajos, Europa del Norte",
    emoji: "🚲",
    description: "Ámsterdam combina canales UNESCO + arte (Rijksmuseum, Van Gogh) + vida nocturna. Error fares €60-100 RT desde España con KLM/Vueling/Transavia.",
    bestMonths: ["Abril", "Mayo", "Junio", "Septiembre"],
    avgTemp: "5-22°C",
    flightTime: "~2h 30min desde MAD/BCN",
    tips: [
      "Bicicleta es OBLIGATORIA: alquila desde €10/día (Mac Bike, Black Bikes)",
      "I Amsterdam City Card 24/48/72h ahorra mucho si vas a museos top",
      "Reserva Van Gogh + Anne Frank online MUCHO antes (sold-out 4+ semanas)",
      "Tulipanes: mediados abril a primeros mayo (Keukenhof)",
      "Stroopwafels frescos en mercados son 10× mejores que envasados",
    ],
  },
  "viena": {
    name: "Viena",
    iata: ["VIE"],
    country: "Austria, Europa Central",
    emoji: "🎻",
    description: "Viena tiene la mejor calidad de vida de Europa según Mercer. Música clásica, palacios imperiales, Sachertorte. Error fares €60-110 RT desde España.",
    bestMonths: ["Abril", "Mayo", "Junio", "Septiembre", "Octubre", "Diciembre"],
    avgTemp: "0-25°C según mes",
    flightTime: "~3h desde MAD/BCN",
    tips: [
      "Vienna Pass 1/2/3/6 días incluye 60+ atracciones + bus turístico",
      "Conciertos de Mozart en iglesias €30-50 (vs €80+ Musikverein)",
      "Mercados de Navidad mejor de Europa (Rathausplatz, Schönbrunn)",
      "Schönbrunn Palace: reserva online slot horario para evitar colas",
      "Café Central, Sacher, Demel: tradición vienesa pero turísticos. Locales prefieren Café Hawelka",
    ],
  },
};

// abr-2026r — revalidate: destinos cambian con seasonal_threshold + holiday
// windows, pero el contenido textual es estable. 1h es suficiente para que
// cambios manuales se reflejen razonablemente rápido sin agobiar al ISR.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dest = DESTINATIONS[params.slug];
  if (!dest) return { title: "Destino no encontrado" };
  // SSS97 SEO: canonical + hreflang + OG completo. Antes faltaban los 3 →
  // 24 destinos pierden CTR (sin OG image específico) y duplicate content
  // risk para variantes ?utm_source. Description capada a 155 chars.
  const description = (
    `Encuentra los mejores chollos de vuelo a ${dest.name}. ${dest.description}`
  ).slice(0, 155);
  const SITE = "https://tripcazador.com";
  const url = `${SITE}/destinos/${params.slug}`;
  const ogImage = `${SITE}/destinos/${params.slug}/opengraph-image`;
  return {
    title: `Vuelos baratos a ${dest.name} — TripCazador`,
    description,
    alternates: {
      canonical: `/destinos/${params.slug}`,
      languages: {
        "es-ES": `/destinos/${params.slug}`,
        "es-MX": `/destinos/${params.slug}`,
        "es-AR": `/destinos/${params.slug}`,
        "x-default": `/destinos/${params.slug}`,
      },
    },
    openGraph: {
      title: `${dest.emoji} Vuelos baratos a ${dest.name}`,
      description,
      url,
      siteName: "TripCazador",
      type: "website",
      locale: "es_ES",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Vuelos a ${dest.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dest.emoji} Vuelos baratos a ${dest.name}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: { slug: string };
}) {
  const dest = DESTINATIONS[params.slug];
  if (!dest) notFound();

  // Buscar deals actuales para este destino. abr-2026n (#213): además del
  // match por código IATA exacto, aceptamos match por nombre de ciudad
  // (case-insensitive). Esto evita falsos negativos si el feed reporta el
  // deal con `destination` no IATA (ej. "PBQ" para Punta Cana en lugar de
  // "PUJ"). El IATA sigue siendo señal primaria; ciudad es fallback.
  const data = await getDeals({ region: undefined, limit: 200 });
  const destNameLower = dest.name.toLowerCase();
  const destDeals = data.deals
    .filter((d) => {
      // Match primario por IATA exacto (caso normal)
      if (dest.iata.includes(d.destination)) return true;
      // Fallback: ciudad de destino contiene el nombre del destino canónico
      const cityTo = (d.city_to || "").toLowerCase();
      if (cityTo && cityTo.includes(destNameLower)) return true;
      return false;
    })
    .slice(0, 12);

  // Métricas para enriquecer schema TouristTrip — tomamos rangos del feed
  // de deals ya filtrado para este destino (precio mínimo, aerolíneas únicas).
  const destPrices = destDeals
    .map((d) => Number(d.price_eur || 0))
    .filter((n) => n > 0);
  const minDestPrice = destPrices.length ? Math.min(...destPrices) : null;
  const uniqueAirlines = Array.from(
    new Set(destDeals.map((d) => d.airline).filter(Boolean) as string[]),
  ).slice(0, 6);

  // Heurística de duración recomendada por distancia (ratio noches/destino):
  // - long-haul (Asia/LatAm/Pacífico) → 14 días
  // - medium-haul (África/Caribe) → 10 días
  // - short-haul (Europa/Marruecos) → 5 días
  const longHaulSlugs = ["japon", "bali", "tailandia", "vietnam", "buenos-aires", "maldivas", "sudafrica", "costa-rica"];
  const mediumHaulSlugs = ["nueva-york", "tanzania"];
  const tripDays = longHaulSlugs.includes(params.slug)
    ? 14
    : mediumHaulSlugs.includes(params.slug)
    ? 10
    : 5;

  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: dest.name,
      description: dest.description,
      url: `https://tripcazador.com/destinos/${params.slug}`,
      image: "https://tripcazador.com/og-default.png",
      touristType: ["Budget travelers from Europe", "Error fare hunters"],
      // abr-2026m: añadimos `availableLanguage` (ES + EN — el feed es bilingüe)
      // y `geo` opcional cuando el frontmatter lo trae.
      availableLanguage: ["es", "en"],
      // Best months como `season` repeatable — Schema.org lo acepta como
      // string o array.
      includesAttraction: dest.bestMonths.map((m) => ({
        "@type": "TouristAttraction",
        name: `${dest.name} en ${m}`,
        description: `Mejor temporada para visitar ${dest.name}: ${m}.`,
      })),
    },
    // abr-2026m: TouristTrip schema — Google muestra rich snippets para
    // queries tipo "viajar a Japón desde Europa". Incluye duración media,
    // budget mínimo (si tenemos deals activos), y partOfTrip → destination.
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: `Viaje a ${dest.name} desde Europa`,
      description: dest.description,
      url: `https://tripcazador.com/destinos/${params.slug}`,
      itinerary: {
        "@type": "ItemList",
        numberOfItems: tripDays,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            item: {
              "@type": "Place",
              name: `Llegada a ${dest.name}`,
            },
          },
          {
            "@type": "ListItem",
            position: 2,
            item: {
              "@type": "Action",
              name: `${tripDays} días explorando ${dest.name}`,
            },
          },
        ],
      },
      partOfTrip: {
        "@type": "TouristDestination",
        name: dest.name,
        url: `https://tripcazador.com/destinos/${params.slug}`,
      },
      provider: {
        "@type": "Organization",
        name: "TripCazador",
        url: "https://tripcazador.com",
      },
      // Si tenemos deals activos, exponer rango de precio del vuelo como
      // hint para Google. Marcamos `lowPrice` con la oferta más barata.
      ...(minDestPrice && {
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: Math.round(minDestPrice),
          offerCount: destDeals.length,
          seller: { "@type": "Organization", name: "TripCazador" },
          ...(uniqueAirlines.length > 0 && {
            itemOffered: {
              "@type": "Flight",
              provider: uniqueAirlines.map((a) => ({
                "@type": "Airline",
                name: a,
              })),
            },
          }),
        },
      }),
      // Audiencia + tipo de presupuesto. `suitableForBudget` no es Schema
      // canónico pero algunos crawlers lo respetan; usamos `additionalProperty`.
      audience: {
        "@type": "Audience",
        audienceType: "Travelers from European hubs (BSL, ZRH, MAD, FRA, CDG, AMS)",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Destinos", item: "https://tripcazador.com/destinos" },
        {
          "@type": "ListItem",
          position: 3,
          name: dest.name,
          item: `https://tripcazador.com/destinos/${params.slug}`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <JsonLd data={jsonLd} />
      {/* Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <a href="/destinos" className="hover:text-white">Destinos</a>
          <span>/</span>
          <span className="text-white">{dest.name}</span>
        </div>

        <div className="flex items-start gap-4">
          <span className="text-5xl">{dest.emoji}</span>
          <div>
            <h1 className="text-4xl font-bold text-white">{dest.name}</h1>
            <p className="text-gray-400 mt-1">{dest.country}</p>
          </div>
        </div>

        <p className="text-gray-300 text-lg max-w-3xl">{dest.description}</p>

        {/* KKK2+KKK3 — Monetización: tours + eSIM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          <div className="lg:col-span-2">
            <GetYourGuideWidget city={dest.name} destinationIata={undefined} />
          </div>
          <div>
            <EsimBanner countryName={dest.country.split(",")[0]} />
          </div>
        </div>

        {/* Info rápida */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Vuelo desde Europa</div>
            <div className="text-white font-semibold mt-1">{dest.flightTime}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Temperatura media</div>
            <div className="text-white font-semibold mt-1">{dest.avgTemp}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Mejor época</div>
            <div className="text-white font-semibold mt-1">{dest.bestMonths.slice(0, 3).join(", ")}</div>
          </div>
        </div>
      </section>

      {/* Deals activos */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">
          Vuelos activos a {dest.name}
          <span className="text-base font-normal text-gray-400 ml-3">
            ({destDeals.length} encontrados)
          </span>
        </h2>

        {destDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {destDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
            <p className="text-gray-400">No hay deals activos en este momento para {dest.name}.</p>
            <p className="text-sm text-gray-500 mt-2">El motor está buscando. Vuelve en unas horas.</p>
          </div>
        )}
      </section>

      {/* Hoteles del destino */}
      {(() => {
        // Match por ciudad o país aproximado (slug → entries)
        const destHotels = getHotelSeedFallback({ limit: 6, minStars: 3 })
          .filter((h) => {
            const cityLower = (h.city_to ?? "").toLowerCase();
            const countryLower = (h.country_to ?? "").toLowerCase();
            const destName = dest.name.toLowerCase();
            return (
              cityLower.includes(destName) ||
              destName.includes(cityLower) ||
              countryLower.includes(destName) ||
              destName.includes(countryLower)
            );
          })
          .slice(0, 3);
        if (destHotels.length === 0) return null;
        return (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                🏨 Hoteles seleccionados en {dest.name}
              </h2>
              <Link href="/hoteles" className="text-amber-400 hover:text-amber-300 text-sm font-semibold">
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {destHotels.map((h) => (
                <HotelCard key={h.id} hotel={h} />
              ))}
            </div>
          </section>
        );
      })()}

      {/* Guía / Tips */}
      <section className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          📚 Guía de viaje — {dest.name}
        </h2>
        <ul className="space-y-2">
          {dest.tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 mt-0.5 shrink-0">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* LLL2 — Travel toolkit (4 partners) + insurance separado al final */}
      <TravelToolkit
        variant="destination"
        city={dest.name}
        country={dest.country.split(",")[0]}
      />

      {/* KKK4 — Travel insurance CTA al final con destination context */}
      <TravelInsuranceCTA destination={dest.name} variant="expanded" />
    </div>
  );
}
