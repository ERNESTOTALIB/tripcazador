/**
 * /partners/agencia — SSS375 (21 may 2026)
 *
 * Landing público del programa B2B "TripCazador Partners" para agencias
 * de viajes, blogs de nicho, creadores y comparadores. Revshare 15-25%.
 *
 * Audience: dueño de agencia de viajes, blogger Travel, creator IG/TikTok
 *   con audiencia ES/LATAM. Comparadores tipo Jetcost, Kiwi.
 *
 * CTA: form aplicación → /api/agency-partner/apply.
 */

import type { Metadata } from "next";
import { PartnerApplyForm } from "@/components/PartnerApplyForm";

export const metadata: Metadata = {
  title: "Partners — Programa de afiliados para agencias y creadores | TripCazador",
  description:
    "Revende TripCazador Premium (€9.99/mes) y Concierge a tu audiencia. Comisión 15-25% recurring + one-shot. Aplicación abierta.",
  alternates: { canonical: "https://tripcazador.com/partners/agencia" },
  openGraph: {
    title: "TripCazador Partners — Revshare 15-25%",
    description: "Agencias, bloggers, creators: gana revshare revendiendo Premium + Concierge.",
    url: "https://tripcazador.com/partners/agencia",
  },
};

export default function AgencyPartnerPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wide">
          Partners B2B
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-white">
          Convierte tu audiencia en ingresos pasivos
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          Si gestionas una agencia, un blog de viajes o tienes audiencia en redes,
          gana <strong className="text-amber-300">hasta 25% de comisión</strong> revendiendo
          TripCazador Premium y Concierge.
        </p>
      </div>

      <section className="grid md:grid-cols-2 gap-4 mb-10">
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5">
          <h2 className="text-xl font-bold text-white mb-3">💰 Estructura comisiones</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <strong className="text-amber-300">20% recurring</strong> sobre Premium mensual
              (€9.99) — €2/mes por suscriptor activo
            </li>
            <li>
              <strong className="text-amber-300">25% one-off</strong> sobre Premium anual
              (€99) — €24.75 por venta
            </li>
            <li>
              <strong className="text-amber-300">15% one-off</strong> sobre Concierge (€19/49/99)
            </li>
            <li>
              <strong className="text-amber-300">20% one-off</strong> sobre Premium gift (€9.99)
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Cookie de atribución 30 días. Payouts mensuales SEPA/Wise. Mínimo €25 por payout.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5">
          <h2 className="text-xl font-bold text-white mb-3">🎯 ¿Para quién?</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✈️ Agencias de viajes con clientela recurrente</li>
            <li>📝 Bloggers Travel con tráfico SEO orgánico ES/LATAM</li>
            <li>📱 Creators IG/TikTok/YouTube con &gt; 5k seguidores</li>
            <li>🔗 Comparadores y portales travel</li>
            <li>💼 Consultores corporate travel</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Revisamos aplicaciones manualmente — calidad &gt; cantidad.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-700 bg-gradient-to-br from-purple-500/10 to-amber-500/10 p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-3">📊 Ejemplo facturación</h2>
        <p className="text-gray-300 mb-4">
          Una agencia con 100 clientes/mes convierte ~3% a Premium anual:
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-black/40 p-4">
            <p className="text-3xl font-bold text-amber-300">3</p>
            <p className="text-xs text-gray-400 mt-1">conversiones/mes</p>
          </div>
          <div className="rounded-xl bg-black/40 p-4">
            <p className="text-3xl font-bold text-amber-300">€74</p>
            <p className="text-xs text-gray-400 mt-1">comisión/mes</p>
          </div>
          <div className="rounded-xl bg-black/40 p-4">
            <p className="text-3xl font-bold text-amber-300">€890</p>
            <p className="text-xs text-gray-400 mt-1">año 1 estimado</p>
          </div>
        </div>
      </section>

      <section id="apply" className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Aplicar al programa</h2>
        <p className="text-gray-300 mb-5">
          Revisamos todas las aplicaciones en 24-48h. Si encajas, recibirás tu
          dashboard partner + ref_code + materiales (banners, copy).
        </p>
        <PartnerApplyForm />
      </section>

      <p className="mt-10 text-xs text-gray-500 text-center">
        ¿Dudas? Escribe a{" "}
        <a href="mailto:partners@tripcazador.com" className="text-amber-400 hover:underline">
          partners@tripcazador.com
        </a>
      </p>
    </main>
  );
}
