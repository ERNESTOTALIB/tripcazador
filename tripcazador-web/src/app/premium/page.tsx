import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";
import { PremiumUpgradeButton } from "@/components/PremiumUpgradeButton";

export const metadata: Metadata = {
  title: "TripCazador Premium — Alertas instantáneas y filtros pro",
  description:
    "Por 2,99€/mes: alertas instantáneas de error fares, filtros pro, sin disclaimers. Cancela cuando quieras. 7 días gratis.",
  alternates: { canonical: "/premium" },
};

export const revalidate = 3600;

const FAQ = [
  {
    q: "¿Qué incluye Premium?",
    a: "Alertas instantáneas (push + email en menos de 60 segundos vs 24h en gratis), filtros pro por aerolínea/escalas/clase exacta, sin disclaimer 'precio aproximado', soporte prioritario, exportar deals a CSV y acceso API.",
  },
  {
    q: "¿Hay periodo de prueba?",
    a: "Sí, 7 días gratis. Si cancelas en ese plazo no se cobra nada. Si te quedas, son 2,99€/mes recurrentes — el precio de un café.",
  },
  {
    q: "¿Cómo cancelo?",
    a: "Un click desde tu perfil en /panel. Sin llamadas, sin formularios. Y mantienes Premium hasta el final del periodo ya pagado.",
  },
  {
    q: "¿Cuánto puedo ahorrar?",
    a: "Los suscriptores premium reciben error fares 24h antes que el resto. En un solo error fare ahorras 200-500€ — el premium se paga solo en el primer chollo que pilles.",
  },
  {
    q: "¿Hay descuento anual?",
    a: "Sí. 24,99€/año = 2 meses gratis (equivale a 2,08€/mes). Mismo flow desde la página de pago.",
  },
];

export default function PremiumPage() {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "TripCazador Premium",
    description: "Alertas instantáneas de error fares + filtros pro. 2,99€/mes con 7 días gratis.",
    brand: { "@type": "Brand", name: "TripCazador" },
    offers: {
      "@type": "Offer",
      price: "2.99",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: "https://tripcazador.com/premium",
    },
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="space-y-12">
      <JsonLd data={[productSchema, faqSchema]} />

      <SectionHero
        size="tall"
        badge="7 días gratis · cancela cuando quieras"
        title={
          <>
            TripCazador <em>Premium</em>
          </>
        }
        subtitle="Alertas instantáneas de error fares, filtros pro y sin disclaimers. Por 2,99€/mes."
      />

      {/* Hero feature comparison */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free tier */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
          <div className="text-sm text-gray-500 uppercase tracking-wider">Gratis</div>
          <div className="text-4xl font-bold text-white mt-2">0€<span className="text-lg text-gray-500">/mes</span></div>
          <ul className="mt-6 space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2"><span className="text-amber-400">✓</span> Catálogo público de chollos</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">✓</span> Búsqueda por origen + destino + fecha</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">✓</span> Newsletter semanal</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">✓</span> Canal Telegram</li>
            <li className="flex items-start gap-2 text-gray-500"><span>✗</span> Alertas con delay de 24h</li>
            <li className="flex items-start gap-2 text-gray-500"><span>✗</span> Filtros básicos</li>
          </ul>
        </div>

        {/* Premium tier */}
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-8 relative">
          <div className="absolute -top-3 right-6 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">RECOMENDADO</div>
          <div className="text-sm text-amber-400 uppercase tracking-wider font-semibold">Premium</div>
          <div className="text-4xl font-bold text-white mt-2">2,99€<span className="text-lg text-gray-400">/mes</span></div>
          <p className="text-xs text-gray-400 mt-1">o 24,99€/año (ahorra 2 meses)</p>
          <ul className="mt-6 space-y-3 text-sm text-white">
            <li className="flex items-start gap-2"><span className="text-amber-400">★</span><strong>Alertas instantáneas</strong> (&lt;60s vs 24h)</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">★</span><strong>Filtros pro</strong> aerolínea/clase/escalas</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">★</span>Sin disclaimer "precio aproximado"</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">★</span>Soporte prioritario</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">★</span>Exportar a CSV</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">★</span>API access para tu bot</li>
          </ul>
          <div className="mt-8">
            <PremiumUpgradeButton />
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">7 días gratis · Cancela en 1 clic</p>
        </div>
      </section>

      {/* Value prop */}
      <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">¿Por qué Premium se paga solo?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-amber-400 mb-2">Llegas el primero</h3>
            <p className="text-gray-300">
              Los error fares duran <strong>2-6 horas</strong>. Si te enteras 24h después,
              ya están corregidos. Premium notifica en &lt;60 segundos por push y email.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-amber-400 mb-2">Filtros precisos</h3>
            <p className="text-gray-300">
              Solo Business class · Solo Star Alliance · Solo directo · Salida martes-jueves.
              El motor caza lo que tú quieres, no spam.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-amber-400 mb-2">ROI de 1 chollo</h3>
            <p className="text-gray-300">
              Un solo error fare medio ahorra <strong>200-500€</strong>. Premium cuesta
              35,88€/año. Pillas un chollo y ya has rentabilizado 5+ años de premium.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {FAQ.map((f, i) => (
            <details key={i} className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-semibold text-white">{f.q}</span>
                <span className="text-amber-400 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
              </summary>
              <p className="text-sm text-gray-300 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
