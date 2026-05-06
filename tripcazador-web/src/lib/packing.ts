/**
 * packing.ts — A5 (May 2026)
 *
 * Generador de packing list. Combina heurística (clima destino + duración +
 * actividades + tipo viajero) y opcionalmente AI cascade (Groq → Gemini).
 */

export type PackingInput = {
  destination: string;
  days: number;
  travelers: number;
  travelerType: "solo" | "pareja" | "familia" | "business";
  activities: string[]; // ["playa", "ciudad", "trekking", "fiesta", "frio", "trabajo"]
  season: "primavera" | "verano" | "otoño" | "invierno";
  notes?: string;
};

export type PackingItem = {
  category: string;
  name: string;
  qty: number;
  essential: boolean;
};

const BASE_ESSENTIALS: PackingItem[] = [
  { category: "Documentos", name: "Pasaporte / DNI", qty: 1, essential: true },
  { category: "Documentos", name: "Tarjeta sanitaria europea / seguro", qty: 1, essential: true },
  { category: "Documentos", name: "Reserva vuelo + hotel impresa o offline", qty: 1, essential: true },
  { category: "Documentos", name: "Tarjeta crédito + débito", qty: 2, essential: true },
  { category: "Documentos", name: "Foto pasaporte digital + papel (backup)", qty: 1, essential: false },
  { category: "Electrónica", name: "Móvil + cargador", qty: 1, essential: true },
  { category: "Electrónica", name: "Adaptador enchufe internacional", qty: 1, essential: true },
  { category: "Electrónica", name: "Powerbank ≥10000mAh", qty: 1, essential: false },
  { category: "Electrónica", name: "Auriculares", qty: 1, essential: false },
  { category: "Higiene", name: "Cepillo + pasta dientes (≤100ml)", qty: 1, essential: true },
  { category: "Higiene", name: "Desodorante (≤100ml)", qty: 1, essential: true },
  { category: "Higiene", name: "Crema solar SPF50+ (≤100ml en cabina)", qty: 1, essential: false },
  { category: "Salud", name: "Medicación habitual + receta", qty: 1, essential: true },
  { category: "Salud", name: "Ibuprofeno / paracetamol", qty: 1, essential: false },
  { category: "Salud", name: "Tiritas + antiséptico", qty: 1, essential: false },
];

function clothesByDays(days: number, season: PackingInput["season"]): PackingItem[] {
  const cap = Math.min(days, 7);
  const items: PackingItem[] = [
    { category: "Ropa", name: "Camisetas / tops", qty: cap, essential: true },
    { category: "Ropa", name: "Ropa interior", qty: cap + 1, essential: true },
    { category: "Ropa", name: "Calcetines", qty: cap + 1, essential: true },
    { category: "Ropa", name: "Pantalón largo", qty: 2, essential: true },
    { category: "Ropa", name: "Pijama", qty: 1, essential: true },
  ];
  if (season === "verano") {
    items.push({ category: "Ropa", name: "Pantalón corto / falda", qty: 2, essential: true });
    items.push({ category: "Ropa", name: "Chaqueta ligera (aire acondicionado)", qty: 1, essential: false });
  }
  if (season === "invierno") {
    items.push({ category: "Ropa", name: "Abrigo / parka", qty: 1, essential: true });
    items.push({ category: "Ropa", name: "Bufanda + gorro + guantes", qty: 1, essential: true });
    items.push({ category: "Ropa", name: "Jersey grueso", qty: 2, essential: true });
    items.push({ category: "Ropa", name: "Térmicos base layer", qty: 2, essential: false });
  }
  if (season === "primavera" || season === "otoño") {
    items.push({ category: "Ropa", name: "Jersey / sudadera", qty: 2, essential: true });
    items.push({ category: "Ropa", name: "Chubasquero ligero", qty: 1, essential: true });
  }
  return items;
}

function activityItems(acts: string[]): PackingItem[] {
  const items: PackingItem[] = [];
  if (acts.includes("playa")) {
    items.push({ category: "Playa", name: "Bañador / bikini", qty: 2, essential: true });
    items.push({ category: "Playa", name: "Chanclas", qty: 1, essential: true });
    items.push({ category: "Playa", name: "Toalla microfibra", qty: 1, essential: false });
    items.push({ category: "Playa", name: "Gafas sol + funda", qty: 1, essential: true });
  }
  if (acts.includes("ciudad")) {
    items.push({ category: "Ciudad", name: "Zapatillas cómodas (caminar mucho)", qty: 1, essential: true });
    items.push({ category: "Ciudad", name: "Mochila día", qty: 1, essential: true });
    items.push({ category: "Ciudad", name: "Botella agua reutilizable", qty: 1, essential: false });
  }
  if (acts.includes("trekking")) {
    items.push({ category: "Trekking", name: "Botas trekking (rodadas)", qty: 1, essential: true });
    items.push({ category: "Trekking", name: "Calcetines técnicos", qty: 3, essential: true });
    items.push({ category: "Trekking", name: "Bastones plegables", qty: 1, essential: false });
    items.push({ category: "Trekking", name: "Chubasquero técnico", qty: 1, essential: true });
  }
  if (acts.includes("fiesta")) {
    items.push({ category: "Fiesta", name: "Outfit nocturno", qty: 2, essential: true });
    items.push({ category: "Fiesta", name: "Zapatos formales", qty: 1, essential: false });
  }
  if (acts.includes("frio") || acts.includes("nieve")) {
    items.push({ category: "Frío extremo", name: "Plumas / pluma técnica", qty: 1, essential: true });
    items.push({ category: "Frío extremo", name: "Forro polar", qty: 1, essential: true });
    items.push({ category: "Frío extremo", name: "Crema labial cacao", qty: 1, essential: false });
  }
  if (acts.includes("trabajo") || acts.includes("business")) {
    items.push({ category: "Trabajo", name: "Laptop + cargador + ratón", qty: 1, essential: true });
    items.push({ category: "Trabajo", name: "Outfit reuniones", qty: 2, essential: true });
    items.push({ category: "Trabajo", name: "Tarjetas visita", qty: 1, essential: false });
    items.push({ category: "Trabajo", name: "Adaptador HDMI/USB-C", qty: 1, essential: false });
  }
  return items;
}

export function buildHeuristicPackingList(input: PackingInput): PackingItem[] {
  const items = [
    ...BASE_ESSENTIALS,
    ...clothesByDays(input.days, input.season),
    ...activityItems(input.activities),
  ];
  if (input.travelerType === "familia") {
    items.push({ category: "Familia", name: "Toallitas húmedas", qty: 3, essential: true });
    items.push({ category: "Familia", name: "Snacks niños vuelo", qty: 1, essential: true });
    items.push({ category: "Familia", name: "Tablet + auriculares niños", qty: 1, essential: false });
    items.push({ category: "Familia", name: "Muda extra cabina", qty: 1, essential: true });
  }
  if (input.days > 7) {
    items.push({ category: "Lavandería", name: "Detergente viaje (sobre)", qty: 2, essential: false });
    items.push({ category: "Lavandería", name: "Cuerda + pinzas mini", qty: 1, essential: false });
  }
  return items;
}
