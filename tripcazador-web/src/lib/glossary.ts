/**
 * glossary.ts — abr-2026y.
 *
 * 50+ términos del sector vuelos/error fares con definiciones en ES.
 * Cada término genera anchor (#term-slug) + JSON-LD DefinedTerm para
 * habilitar rich snippets de "Definiciones" en SERP.
 *
 * Por qué es valioso para SEO: cada término es una keyword long-tail con
 * intent informacional alto. "Qué es un error fare", "Qué es code share"
 * captura tráfico de descubrimiento que después puede convertir.
 */

export interface GlossaryTerm {
  /** Anchor slug (sin acentos, kebab-case). */
  slug: string;
  /** Término principal en ES. */
  term: string;
  /** Sinónimos / forma EN para acceso bilingüe. */
  aliases?: string[];
  /** Definición concisa (1-3 frases). */
  definition: string;
  /** Explicación extendida opcional. */
  detail?: string;
  /** Categoría para agrupación. */
  category:
    | "tarifas"
    | "operativa"
    | "alianzas"
    | "miles"
    | "cabina"
    | "aeropuertos"
    | "cazador";
}

export const GLOSSARY: GlossaryTerm[] = [
  // ─── Tarifas ───────────────────────────────────────────────
  {
    slug: "error-fare",
    term: "Error fare",
    aliases: ["mistake fare", "tarifa errónea"],
    definition:
      "Tarifa publicada por una aerolínea con un descuento muy superior al normal debido a un error de su sistema de pricing.",
    detail:
      "Suelen ser -65% a -85% del precio publicado, duran horas y se honran si pagas dentro de la ventana. La industria los acepta como parte del coste de tener pricing engines complejos.",
    category: "tarifas",
  },
  {
    slug: "fuel-surcharge",
    term: "Fuel surcharge",
    aliases: ["YQ", "tasa combustible"],
    definition:
      "Recargo aplicado sobre el precio base del billete que las aerolíneas cobran como compensación por el coste del combustible.",
    detail:
      "Suele venir codificado como YQ en el ticket. En redenciones de millas a veces se cobra cash, lo que reduce el valor real del programa.",
    category: "tarifas",
  },
  {
    slug: "fare-class",
    term: "Fare class",
    aliases: ["clase tarifaria", "letter class"],
    definition:
      "Letra (Y, J, F, etc.) que identifica el cubo de precio dentro de una cabina concreta. Determina millas ganadas, flexibilidad y restricciones.",
    detail:
      "Las clases más comunes: Y (economy full-flex), B/H/M (economy mid), Q/T/L/V (economy descuento), J/C (business full-flex), I/D (business descuento).",
    category: "tarifas",
  },
  {
    slug: "advance-purchase",
    term: "Advance purchase",
    aliases: ["AP", "compra anticipada"],
    definition:
      "Restricción que obliga a comprar el billete con cierta antelación al vuelo (típicamente 7, 14 o 21 días).",
    category: "tarifas",
  },
  {
    slug: "round-trip",
    term: "Round trip",
    aliases: ["RT", "ida y vuelta"],
    definition:
      "Itinerario que incluye ida desde A hasta B y vuelta de B a A. Suele ser más barato que dos one-ways separados.",
    category: "tarifas",
  },
  {
    slug: "open-jaw",
    term: "Open jaw",
    aliases: ["mandíbula abierta"],
    definition:
      "Itinerario en el que vuelas a A y vuelves desde B (o viceversa). Útil para ahorrar internos cuando combinas dos ciudades.",
    detail:
      "Ejemplo: MAD → BKK + HKT → MAD. En lugar de RT a BKK + interno BKK-HKT-BKK, sale más barato y ahorra una mañana.",
    category: "tarifas",
  },
  {
    slug: "stopover",
    term: "Stopover",
    definition:
      "Escala intencional de más de 24h en una ciudad intermedia, normalmente sin coste extra.",
    detail:
      "Algunas aerolíneas (Turkish, Singapore, Icelandair) lo promocionan como destino-bonus gratis. Diferencia con layover: menos de 24h.",
    category: "tarifas",
  },
  {
    slug: "layover",
    term: "Layover",
    aliases: ["escala"],
    definition:
      "Escala corta (<24h) entre dos vuelos del mismo itinerario, normalmente solo para conectar.",
    category: "tarifas",
  },

  // ─── Operativa ───────────────────────────────────────────
  {
    slug: "code-share",
    term: "Code share",
    aliases: ["código compartido"],
    definition:
      "Acuerdo entre dos aerolíneas en el que una vende billetes de un vuelo operado por la otra bajo su propio código.",
    detail:
      "Ejemplo: IB6201 puede ser un vuelo Iberia operado por American Airlines. Las clases tarifarias y precios pueden diferir entre el operador y el commercializador.",
    category: "operativa",
  },
  {
    slug: "interlining",
    term: "Interlining",
    definition:
      "Acuerdo entre aerolíneas para emitir billetes únicos cubriendo segmentos operados por más de una. Diferente de code-share: puede no involucrar marketing conjunto.",
    category: "operativa",
  },
  {
    slug: "alianza",
    term: "Alianza aérea",
    aliases: ["airline alliance"],
    definition:
      "Asociación entre múltiples aerolíneas que comparten códigos, frequent flyer programs, lounges y estándares operativos.",
    detail:
      "Las tres grandes: Star Alliance (LH, UA, ANA, Singapore...), oneworld (BA, AA, JAL, Iberia...), SkyTeam (AF, KLM, Delta, Korean Air...).",
    category: "alianzas",
  },
  {
    slug: "hub-and-spoke",
    term: "Hub and spoke",
    definition:
      "Modelo operativo en el que una aerolínea concentra vuelos en un aeropuerto central (hub) desde el que conecta destinos (spokes).",
    detail:
      "Lufthansa usa hub-and-spoke en FRA y MUC. Ryanair, en contraste, usa point-to-point: vuelo directo entre cualquier par de aeropuertos sin centralizar.",
    category: "operativa",
  },
  {
    slug: "point-to-point",
    term: "Point to point",
    definition:
      "Modelo operativo de vuelos directos entre dos ciudades sin necesidad de pasar por un hub central. Típico de low-cost.",
    category: "operativa",
  },
  {
    slug: "irregularidad-operativa",
    term: "Irregularidad operativa",
    aliases: ["IROP", "irregular operations"],
    definition:
      "Cualquier evento que altera el plan original de vuelo: retraso, cancelación, cambio de aeronave, desvío. Activa derechos según EU 261 en Europa.",
    category: "operativa",
  },
  {
    slug: "eu-261",
    term: "EU 261",
    aliases: ["Reglamento 261/2004"],
    definition:
      "Regulación europea que protege a pasajeros en caso de cancelación, retraso largo o denegación de embarque. Compensa €250-600 según ruta.",
    detail:
      "Aplica si el vuelo sale desde la UE o si llega a la UE en aerolínea con sede en la UE. La compensación es independiente del precio del billete.",
    category: "operativa",
  },
  {
    slug: "denied-boarding",
    term: "Denied boarding",
    aliases: ["overbooking", "embarque denegado"],
    definition:
      "Cuando la aerolínea vende más asientos que los disponibles y deniega el embarque a algunos pasajeros. Activa compensación EU 261 obligatoria.",
    category: "operativa",
  },

  // ─── Alianzas y miles ────────────────────────────────────
  {
    slug: "frequent-flyer",
    term: "Frequent flyer program",
    aliases: ["FFP", "programa de millas"],
    definition:
      "Programa de fidelización que acumula puntos/millas por vuelos. Permite redenciones gratuitas, upgrades y status tier (Silver, Gold, Platinum).",
    category: "miles",
  },
  {
    slug: "elite-status",
    term: "Elite status",
    aliases: ["status tier", "estatus elite"],
    definition:
      "Nivel alcanzado en un programa frequent flyer (Silver, Gold, Platinum) que da beneficios: prioridad embarque, equipaje extra, acceso lounge, upgrades.",
    category: "miles",
  },
  {
    slug: "award-ticket",
    term: "Award ticket",
    aliases: ["billete con millas", "redención"],
    definition:
      "Billete pagado con millas/puntos en lugar de cash. La aerolínea publica una tabla de "
      + "redenciones (saver/standard) por ruta y cabina.",
    category: "miles",
  },
  {
    slug: "saver-award",
    term: "Saver award",
    definition:
      "Categoría más barata de redención de millas, con disponibilidad limitada. Alternativa: standard award (más caro pero más disponibilidad).",
    category: "miles",
  },
  {
    slug: "transfer-partner",
    term: "Transfer partner",
    aliases: ["socio de transferencia"],
    definition:
      "Programa de tarjeta de crédito (Amex, Chase, Citi) cuyos puntos se pueden transferir 1:1 a un FFP. Multiplica flexibilidad.",
    category: "miles",
  },
  {
    slug: "avios",
    term: "Avios",
    definition:
      "Moneda de fidelización compartida por British Airways, Iberia, Aer Lingus y Qatar. Una de las más eficientes para vuelos cortos en Europa.",
    category: "miles",
  },

  // ─── Cabina ─────────────────────────────────────────────
  {
    slug: "economy",
    term: "Economy class",
    aliases: ["turista", "economy"],
    definition:
      "Cabina más básica del avión. Asiento estándar (30-32\" pitch), pasta dental como amenities en long-haul.",
    category: "cabina",
  },
  {
    slug: "premium-economy",
    term: "Premium economy",
    aliases: ["W class"],
    definition:
      "Cabina intermedia entre economy y business. Más espacio (38-40\" pitch), mejor comida, no flat-bed.",
    category: "cabina",
  },
  {
    slug: "business-class",
    term: "Business class",
    aliases: ["clase ejecutiva", "J class"],
    definition:
      "Cabina de gama alta con asiento que se convierte en cama (flat-bed), comida gourmet, lounge access.",
    category: "cabina",
  },
  {
    slug: "first-class",
    term: "First class",
    aliases: ["primera clase", "F class"],
    definition:
      "La cabina premium absoluta, con suites privadas en algunas aerolíneas (Singapore, Emirates, Etihad). Cada vez menos aerolíneas la operan.",
    category: "cabina",
  },
  {
    slug: "flat-bed",
    term: "Flat bed",
    definition:
      "Asiento de business o first que se reclina 180° formando una cama horizontal. Estándar en business class moderna long-haul.",
    category: "cabina",
  },
  {
    slug: "herringbone",
    term: "Herringbone",
    aliases: ["en raspa de pescado"],
    definition:
      "Configuración de cabina business class en la que los asientos están dispuestos en ángulo respecto al pasillo, normalmente 1-2-1.",
    category: "cabina",
  },
  {
    slug: "reverse-herringbone",
    term: "Reverse herringbone",
    definition:
      "Variante del herringbone con asientos angulados hacia el lado contrario. Pies hacia la ventana en lugar de hacia el pasillo.",
    category: "cabina",
  },

  // ─── Aeropuertos ─────────────────────────────────────────
  {
    slug: "iata-code",
    term: "Código IATA",
    aliases: ["IATA airport code"],
    definition:
      "Código de tres letras que identifica un aeropuerto. Ejemplos: MAD (Madrid), BCN (Barcelona), LHR (Londres Heathrow), JFK (Nueva York).",
    category: "aeropuertos",
  },
  {
    slug: "icao-code",
    term: "Código ICAO",
    definition:
      "Código de cuatro letras usado por controladores aéreos. Ejemplos: LEMD (Madrid Barajas), LEBL (Barcelona). Más jerárquico que IATA.",
    category: "aeropuertos",
  },
  {
    slug: "hub-aeropuerto",
    term: "Hub",
    aliases: ["aeropuerto hub"],
    definition:
      "Aeropuerto desde el que una aerolínea opera la mayor parte de sus rutas long-haul. Iberia tiene hub único en MAD.",
    category: "aeropuertos",
  },
  {
    slug: "secondary-airport",
    term: "Aeropuerto secundario",
    aliases: ["secondary airport"],
    definition:
      "Aeropuerto a las afueras de una ciudad principal, usado por low-cost por menores tasas. Ejemplo: Beauvais para París, Stansted para Londres.",
    category: "aeropuertos",
  },
  {
    slug: "minimum-connection-time",
    term: "Minimum connection time",
    aliases: ["MCT", "tiempo mínimo conexión"],
    definition:
      "Tiempo mínimo que la aerolínea garantiza para hacer conexión entre dos vuelos en el mismo aeropuerto. Si pierdes conexión por demora, te re-acomodan.",
    category: "aeropuertos",
  },

  // ─── Cazador ─────────────────────────────────────────────
  {
    slug: "fare-alert",
    term: "Fare alert",
    aliases: ["alerta de precio"],
    definition:
      "Notificación automática cuando el precio de una ruta concreta baja de un umbral. Se configura por email, push o Telegram.",
    category: "cazador",
  },
  {
    slug: "yield-management",
    term: "Yield management",
    aliases: ["pricing dinámico"],
    definition:
      "Sistema de las aerolíneas que ajusta precios en tiempo real según demanda, días anticipación, competencia. Por eso un mismo asiento varía ±40% en 24h.",
    category: "cazador",
  },
  {
    slug: "fare-bucket",
    term: "Fare bucket",
    aliases: ["cubo tarifario"],
    definition:
      "Conjunto de asientos asignados a una clase tarifaria concreta. Cuando se agota el bucket, los siguientes se venden al siguiente cubo más caro.",
    category: "cazador",
  },
  {
    slug: "gds",
    term: "GDS",
    aliases: ["Global Distribution System"],
    definition:
      "Sistema centralizado de distribución (Amadeus, Sabre, Travelport) que conecta agencias y plataformas de venta con las aerolíneas.",
    detail:
      "Los GDS actualizan precios en bloques (no en tiempo real), lo que crea ventanas de minutos donde los precios entre el GDS y el website de la aerolínea pueden divergir — fuente común de error fares.",
    category: "cazador",
  },
  {
    slug: "ndc",
    term: "NDC",
    aliases: ["New Distribution Capability"],
    definition:
      "Estándar IATA para distribuir contenido aéreo (precios, reglas, ancillaries) directamente desde aerolíneas, sin pasar por GDS legacy.",
    category: "cazador",
  },
  {
    slug: "shoulder-season",
    term: "Shoulder season",
    aliases: ["temporada media"],
    definition:
      "Periodo entre temporada alta y baja, con precios y demanda intermedios. Suele dar el mejor balance precio/clima.",
    detail:
      "Para Tailandia: octubre y noviembre. Para Caribe: mayo. Para Japón: marzo y noviembre.",
    category: "cazador",
  },
  {
    slug: "shoulder-week",
    term: "Shoulder week",
    definition:
      "Semana inmediatamente antes o después de una temporada de pico. Precios suelen ser 20-40% más bajos manteniendo casi el mismo clima/experiencia.",
    category: "cazador",
  },
  {
    slug: "honeypot",
    term: "Honeypot",
    definition:
      "Campo invisible en formularios que solo bots rellenan. Si está lleno, descartas el envío silenciosamente. Técnica antispam standard.",
    category: "cazador",
  },
  {
    slug: "rev-management",
    term: "Revenue management",
    aliases: ["RM", "gestión de ingresos"],
    definition:
      "Departamento de la aerolínea responsable del yield management. Revisan errores fares y deciden si honrar o cancelar.",
    category: "cazador",
  },
  {
    slug: "deep-link",
    term: "Deep link",
    definition:
      "URL que abre directamente una búsqueda preconfigurada en una OTA (Online Travel Agent) o aerolínea. Esencial para enviar al usuario directo a la oferta.",
    category: "cazador",
  },
  {
    slug: "dry-lease",
    term: "Dry lease",
    definition:
      "Alquiler de aeronave sin tripulación ni mantenimiento. La aerolínea operadora aporta personal y certificado.",
    category: "operativa",
  },
  {
    slug: "wet-lease",
    term: "Wet lease",
    aliases: ["ACMI"],
    definition:
      "Alquiler de aeronave con tripulación, mantenimiento y seguros. Útil para cubrir picos operativos o sustituir aviones averiados.",
    category: "operativa",
  },
  {
    slug: "skiplagging",
    term: "Skiplagging",
    aliases: ["hidden city ticketing"],
    definition:
      "Técnica de comprar A-B-C y bajarse en la conexión B porque A-B-C es más barato que A-B directo. Las aerolíneas lo prohíben en términos.",
    detail:
      "Riesgo real: si lo detectan, pueden cerrarte cuenta de millas, anular vuelta y reclamar diferencia de precio. No funciona con equipaje facturado.",
    category: "cazador",
  },
  {
    slug: "throwaway-ticketing",
    term: "Throwaway ticketing",
    definition:
      "Comprar un billete RT más barato que un OW y descartar la vuelta. También prohibido por términos de la aerolínea.",
    category: "cazador",
  },
  {
    slug: "dummy-ticket",
    term: "Dummy ticket",
    definition:
      "Reserva temporal sin pago, válida 24-48h, usada para gestionar visados y devolver. No implica compra firme.",
    category: "cazador",
  },
  {
    slug: "watch-list",
    term: "Watch list",
    aliases: ["lista de seguimiento"],
    definition:
      "Conjunto de rutas que monitorizas para esperar precio mínimo. El motor de TripCazador mantiene watch lists configurables.",
    category: "cazador",
  },
];

export function getGlossaryByCategory(): Record<string, GlossaryTerm[]> {
  const grouped: Record<string, GlossaryTerm[]> = {};
  for (const t of GLOSSARY) {
    grouped[t.category] = grouped[t.category] || [];
    grouped[t.category].push(t);
  }
  return grouped;
}

export const CATEGORY_LABELS: Record<string, string> = {
  tarifas: "Tarifas y precios",
  operativa: "Operativa de vuelo",
  alianzas: "Alianzas",
  miles: "Millas y programas",
  cabina: "Cabinas",
  aeropuertos: "Aeropuertos",
  cazador: "Cazador (técnicas y herramientas)",
};
