import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Press kit & contacto para periodistas — TripCazador",
  description:
    "Información para medios y prensa sobre TripCazador: bio, screenshots, logo, copy aprobado y contacto directo. Material listo para descargar.",
  alternates: { canonical: "/prensa" },
  openGraph: {
    type: "website",
    title: "Press kit TripCazador",
    description: "Información, assets y contacto para periodistas.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const FACTS = [
  { label: "Lanzamiento", value: "Marzo 2026" },
  { label: "Sede", value: "Basilea, Suiza (operación) / España (mercado principal)" },
  { label: "Cobertura", value: "Vuelos desde 8 hubs europeos hacia 150+ destinos" },
  { label: "Frecuencia de búsqueda", value: "Cada 4 horas, 24/7" },
  { label: "Catálogo aeropuertos", value: "424 aeropuertos en geo_data" },
  { label: "Aerolíneas analizadas", value: "10 con landing dedicada, 80+ tracked" },
  { label: "Modelo de negocio", value: "Afiliación a OTAs (Travelpayouts) + futuro premium" },
  { label: "Idiomas web", value: "ES (principal), EN, DE/FR/IT (stubs)" },
];

const COPY_VARIANTS = [
  {
    length: "Corto (1 frase, 18 palabras)",
    text:
      "TripCazador es un cazador automatizado de error fares y vuelos baratos desde Europa que avisa por Telegram en segundos.",
  },
  {
    length: "Medio (3 frases, ~70 palabras)",
    text:
      "TripCazador monitoriza vuelos 24/7 desde 8 hubs europeos hacia 150+ destinos buscando error fares — tarifas anómalamente bajas que las aerolíneas honran. El motor compara precios en tiempo real, detecta glitches y notifica a través de Telegram en segundos. Está orientado al viajero hispanohablante con redes especializadas en rutas Europa-Latam y Europa-Asia.",
  },
  {
    length: "Largo (~150 palabras)",
    text:
      "TripCazador es una plataforma especializada en la caza de error fares y tarifas anómalas de vuelos desde Europa. Su motor de búsqueda automatizado, escrito en Python, monitoriza tarifas cada 4 horas en 8 hubs europeos (Madrid, Barcelona, París, Frankfurt, Múnich, Ámsterdam, Zúrich, Basilea) hacia 150+ destinos en todo el mundo. Cuando detecta un error fare —típicamente -65% a -85% del precio publicado— envía una notificación por Telegram con el deep-link de reserva. La plataforma está optimizada para el viajero hispanohablante, con análisis profundo de rutas Europa-Latinoamérica y Europa-Asia. Además del bot, ofrece blog en español y inglés, comparativas de aerolíneas y destinos, lead magnet PDF '50 hubs error-fare' y newsletter semanal opcional. Cobertura del catálogo: 424 aeropuertos, 10 aerolíneas con landing dedicada, integración con Travelpayouts (Skyscanner, Aviasales, Booking).",
  },
];

const FAQ_PRESS = [
  {
    q: "¿Qué es exactamente un error fare?",
    a: "Una tarifa publicada por una aerolínea con un descuento muy superior al normal por error de su sistema de pricing (típicamente -65 a -85%). Suelen durar de horas a días y la mayoría de aerolíneas los honran si pagas dentro de la ventana.",
  },
  {
    q: "¿Cómo se diferencia TripCazador de Skyscanner o Google Flights?",
    a: "Skyscanner y Google Flights son comparadores. Tú haces la búsqueda manualmente. TripCazador es un cazador automatizado: corre 24/7 sin que el usuario haga nada y notifica solo cuando hay anomalías de precio reales (no cualquier vuelo barato).",
  },
  {
    q: "¿Cuántos error fares se cazan al mes?",
    a: "Variable. Los meses fuertes (enero, febrero, octubre, noviembre) detectamos 8-15 anomalías significativas. Los meses tranquilos, 3-5. Solo se notifican las que pasan filtros de calidad (descuento >50%, ruta relevante, aerolínea conocida por honrar).",
  },
  {
    q: "¿Es gratuito?",
    a: "Sí. El bot Telegram, las alertas, el lead magnet y el blog son 100% gratis. Monetización vía afiliación a OTAs (Skyscanner/Aviasales/Booking) cuando el usuario reserva tras hacer click. Plan premium futuro con alertas hyper-personalizadas en consideración.",
  },
];

export default function PrensaPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "TripCazador",
      url: "https://tripcazador.com",
      logo: "https://tripcazador.com/android-chrome-512x512.png",
      sameAs: [
        "https://t.me/tripcazador_bot",
        "https://t.me/tripcazador",
      ],
      description:
        "Cazador automatizado de error fares y vuelos baratos desde Europa.",
      foundingDate: "2026-03",
      founders: [{ "@type": "Person", name: "Ernesto Talib" }],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_PRESS.map((f) => ({
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
        {
          "@type": "ListItem",
          position: 2,
          name: "Prensa",
          item: "https://tripcazador.com/prensa",
        },
      ],
    },
  ];

  return (
    <article className="max-w-3xl mx-auto space-y-10">
      <JsonLd data={jsonLd} />
      <header className="space-y-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Prensa</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Press kit & contacto para periodistas</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Material listo para artículos, posts y entrevistas. Si necesitas algo que no encuentras aquí, escríbenos directamente.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Datos rápidos</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-900/40 rounded-2xl p-5 border border-gray-800">
          {FACTS.map((f) => (
            <div key={f.label} className="space-y-0.5">
              <dt className="text-xs uppercase tracking-wider text-gray-500">{f.label}</dt>
              <dd className="text-gray-200 text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Copy aprobado para usar</h2>
        <p className="text-sm text-gray-400">
          Texto pre-aprobado en 3 longitudes. Puedes usarlo tal cual o adaptarlo manteniendo el sentido.
        </p>
        <div className="space-y-4">
          {COPY_VARIANTS.map((c) => (
            <div
              key={c.length}
              className="bg-gray-900/40 border border-gray-800 rounded-xl p-5"
            >
              <p className="text-xs uppercase tracking-wider text-amber-400 mb-2">{c.length}</p>
              <p className="text-gray-300 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Logo y assets</h2>
        {/* SSS350 — wired a /brand/ assets generados en SSS343 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <a
            href="/brand/tripcazador-logo.svg"
            download
            className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 text-center transition-colors"
          >
            <p className="text-amber-400 text-3xl mb-2">🎯</p>
            <p className="text-sm text-white font-semibold">Logo horizontal SVG</p>
            <p className="text-xs text-gray-500">Vectorial · transparente · 2000×500</p>
          </a>
          <a
            href="/brand/tripcazador-logo.png"
            download
            className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 text-center transition-colors"
          >
            <p className="text-amber-400 text-3xl mb-2">🖼️</p>
            <p className="text-sm text-white font-semibold">Logo horizontal PNG</p>
            <p className="text-xs text-gray-500">2000×500 · transparente</p>
          </a>
          <a
            href="/brand/tripcazador-logo-mark.svg"
            download
            className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 text-center transition-colors"
          >
            <p className="text-amber-400 text-3xl mb-2">⭐</p>
            <p className="text-sm text-white font-semibold">Símbolo SVG</p>
            <p className="text-xs text-gray-500">Cuadrado · 512×512</p>
          </a>
          <a
            href="/brand/tripcazador-logo-mark-1024.png"
            download
            className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 text-center transition-colors"
          >
            <p className="text-amber-400 text-3xl mb-2">📱</p>
            <p className="text-sm text-white font-semibold">Símbolo PNG 1024</p>
            <p className="text-xs text-gray-500">Para mobile / app stores</p>
          </a>
          <a
            href="/brand/tripcazador-color-palette.pdf"
            download
            className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 text-center transition-colors"
          >
            <p className="text-amber-400 text-3xl mb-2">🎨</p>
            <p className="text-sm text-white font-semibold">Paleta colores PDF</p>
            <p className="text-xs text-gray-500">12 colores + tipografía</p>
          </a>
          <a
            href="/og-default.png"
            download
            className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 text-center transition-colors"
          >
            <p className="text-amber-400 text-3xl mb-2">🌐</p>
            <p className="text-sm text-white font-semibold">OG image 1200×630</p>
            <p className="text-xs text-gray-500">Para artículos web</p>
          </a>
        </div>
        <p className="text-xs text-gray-500">
          Uso libre con crédito a "TripCazador" enlazando a https://tripcazador.com.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">FAQ para prensa</h2>
        <div className="space-y-4">
          {FAQ_PRESS.map((f, i) => (
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

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20 space-y-3">
        <h2 className="text-xl font-bold text-white">Contacto directo</h2>
        <p className="text-gray-300">
          Para entrevistas, datos custom, declaraciones o colaboraciones, escríbenos:
        </p>
        <ul className="space-y-1.5 text-sm">
          <li className="text-gray-300">
            <span className="text-gray-500 mr-2">Email:</span>
            <a href="mailto:contacto@tripcazador.com" className="text-amber-400 hover:text-amber-300">
              contacto@tripcazador.com
            </a>
          </li>
          <li className="text-gray-300">
            <span className="text-gray-500 mr-2">Telegram:</span>
            <a
              href="https://t.me/tripcazador_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300"
            >
              @tripcazador_bot
            </a>
          </li>
          <li className="text-gray-300">
            <span className="text-gray-500 mr-2">Tiempo de respuesta:</span>
            <span>{"<"} 24h en días laborables</span>
          </li>
        </ul>
      </section>

      <p className="text-xs text-gray-500 text-center pt-6 border-t border-gray-800">
        Gracias por escribir sobre nosotros. Avisa cuando publiques y haremos amplificación si encaja editorialmente.
      </p>
    </article>
  );
}
