/**
 * lounges_catalog.ts — SUPER-SEO (25 may 2026)
 *
 * Salas VIP por aeropuerto ES. High-intent SEO:
 * "sala vip aeropuerto Madrid" + variantes ~30k búsquedas/mes ES total.
 * Cubre: nombre lounge, terminal, acceso (Priority Pass/Lounge Key/
 * Iberia Plus/etc.), pase day-pass €, horario, qué incluye.
 */

export interface LoungeAccess {
  /** Tarjeta que da acceso */
  metodo: string;
  /** Si requiere status/elite o vale tarjeta básica */
  detalle: string;
}

export interface Lounge {
  /** Nombre comercial del lounge */
  name: string;
  terminal: string;
  airside: boolean;
  /** Capacidad aprox personas */
  capacidad?: number;
  /** Acceso por método (multiples) */
  acceso: LoungeAccess[];
  /** Day pass walk-in precio (si lo permiten) */
  dayPassEur?: number;
  /** Horas máx estancia con day pass */
  estanciaMaxH?: number;
  horario: string;
  /** Servicios destacados */
  servicios: string[];
}

export interface LoungeHub {
  iata: string;
  ciudad: string;
  lounges: Lounge[];
  /** Tarjetas con acceso lounge gratis recomendadas */
  tarjetasRecomendadas: Array<{ nombre: string; coste: string; cobertura: string }>;
  /** Tips específicos del aeropuerto */
  tips: string[];
  lastUpdated: string;
}

export const LOUNGES: LoungeHub[] = [
  {
    iata: "MAD",
    ciudad: "Madrid",
    lounges: [
      {
        name: "Sala VIP Iberia Velázquez",
        terminal: "T4",
        airside: true,
        capacidad: 800,
        acceso: [
          { metodo: "Iberia Plus Oro/Platino", detalle: "Acceso gratuito + 1 acompañante" },
          { metodo: "Oneworld Sapphire/Emerald", detalle: "Acceso a sala Oneworld + 1 acomp" },
          { metodo: "Business class", detalle: "Si vuelas en business Iberia/LATAM/BA" },
          { metodo: "Priority Pass", detalle: "NO accepted en lounges Iberia" },
        ],
        dayPassEur: 50,
        estanciaMaxH: 3,
        horario: "5:00-1:30",
        servicios: [
          "Buffet caliente + bar",
          "Showers (8 cabinas)",
          "Salones tranquilos",
          "Espacio business + WiFi",
        ],
      },
      {
        name: "Sala VIP Aspire",
        terminal: "T1",
        airside: true,
        capacidad: 200,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado a titulares" },
          { metodo: "LoungeKey", detalle: "Acceso con tarjetas Diners/Amex" },
          { metodo: "Walk-in", detalle: "Day pass walk-in disponible" },
        ],
        dayPassEur: 39,
        estanciaMaxH: 3,
        horario: "5:00-22:00",
        servicios: [
          "Snacks + bebidas",
          "WiFi gratis",
          "Prensa + revistas",
          "Asientos cómodos",
        ],
      },
      {
        name: "Sala VIP Cibeles",
        terminal: "T4 Satélite",
        airside: true,
        acceso: [
          { metodo: "Iberia Plus Oro/Platino", detalle: "Gratis + acompañante" },
          { metodo: "Oneworld Sapphire/Emerald", detalle: "Acceso garantizado" },
          { metodo: "Business class long-haul", detalle: "Acceso por tarjeta de embarque" },
        ],
        dayPassEur: 50,
        estanciaMaxH: 3,
        horario: "5:30-23:30",
        servicios: [
          "Buffet caliente premium",
          "Showers",
          "Wine bar",
          "Vistas pista",
        ],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "Centurion + Priority Pass + Delta SkyClub + más" },
      { nombre: "Iberia Plus Oro (con vuelos)", coste: "Gratis si elite", cobertura: "Todas Iberia + Oneworld" },
      { nombre: "Revolut Metal", coste: "13.99 €/mes", cobertura: "Lounge Pass 1 visita/mes 28+ aeropuertos" },
    ],
    tips: [
      "T4 Iberia Velázquez es el mejor lounge de España — buffet caliente, ducha, vinos premium. Si tienes acceso, ve 2h+ antes para aprovechar.",
      "T1 Aspire es decente pero pequeño — en hora pico (8-10am) puede haber cola.",
      "Si compras day-pass, hazlo online en LoungeBuddy o Aspire web — 5-10 € más barato que walk-in.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "BCN",
    ciudad: "Barcelona",
    lounges: [
      {
        name: "Sala VIP Pau Casals",
        terminal: "T1",
        airside: true,
        capacidad: 350,
        acceso: [
          { metodo: "Iberia Plus Oro/Platino", detalle: "Acceso + 1 acompañante" },
          { metodo: "Oneworld Sapphire/Emerald", detalle: "Acceso garantizado" },
          { metodo: "Business class", detalle: "Iberia, LATAM, BA, Vueling business" },
          { metodo: "Priority Pass", detalle: "NO accepted (lounge gestionado por Iberia)" },
        ],
        dayPassEur: 45,
        estanciaMaxH: 3,
        horario: "5:00-23:30",
        servicios: ["Buffet caliente", "Bar", "Showers", "Wifi"],
      },
      {
        name: "Sala VIP Colomer Sky Center",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "LoungeKey", detalle: "Diners, Amex tarjetas compatibles" },
          { metodo: "Walk-in", detalle: "Day pass 38 €" },
        ],
        dayPassEur: 38,
        estanciaMaxH: 3,
        horario: "5:00-22:00",
        servicios: ["Snacks + bebidas", "WiFi", "Asientos cómodos"],
      },
      {
        name: "Sala VIP Miró",
        terminal: "T2",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "LoungeKey", detalle: "Acceso compatible" },
          { metodo: "Walk-in", detalle: "Day pass 32 €" },
        ],
        dayPassEur: 32,
        estanciaMaxH: 3,
        horario: "5:30-22:30",
        servicios: ["Buffet ligero", "Bar limitado", "WiFi", "Vistas pista"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "Priority Pass ilimitado + más" },
      { nombre: "Revolut Metal", coste: "13.99 €/mes", cobertura: "1 lounge pass gratis/mes" },
      { nombre: "BBVA Premium", coste: "Gratis con cumplir mínimos", cobertura: "Iberia Plus Plata (a veces)" },
    ],
    tips: [
      "T1 Pau Casals es el lounge premium — solo aceptan tarjeta de embarque business o status. Si tienes Iberia Oro, gana a Colomer.",
      "T2 Miró es buena opción para low-cost (Ryanair/Vueling) — la única lounge T2 con Priority Pass.",
      "Llegada anticipada 3h+ en BCN da mucho juego en lounge — buffet, ducha, café = vuelo low-cost convertido en business class lite.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "VLC",
    ciudad: "Valencia",
    lounges: [
      {
        name: "Sala VIP Joan Olivert",
        terminal: "T1",
        airside: true,
        capacidad: 60,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "LoungeKey", detalle: "Diners, Amex" },
          { metodo: "Walk-in", detalle: "Day pass 35 €" },
        ],
        dayPassEur: 35,
        estanciaMaxH: 3,
        horario: "5:00-21:30",
        servicios: ["Snacks", "Bebidas alcohólicas", "WiFi", "Prensa"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "Priority Pass + Aspire VLC" },
      { nombre: "Revolut Metal", coste: "13.99 €/mes", cobertura: "1 lounge/mes incluido VLC" },
    ],
    tips: [
      "VLC tiene un solo lounge — siempre lleno en hora pico, mejor 7-8am o tarde.",
      "Sin Priority Pass walk-in es 35 € — caro para lounge pequeño. Considera tarjeta Amex/Revolut amortiza.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "AGP",
    ciudad: "Málaga",
    lounges: [
      {
        name: "Sala VIP Pablo Ruiz Picasso",
        terminal: "T3",
        airside: true,
        capacidad: 120,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "LoungeKey", detalle: "Tarjetas compatibles" },
          { metodo: "Walk-in", detalle: "Day pass 32 €" },
          { metodo: "Iberia Plus Oro", detalle: "Acceso por status" },
        ],
        dayPassEur: 32,
        estanciaMaxH: 3,
        horario: "5:00-22:30",
        servicios: ["Buffet ligero", "Bar full", "WiFi", "Showers (limitadas)"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "Acceso ilimitado AGP" },
      { nombre: "Revolut Metal", coste: "13.99 €/mes", cobertura: "1 lounge/mes" },
    ],
    tips: [
      "AGP solo tiene 1 lounge — verano puede llegar a capacity. Llegada 2h antes recomendada.",
      "Si vuelas a UK desde AGP, el lounge tiene desayuno inglés en T3 — útil para vuelo madrugada.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "BIO",
    ciudad: "Bilbao",
    lounges: [
      {
        name: "Sala VIP BBK",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "Iberia Plus Oro/Platino", detalle: "Acceso" },
          { metodo: "Walk-in", detalle: "Day pass 30 €" },
        ],
        dayPassEur: 30,
        estanciaMaxH: 3,
        horario: "5:30-22:00",
        servicios: ["Buffet ligero", "Bar", "WiFi", "Prensa"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "Acceso BIO + Priority Pass mundial" },
    ],
    tips: [
      "BIO es muy pequeño — lounge único, normalmente sin esperas.",
      "Después de 21h las opciones de comida en zona pública son limitadas — lounge salva la cena.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "PMI",
    ciudad: "Palma de Mallorca",
    lounges: [
      {
        name: "Sala VIP Formentor (Aspire)",
        terminal: "Módulo C",
        airside: true,
        capacidad: 180,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "LoungeKey", detalle: "Diners, Amex" },
          { metodo: "Walk-in", detalle: "Day pass 38 €" },
        ],
        dayPassEur: 38,
        estanciaMaxH: 3,
        horario: "4:30-23:30",
        servicios: ["Buffet caliente verano", "Bar", "WiFi", "Espacio familia"],
      },
      {
        name: "Sala VIP Galatzó",
        terminal: "Módulo A",
        airside: true,
        acceso: [
          { metodo: "Iberia Plus Oro", detalle: "Acceso por status" },
          { metodo: "Business class", detalle: "Iberia/Oneworld" },
        ],
        horario: "5:00-22:00",
        servicios: ["Buffet", "Bar", "WiFi"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "PMI + Priority Pass ilimitado" },
      { nombre: "Revolut Metal", coste: "13.99 €/mes", cobertura: "1 visita/mes — útil PMI vacaciones" },
    ],
    tips: [
      "PMI en verano es caótico — el lounge ahorra horas de cola estresante. Inversión 38 € walk-in worth it Jun-Ago.",
      "Llegada anticipada 3h+ en verano es realista — el lounge convierte espera en relax.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "ALC",
    ciudad: "Alicante",
    lounges: [
      {
        name: "Sala VIP Costa Blanca",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "Walk-in", detalle: "Day pass 30 €" },
        ],
        dayPassEur: 30,
        estanciaMaxH: 3,
        horario: "5:00-22:30",
        servicios: ["Snacks", "Bar", "WiFi", "Prensa"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "ALC + Priority Pass mundial" },
    ],
    tips: [
      "ALC verano: lounge único saturado. Considera llegar más tarde si ya tienes acceso a fast track.",
      "El lounge Costa Blanca tiene wifi rápido — útil si trabajas remoto en vacaciones.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "SVQ",
    ciudad: "Sevilla",
    lounges: [
      {
        name: "Sala VIP Andalucía",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "Iberia Plus Oro", detalle: "Acceso status" },
          { metodo: "Walk-in", detalle: "Day pass 32 €" },
        ],
        dayPassEur: 32,
        estanciaMaxH: 3,
        horario: "5:30-22:00",
        servicios: ["Buffet ligero (tapas)", "Bar", "WiFi"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "SVQ + global" },
    ],
    tips: [
      "Sala Andalucía tiene tapas en buffet — único lounge ES con identidad gastro local.",
      "SVQ es pequeño — controles ágiles, no necesitas 3h antes. 2h sobra (1h si fast track).",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "LPA",
    ciudad: "Las Palmas",
    lounges: [
      {
        name: "Sala VIP Galdós",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "Walk-in", detalle: "Day pass 34 €" },
        ],
        dayPassEur: 34,
        estanciaMaxH: 3,
        horario: "5:30-22:30",
        servicios: ["Buffet", "Bar", "WiFi", "Asientos buenos"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "LPA + Priority Pass global" },
    ],
    tips: [
      "LPA: si vienes de la isla en el último día, el lounge te da agua + showers tras un día de playa.",
      "El lounge cierra a las 22:30 — los vuelos late evening a Madrid llegan justo a tiempo si llegas con margen.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "TFS",
    ciudad: "Tenerife Sur",
    lounges: [
      {
        name: "Sala VIP Mencey",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "Walk-in", detalle: "Day pass 36 €" },
        ],
        dayPassEur: 36,
        estanciaMaxH: 3,
        horario: "5:00-23:00",
        servicios: ["Buffet ligero", "Bar", "WiFi", "Vistas pista"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "TFS + global" },
    ],
    tips: [
      "TFS verano-invierno (high season Canarias) saturado — lounge ayuda mucho.",
      "Salidas tarde a UK: el lounge sirve cena light hasta cierre 23h.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "TFN",
    ciudad: "Tenerife Norte",
    lounges: [
      {
        name: "Sala VIP Los Cardones",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "Iberia Plus Oro", detalle: "Status" },
          { metodo: "Walk-in", detalle: "Day pass 28 €" },
        ],
        dayPassEur: 28,
        estanciaMaxH: 3,
        horario: "6:00-22:00",
        servicios: ["Snacks", "Bar", "WiFi"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "TFN + global" },
    ],
    tips: [
      "TFN es muy pequeño — lounge es básico pero buen valor 28 € walk-in.",
      "Vuelos a Madrid 19-21h: lounge da merienda + bebidas mientras esperas.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    iata: "SCQ",
    ciudad: "Santiago de Compostela",
    lounges: [
      {
        name: "Sala VIP Compostela",
        terminal: "T1",
        airside: true,
        acceso: [
          { metodo: "Priority Pass", detalle: "Acceso ilimitado" },
          { metodo: "Iberia Plus Oro", detalle: "Status" },
          { metodo: "Walk-in", detalle: "Day pass 27 €" },
        ],
        dayPassEur: 27,
        estanciaMaxH: 3,
        horario: "6:00-22:00",
        servicios: ["Snacks gallegos (empanada)", "Bar", "WiFi"],
      },
    ],
    tarjetasRecomendadas: [
      { nombre: "American Express Platinum", coste: "740 €/año", cobertura: "SCQ + global" },
    ],
    tips: [
      "SCQ lounge sirve empanada gallega — vale por sí solo el day-pass para muchos peregrinos.",
      "El lounge es pequeño pero suele tener espacio — SCQ tiene menos tráfico que otros hubs.",
    ],
    lastUpdated: "2026-05-25",
  },
];

export const LOUNGE_IATAS = LOUNGES.map((h) => h.iata);

export function getLoungesByIata(iata: string): LoungeHub | undefined {
  return LOUNGES.find((h) => h.iata.toLowerCase() === iata.toLowerCase());
}
