import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Colaboraciones y partnerships con TripCazador",
  description:
    "Oportunidades de colaboración con TripCazador: travel bloggers, agencias, OTAs, medios. Embed widgets, contenido sindicado, datos custom para periodismo.",
  alternates: { canonical: "/partners" },
  openGraph: {
    type: "website",
    title: "Partnerships con TripCazador",
    description: "Colabora con el cazador automatizado de error fares más grande de habla hispana.",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const TYPES = [
  {
    title: "Travel bloggers y creadores",
    icon: "✍️",
    desc: "Embed gratuito de nuestro widget de precios mensuales en vuestros artículos. Cita TripCazador como fuente y consigues tráfico cualificado a tu blog vía nuestros canales sociales.",
    cta: "Embed widget",
    ctaUrl: "/embed",
  },
  {
    title: "Periodistas y medios",
    icon: "📰",
    desc: "Datos custom sobre tarifas, error fares, tendencias del sector. Nuestro motor genera 80,000+ búsquedas/año. Para reportajes, columnas, podcasts. Sin coste para coverage editorial.",
    cta: "Press kit + contacto",
    ctaUrl: "/prensa",
  },
  {
    title: "Agencias de viaje",
    icon: "🏢",
    desc: "Datos B2B de precios mensuales por ruta para integrar en sistemas de gestión. API de tarifas + alertas. Pricing custom según volumen.",
    cta: "Contacto comercial",
    ctaUrl: "mailto:contacto@tripcazador.com",
  },
  {
    title: "OTAs y plataformas",
    icon: "🔗",
    desc: "Programas de afiliación bidireccional. Si tu OTA tiene tarifas competitivas, podemos enviarte tráfico cualificado de cazadores activos. Comisión negociable.",
    cta: "Hablamos",
    ctaUrl: "mailto:contacto@tripcazador.com",
  },
  {
    title: "Aerolíneas",
    icon: "✈️",
    desc: "Si quieres entender por qué tus precios atraen o no a cazadores experimentados, ofrecemos consultoría: análisis de pricing engine + recomendaciones de fare class para reducir error fares.",
    cta: "Análisis personalizado",
    ctaUrl: "mailto:contacto@tripcazador.com",
  },
  {
    title: "Influencers redes",
    icon: "📱",
    desc: "Programa de afiliación para influencers travel: 30% revenue share durante 12 meses sobre cualquier venta de paquetes premium future + acceso prioritario a error fares pre-publicación.",
    cta: "Únete",
    ctaUrl: "mailto:contacto@tripcazador.com",
  },
];

const FAQ_PARTNERS = [
  {
    q: "¿Cómo se mide el ROI de la colaboración?",
    a: "Para bloggers/medios: tracking UTM por backlink + reporte mensual de clicks. Para agencias/OTAs: API con métricas de uso + reportes trimestrales.",
  },
  {
    q: "¿Hay coste de la colaboración?",
    a: "Embed widgets, press kit, datos para artículos editoriales: gratis. API B2B, consultoría aerolíneas, white-label: precios según volumen.",
  },
  {
    q: "¿Qué exclusividad ofrecéis?",
    a: "Para partners estratégicos (medios top + agencias grandes), ofrecemos: acceso pre-público a error fares (24h antes), datos no publicados, branding co-marketing.",
  },
  {
    q: "¿Tiempo de respuesta a propuestas?",
    a: "Email a contacto@tripcazador.com: respuesta en 24-48h laborables. Propuestas formales requieren 5-7 días para evaluación.",
  },
];

export default function PartnersPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "TripCazador",
      url: "https://tripcazador.com",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "Partnerships",
          email: "contacto@tripcazador.com",
          availableLanguage: ["Spanish", "English"],
        },
        {
          "@type": "ContactPoint",
          contactType: "Press",
          email: "contacto@tripcazador.com",
          availableLanguage: ["Spanish"],
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_PARTNERS.map((f) => ({
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
        { "@type": "ListItem", position: 2, name: "Partners", item: "https://tripcazador.com/partners" },
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
          <span className="text-white">Partners</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Colaboraciones y partnerships</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Si trabajas en travel, journalism, OTAs o creator economy, hay maneras de colaborar con nosotros. Embed widgets, datos custom, programas de afiliación.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Tipos de colaboración</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TYPES.map((t) => (
            <li key={t.title} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{t.icon}</span>
                <h3 className="text-lg font-bold text-white">{t.title}</h3>
              </div>
              <p className="text-sm text-gray-400">{t.desc}</p>
              <a
                href={t.ctaUrl}
                className="text-amber-400 hover:text-amber-300 text-sm font-semibold"
              >
                {t.cta} →
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQ_PARTNERS.map((f, i) => (
            <details key={i} className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 group">
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
        <ul className="space-y-1.5 text-sm">
          <li className="text-gray-300">
            <span className="text-gray-500 mr-2">Partnerships:</span>
            <a href="mailto:contacto@tripcazador.com" className="text-amber-400 hover:text-amber-300">
              contacto@tripcazador.com
            </a>
          </li>
          <li className="text-gray-300">
            <span className="text-gray-500 mr-2">Prensa:</span>
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
        </ul>
      </section>
    </div>
  );
}
