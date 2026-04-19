import type { Metadata } from "next";
import { NewsletterForm } from "@/components/NewsletterForm";
import { JsonLd } from "@/components/JsonLd";

// FAQ estructurada (fuente única de verdad: se renderiza como <details> y
// se emite también como JSON-LD para rich snippets en Google).
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "¿Cuántos mensajes al día voy a recibir?",
    a: "Entre 0 y 5. No enviamos ofertas promocionales, solo tarifas con score ≥70. Hay días sin mensajes si no aparece nada realmente bueno.",
  },
  {
    q: "¿Son error fares que luego cancelan?",
    a: "Algunos sí son error fares (la aerolínea puede cancelar). Otros son promociones muy agresivas o combinaciones de tarifas anómalas que sí se respetan. Siempre indicamos el tipo en la alerta.",
  },
  {
    q: "¿Cobráis comisión por reservar?",
    a: "No cobramos a los usuarios. Si reservas a través de un enlace de afiliado, el proveedor nos paga una pequeña comisión — el precio para ti es exactamente el mismo.",
  },
];

export const metadata: Metadata = {
  title: "Canal de Telegram — Alertas de chollos al instante",
  description:
    "Recibe alertas de error fares, Business class barata y anomalías de precio directamente en Telegram. Gratis, sin spam, solo chollos reales.",
  alternates: { canonical: "/telegram" },
  openGraph: {
    title: "Canal Telegram TripCazador — Alertas al instante",
    description:
      "Error fares y Business class barata entregados en segundos. Gratis.",
    type: "website",
  },
};

const FEATURES = [
  {
    title: "Alertas en < 60 segundos",
    text: "En cuanto el motor detecta una tarifa errónea o anómala, el bot manda el mensaje al canal. Antes de que la aerolínea la cancele.",
  },
  {
    title: "Solo CRÍTICO y ERROR",
    text: "No enviamos ofertas promocionales. Solo avisamos cuando el score del motor es ≥70: error fares, Business a precio de economy, anomalías estadísticas claras.",
  },
  {
    title: "Desde hubs europeos",
    text: "Monitorizamos BSL, ZRH, GVA, FRA, MUC, STR, CDG, AMS. Ideal para hispanohablantes en DACH y Europa central.",
  },
  {
    title: "100% gratis, sin spam",
    text: "El canal público es gratuito. Si quieres filtros personalizados y notificaciones por ruta, existe un tier premium opcional.",
  },
];

const STATS = [
  { label: "Error fares detectados", value: "127" },
  { label: "Precio medio Business", value: "−62%" },
  { label: "Tiempo medio alerta", value: "48s" },
  { label: "Suscriptores activos", value: "…" },
];

export default function TelegramPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-sm text-amber-300">
          <span>✈️</span> Canal público — 100% gratuito
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Alertas de chollos en <span className="text-amber-400">Telegram</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          El motor de TripCazador escanea 24/7 cientos de rutas desde Europa. Cuando encuentra una tarifa anómala, el bot te avisa al instante.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Unirme al canal Telegram
          </a>
          <a
            href="#newsletter"
            className="inline-flex items-center gap-2 border border-gray-700 hover:border-amber-500 text-gray-200 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Prefiero por email
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center"
          >
            <div className="text-3xl font-bold text-amber-400">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-2">{f.title}</h2>
            <p className="text-gray-400 text-sm">{f.text}</p>
          </div>
        ))}
      </section>

      {/* Newsletter */}
      <section
        id="newsletter"
        className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/20 max-w-2xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          ¿Prefieres email?
        </h2>
        <p className="text-gray-400 mb-5">
          Resumen semanal con los top 10 chollos de la semana. Un correo cada lunes, cero spam.
        </p>
        <NewsletterForm source="telegram_landing" />
      </section>

      {/* FAQ breve (renderizado + JSON-LD FAQPage para rich snippets de Google) */}
      <section className="max-w-2xl mx-auto space-y-6" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold text-white">Preguntas rápidas</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="glass rounded-xl p-4">
              <summary className="cursor-pointer text-white font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded">
                {item.q}
              </summary>
              <p className="text-gray-300 text-sm mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
    </div>
  );
}
