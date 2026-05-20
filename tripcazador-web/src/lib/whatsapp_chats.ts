/**
 * whatsapp_chats.ts — SSS365 (21 may 2026)
 *
 * Catálogo de chats WhatsApp por destino — tu idea original.
 * Cada chat = grupo público con subscribers interesados en ese destino.
 * Bot del broadcaster filtra deals y solo manda al chat matching.
 *
 * Cada chat tiene un invitelink público (creado manualmente en WA app y
 * registrado aquí).
 */

export interface WhatsAppChat {
  slug: string;
  display: string;
  emoji: string;
  destinations: string[]; // IATAs que matchean este chat
  description: string;
  invite_link?: string; // Set una vez creado en WA
  active: boolean;
}

export const WHATSAPP_CHATS: WhatsAppChat[] = [
  {
    slug: "chollos-asia",
    display: "Chollos Asia",
    emoji: "🏯",
    destinations: ["TYO", "HND", "NRT", "BKK", "DPS", "SGN", "HAN", "SIN", "KUL", "ICN", "DEL", "DXB"],
    description: "Error fares + business class a Asia desde Europa. ~3-5 chollos al mes.",
    active: false, // pasa a true cuando user crea el grupo
  },
  {
    slug: "chollos-america",
    display: "Chollos América",
    emoji: "🗽",
    destinations: ["JFK", "LAX", "MIA", "CUN", "MEX", "EZE", "GIG", "SCL", "HAV", "BOG", "LIM"],
    description: "Vuelos baratos a USA + Latinoamérica. Las mejores rutas con escala incluidas.",
    active: false,
  },
  {
    slug: "chollos-europa-norte",
    display: "Chollos Europa Norte",
    emoji: "🏔️",
    destinations: ["CPH", "ARN", "OSL", "HEL", "KEF", "DUB", "EDI"],
    description: "Escandinavia + UK + Islandia. Auroras boreales con chollos.",
    active: false,
  },
  {
    slug: "chollos-mediterraneo",
    display: "Chollos Mediterráneo",
    emoji: "🇮🇹",
    destinations: ["FCO", "MXP", "ATH", "IST", "LIS", "OPO", "BCN", "AGP"],
    description: "Italia, Grecia, Turquía y resto del Mediterráneo. Short-haul Europa.",
    active: false,
  },
  {
    slug: "chollos-africa",
    display: "Chollos África",
    emoji: "🐘",
    destinations: ["RAK", "CAI", "CPT", "JNB", "NBO"],
    description: "Marruecos, Egipto, Sudáfrica, safari Kenya/Tanzania.",
    active: false,
  },
  {
    slug: "chollos-business",
    display: "Chollos Business Class",
    emoji: "💼",
    destinations: ["*"],
    description: "Solo error fares en Business + First Class. Para los caza-chollos pro.",
    active: false,
  },
];

export function findChatForDestination(iata: string): WhatsAppChat | undefined {
  return WHATSAPP_CHATS.find(
    (c) =>
      c.active &&
      (c.destinations.includes("*") || c.destinations.includes(iata.toUpperCase())),
  );
}

export function getActiveChats(): WhatsAppChat[] {
  return WHATSAPP_CHATS.filter((c) => c.active);
}
