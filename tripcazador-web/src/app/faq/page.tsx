import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ: 25 preguntas frecuentes sobre vuelos baratos y error fares",
  description:
    "Respuestas claras a las 25 preguntas más frecuentes sobre cazar vuelos baratos: qué es un error fare, cómo se detecta, cuándo bookear, derechos pasajero y más.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    title: "FAQ — TripCazador",
    description: "25 preguntas frecuentes con respuestas claras.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

interface FaqEntry {
  q: string;
  a: string;
  category: "basico" | "avanzado" | "derechos" | "servicio";
}

const FAQS: FaqEntry[] = [
  // ─── Básico ────────────────────────────────────────────
  {
    q: "¿Qué es un error fare?",
    a: "Una tarifa publicada por una aerolínea con un descuento muy superior al normal debido a un error de su sistema de pricing. Suelen ser -65 a -85% del precio publicado, duran horas, y la mayoría de aerolíneas las honran si pagas dentro de la ventana.",
    category: "basico",
  },
  {
    q: "¿Cómo encuentro vuelos baratos en general?",
    a: "Tres palancas: flexibilidad de fechas (mover ±3 días ahorra ~18%), bookear con 60-90 días de antelación (sweet spot), y configurar alertas automáticas para tu ruta concreta. La última es la más eficiente — herramientas como nuestro bot Telegram lo automatizan.",
    category: "basico",
  },
  {
    q: "¿Cuándo es el mejor momento para comprar un vuelo?",
    a: "Para vuelos de ocio: 60-90 días antes del viaje. Para business: 14-30 días antes. Día de la semana: martes/miércoles afternoon CET son los más baratos. Hora: típicamente 14:00-18:00 CET es cuando GDS systems push updates.",
    category: "basico",
  },
  {
    q: "¿Qué es la diferencia entre 1500 km y 3500 km en compensaciones?",
    a: "El Reglamento EU 261/2004 categoriza vuelos por distancia: <1500 km = €250 compensación, 1500-3500 km = €400, >3500 km = €600. Aplica si tu vuelo se cancela, retrasa más de 3 horas o sufres denegación de embarque.",
    category: "derechos",
  },
  {
    q: "¿Es legal cazar error fares?",
    a: "Sí, completamente legal. La aerolínea publica el precio, tú lo aceptas. Algunas aerolíneas se reservan el derecho de cancelar el ticket si detectan el error pronto, pero la práctica del mercado es honrarlos. Más de 95% de error fares observados son honrados.",
    category: "basico",
  },
  // ─── Servicio ────────────────────────────────────────
  {
    q: "¿TripCazador es gratis?",
    a: "Sí, 100% gratis. El bot Telegram, las alertas, el blog y el lead magnet son completamente gratuitos. Monetizamos vía afiliación a OTAs (Skyscanner, Aviasales, Booking) cuando reservas tras hacer click — sin coste extra para ti.",
    category: "servicio",
  },
  {
    q: "¿Cómo funciona el bot Telegram?",
    a: "Te suscribes al bot, configuras alertas para tus rutas (origen-destino + precio máximo + cabina). El motor escanea tarifas cada 4 horas, 24/7. Cuando detecta una anomalía que cumple tus filtros, te llega notificación al instante con el deep-link de booking.",
    category: "servicio",
  },
  {
    q: "¿Cuántos error fares se cazan al mes?",
    a: "Variable. En meses fuertes (enero, febrero, octubre, noviembre) detectamos 8-15 anomalías relevantes. Meses tranquilos, 3-5. Solo se notifican las que pasan filtros de calidad (descuento >50%, ruta relevante, aerolínea conocida por honrar).",
    category: "servicio",
  },
  {
    q: "¿Hay versión web sin Telegram?",
    a: "Sí. Puedes ver los chollos públicos en /deals (sin alertas personalizadas). Para alertas push, necesitas Telegram. Estamos trabajando en alternativas vía email y push web para 2026.",
    category: "servicio",
  },
  {
    q: "¿Funciona desde España y otros países hispanohablantes?",
    a: "Sí. Nos enfocamos en hubs europeos pero detectamos errores fares globalmente. Si vives en Argentina, México o Chile, las alertas EZE/MEX/SCL desde Europa funcionan perfectamente. Para vuelos internos de tu país, recomendamos servicios locales más específicos.",
    category: "servicio",
  },
  // ─── Avanzado ────────────────────────────────────────
  {
    q: "¿Qué es un fare bucket y por qué importa?",
    a: "Cada cabina (economy, business...) está dividida en cubos identificados por una letra (Y, B, M, Q...). Cuando se agota el cubo más barato, el siguiente se vende al cubo más caro. Por eso los precios pueden subir €60 de la noche a la mañana sin que la aerolínea cambie nada.",
    category: "avanzado",
  },
  {
    q: "¿Funciona usar VPN para precios más baratos?",
    a: "En 2026 funciona muy poco. Las aerolíneas detectan IP/cookies y a veces el precio sí cambia, pero raramente >5%. El esfuerzo no compensa. Mejor invertir tiempo en alertas automáticas para tu ruta.",
    category: "avanzado",
  },
  {
    q: "¿Qué es un codeshare y cómo lo aprovecho?",
    a: "Acuerdo entre 2 aerolíneas: una vende billetes operados por la otra. Ejemplo: IB6201 puede ser vuelo Iberia operado por American Airlines. Las clases tarifarias y precios pueden diferir. Truco cazador: a veces el codeshare es más barato que el vuelo directo.",
    category: "avanzado",
  },
  {
    q: "¿Qué son los stopovers y cuándo son gratis?",
    a: "Escala de >24h en una ciudad intermedia, sin coste extra. Algunas aerolíneas lo promocionan (Turkish, Singapore, Icelandair, Qatar): vuelas Madrid-IST-Bangkok y puedes parar 1-3 noches en Estambul gratis. Se reserva en multi-city con la misma aerolínea.",
    category: "avanzado",
  },
  {
    q: "¿Hidden city ticketing funciona en 2026?",
    a: "Sí pero con riesgo creciente. Comprar A→B→C y bajarse en B porque A→B→C es más barato que A→B directo. Las aerolíneas lo prohíben en términos. Si te detectan: pueden cerrarte cuenta de millas, anular tu vuelta, o reclamar diferencia. NO funciona con equipaje facturado.",
    category: "avanzado",
  },
  // ─── Derechos ────────────────────────────────────────
  {
    q: "¿Qué hago si mi vuelo se cancela?",
    a: "1) Documenta todo: foto del display, ticket, boarding pass. 2) En el aeropuerto pide constancia escrita y comida/hotel si demora >2h. 3) Si la cancelación es atribuible a la aerolínea (no meteo extrema ni huelga ATC), tienes derecho a €250-600 según distancia (EU 261/2004).",
    category: "derechos",
  },
  {
    q: "¿Cuánto tiempo tengo para reclamar?",
    a: "Hasta 5 años desde el incidente en España. En otros países UE varía 2-5 años. Mejor reclamar pronto (ventana 6 semanas) pero no hay prisa absoluta.",
    category: "derechos",
  },
  {
    q: "¿Las aerolíneas siempre honran error fares?",
    a: "Más de 95% sí. Algunas (Avianca, LATAM) cancelan ocasionalmente. Otras (Iberia, KLM, Lufthansa) los honran casi siempre. Por eso se recomienda no bookear hotel hasta 48-72h post-ticket emitido.",
    category: "derechos",
  },
  {
    q: "¿Qué hago si la aerolínea me ofrece voucher en vez de cash?",
    a: "Decir NO. La compensación EU 261 es en cash al IBAN que tú elijas. El voucher tiene 30-50% menos valor real (caduca, restricciones, no transferible). Insiste en cash citando 'EU 261 Article 7'.",
    category: "derechos",
  },
  {
    q: "¿Mis millas/Avios se acumulan en error fares?",
    a: "Depende de la fare class. Algunos error fares son tarifa básica que no acumula. Otros sí. Verifica 24-48h post-ticket en tu programa frequent flyer; si faltan, abre caso con la aerolínea.",
    category: "derechos",
  },
  // ─── Más básico/avanzado ─────────────────────────────
  {
    q: "¿Vale más la pena business class o económica?",
    a: "Depende de la duración. Para vuelos <6h, business raramente compensa. Para vuelos 11h+ con asiento plano + comida + lounge, business class por €100/h extra es razonable para muchos viajeros. Usa nuestra calculadora interactiva para tu caso concreto.",
    category: "basico",
  },
  {
    q: "¿Qué es 'shoulder season' y por qué es importante?",
    a: "Periodo entre temporada alta y baja con precios y demanda intermedios. Para Tailandia: octubre-noviembre. Para Caribe: mayo. Suele dar el mejor balance precio/clima. Las 'shoulder weeks' (la semana inmediatamente antes/después de pico) son aún más baratas.",
    category: "basico",
  },
  {
    q: "¿Es seguro pagar con débito o necesito crédito?",
    a: "Crédito SIEMPRE. Razones: si la aerolínea cancela, devolución crédito tarda 1-3 días vs 7-21 días débito. Y crédito tiene chargeback rights muchísimo mejores. Sin excepción.",
    category: "avanzado",
  },
  {
    q: "¿Cómo combinar millas + cash para mejor deal?",
    a: "Algunas aerolíneas permiten 'cash + miles': pagas parte con miles, parte cash. Suele ser peor valor que 100% miles o 100% cash, pero en algunos sweet spots puede salir. Especialmente útil cuando te faltan miles para una redención completa.",
    category: "avanzado",
  },
  {
    q: "¿Qué hago si me llaman 'overbooked' al check-in?",
    a: "Es denegación de embarque (DBC). Si no eres voluntario y no aceptan tu billete, tienes derecho a compensación EU 261 inmediata (€250-600 según distancia) + reescalado al siguiente vuelo + comida si demora >2h. Pide compensación en cash, no voucher.",
    category: "derechos",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  basico: "Básico (empezar aquí)",
  servicio: "Sobre TripCazador",
  avanzado: "Avanzado (técnicas)",
  derechos: "Derechos del pasajero",
};

export default function FaqPage() {
  const grouped: Record<string, FaqEntry[]> = {};
  for (const f of FAQS) {
    grouped[f.category] = grouped[f.category] || [];
    grouped[f.category].push(f);
  }
  const categoryOrder = ["basico", "servicio", "avanzado", "derechos"];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "FAQ", item: "https://tripcazador.com/faq" },
      ],
    },
  ];

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">FAQ</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Preguntas frecuentes</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          {FAQS.length} preguntas con respuestas claras. Si la tuya no está aquí, escríbenos por Telegram y la añadimos.
        </p>
      </header>

      <nav aria-label="Saltar a categoría" className="flex flex-wrap gap-2 pb-4 border-b border-gray-800">
        {categoryOrder.map((cat) =>
          grouped[cat] ? (
            <a
              key={cat}
              href={`#cat-${cat}`}
              className="text-xs bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-amber-300 px-3 py-1.5 rounded-full border border-gray-800 transition-colors"
            >
              {CATEGORY_LABELS[cat]}{" "}
              <span className="text-gray-500">({grouped[cat].length})</span>
            </a>
          ) : null,
        )}
      </nav>

      {categoryOrder.map((cat) =>
        grouped[cat] ? (
          <section key={cat} id={`cat-${cat}`} className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-3">
              {grouped[cat].map((f, i) => (
                <details
                  key={i}
                  className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 group"
                >
                  <summary className="font-semibold text-white cursor-pointer flex justify-between items-center">
                    {f.q}
                    <span className="text-amber-400 group-open:rotate-180 transition-transform">⌄</span>
                  </summary>
                  <p className="text-gray-300 mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null,
      )}

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">¿Tu pregunta no está aquí?</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Escríbenos por Telegram. Si la pregunta es relevante para más usuarios, la añadimos en la próxima revisión.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Preguntar por Telegram
        </a>
      </section>
    </div>
  );
}
