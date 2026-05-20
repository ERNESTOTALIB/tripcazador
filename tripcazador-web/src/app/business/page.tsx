/**
 * /business — SSS364 (21 may 2026)
 *
 * TripCazador for Business — landing para captar corporates que pagan
 * suscripción para que sus empleados reciban alertas de viajes corporativos.
 * Target: HR / Travel managers / EAs.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { faqPageSchema, breadcrumbSchema } from "@/lib/schema_helpers";

export const metadata: Metadata = {
  title: "TripCazador for Business · ahorra hasta 40% en viajes corporativos",
  description:
    "Solución B2B para empresas que viajan: alertas de Business class a precio Economy, gestión centralizada de bookings, ahorro medio 30-40% vs. agencias tradicionales. Desde €99/mes.",
  alternates: { canonical: "/business" },
  openGraph: {
    title: "TripCazador for Business",
    description:
      "Ahorra 30-40% en viajes corporativos con alertas de error fares + business class barata.",
    type: "article",
  },
};

const BENEFITS = [
  {
    icon: "💼",
    title: "Business class a precio Economy",
    description:
      "Cazamos error fares y rebajas anómalas en Business + First. Tu equipo viaja cómodo sin que el CFO se entere.",
  },
  {
    icon: "📊",
    title: "Dashboard centralizado",
    description:
      "Todos los empleados en un panel. Aprobación por viaje, presupuestos por departamento, reporting mensual.",
  },
  {
    icon: "🎯",
    title: "Política de viajes integrada",
    description:
      "Define límites (precio max, clase, antelación) y solo se notifican deals que cumplen.",
  },
  {
    icon: "🛡️",
    title: "Compliance + facturación",
    description:
      "Factura única mensual con IVA. Cumplimiento RGPD. Exportación a SAP/Holded/Sage.",
  },
  {
    icon: "🚀",
    title: "ROI inmediato",
    description:
      "Empresa media ahorra 30-40% vs. agencia tradicional. Plan se paga solo con 1 vuelo intercontinental.",
  },
  {
    icon: "📞",
    title: "Account manager dedicado",
    description:
      "Persona de contacto que conoce tu cuenta. SLA respuesta 4h laborables. Sin call centers.",
  },
];

const PLANS = [
  {
    name: "Startup",
    price: "99€",
    period: "/mes",
    employees: "Hasta 10 empleados",
    features: [
      "Alertas Premium ilimitadas",
      "Dashboard equipo",
      "Booking via portal con tarjeta empresa",
      "Factura única mensual",
      "Soporte email",
    ],
    cta: "Probar 14 días gratis",
  },
  {
    name: "Growth",
    price: "299€",
    period: "/mes",
    employees: "Hasta 50 empleados",
    features: [
      "Todo lo de Startup",
      "Política de viajes custom",
      "Presupuestos por departamento",
      "Reporting mensual + Excel export",
      "Account manager",
      "Onboarding personalizado",
    ],
    cta: "Reservar demo",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    employees: "+50 empleados o multi-país",
    features: [
      "Todo lo de Growth",
      "SAML SSO + Active Directory",
      "Integración SAP Concur / Holded",
      "SLA 99.9% + uptime credits",
      "Account manager + Slack channel",
      "Auditoría compliance trimestral",
    ],
    cta: "Hablar con ventas",
  },
];

const FAQ = [
  {
    q: "¿En qué se diferencia de una agencia de viajes tradicional?",
    a: "Las agencias cobran comisión sobre el ticket emitido — su incentivo es venderte caro. Nosotros cobramos suscripción fija, así nuestro incentivo es encontrarte los precios más bajos. Además, automatizamos el monitoring 24/7 (vs. agencia que solo busca cuando le preguntas).",
  },
  {
    q: "¿Mis empleados pueden seguir reservando por su cuenta?",
    a: "Sí. TripCazador Business es complementario — les damos alertas + portal opcional. Si prefieren reservar via Skyscanner/Booking directo, sin problema. Sólo perderás la centralización de facturación.",
  },
  {
    q: "¿Cómo gestionamos la facturación corporativa?",
    a: "Te emitimos UNA factura mensual con IVA por la suscripción. Los billetes los compran tus empleados con tarjeta empresa (vía portal o externamente). Si prefieres que TripCazador emita los billetes, plan Enterprise lo permite con kickback al CFO.",
  },
  {
    q: "¿Cumplís con la normativa de viajes corporativos española?",
    a: "Sí. Facturación con CIF empresa, IVA 21%, archivo digital legal (5 años). Para sectores regulados (defensa, salud) tenemos addendum compliance.",
  },
  {
    q: "¿Cuánto se tarda en empezar?",
    a: "Plan Startup: 24h (auto-onboarding). Plan Growth: 1 semana (incluye custom policy + training). Enterprise: 2-4 semanas (depende integraciones).",
  },
  {
    q: "¿Qué pasa si no encontráis chollos para una ruta específica?",
    a: "Si en 6 meses no recibes deals utiles para tu ruta principal, te devolvemos el dinero del último trimestre. Garantía escrita en contrato.",
  },
];

export default function BusinessPage() {
  const faqLd = faqPageSchema(FAQ);
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Business", url: "/business" },
  ]);
  return (
    <div className="space-y-12">
      <JsonLd data={[faqLd, breadcrumbLd]} />

      <header className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
          For Business
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Ahorra hasta 40% en viajes corporativos
        </h1>
        <p className="text-lg text-gray-300">
          Solución B2B para empresas que viajan: Business class a precio Economy,
          error fares verificados, dashboard centralizado, facturación única.
        </p>
      </header>

      {/* Benefits */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Por qué empresas eligen TripCazador
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
            >
              <div className="text-3xl mb-2">{b.icon}</div>
              <h3 className="text-white font-bold text-sm">{b.title}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Planes Business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-cyan-500/40 bg-cyan-500/5"
                  : "border-gray-800 bg-gray-900"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-cyan-500 text-black text-xs font-bold uppercase">
                  Más popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{plan.employees}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-cyan-300">{plan.price}</span>
                <span className="text-xs text-gray-500">{plan.period}</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-cyan-400 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:partners@tripcazador.com?subject=${encodeURIComponent(`Business plan ${plan.name}`)}`}
                className={`mt-5 block text-center px-4 py-2.5 rounded-lg font-semibold text-sm ${
                  plan.highlighted
                    ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
                }`}
              >
                {plan.cta} →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ROI calculator */}
      <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
        <h2 className="text-xl font-bold text-white mb-2">📊 Cálculo de ROI</h2>
        <p className="text-sm text-gray-300 mb-4">
          Ejemplo: empresa de 15 empleados con 3 viajes intercontinentales/mes.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-gray-900">
            <div className="text-2xl font-bold text-cyan-300">€2.400</div>
            <div className="text-xs text-gray-400">Precio agencia/vuelo BCN-JFK Business</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900">
            <div className="text-2xl font-bold text-cyan-300">€1.450</div>
            <div className="text-xs text-gray-400">Precio TripCazador con error fare</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900">
            <div className="text-2xl font-bold text-emerald-300">€950</div>
            <div className="text-xs text-gray-400">Ahorro por vuelo (40%)</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900">
            <div className="text-2xl font-bold text-emerald-300">€2.850/mes</div>
            <div className="text-xs text-gray-400">Ahorro mensual estimado</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          ROI: el plan Growth (€299/mo) se paga solo con 1 viaje al mes. 9.5× ROI mensual.
        </p>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">FAQ para empresas</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white text-sm">
                {f.q}
              </summary>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">¿Empezamos?</h2>
        <p className="text-sm text-gray-300 mb-4">
          Demo 30 min, sin compromiso. Te mostramos chollos reales de tus rutas
          principales y calculamos el ahorro proyectado para tu empresa.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:partners@tripcazador.com?subject=Demo%20Business%20%E2%80%94%20TripCazador"
            className="inline-block px-5 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm"
          >
            📅 Reservar demo gratis
          </a>
          <Link
            href="/sponsor"
            className="inline-block px-5 py-3 rounded-lg border border-gray-700 hover:border-cyan-500/40 text-white font-semibold text-sm"
          >
            Otras opciones B2B
          </Link>
        </div>
      </section>
    </div>
  );
}
