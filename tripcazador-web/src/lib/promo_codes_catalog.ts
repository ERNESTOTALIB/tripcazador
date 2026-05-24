/**
 * promo_codes_catalog.ts — SUPER-1D (24 may 2026)
 *
 * Información sobre códigos descuento por aerolínea. NOTA importante:
 * NO listamos códigos activos (cambian semanalmente y se queman rápido).
 * En su lugar, documentamos PATRÓN típico + dónde buscar + términos legales.
 *
 * Cumple con T&C de aerolíneas (no facilitamos abuse) y aporta valor real
 * al viajero (saber dónde mirar).
 */

export interface PromoAirline {
  slug: string;
  name: string;
  emoji: string;
  iata: string; // FR, IB...
  cuandoSalen: string;
  donde: string;
  patron: string;
  restriccionesTipo: string[];
  combinable: string;
  ejemplos: string;
  consejo: string;
}

export const PROMO_CODES_CATALOG: PromoAirline[] = [
  {
    slug: "ryanair",
    name: "Ryanair",
    emoji: "🟦",
    iata: "FR",
    cuandoSalen:
      "Black Friday (último viernes nov), Cyber Monday, Sales 'Family Sales' (mar/sept), 'Last Minute' (jueves-domingo de cada semana).",
    donde:
      "Newsletter oficial Ryanair (suscríbete con email principal). App Ryanair push notifications. Twitter @Ryanair.",
    patron:
      "Códigos 6-8 caracteres alfanuméricos (ej. 'SUMMER25', 'ESCAPE'). Suelen aplicar 10-25% sobre el precio base (NO sobre tasas ni equipaje).",
    restriccionesTipo: [
      "Solo nuevos clientes (registro 24h antes)",
      "Excluye fechas peak (jul-ago + navidades)",
      "Mín 2 personas / 3 noches",
      "Solo desde España (geofence IP)",
    ],
    combinable: "NO combinable con Family Sales ni descuento Plus (cliente premium).",
    ejemplos:
      "Black Friday 2024: 'BF20' → 20% off vuelos jun-sept 2025. Family Sale mar 2025: 'FAM15' → 15% off + maleta gratis.",
    consejo: "Activa notificaciones push de la app Ryanair. Los códigos duran ~24-48h.",
  },
  {
    slug: "vueling",
    name: "Vueling",
    emoji: "🟡",
    iata: "VY",
    cuandoSalen:
      "Black Friday, Cyber Monday, '#VuelingSummerSale' (mayo). Newsletter mensual con códigos individuales.",
    donde:
      "Newsletter Vueling. App push. Twitter @vueling. Instagram @vueling (códigos exclusivos seguidores).",
    patron:
      "Códigos 6 caracteres formato 'XXX99' (ej. 'BLACK20', 'SUMMER15'). 10-30% descuento.",
    restriccionesTipo: [
      "Mínimo 2 pasajeros",
      "Excluye TODAS las tasas",
      "Solo vuelos directos (excluye codeshares)",
      "Validez ventana 30-90 días desde compra",
    ],
    combinable: "NO con descuento estudiante / Vueling Club Premium.",
    ejemplos:
      "BF 2024: 'BF25VY' → 25% off BCN-CDG/AMS/LON. Verano 2025: 'SUNVY15' → 15% off + cabin gratis.",
    consejo:
      "Vueling Club ya da -5% siempre. Pondera: muchas veces es mejor el descuento Club fijo que el promo code que excluye partners y tasas.",
  },
  {
    slug: "iberia",
    name: "Iberia",
    emoji: "🇪🇸",
    iata: "IB",
    cuandoSalen:
      "Iberia Plus newsletter semanal. Sales largo radio 'Avanza' (enero) y 'Late Summer' (sept).",
    donde:
      "Iberia Plus dashboard (logueado). Newsletter Iberia.com. Avios bonus campaigns en partner site Iberia Plus.",
    patron:
      "Códigos 'PROMO-XXXX' o cupones de Avios bonus (no son cash discounts). Iberia rara vez ofrece código universal cash.",
    restriccionesTipo: [
      "Solo socios Iberia Plus",
      "Para Latam: solo rutas troncales (MAD-EZE/JFK/etc), no codeshares",
      "Algunos solo Business class",
    ],
    combinable: "Combinable con bonos Avios. NO con tarifas Plus / Flex.",
    ejemplos:
      "Avanza 2025: -20% MAD-EZE economy + 2x Avios bonus para business. Late Summer: -15% rutas Europa.",
    consejo:
      "Mejor estrategia Iberia: tarjeta Avios Amex (welcome bonus 30K Avios = ~€400 vuelo) > códigos promo.",
  },
  {
    slug: "easyjet",
    name: "easyJet",
    emoji: "🟠",
    iata: "U2",
    cuandoSalen:
      "Sales trimestrales. 'easyJet Sale' aparece 4-5 veces al año. Mid-year (jun) y Cyber Week son los grandes.",
    donde:
      "Newsletter easyJet ES. App push notification. easyJet Plus (membresía paid) recibe códigos exclusivos.",
    patron:
      "Códigos 6-7 caracteres formato 'EASYxx' o 'SUMxxxx'. 10-25% descuento aplicado en checkout antes de pago.",
    restriccionesTipo: [
      "Mín. 2 pasajeros",
      "Excluye holiday peak (escolares ES)",
      "Solo rutas operadas easyJet (no Switch/codeshare)",
    ],
    combinable: "NO con descuento easyJet Plus.",
    ejemplos:
      "Mid-year 2025: 'EASY20' → 20% off vuelos sep-nov. Cyber Week: 'CYBEREASY25' → 25% off + Speedy Boarding gratis.",
    consejo:
      "easyJet Plus (€199/año) da -€8 cada vuelo + Speedy Boarding + cambios gratuitos. Si viajas 10+ vuelos/año, mejor que códigos.",
  },
  {
    slug: "air-europa",
    name: "Air Europa",
    emoji: "🇪🇸",
    iata: "UX",
    cuandoSalen:
      "Aniversario fundación (oct), Black Friday. Sales Latam 'Conecta América' (mar, sept).",
    donde:
      "Newsletter Air Europa SUMA. Web propia aireuropa.com sección 'Ofertas'.",
    patron:
      "Cupones SUMA (puntos) más comunes que cash. Cash discount típico 10-15%.",
    restriccionesTipo: [
      "Socios SUMA preferentes",
      "Solo rutas largas (MAD-Latam/Caribe)",
      "Excluye reservas vía agencia",
    ],
    combinable: "Combinable con bonus SUMA. NO con Privilege (tarifas más altas).",
    ejemplos:
      "Conecta América mar 2025: 'AECONNECT15' → -15% MAD-EZE/MIA. Aniversario oct: 2x SUMA puntos.",
    consejo:
      "Aire Europa SUMA puntos tienen tasa de conversión peor que Iberia Avios. Prefiere cash discount.",
  },
  {
    slug: "wizz-air",
    name: "Wizz Air",
    emoji: "🟪",
    iata: "W6",
    cuandoSalen:
      "Wizz Sales mensuales. 'Wizz All You Can Fly' (suscripción anual con vuelos ilimitados a precio fijo) lanzado 2024.",
    donde:
      "Newsletter Wizz Discount Club (membresía paid €30/año da -10% en todo + códigos exclusivos).",
    patron:
      "Códigos via Wizz Discount Club. -10% baseline + ofertas específicas 20-30% en rutas concretas.",
    restriccionesTipo: [
      "Solo Wizz Discount Club members para muchos códigos",
      "Excluye Wizz Multipass (suscripción)",
      "Ventana corta (24-72h)",
    ],
    combinable: "NO entre sí.",
    ejemplos: "Wizz Discount Club -10% siempre. + códigos puntuales 'WIZZSUMMER20' adicional 10%.",
    consejo: "Wizz Discount Club (€30/año) vale la pena solo si vuelas 5+ veces/año con Wizz.",
  },
  {
    slug: "lufthansa",
    name: "Lufthansa",
    emoji: "🇩🇪",
    iata: "LH",
    cuandoSalen:
      "Pocas promociones cash. Miles & More bonus campaigns mensuales. Lufthansa Sale (jun, nov).",
    donde:
      "Newsletter Miles & More. Lufthansa.com sección 'Ofertas Especiales'.",
    patron:
      "Bonus Miles & More (no cash). Cash discount excepcional, típicamente 10% en Business para destinos específicos.",
    restriccionesTipo: [
      "Solo M&M members",
      "Business class only en muchos casos",
      "Specific origin/destination",
    ],
    combinable: "Combinable con status M&M (Senator/HON).",
    ejemplos:
      "M&M oct 2024: 50% bonus miles en redenciones Asia. Lufthansa Sale jun: -10% Business FRA-NYC.",
    consejo:
      "Lufthansa = transferir Amex MR (2:1) a M&M cuando hay 25%+ bonus. Aug-sept ratios mejores.",
  },
  {
    slug: "turkish",
    name: "Turkish Airlines",
    emoji: "🇹🇷",
    iata: "TK",
    cuandoSalen:
      "Anyversario fundación (jul), Sales trimestrales. Miles&Smiles status promotions.",
    donde:
      "Newsletter TK. Twitter @TurkishAirlines. App Miles&Smiles.",
    patron:
      "Códigos 6-8 chars. -10-20% en cash. + bonus Miles&Smiles frecuentes.",
    restriccionesTipo: [
      "Excluye codeshares Star Alliance",
      "Solo rutas TK directas",
      "Tail-of-week (vie-dom)",
    ],
    combinable: "Combinable con Miles&Smiles status.",
    ejemplos: "Aniversario jul 2024: 'TK91' → -20% economy. Trimestral: -15% Business larga radio.",
    consejo:
      "TK tiene una de las mejores experiencias largo radio (Star Alliance) + códigos relativamente generosos. Suscribir newsletter.",
  },
];

export const PROMO_CODES_SLUGS: string[] = PROMO_CODES_CATALOG.map((p) => p.slug);

export function getPromoCodeInfo(slug: string): PromoAirline | undefined {
  return PROMO_CODES_CATALOG.find((p) => p.slug === slug.toLowerCase());
}
