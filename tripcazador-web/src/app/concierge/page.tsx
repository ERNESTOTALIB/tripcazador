import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Sparkles, Clock, Shield, Mail } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { ConciergeForm } from "@/components/ConciergeForm";

export const metadata: Metadata = {
  title: "Concierge €19 — Te encontramos vuelo + hotel y ahorras 100-300€",
  description:
    "Envíanos tus fechas y presupuesto. En 24-48h te enviamos 3 opciones reales de vuelo + hotel ahorrando 100-300€ vs Skyscanner/Kayak. Garantía: si no ahorras al menos €100, te devolvemos el fee.",
  alternates: { canonical: "/concierge" },
};

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export default function ConciergePage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Concierge", item: `${SITE}/concierge` },
    ],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Búsqueda personalizada de vuelo + hotel",
    provider: { "@type": "Organization", name: "TripCazador" },
    description: "Servicio concierge: te buscamos 3 opciones de vuelo+hotel para tus fechas. Pagas €19, ahorras €100-300 vs Skyscanner.",
    offers: {
      "@type": "Offer",
      price: "19",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
    areaServed: { "@type": "Continent", name: "Europa" },
  };

  return (
    <div className="space-y-12">
      <JsonLd data={[breadcrumb, service]} />

      {/* Hero */}
      <section className="text-center space-y-4 py-8">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          ✨ Nuevo servicio premium
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
          Te encontramos <em className="text-amber-400 not-italic">vuelo + hotel</em> que te ahorra 100-300€
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Envíanos tus fechas y presupuesto. En 24-48 horas recibes <strong className="text-white">3 opciones reales</strong> que ahorran más que cualquier comparador. Por solo <strong className="text-amber-400">€19</strong>.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 flex-wrap">
          <span className="flex items-center gap-2"><Clock size={14} className="text-amber-400" />24-48h respuesta</span>
          <span className="flex items-center gap-2"><Shield size={14} className="text-emerald-400" />Garantía €100+ ahorro o devolución</span>
          <span className="flex items-center gap-2"><Mail size={14} className="text-cyan-400" />Recibes 3 opciones por email</span>
        </div>
      </section>

      {/* Comparativa visual */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Caso real: Madrid → Tokio · 2 personas · 10 días
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
                    TripCazador Concierge
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

      {/* Cómo funciona */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-8">Cómo funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { n: 1, t: "Cuéntanos tu viaje", d: "Origen, destino, fechas flexibles ±3 días, presupuesto y preferencias hotel. Pagas €19." },
            { n: 2, t: "Buscamos por ti", d: "En 24-48h aplicamos error fares, codeshare arbitrage y secret deals. Te enviamos 3 opciones por email." },
            { n: 3, t: "Reservas tú", d: "Eliges la que más te guste. Reservas directo en la web del proveedor. El ahorro va a tu bolsillo." },
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
        <h2 className="text-2xl font-bold text-white mb-2">Garantía de ahorro</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Si las 3 opciones que te enviamos no ahorran <strong className="text-emerald-400">al menos €100</strong> vs el comparador que tú elijas (Skyscanner, Kayak, Expedia), te devolvemos los €19 sin preguntas. Riesgo cero para ti.
        </p>
      </section>

      {/* Form */}
      <section className="rounded-2xl border border-amber-500/30 bg-gray-900 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
          Empieza tu búsqueda · €19
        </h2>
        <p className="text-center text-gray-400 mb-6 text-sm">
          Pago único. Recibes 3 opciones en 24-48h por email.
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
            <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span>Necesitas reservar en las próximas 24h</li>
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
