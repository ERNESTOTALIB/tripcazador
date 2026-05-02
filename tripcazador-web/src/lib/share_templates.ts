/**
 * share_templates.ts — fase tt-TT1
 *
 * Templates para distribuir contenido en Reddit, Twitter/X, Facebook,
 * Threads, WhatsApp comunidades. Pensado para uso desde /panel/share —
 * copy-paste rápido cuando hay un nuevo post o deal interesante.
 *
 * Cada template tiene variantes por plataforma: Reddit (más largo, valor-first
 * sin link spam), Twitter (160 char, hilo opcional), Facebook (medio), Threads
 * (similar Twitter pero más casual).
 *
 * Auto-rellena {{url}} con la URL de la página, {{title}} con el título.
 */

export type SharePlatform = "reddit" | "twitter" | "facebook" | "threads" | "whatsapp";

export interface ShareTemplate {
  id: string;
  platform: SharePlatform;
  context: "blog_post" | "calculator" | "comparison" | "destination" | "homepage";
  title: string;
  body: string;
  subreddit_targets?: string[]; // sugeridos para reddit
}

export const SHARE_TEMPLATES: ShareTemplate[] = [
  // ============== REDDIT ==============
  {
    id: "reddit-blog-post-es",
    platform: "reddit",
    context: "blog_post",
    title: "{{title}}",
    body: `He estado analizando datos de precios de vuelos los últimos meses para un proyecto personal y acabo de publicar este análisis: {{url}}

Lo que cubre:
- Patrones reales de precio para los meses analizados (no opiniones)
- Ventana óptima de compra ruta por ruta
- Aerolíneas concretas que dominan cada segmento

Si alguien tiene experiencia distinta o conoce algún detalle que no haya considerado, me encantaría feedback. El proyecto está en tripcazador.com, sin paywall ni newsletter forzada — pueden leer y largarse.`,
    subreddit_targets: ["spain", "viajeros", "askspain", "podemos", "Madrid", "Barcelona", "preguntaleareddit"],
  },
  {
    id: "reddit-calc-es",
    platform: "reddit",
    context: "calculator",
    title: "[Herramienta] {{title}}",
    body: `He hecho una calculadora gratuita para algo que nunca encontré bien resuelto en español: {{url}}

Funciona client-side (no envía nada a servidor), no requiere registro, y la fórmula está documentada al pie. Si os sirve genial; si encontráis errores o queréis que añada algún caso específico, me lo decís.

Si os interesa el proyecto en general (TripCazador es un side project de error fares), está en tripcazador.com. No hay newsletter forzosa ni paywalls.`,
    subreddit_targets: ["spain", "viajeros", "askspain", "Spanish", "FinanzasPersonalesEs"],
  },
  {
    id: "reddit-comparison-en",
    platform: "reddit",
    context: "comparison",
    title: "{{title}}",
    body: `I spent way too long comparing these two destinations side by side after debating with my partner — wrote up the actual numbers (flight cost, lodging cost, food cost, transport, day-by-day what to do): {{url}}

If you've been to either, would love to hear if my breakdown matches your experience. I tried to be honest about which one wins per criterion (and where it's a tie).

The site itself (tripcazador.com) is a side project on error fares — no paywall, no signup nag.`,
    subreddit_targets: ["travel", "solotravel", "shoestring", "SoloTravel", "travelhacks"],
  },
  {
    id: "reddit-destination-es",
    platform: "reddit",
    context: "destination",
    title: "Análisis: cuándo es realmente barato volar a {{title}}",
    body: `Después de seguir los precios de varios meses he reunido los datos para esta ruta: {{url}}

Lo que verás (sin gurús):
- Precio medio por mes y mes más barato real
- Aerolíneas que dominan
- Aeropuertos secundarios que ahorran y cuánto
- Fechas concretas a evitar (puentes, festivos)

Si alguien viaja regularmente y tiene precios distintos a los que vi, me cuenta y actualizo. Side project en tripcazador.com.`,
    subreddit_targets: ["spain", "viajeros", "askspain", "Madrid"],
  },

  // ============== TWITTER / X ==============
  {
    id: "twitter-blog-post-thread",
    platform: "twitter",
    context: "blog_post",
    title: "Hilo: análisis de precios",
    body: `He analizado los precios de vuelo de los últimos meses para escribir esto:

📊 {{title}}

🧵 Hilo con los puntos clave:

1/

[Pega aquí los 3-5 takeaways del post]
↓
↓
↓

Análisis completo aquí: {{url}}

(Sin newsletter forzada, sin paywall — léelo y vete tranquilo si no aporta)`,
  },
  {
    id: "twitter-calc-tweet",
    platform: "twitter",
    context: "calculator",
    title: "Calculadora gratis",
    body: `Acabo de publicar esta calculadora 100% gratis:

🧮 {{title}}

✓ Sin registro
✓ Sin email
✓ Funciona offline
✓ Fórmula documentada

{{url}}

(Side project de @tripcazador)`,
  },
  {
    id: "twitter-deal-tweet",
    platform: "twitter",
    context: "homepage",
    title: "Deal share",
    body: `Chollo de hoy en TripCazador: {{title}}

✈️ Detalles + booking directo: {{url}}

Verificado, sin clickbait. Si lo cojo, te lo cuento.`,
  },

  // ============== FACEBOOK / GRUPOS ==============
  {
    id: "facebook-blog-post-es",
    platform: "facebook",
    context: "blog_post",
    title: "Compartir en grupos viajes",
    body: `Hola grupo,

Soy de TripCazador, una web de error fares y comparativas que llevo tiempo construyendo. Acabo de publicar este análisis que creo os puede interesar:

{{title}}

Lo que cubre: [resume en 2-3 líneas el contenido del post]

Lo podéis leer aquí: {{url}}

No hay newsletter agresiva ni paywall — sólo el análisis. Cualquier feedback es bienvenido (en serio, leemos todo). 🛫`,
  },
  {
    id: "facebook-calc",
    platform: "facebook",
    context: "calculator",
    title: "Compartir herramienta",
    body: `Para los que también andáis cazando vuelos baratos: he hecho esta calculadora gratis (sin registro, sin emails) que os puede ahorrar tiempo:

🧮 {{title}}

{{url}}

La fórmula está documentada y todo el cálculo es client-side (vuestra info no sale de vuestro navegador). Side project en tripcazador.com — feedback bienvenido.`,
  },

  // ============== THREADS ==============
  {
    id: "threads-blog-casual",
    platform: "threads",
    context: "blog_post",
    title: "Threads casual share",
    body: `Acabo de soltar un análisis nuevo en TripCazador:

📍 {{title}}

Si os interesa el tema de cazar precios de vuelo sin volverse loco, échele un ojo: {{url}}

(side project, sin newsletter forzada)`,
  },

  // ============== WHATSAPP ==============
  {
    id: "whatsapp-deal",
    platform: "whatsapp",
    context: "homepage",
    title: "WhatsApp grupo viajes",
    body: `Chollo verificado:

✈️ {{title}}

Más detalles + booking: {{url}}

(de TripCazador, side project que llevo)`,
  },
  {
    id: "whatsapp-calc",
    platform: "whatsapp",
    context: "calculator",
    title: "WhatsApp calc",
    body: `Para los que cazáis vuelos:

🧮 He hecho esta calc gratis (sin registro):
{{title}}

{{url}}`,
  },
];

export interface ShareableContent {
  id: string;
  type: "blog_post" | "calculator" | "comparison" | "destination" | "homepage";
  title: string;
  url_path: string;
}

// Top contenido a distribuir (curado para alta probabilidad de interés)
export const TOP_CONTENT: ShareableContent[] = [
  // Calculadoras (alta share-rate, util)
  { id: "calc-vuelos", type: "calculator", title: "Calculadora valor del vuelo", url_path: "/calculadora" },
  { id: "calc-co2", type: "calculator", title: "Calculadora CO2 vuelo vs tren", url_path: "/calculadora-co2" },
  { id: "calc-millas", type: "calculator", title: "Calculadora millas equivalentes", url_path: "/calculadora-millas" },
  { id: "calc-cancel", type: "calculator", title: "Probabilidad de cancelación de vuelo", url_path: "/calculadora-cancelacion" },
  { id: "calc-upgrade", type: "calculator", title: "Probabilidad de upgrade a business", url_path: "/calculadora-upgrade" },

  // Posts SEO long-tail con tracción potencial
  { id: "blog-fare-buckets", type: "blog_post", title: "Códigos secretos de las aerolíneas: cómo deciden tu tarifa en 2026", url_path: "/blog/secret-codes-airline-pricing-fare-buckets-2026" },
  { id: "blog-asia-mes", type: "blog_post", title: "Vuelos baratos a Asia desde España: el mes exacto para comprar 2026-2027", url_path: "/blog/vuelos-baratos-asia-mejor-mes-comprar-2026" },
  { id: "blog-europe-asia", type: "blog_post", title: "Europe vs Asia 2026: where €1500 actually goes further", url_path: "/blog/europe-vs-asia-best-bang-for-buck-2026" },
  { id: "blog-puente-mayo", type: "blog_post", title: "Vuelos baratos puente de mayo 2026: dónde van los precios y cuándo comprar", url_path: "/blog/vuelos-puente-mayo-2026-baratos" },
  { id: "blog-cuando-error", type: "blog_post", title: "Cuándo comprar un vuelo error fare en 2026 (sin perder la oportunidad)", url_path: "/blog/cuando-comprar-vuelo-error-fare-detectar-2026" },

  // Comparativas alto intent
  { id: "comp-praga-bud", type: "comparison", title: "Praga vs Budapest 2026: cuál fin de semana", url_path: "/comparar/praga-vs-budapest-fin-de-semana-cultura" },
  { id: "comp-japon-vt", type: "comparison", title: "Japón vs Vietnam 2026: circuito Asia cultural", url_path: "/comparar/japon-vs-vietnam-asia-cultural" },
  { id: "comp-mald-sey", type: "comparison", title: "Maldivas vs Seychelles: luna de miel paradisíaca", url_path: "/comparar/maldivas-vs-seychelles-luna-de-miel" },
  { id: "comp-ar-cl", type: "comparison", title: "Argentina vs Chile: cuál Patagonia elegir", url_path: "/comparar/argentina-vs-chile-patagonia-2026" },
  { id: "comp-aus-nz", type: "comparison", title: "Australia vs Nueva Zelanda 2026: aventura paisaje extremo", url_path: "/comparar/australia-vs-nueva-zelanda-aventura-naturaleza" },

  // Hubs / destinos
  { id: "hub-mapa", type: "homepage", title: "Mapa de precios — visualización de chollos por destino", url_path: "/mapa-precios" },
  { id: "hub-deals", type: "homepage", title: "Chollos de vuelo verificados — TripCazador", url_path: "/deals" },
  { id: "hub-glosario", type: "blog_post", title: "Glosario de cazadores de vuelo: 50 términos esenciales", url_path: "/glosario" },
];

export function renderShare(
  template: ShareTemplate,
  content: ShareableContent,
  siteUrl = "https://tripcazador.com",
): { title: string; body: string; url: string } {
  const url = `${siteUrl}${content.url_path}`;
  const title = template.title
    .replace(/\{\{title\}\}/g, content.title)
    .replace(/\{\{url\}\}/g, url);
  const body = template.body
    .replace(/\{\{title\}\}/g, content.title)
    .replace(/\{\{url\}\}/g, url);
  return { title, body, url };
}

export function templatesForContent(content: ShareableContent): ShareTemplate[] {
  return SHARE_TEMPLATES.filter((t) => t.context === content.type || t.context === "homepage");
}
