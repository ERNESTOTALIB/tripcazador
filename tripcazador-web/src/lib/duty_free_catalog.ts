/**
 * duty_free_catalog.ts — NEXT batch (26 may 2026)
 *
 * 10 aeropuertos ES con guía duty-free. "duty free aeropuerto madrid"
 * ~5-15k búsquedas/mes per ciudad. Cubre qué se vende típicamente,
 * comparativa precios vs ciudad, límites aduana, qué SÍ vs NO comprar.
 */

export interface DutyFreeCategory {
  category: string;
  exampleItems: string[];
  /** Ahorro típico vs precio en ciudad (rango) */
  ahorroPct: string;
  /** Vale la pena? recomendación honest */
  vaLaPena: string;
}

export interface DutyFreeAeropuerto {
  iata: string;
  ciudad: string;
  /** Marcas principales presentes en este aeropuerto */
  marcas: string[];
  /** Categorías populares con análisis */
  categorias: DutyFreeCategory[];
  /** Reglas aduana vuelo EU vs no-EU */
  limitesAduana: {
    intraEU: string;
    extraEU: string;
  };
  /** Tips específicos */
  tips: string[];
  /** Trampas típicas a evitar */
  trampas: string[];
  lastUpdated: string;
}

export const DUTY_FREE: DutyFreeAeropuerto[] = [
  {
    iata: "MAD",
    ciudad: "Madrid",
    marcas: ["Dufry (general)", "Hermès", "Loewe (terminal T4S)", "Tous", "Bvlgari", "Cartier"],
    categorias: [
      {
        category: "Tabaco",
        exampleItems: ["Cartón Marlboro 200 cig.", "Cartón Camel", "Puros Cohiba"],
        ahorroPct: "0-15% vs estanco España",
        vaLaPena: "NO para vuelos intra-EU (España precio similar). SÍ para destinos low-tax (UAE, Singapore).",
      },
      {
        category: "Alcohol",
        exampleItems: ["Whisky Macallan 12y", "Ron Diplomático", "Vodka Beluga", "Champán Moët"],
        ahorroPct: "15-30% vs ciudad",
        vaLaPena: "SÍ para botellas premium >40€. NO para licores básicos (whisky barato = mismo precio supermercado).",
      },
      {
        category: "Cosmética",
        exampleItems: ["Chanel No.5 100ml", "Dior Sauvage", "La Mer cremas", "Clarins"],
        ahorroPct: "10-25% vs ciudad (Sephora/El Corte Inglés)",
        vaLaPena: "Comparar mientras esperas: app Sephora vs precio duty-free. Marcas exclusivas duty-free a veces.",
      },
      {
        category: "Chocolate y alimentación",
        exampleItems: ["Lindt 200g", "Toblerone XXL 1kg", "Mahou cerveza pack regalo", "Jamón ibérico"],
        ahorroPct: "0-10% vs supermercado",
        vaLaPena: "NO realmente — más barato Mercadona o Carrefour. SÍ por practicidad (regalo último minuto).",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límites cuantitativos para uso personal (orientativo: 800 cig., 10L licor, 90L vino).",
      extraEU: "200 cig., 1L licor +40°, 4L vino, valor max 430€ bienes (incl. perfume, electrónica).",
    },
    tips: [
      "T4 Iberia Velázquez tiene los lounges premium — el duty-free de T4S es el más amplio (3000m²) con marcas exclusivas Hermès/Loewe.",
      "Si vuelas Iberia Premium Economy/Business class, descuento adicional 10% en duty-free presentando tarjeta de embarque.",
      "App Aena Travel tiene 'reserva online' — el producto te lo entregan en puerta de embarque, ahorras tiempo cola.",
    ],
    trampas: [
      "Perfumes 'edición duty-free' a veces son tamaños diferentes (90ml en vez de 100ml) — comparar precio por ml.",
      "Cigarrillos: precio en MAD similar a estanco si vuelas EU. Solo merece pena con destino fuera EU (límite 1 cartón).",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "BCN",
    ciudad: "Barcelona",
    marcas: ["Dufry", "Cacao Sampaka", "Custo Barcelona", "Tous", "Camper"],
    categorias: [
      {
        category: "Alcohol",
        exampleItems: ["Cava Codorníu Brut Vintage", "Whisky catalán Nomad", "Cava Recaredo"],
        ahorroPct: "15-25%",
        vaLaPena: "SÍ para cava premium — botellas que no encuentras fácil fuera España.",
      },
      {
        category: "Chocolate y cosmética catalana",
        exampleItems: ["Cacao Sampaka chocolatería", "Productos artesanos catalanes"],
        ahorroPct: "0-10%",
        vaLaPena: "Más por regalo único que ahorro real.",
      },
      {
        category: "Tabaco",
        exampleItems: ["Cartón Marlboro", "Cigarros Cohiba"],
        ahorroPct: "0-15%",
        vaLaPena: "Solo para destinos extra-EU.",
      },
      {
        category: "Perfumería",
        exampleItems: ["Carolina Herrera", "Loewe", "Paco Rabanne"],
        ahorroPct: "10-20%",
        vaLaPena: "Marcas españolas (Loewe, CH) ligero descuento.",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límite cuantitativo para uso personal.",
      extraEU: "200 cig., 1L licor +40°, 4L vino, 430€ bienes total.",
    },
    tips: [
      "T1 tiene más selección que T2 (low-cost) — si tu vuelo es T2 y quieres duty-free, recorre la zona airside antes del embarque.",
      "Cava Recaredo o Mont-Marçal — botellas premium difíciles de encontrar fuera de Cataluña, valen para regalo único.",
    ],
    trampas: [
      "Promociones 'compra 2 paga 1.5' en perfumería suelen ser productos con stock antiguo — verifica fecha caducidad.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "AGP",
    ciudad: "Málaga",
    marcas: ["Dufry", "Picasso souvenirs", "Estrella Galicia"],
    categorias: [
      {
        category: "Vino y licor andaluz",
        exampleItems: ["Vino Málaga dulce", "Vino Jerez", "Brandy Lustau"],
        ahorroPct: "15-25%",
        vaLaPena: "SÍ — vinos jerezanos y malagueños difícil encontrar fuera España.",
      },
      {
        category: "Alimentación",
        exampleItems: ["Aceite oliva virgen extra (lata)", "Jamón ibérico", "Almendras"],
        ahorroPct: "0-10%",
        vaLaPena: "NO — más barato en supermercado o mercado Atarazanas. Como regalo SÍ.",
      },
      {
        category: "Cosmética / perfumería",
        exampleItems: ["Marcas internacionales habituales"],
        ahorroPct: "10-20%",
        vaLaPena: "Variable según producto — comparar app.",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límite uso personal.",
      extraEU: "Estándar EU (200 cig., 1L, 4L vino, 430€).",
    },
    tips: [
      "AGP en verano duty-free saturado — recorre antes de tu hora boarding.",
      "Productos andaluces (vino Málaga, brandy Jerez) son los más interesantes — únicos a la región.",
    ],
    trampas: [
      "Jamón ibérico en duty-free: precio caro vs Mercadona o tienda especializada. Solo conveniente si te lo llevas a USA (Iberian Pork Importers tiene restricciones específicas).",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "PMI",
    ciudad: "Palma de Mallorca",
    marcas: ["Dufry", "Pearls of Mallorca", "Custo Barcelona", "Camper"],
    categorias: [
      {
        category: "Licores baleares",
        exampleItems: ["Hierbas de Mallorca", "Ron Mallorquín", "Ginebra Gin Mare"],
        ahorroPct: "15-25%",
        vaLaPena: "SÍ — licores locales únicos. Hierbas de Mallorca y Gin Mare valen como regalo.",
      },
      {
        category: "Productos típicos",
        exampleItems: ["Sobrasada", "Ensaimadas envasadas", "Aceite oliva DOP Mallorca"],
        ahorroPct: "0-15%",
        vaLaPena: "Más por regalo que ahorro. Ensaimadas envasadas duran 2-3 semanas.",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límite uso personal.",
      extraEU: "Estándar EU.",
    },
    tips: [
      "PMI duty-free en verano (Jun-Sep): largas colas — llega 2h antes vuelo.",
      "Hierbas de Mallorca (licor local) y Gin Mare son los productos más recomendados.",
    ],
    trampas: [
      "Ensaimadas envasadas 'duty-free': 8-12€ por caja, mientras en panadería local 4-6€. Compra en pueblo y llévatela al aeropuerto.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "ALC",
    ciudad: "Alicante",
    marcas: ["Dufry"],
    categorias: [
      {
        category: "Turrones y dulces",
        exampleItems: ["Turrón Jijona", "Turrón Alicante", "Mazapán"],
        ahorroPct: "0-10%",
        vaLaPena: "NO — más barato en supermercado o tienda especializada en Jijona. SÍ para regalo último momento.",
      },
      {
        category: "Vinos y licor",
        exampleItems: ["Vino Alicante DO", "Cava regional"],
        ahorroPct: "10-20%",
        vaLaPena: "Algunos vinos DO Alicante son interesantes — comparar antes.",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límite uso personal.",
      extraEU: "Estándar EU.",
    },
    tips: [
      "ALC es pequeño y duty-free limitado — no esperes encontrar marcas exclusivas.",
    ],
    trampas: [
      "Turrones a precio premium — productores locales (Jijona, Xixona) los venden 30-50% más barato.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "VLC",
    ciudad: "Valencia",
    marcas: ["Dufry"],
    categorias: [
      {
        category: "Productos valencianos",
        exampleItems: ["Horchata envasada", "Turrón Casinos", "Vino DO Valencia"],
        ahorroPct: "0-10%",
        vaLaPena: "NO ahorro real. SÍ por regalo único.",
      },
      {
        category: "Alimentación",
        exampleItems: ["Aceite oliva", "Almendras"],
        ahorroPct: "0-5%",
        vaLaPena: "NO — supermercado más barato.",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límite uso personal.",
      extraEU: "Estándar EU.",
    },
    tips: [
      "VLC duty-free es básico — selección limitada.",
    ],
    trampas: [
      "Productos valencianos 'gourmet' a precio inflado vs mercado central de Valencia.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "SVQ",
    ciudad: "Sevilla",
    marcas: ["Dufry"],
    categorias: [
      {
        category: "Vinos jerezanos",
        exampleItems: ["Manzanilla La Guita", "Fino Tío Pepe", "Pedro Ximénez"],
        ahorroPct: "10-20%",
        vaLaPena: "SÍ — botellas premium difíciles de encontrar fuera Andalucía.",
      },
      {
        category: "Productos artesanales",
        exampleItems: ["Aceite oliva DOP", "Aceitunas en lata", "Mantecados"],
        ahorroPct: "0-10%",
        vaLaPena: "Más por regalo que ahorro.",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límite uso personal.",
      extraEU: "Estándar EU.",
    },
    tips: [
      "Manzanilla La Guita y Tío Pepe son productos icónicos — buen regalo para amigos extranjeros.",
    ],
    trampas: [
      "Olivas en lata 'andaluzas': precio aeropuerto vs supermercado = 2-3x. Compra en mercado Triana antes de salir.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "BIO",
    ciudad: "Bilbao",
    marcas: ["Dufry"],
    categorias: [
      {
        category: "Vinos vascos",
        exampleItems: ["Txakoli", "Rioja Alavesa"],
        ahorroPct: "10-20%",
        vaLaPena: "SÍ para txakoli — difícil encontrar fuera País Vasco.",
      },
      {
        category: "Productos típicos",
        exampleItems: ["Idiazabal queso", "Conservas (anchoas Santoña)"],
        ahorroPct: "0-15%",
        vaLaPena: "Anchoas premium duty-free a veces son las mismas marcas que mercado local — comparar.",
      },
    ],
    limitesAduana: {
      intraEU: "Sin límite uso personal.",
      extraEU: "Estándar EU.",
    },
    tips: [
      "BIO duty-free es pequeño pero con buena selección vasca local.",
    ],
    trampas: [
      "Anchoas Santoña 'premium' duty-free a precio inflado — mismas marcas en La Bretxa mercado.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "LPA",
    ciudad: "Las Palmas",
    marcas: ["Dufry"],
    categorias: [
      {
        category: "Tabaco y licor",
        exampleItems: ["Cartones tabaco", "Ron canario", "Mojo picón"],
        ahorroPct: "30-50%",
        vaLaPena: "SÍ — Canarias tiene régimen fiscal especial (sin IVA en muchos productos). Precios muy competitivos vs península.",
      },
      {
        category: "Productos canarios",
        exampleItems: ["Mojo picón", "Gofio", "Plátano canario"],
        ahorroPct: "0-15%",
        vaLaPena: "Más por regalo único.",
      },
    ],
    limitesAduana: {
      intraEU: "Canarias TIENE límite también porque NO es zona IVA EU: 200 cig., 1L licor +40°, 4L vino, 430€ valor.",
      extraEU: "Igual que intraEU desde Canarias.",
    },
    tips: [
      "Canarias = mejor duty-free de España: sin IVA en muchos productos. Diferencia precio real con península.",
      "Whisky premium (Macallan, Lagavulin) en LPA puede costar 30-40% menos que península.",
    ],
    trampas: [
      "Cantidad máxima 1 cartón tabaco al pasar a península — superas, decomiso + multa.",
    ],
    lastUpdated: "2026-05-26",
  },
  {
    iata: "TFS",
    ciudad: "Tenerife Sur",
    marcas: ["Dufry"],
    categorias: [
      {
        category: "Tabaco y licor",
        exampleItems: ["Cartones tabaco", "Ron canario", "Whisky premium"],
        ahorroPct: "30-50%",
        vaLaPena: "SÍ — mismo régimen fiscal Canarias = mejores precios España.",
      },
      {
        category: "Productos canarios",
        exampleItems: ["Vino malvasía", "Miel palma", "Mojo picón"],
        ahorroPct: "0-10%",
        vaLaPena: "Como regalo único.",
      },
    ],
    limitesAduana: {
      intraEU: "Estándar EU al pasar a España continental (200 cig., 1L licor +40°, 4L vino, 430€).",
      extraEU: "Igual.",
    },
    tips: [
      "TFS tiene la mejor selección duty-free de Canarias (más grande que TFN o LPA en superficie).",
      "Whisky single malt premium con descuento real 25-40% vs península.",
    ],
    trampas: [
      "Cantidad máx 1 cartón tabaco — superas en aduana península = decomiso.",
    ],
    lastUpdated: "2026-05-26",
  },
];

export const DUTY_FREE_IATAS = DUTY_FREE.map((d) => d.iata);

export function getDutyFreeByIata(iata: string): DutyFreeAeropuerto | undefined {
  return DUTY_FREE.find((d) => d.iata.toLowerCase() === iata.toLowerCase());
}
