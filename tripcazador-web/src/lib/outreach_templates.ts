/**
 * outreach_templates.ts — fase ss-SS8
 *
 * Templates de outreach para conseguir partners afiliados/sponsored.
 * Pensados para uso desde /panel (login owner) — copy-paste rápido a Hotmail.
 *
 * Personalización mínima: {{brand_name}}, {{your_name}} = "Ernesto",
 * {{contact_email}} = contacto@tripcazador.com.
 */

export interface OutreachTemplate {
  id: string;
  category: "insurance" | "esim" | "transfer" | "carrental" | "hotels" | "lounge";
  brand_examples: string[];
  subject: string;
  body: string;
}

const SITE_STATS = `
- 60+ blog posts long-tail (ES + EN, indexados)
- 50+ comparativas head-to-head con tráfico orgánico creciente
- ~250 páginas indexables en sitemap (calculadoras, hubs aeropuerto, regiones, destinos, deals)
- Audiencia cazador-de-vuelos hispanohablante + EN secundario
- Canal Telegram con publicación automática 3 deals/día
- Travelpayouts marker activo (vuelos + hoteles)
- Stack técnico: Next.js + Vercel, Lighthouse 90+ móvil`;

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: "insurance-cold",
    category: "insurance",
    brand_examples: ["IATI Seguros", "Mondo Seguros", "Heymondo", "Chapka"],
    subject: "Propuesta partnership — TripCazador (audiencia cazadores de vuelos hispanos)",
    body: `Hola {{brand_name}},

Soy Ernesto Talib, fundador de TripCazador.com — una web española de error fares, comparativas y herramientas para viajeros que buscan vuelos baratos. Os escribo porque tu producto encaja directo con nuestra audiencia, que entra a la web ya con intención de viaje (high-intent).

Lo que tenemos hoy:
${SITE_STATS}

Lo que propongo:
- Banner footer en todas las páginas + recomendación contextual en blog posts long-tail (ej: "viajar a Tokio 2026" → seguro Asia).
- Link de afiliado tracker que tú me proporciones (Travelpayouts, ShareASale, Awin, lo que uses).
- Compromiso editorial: solo recomendamos productos que probaríamos nosotros. No spammeo, no popups agresivos.

Si os interesa, mándame:
1. Tu programa de afiliados activo (con CPA o revshare estándar)
2. URL de landing optimizada para tráfico hispano
3. Algún case study si lo tenéis

Si no es el momento, no pasa nada — mantengo la dirección por si hubiera algo en 2026.

Gracias por tu tiempo,
Ernesto Talib
contacto@tripcazador.com
https://tripcazador.com`,
  },
  {
    id: "esim-cold",
    category: "esim",
    brand_examples: ["Holafly", "Airalo", "Saily", "Maya Mobile"],
    subject: "Partnership con TripCazador — eSIM para viajeros hispanohablantes",
    body: `Hola {{brand_name}},

Te escribo desde TripCazador.com, una web española de cazadores de vuelos baratos con tráfico orgánico creciente. Mi audiencia (hispanohablante, 25-45 años, viaja 3-6 veces al año) es exactamente la que compra eSIM repetidamente.

Lo que tenemos:
${SITE_STATS}

Mi propuesta:
- Recomendación contextual en blog posts de destinos (mis posts top traen tráfico de "viajar a Tailandia 2026", "Vietnam 14 días", etc — perfecto para eSIM).
- Banner discreto en /destinos/[slug] con tu link tracker.
- Posibilidad de promo code exclusivo "TRIPCAZADOR" si quieres algo medible.

Necesitaría de tu parte:
1. Programa de afiliados activo (revshare o flat fee)
2. eSIM coverage especialmente para Asia, Latinoamérica y Europa
3. Promo code tracker si optas por la opción de descuento

¿Te interesa? Podemos hacer una llamada corta de 15 min para ver si encaja.

Saludos,
Ernesto Talib
contacto@tripcazador.com
https://tripcazador.com`,
  },
  {
    id: "transfer-cold",
    category: "transfer",
    brand_examples: ["Welcome Pickups", "GetTransfer", "AirportTransfer.com", "HoppaGo"],
    subject: "TripCazador + traslados aeropuerto: propuesta colaboración",
    body: `Hola {{brand_name}},

Soy Ernesto, fundador de TripCazador.com — el portal español de error fares y comparativas de vuelos. Mis usuarios tienen un problema concreto que tu producto resuelve: cuando reservan un vuelo barato a un destino nuevo, necesitan transfer aeropuerto-hotel y casi siempre acaban pagando taxi caro o en uber con sobrecargo.

Stats actuales del sitio:
${SITE_STATS}

Propuesta:
- Widget compacto en /destinos/[slug] (tengo 24 destinos): "Llegada al aeropuerto X — reserva tu transfer ahora con {{brand_name}}".
- Mención contextual en blog posts de itinerario (ej: "Bali 14 días" → transfer DPS-Ubud).
- Link tracker tu lado.

Lo que necesito:
1. Programa de afiliados activo
2. Cobertura de aeropuertos top (priorizo: BKK, DPS, MLE, NRT, ICN, JFK, LAX, SCL, EZE, CDG, FCO, LHR)
3. Comisión estándar (target ~5-10% del transfer, lo que se acostumbre)

Si tu producto cubre estos aeropuertos y tienes programa activo, te propongo una integración ligera. Si tienes alguna restricción, dímelo y vemos.

Un saludo,
Ernesto Talib
contacto@tripcazador.com
https://tripcazador.com`,
  },
  {
    id: "lounge-cold",
    category: "lounge",
    brand_examples: ["Priority Pass", "LoungeBuddy", "Plaza Premium", "DragonPass"],
    subject: "Acceso a lounges aeropuerto — partnership con TripCazador",
    body: `Hola {{brand_name}},

Te escribo porque mi audiencia en TripCazador.com sería un buen fit para tu producto. Cazadores de error fares + viajeros frecuentes + business class hunters = perfil exactamente alineado con quien paga acceso a lounges fuera de programa de fidelidad.

Sobre nosotros:
${SITE_STATS}

La oportunidad: tengo posts top sobre escalas largas (stopovers de 5+ horas en IST, DOH, SIN, FRA, LHR), business class error fares, y guías de "qué hacer en aeropuerto X". En todos esos contextos, recomendar acceso a lounge es genuinamente útil para el lector.

Mi propuesta:
- Banner contextual + recomendación inline en posts relevantes (mido qué posts traen este tráfico via GA4)
- Opcional: review honesta de tu producto en formato blog (sin pago — solo si me dais acceso a probar)
- Link tracker afiliado

Necesitaría:
1. Programa afiliado activo (revshare o membership commission)
2. Cobertura de lounges en hubs top (IST, DOH, SIN, JFK, LAX, FRA, LHR, MEX, GRU, EZE)

¿Tienes 15 min para una llamada o me mandas el deck del programa?

Saludos,
Ernesto Talib
contacto@tripcazador.com
https://tripcazador.com`,
  },
  {
    id: "carrental-cold",
    category: "carrental",
    brand_examples: ["Discover Cars", "Rentalcars.com", "AutoEurope", "Sixt"],
    subject: "TripCazador — partnership alquiler de coche para viajeros hispanos",
    body: `Hola {{brand_name}},

Soy Ernesto de TripCazador.com. Mis usuarios son cazadores de vuelos baratos hispanohablantes — cuando aterrizan en un destino, ~40% de los viajes incluyen alquiler de coche según las encuestas que he hecho a lectores.

Stats actuales:
${SITE_STATS}

Te propongo:
- Widget en /destinos/[slug] con buscador embebido o link tracker para alquiler en ese destino.
- Recomendación contextual en blog posts de road trip (tengo posts sobre Nueva Zelanda road trip, Patagonia, Islandia, Costa Oeste USA).
- Mención en /partners (página dedicada de mis sponsors).

Lo que necesito de tu parte:
1. Programa de afiliados activo (revshare estándar 5-10%)
2. Cobertura competitiva en aeropuertos top
3. Buscador embebible o link tracker

¿Encaja con lo que ofrecéis hoy en 2026?

Gracias,
Ernesto Talib
contacto@tripcazador.com
https://tripcazador.com`,
  },
  {
    id: "hotels-cold",
    category: "hotels",
    brand_examples: ["Booking.com", "Hotels.com", "Expedia", "Trip.com (hotels)"],
    subject: "TripCazador hotels integration — propuesta volumen alto",
    body: `Hola equipo {{brand_name}},

Soy Ernesto, fundador de TripCazador.com. Estamos integrando booking de hoteles directamente en flujo del usuario (cuando ve un vuelo barato a destino X, le mostramos opciones de hotel del mismo destino). Hoy uso Travelpayouts/Hotellook por defecto, pero quiero evaluar otras opciones.

Stats:
${SITE_STATS}

Lo que busco:
- Programa de afiliados B2B con buena comisión hotel (ideal ~6-8% del room cost)
- Búsquedas embebibles (widget) o API para integración directa
- Cobertura global, especial Asia, Caribe y Mediterráneo (90% de mis búsquedas)

Si me podéis enviar:
1. Términos del programa (commission rate + payment terms)
2. Documentación de API o widget
3. Algún case study con publishers similares

Hago la integración yo y empezamos a generar volumen. Si os interesa, podemos avanzar esta semana.

Saludos,
Ernesto Talib
contacto@tripcazador.com
https://tripcazador.com`,
  },
];

export function getTemplatesByCategory(category: OutreachTemplate["category"]): OutreachTemplate[] {
  return OUTREACH_TEMPLATES.filter((t) => t.category === category);
}

export function renderTemplate(t: OutreachTemplate, brand: string): { subject: string; body: string } {
  const subject = t.subject.replace(/\{\{brand_name\}\}/g, brand);
  const body = t.body.replace(/\{\{brand_name\}\}/g, brand);
  return { subject, body };
}
