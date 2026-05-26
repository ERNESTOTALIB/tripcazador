/**
 * parking_aeropuerto_catalog.ts — NEXT batch (26 may 2026)
 *
 * 15 aeropuertos ES con info parking. Catalog plano — no listamos
 * marcas comerciales específicas (cambian rápido), sí tipos de parking
 * + rango precios + tips.
 *
 * Revenue path: Parclick afiliado link en cada landing
 * (NEXT_PUBLIC_PARCLICK_REF env var) — el código ya está wired
 * desde SSS345.
 *
 * High-intent SEO: "parking aeropuerto madrid" ~30k búsquedas/mes,
 * mainland 5-15k/mes, islas 2-5k/mes.
 */

export type ParkingType =
  | "p_general"      // AENA parking general (lejos, barato)
  | "p_oficial"      // AENA Express (cerca, caro)
  | "p_largo"        // AENA Estancia Larga (días+)
  | "concertado"     // privado fuera del aeropuerto, shuttle
  | "valet";         // recogida y entrega coche en terminal

export interface ParkingOption {
  type: ParkingType;
  name: string;
  /** Tiempo a terminal en minutos */
  walkMin: number;
  /** Precio día completo (24h) en EUR */
  diaEur: number;
  /** Precio semana (7 días) en EUR */
  semanaEur: number;
  /** Notas sobre shuttle, horarios, descuentos */
  notas: string;
}

export interface ParkingAeropuerto {
  iata: string;
  ciudad: string;
  /** Opciones de parking principales */
  options: ParkingOption[];
  /** Recomendación según estancia */
  recomendacion: {
    cortoPlazoH: string;     // < 4h
    medio1_3Dias: string;    // 1-3 días
    largoSemana: string;     // 7+ días
  };
  tips: string[];
  evitar: string[];
  lastUpdated: string;
}

export const PARKING_AEROPUERTOS: ParkingAeropuerto[] = [
  {
    iata: "MAD",
    ciudad: "Madrid",
    options: [
      { type: "p_general", name: "AENA P1/P2 General T1-T4", walkMin: 5, diaEur: 32, semanaEur: 130, notas: "Caro pero más cerca de terminales. Plazas cubiertas." },
      { type: "p_largo", name: "AENA Estancia Larga", walkMin: 15, diaEur: 17, semanaEur: 65, notas: "Bus gratuito cada 10 min al terminal. Más rentable >3 días." },
      { type: "concertado", name: "Parkings concertados (Parclick partners)", walkMin: 25, diaEur: 9, semanaEur: 32, notas: "5-10 km del aeropuerto. Shuttle incluido cada 15-20 min. Reserva online obligatoria." },
      { type: "valet", name: "Valet (servicio premium)", walkMin: 0, diaEur: 35, semanaEur: 145, notas: "Recogen coche en terminal salida + devolución llegada. Marcas como Aerocity, etc." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA Express T1-T4 (4€/hora primer 30min, luego escalado)",
      medio1_3Dias: "AENA Estancia Larga (17€/día) o Parclick concertado (~10€/día)",
      largoSemana: "Parclick concertado 30-40€ semana = -75% vs AENA Express",
    },
    tips: [
      "Reserva online >24h antes ahorra ~30% sobre walk-in en cualquier parking AENA.",
      "Concertados con shuttle: salir hotel 30 min antes del que sería al aeropuerto directamente.",
      "Si vuelas con mascota o equipaje XL, valet (35€/día) puede valer la pena = sin maniobras con maletas.",
    ],
    evitar: [
      "Dejar coche en arcén/calles laterales — la grúa retira y multa 90€+.",
      "Carteles 'parking 8€/día barato' en redes sociales sin web — algunos son fraude (coche aparece arañado o robado).",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "BCN",
    ciudad: "Barcelona",
    options: [
      { type: "p_general", name: "AENA P1/P2 General T1/T2", walkMin: 5, diaEur: 34, semanaEur: 138, notas: "Cubierto. Precio premium." },
      { type: "p_largo", name: "AENA Low Cost T2", walkMin: 12, diaEur: 13, semanaEur: 49, notas: "Solo T2. Bus gratis a T1/T2 cada 10 min." },
      { type: "concertado", name: "Parclick Premium concertados", walkMin: 20, diaEur: 8, semanaEur: 32, notas: "Zona Prat/Sant Boi. Shuttle 15-20 min. Verificación online." },
      { type: "valet", name: "Valet servicios premium", walkMin: 0, diaEur: 32, semanaEur: 130, notas: "Marcas tipo Aeroparkings, Parkimeter Premium." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA Express T1/T2 (4€/30min)",
      medio1_3Dias: "AENA Low Cost T2 (13€/día) — válido si llegas/sales T2",
      largoSemana: "Parclick concertado ~32€ semana",
    },
    tips: [
      "Si vuelas con Vueling/Ryanair (T2) y dejas coche, AENA Low Cost T2 es el sweet spot.",
      "Si vuelas en T1 (LH, IB, AF) usa Parclick concertado — bus shuttle te lleva a T1 también.",
      "Reservar Parclick app: 5-10% descuento + cancelación gratuita hasta 24h antes.",
    ],
    evitar: [
      "Dejar coche en zona de Servicio AENA — multa inmediata.",
      "Parkings 'baratos' sin web/teléfono — verifica antes en Google Reviews.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "AGP",
    ciudad: "Málaga",
    options: [
      { type: "p_general", name: "AENA P1/P2 T3", walkMin: 5, diaEur: 28, semanaEur: 110, notas: "Cubierto. Próximo al check-in T3." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 12, diaEur: 12, semanaEur: 45, notas: "Bus gratuito cada 10-15 min al terminal." },
      { type: "concertado", name: "Parclick concertados Málaga", walkMin: 20, diaEur: 7, semanaEur: 28, notas: "Costa del Sol, shuttle frecuente." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1/P2 (escalado horas)",
      medio1_3Dias: "AENA Larga Estancia 12€/día",
      largoSemana: "Parclick concertado ~28€ semana",
    },
    tips: [
      "AGP en verano tiene tráfico denso por la autopista — sal 30 min antes del cálculo de Google Maps.",
      "Si vas a la Costa del Sol Tu coche queda libre — alquila uno local en Marbella/Fuengirola si no lo necesitas en aeropuerto.",
    ],
    evitar: ["Parkings 'baratos' sin reserva online — saturan en alta temporada."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "PMI",
    ciudad: "Palma de Mallorca",
    options: [
      { type: "p_general", name: "AENA P1/P2 General", walkMin: 5, diaEur: 30, semanaEur: 120, notas: "Cubierto, cerca del terminal." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 15, diaEur: 13, semanaEur: 48, notas: "Bus gratuito cada 10 min." },
      { type: "concertado", name: "Parclick partners Mallorca", walkMin: 25, diaEur: 8, semanaEur: 32, notas: "Zonas periféricas isla. Recomendado >5 días." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1/P2",
      medio1_3Dias: "AENA Larga Estancia 13€/día",
      largoSemana: "Parclick concertado",
    },
    tips: [
      "PMI tiene tráfico denso en verano — sal hotel con 1h+ de margen extra Jul-Ago.",
      "Si llegas Mallorca y alquilas coche, parking aeropuerto durante vacaciones no es necesario.",
    ],
    evitar: ["Aparcar fuera del aeropuerto en pueblos sin reserva — saturación verano."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "ALC",
    ciudad: "Alicante",
    options: [
      { type: "p_general", name: "AENA P1 General T1", walkMin: 5, diaEur: 25, semanaEur: 95, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 12, diaEur: 11, semanaEur: 42, notas: "Bus gratuito al terminal." },
      { type: "concertado", name: "Parclick concertados", walkMin: 20, diaEur: 7, semanaEur: 26, notas: "Zona El Altet, shuttle 15 min." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 11€/día",
      largoSemana: "Parclick concertado ~26€ semana",
    },
    tips: [
      "ALC es uno de los aeropuertos con parking más barato de España — relación precio/comodidad muy buena.",
    ],
    evitar: ["Parking en calle del pueblo El Altet — limitado, pocas plazas."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "VLC",
    ciudad: "Valencia",
    options: [
      { type: "p_general", name: "AENA P1/P2", walkMin: 5, diaEur: 22, semanaEur: 85, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 10, diaEur: 10, semanaEur: 38, notas: "Bus gratuito al T1." },
      { type: "concertado", name: "Parclick partners Manises", walkMin: 18, diaEur: 7, semanaEur: 26, notas: "Cerca aeropuerto." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1/P2",
      medio1_3Dias: "AENA Larga Estancia 10€/día",
      largoSemana: "Parclick ~26€ semana",
    },
    tips: [
      "VLC es muy compacto — controles y aparcamiento ágiles. No requieres llegar 3h antes (1h sobra).",
    ],
    evitar: ["Estación AVE Joaquín Sorolla NO conecta directo con parking aeropuerto — coche separado del tren."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "SVQ",
    ciudad: "Sevilla",
    options: [
      { type: "p_general", name: "AENA P1 General T1", walkMin: 5, diaEur: 23, semanaEur: 90, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 10, diaEur: 10, semanaEur: 38, notas: "Bus gratuito." },
      { type: "concertado", name: "Parclick concertados", walkMin: 18, diaEur: 6, semanaEur: 24, notas: "Polígonos cercanos." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 10€/día",
      largoSemana: "Parclick ~24€ semana",
    },
    tips: [
      "SVQ es pequeño y eficiente — parking AENA siempre con plazas disponibles excepto en Feria de Abril.",
    ],
    evitar: ["Aparcamiento en zonas próximas no autorizadas — grúa rápida."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "BIO",
    ciudad: "Bilbao",
    options: [
      { type: "p_general", name: "AENA P1", walkMin: 5, diaEur: 25, semanaEur: 96, notas: "Cubierto. Próximo terminal." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 12, diaEur: 11, semanaEur: 42, notas: "Bus gratuito." },
      { type: "concertado", name: "Parclick Loiu / Sondika", walkMin: 18, diaEur: 7, semanaEur: 28, notas: "Cerca del aeropuerto." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 11€/día",
      largoSemana: "Parclick ~28€ semana",
    },
    tips: [
      "BIO es el aeropuerto con la terminal más bonita de España (Calatrava) — vale la pena llegar con 30 min de margen para ver el edificio.",
    ],
    evitar: ["Parking en pueblos cercanos sin reserva — saturados en eventos Bilbao."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "LPA",
    ciudad: "Las Palmas",
    options: [
      { type: "p_general", name: "AENA P1 General", walkMin: 5, diaEur: 24, semanaEur: 92, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 10, diaEur: 11, semanaEur: 42, notas: "Bus gratuito." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia",
      largoSemana: "AENA Larga Estancia es la única opción razonable en LPA",
    },
    tips: [
      "LPA no tiene tantas opciones de parking concertado como peninsular — AENA Larga Estancia es estándar.",
    ],
    evitar: ["No hay parkings ilegales viables — la guardia civil controla muy a menudo."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "TFS",
    ciudad: "Tenerife Sur",
    options: [
      { type: "p_general", name: "AENA P1", walkMin: 5, diaEur: 22, semanaEur: 85, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 10, diaEur: 10, semanaEur: 38, notas: "Bus gratuito." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 10€/día",
      largoSemana: "AENA Larga Estancia (no Parclick mayor en TFS)",
    },
    tips: [
      "TFS está conectado con la mayoría de hoteles turísticos del sur (Adeje, Cristianos) por bus — alquila coche solo si haces ruta isla.",
    ],
    evitar: ["No dejar coche en aparcamientos de hoteles si te vas de viaje — pueden mover el coche."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "TFN",
    ciudad: "Tenerife Norte",
    options: [
      { type: "p_general", name: "AENA P1", walkMin: 5, diaEur: 20, semanaEur: 78, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 10, diaEur: 9, semanaEur: 35, notas: "Bus gratuito." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 9€/día",
      largoSemana: "AENA Larga Estancia (más barato de Canarias)",
    },
    tips: [
      "TFN es el aeropuerto con parking más barato de Canarias.",
      "Si vuelas Madrid o Barcelona desde TFN, deja coche en Larga Estancia y come tapas en Puerto de la Cruz.",
    ],
    evitar: ["No hay zonas gratuitas viables cerca — todas son privadas o de hoteles."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "SCQ",
    ciudad: "Santiago de Compostela",
    options: [
      { type: "p_general", name: "AENA P1", walkMin: 5, diaEur: 18, semanaEur: 68, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 8, diaEur: 8, semanaEur: 32, notas: "Próximo al terminal." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 8€/día",
      largoSemana: "AENA Larga Estancia ~32€ semana — uno de los más baratos de España",
    },
    tips: [
      "SCQ es muy pequeño + económico — perfecto para escapadas semana o más.",
    ],
    evitar: ["Lluvia: 60% del año. Si dejas convertible o sin cobertura, parking cubierto AENA P1."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "OVD",
    ciudad: "Oviedo / Asturias",
    options: [
      { type: "p_general", name: "AENA P1", walkMin: 3, diaEur: 16, semanaEur: 62, notas: "Cubierto. Cerca terminal." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 8, diaEur: 8, semanaEur: 30, notas: "Bus gratuito." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 8€/día",
      largoSemana: "AENA Larga Estancia ~30€ semana",
    },
    tips: [
      "OVD es aeropuerto pequeño en zona rural — siempre tiene plazas.",
      "Si vienes desde Oviedo capital, son 47 km — calcula 1h en coche con tráfico.",
    ],
    evitar: ["Atascos N-632 → aeropuerto en horario punta."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "GRX",
    ciudad: "Granada",
    options: [
      { type: "p_general", name: "AENA P1", walkMin: 5, diaEur: 18, semanaEur: 68, notas: "Cubierto." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 10, diaEur: 8, semanaEur: 30, notas: "Bus gratuito." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 8€/día",
      largoSemana: "AENA Larga Estancia 30€ semana",
    },
    tips: [
      "GRX tiene tráfico aéreo limitado — buena disponibilidad parking incluso en alta temporada.",
    ],
    evitar: ["Aparcamiento pueblo Chauchina sin reserva — pocas plazas legales."],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "IBZ",
    ciudad: "Ibiza",
    options: [
      { type: "p_general", name: "AENA P1", walkMin: 5, diaEur: 32, semanaEur: 130, notas: "Cubierto. Precio premium temporada alta." },
      { type: "p_largo", name: "AENA Larga Estancia", walkMin: 12, diaEur: 14, semanaEur: 52, notas: "Bus gratuito." },
    ],
    recomendacion: {
      cortoPlazoH: "AENA P1",
      medio1_3Dias: "AENA Larga Estancia 14€/día",
      largoSemana: "AENA Larga Estancia 52€ semana",
    },
    tips: [
      "IBZ verano (Jun-Sep) demanda parking dispara — reserva online con 1+ semana antelación.",
      "Alternativa: dejar coche en San Antonio/Es Caná y bus 30 min a aeropuerto (más barato).",
    ],
    evitar: ["Esperar a llegar al aeropuerto para encontrar plaza en agosto — riesgo no hay y pierdes vuelo."],
    lastUpdated: "2026-05-26",
  },
];

export const PARKING_AEROPUERTO_IATAS = PARKING_AEROPUERTOS.map((p) => p.iata);

export function getParkingByIata(iata: string): ParkingAeropuerto | undefined {
  return PARKING_AEROPUERTOS.find((p) => p.iata.toLowerCase() === iata.toLowerCase());
}
