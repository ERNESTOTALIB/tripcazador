import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Sparkles, Clock, Shield, Mail, Star } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { ConciergeForm } from "@/components/ConciergeForm";
import { CONCIERGE_TIER_IDS, CONCIERGE_TIERS } from "@/lib/concierge_tiers";

export const metadata: Metadata = {
  title: "Agencia online TripCazador — 4 niveles desde €9 hasta €99",
  description:
    "Agencia de viajes online personalizada en 4 niveles: Express (€9·24h), Standard (€19·48h), Premium (€49·72h) y Pro (€99·5d). Búsqueda manual, error fares, multi-ruta y soporte WhatsApp.",
  alternates: { canonical: "/concierge" },
};

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

// Matriz de features tier × feature — fuente única de verdad para la tabla.
// La columna `feature` es la fila; cada bool indica si el tier la incluye.
const FEATURE_MATRIX: Array<{
  feature: string;
  express: boolean | string;
  standard: boolean | string;
  premium: boolean | string;
  pro: boolean | string;
}> = [
  { feature: "Búsqueda 1 ruta cheapest", express: true, standard: true, premium: true, pro: true },
  { feature: "Nº opciones entregadas", express: "3", standard: "5", premium: "5+", pro: "10+" },
  { feature: "Error fares + codeshare arbitrage", express: false, standard: true, premium: true, pro: true },
  { feature: "Tips destino (zona, transporte)", express: false, standard: true, premium: true, pro: true },
  { feature: "Garantía €100+ ahorro", express: false, standard: true, premium: true, pro: true },
  { feature: "Hotel sugerido", express: false, standard: "Top 3", premium: "Reservable", pro: "Reservado" },
  { feature: "Multi-ruta (open-jaw, stopover)", express: false, standard: false, premium: true, pro: true },
  { feature: "Asesoría visados / seguros", express: false, standard: false, premium: true, pro: true },
  { feature: "Recomendación cabina business", express: false, standard: false, premium: true, pro: true },
  { feature: "Actividades / tours coordinados", express: false, standard: false, premium: false, pro: true },
  { feature: "Itinerario PDF día-a-día", express: false, standard: false, premium: false, pro: true },
  { feature: "Soporte WhatsApp post-entrega", express: false, standard: false, premium: false, pro: "7 días" },
  { feature: "Tiempo de entrega", express: "24h", standard: "48h", premium: "72h", pro: "5 días" },
];

export default function ConciergePage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Agencia Concierge", item: `${SITE}/concierge` },
    ],
  };

  // TravelAgency con OfferCatalog de los 4 tiers.
  const agency = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "TripCazador Concierge",
    url: `${SITE}/concierge`,
    description:
      "Agencia online personalizada en 4 niveles. Búsqueda humana de vuelos, hoteles, actividades y asesoría completa.",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Niveles de servicio Concierge",
      itemListElement: CONCIERGE_TIER_IDS.map((id, i) => {
        const t = CONCIERGE_TIERS[id];
        return {
          "@type": "Offer",
          position: i + 1,
          name: `${t.name} — ${t.tagline}`,
          price: String(t.amount_eur),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          description: t.bullets.join(". "),
        };
      }),
    },
    areaServed: { "@type": "Continent", name: "Europa" },
  };

  return (
    <div className="space-y-12">
      <JsonLd data={[breadcrumb, agency]} />

      {/* Hero */}
      <section className="text-center space-y-4 py-8">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          ✨ Agencia online personalizada
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
          Tu <em className="text-amber-400 not-italic">agencia de viajes</em> en 4 niveles, desde €9
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Cuéntanos tu viaje y elige cuánta ayuda quieres. Desde búsqueda básica
          en 24h hasta viaje completo turn-key con soporte WhatsApp 7 días.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 flex-wrap">
          <span className="flex items-center gap-2"><Clock size={14} className="text-amber-400" />24h-5d según tier</span>
          <span className="flex items-center gap-2"><Shield size={14} className="text-emerald-400" />Garantía €100+ ahorro (Standard+)</span>
          <span className="flex items-center gap-2"><Mail size={14} className="text-cyan-400" />Entrega por email + PDF</span>
        </div>
      </section>

      {/* TIERS overview cards */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-2">Elige tu nivel</h2>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Cada nivel suma sobre el anterior. Cambia entre tiers al final del formulario.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONCIERGE_TIER_IDS.map((id) => {
            const t = CONCIERGE_TIERS[id];
            return (
              <div
                key={id}
                className={`relative rounded-2xl border p-5 flex flex-col gap-3 ${
                  t.popular
                    ? "border-amber-400 bg-amber-500/5 shadow-[0_0_0_4px_rgba(251,191,36,0.10)]"
                    : "border-gray-800 bg-gray-900"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-5 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Más popular
                  </span>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    TripCazador
                  </div>
                  <div className="text-xl font-bold text-white">{t.name}</div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-amber-400">€{t.amount_eur}</span>
                  <span className="text-xs text-gray-500">/ pago único</span>
                </div>
                <div className="text-sm text-amber-300 font-semibold">{t.delivery_label}</div>
                <p className="text-xs text-gray-400 italic">{t.tagline}</p>
                <ul className="space-y-1.5 mt-1">
                  {t.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <Check size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparativa visual TripCazador vs OTAs */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Caso real Standard: Madrid → Tokio · 2 personas · 10 días
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 text-xs uppercase text-gray-500 tracking-wider">Plataforma</th>
                <th className="text-right py-3 text-xs uppercase text-gray-500 tracking-wider">Vuelo</th>
                <th className="text-right py-3 text-xs uppercase text-gray-500 tracking-wider">Hotel 4★</th>
                <th className="text-right py-3 text-xs uppercase text-gray-500 tracking-wider">Total</th>
                <th className="text-right py-3 text-xs uppercase text-gray-500 tracking-wider">vs TripCazador</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800">
                <td className="py-3 font-semibold">Skyscanner + Booking</td>
                <td className="text-right font-mono">€1.480</td>
                <td className="text-right font-mono">€880</td>
                <td className="text-right font-mono font-bold">€2.360</td>
                <td className="text-right text-red-400">+€312 caro</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3 font-semibold">Kayak + Hotels.com</td>
                <td className="text-right font-mono">€1.420</td>
                <td className="text-right font-mono">€820</td>
                <td className="text-right font-mono font-bold">€2.240</td>
                <td className="text-right text-red-400">+€192 caro</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3 font-semibold">Expedia paquete</td>
                <td className="text-right font-mono">€1.380</td>
                <td className="text-right font-mono">€790</td>
                <td className="text-right font-mono font-bold">€2.170</td>
                <td className="text-right text-red-400">+€122 caro</td>
              </tr>
              <tr className="bg-amber-500/5 border-l-4 border-amber-500">
                <td className="py-4 font-bold text-white pl-3">
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    TripCazador Standard
                  </span>
                </td>
                <td className="text-right font-mono text-emerald-400 font-bold">€1.245</td>
                <td className="text-right font-mono text-emerald-400 font-bold">€680</td>
                <td className="text-right font-mono font-bold text-emerald-400">€1.925 + €19</td>
                <td className="text-right text-emerald-400 font-bold">¡€216 ahorro neto!</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          * Datos reales medidos en abr-2026. Tu ahorro varía según destino, fecha y disponibilidad.
        </p>
      </section>

      {/* Feature matrix */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Comparativa completa de niveles
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 text-xs uppercase text-gray-500 tracking-wider">
                  Feature
                </th>
                {CONCIERGE_TIER_IDS.map((id) => {
                  const t = CONCIERGE_TIERS[id];
                  return (
                    <th
                      key={id}
                      className={`text-center py-3 text-xs uppercase tracking-wider ${
                        t.popular ? "text-amber-400" : "text-gray-500"
                      }`}
                    >
                      {t.name}
                      <div className="text-[10px] mt-0.5 normal-case">€{t.amount_eur}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2.5 text-gray-300">{row.feature}</td>
                  {(["express", "standard", "premium", "pro"] as const).map((tier) => {
                    const v = row[tier];
                    return (
                      <td
                        key={tier}
                        className={`text-center py-2.5 ${
                          tier === "standard" ? "bg-amber-500/5" : ""
                        }`}
                      >
                        {v === true ? (
                          <Check size={16} className="text-emerald-400 inline" />
                        ) : v === false ? (
                          <X size={14} className="text-gray-700 inline" />
                        ) : (
                          <span className="text-xs text-gray-200 font-semibold">{v}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cómo funciona */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-8">Cómo funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { n: 1, t: "Elige nivel + cuéntanos", d: "Selecciona tier (Express/Standard/Premium/Pro), origen, destino, fechas. Pagas seguro vía Stripe." },
            { n: 2, t: "Buscamos por ti", d: "Aplicamos error fares, codeshare arbitrage y deals secretos. Cuanto más alto el tier, más profundo buscamos." },
            { n: 3, t: "Recibes propuesta", d: "Te enviamos email con opciones, links directos y (Pro) PDF itinerario completo. Reservas tú o coordinamos." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-gray-900 border border-gray-800 p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/15 text-amber-400 font-bold inline-flex items-center justify-center text-xl mb-3">
                {s.n}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{s.t}</h3>
              <p className="text-sm text-gray-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Garantía */}
      <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-gray-950 p-6 sm:p-8 text-center">
        <Shield size={40} className="text-emerald-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-white mb-2">Garantía de ahorro (Standard+)</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          En tiers Standard, Premium y Pro: si las opciones que te enviamos no ahorran{" "}
          <strong className="text-emerald-400">al menos €100</strong> vs el comparador que tú elijas
          (Skyscanner, Kayak, Expedia), te devolvemos el fee sin preguntas. Riesgo cero para ti.
        </p>
      </section>

      {/* Form */}
      <section id="form" className="rounded-2xl border border-amber-500/30 bg-gray-900 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
          Empieza tu búsqueda
        </h2>
        <p className="text-center text-gray-400 mb-6 text-sm">
          Pago único. Recibes propuesta en el plazo del tier elegido.
        </p>
        <ConciergeForm />
      </section>

      {/* Pros vs cons */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-5">
          <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2"><Check size={18} />Ideal si</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>Fechas flexibles ±3 días</li>
            <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>Viaje internacional (más oportunidades de error fare)</li>
            <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>Presupuesto €500-3000 por persona</li>
            <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>No quieres pasar 5h comparando webs</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-red-950/15 border border-red-500/20 p-5">
          <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2"><X size={18} />NO es para ti si</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span>Vuelo intra-España o muy corto plazo (&lt;7 días)</li>
            <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span>Necesitas reservar en las próximas 24h (excepto Express)</li>
            <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span>Fechas 100% rígidas (sin flex)</li>
            <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span>Buscas paquete &quot;todo incluido resort&quot; tipo agencia tradicional</li>
          </ul>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center pt-4">
        <p className="text-gray-500 text-sm mb-2">¿Prefieres buscar tú mismo?</p>
        <Link href="/deals" className="text-amber-400 hover:underline font-semibold">Ver chollos automáticos gratis →</Link>
      </section>
    </div>
  );
}
