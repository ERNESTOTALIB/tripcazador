/**
 * /concierge/[tier] — SSS285 (17 may 2026)
 *
 * Landing dedicada para cada tier Concierge (express/standard/premium/pro).
 * Mejora SEO long-tail + conversion por tier-specific copy.
 *
 * generateStaticParams genera las 4 páginas en build.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONCIERGE_TIERS, isValidTier, CONCIERGE_TIER_IDS } from "@/lib/concierge_tiers";
import { ConciergeForm } from "@/components/ConciergeForm";
import { JsonLd } from "@/components/JsonLd";

const SITE = "https://tripcazador.com";

interface TierContent {
  hero: string;
  whoFor: string[];
  whoNotFor: string[];
  process: Array<{ step: number; title: string; description: string }>;
  guarantee: string;
  faq: Array<{ q: string; a: string }>;
}

const TIER_CONTENT: Record<string, TierContent> = {
  express: {
    hero: "Búsqueda rápida de la mejor opción para 1 ruta en 24 horas. Sin tips ni hotel — solo los 3 vuelos más baratos con links directos.",
    whoFor: [
      "Tienes claro el destino + las fechas",
      "Solo necesitas confirmar el precio mínimo real",
      "Prefieres reservar tú directamente con la aerolínea",
    ],
    whoNotFor: [
      "Necesitas asesoría completa (mejor Standard €19)",
      "Buscas multi-ruta o open-jaw (mejor Premium €49)",
      "Quieres hotel + actividades incluidas (mejor Pro €99)",
    ],
    process: [
      { step: 1, title: "Pago seguro €9", description: "Stripe Checkout, completas en 30 segundos" },
      { step: 2, title: "Nos envías tu ruta", description: "Origen, destino, fechas, número de viajeros" },
      { step: 3, title: "Recibes email en 24h", description: "3 opciones más baratas con comparativa vs Skyscanner/Kayak" },
      { step: 4, title: "Reservas tú directo", description: "Links directos a la aerolínea — sin intermediarios" },
    ],
    guarantee: "Si no encontramos ningún vuelo más barato que el mejor precio de Skyscanner/Kayak en el momento, reembolsamos los €9 íntegros. Garantía express, sin preguntas.",
    faq: [
      { q: "¿Cuándo recibiré los resultados?", a: "Entre 6 y 24h desde el pago. Recibirás un email automático cuando el cazador termine la búsqueda manual." },
      { q: "¿Puedo cambiar la ruta tras pagar?", a: "Sí, dentro de las primeras 2 horas escribe a contacto@tripcazador.com con tu Stripe order ID y modificamos sin coste." },
      { q: "¿Qué incluye Express que no incluye una búsqueda gratis en /deals?", a: "Búsqueda manual experta vs nuestro motor automático. Cazadores con experiencia detectan codeshares, fechas valle y rutas alternativas que el algoritmo se pierde." },
    ],
  },
  standard: {
    hero: "El plan sweet-spot: 5 opciones rankeadas + hotel sugerido + tips destino en 48h. Garantía €100+ ahorro o reembolso completo.",
    whoFor: [
      "Vas a viajar de verdad — no solo curioseas precios",
      "Valoras tiempo > €19 (sweet-spot precio/calidad)",
      "Quieres consejo sobre zona, transporte, packing del destino",
    ],
    whoNotFor: [
      "Solo necesitas un dato rápido (mejor Express €9)",
      "Multi-país / multi-ruta (mejor Premium €49)",
      "Itinerario día-a-día PDF (mejor Pro €99)",
    ],
    process: [
      { step: 1, title: "Pago seguro €19", description: "Stripe Checkout — único cargo, sin suscripción" },
      { step: 2, title: "Formulario de viaje", description: "Origen, destino, fechas, presupuesto, viajeros, hotel star preference" },
      { step: 3, title: "Cazador trabaja 48h", description: "Búsqueda manual error fares + codeshare arbitrage + hotel Booking" },
      { step: 4, title: "Email con plan completo", description: "5 opciones vuelo + 3 hoteles + tips zona/transporte/packing" },
    ],
    guarantee: "Si nuestro plan no te ahorra al menos €100 sobre el booking que harías por tu cuenta (con captura de tu búsqueda como prueba), te devolvemos los €19 sin preguntas. Garantía Standard.",
    faq: [
      { q: "¿Qué pasa si encuentro mejor precio por mi cuenta?", a: "Si tu captura demuestra que ofreciste menos de €100 de ahorro vs nuestro plan, te devolvemos el pago." },
      { q: "¿Funciona para vuelos internacionales largos?", a: "Sí, Standard funciona para cualquier ruta. Pero para destinos exóticos / multi-país nuestro Premium €49 es más adecuado." },
      { q: "¿Reservas vosotros el hotel?", a: "En Standard te sugerimos 3 opciones rankeadas — tú reservas con tu cuenta Booking. En Premium (€49) ya viene reservable con mejor precio verificado." },
    ],
  },
  premium: {
    hero: "Asesoría humana + multi-ruta (open-jaw, stopover, multi-ciudad). Hotel reservable con mejor precio verificado. Visados + seguros + tarjetas crédito. 72h.",
    whoFor: [
      "Viaje complejo: vuelos largos + stopover + multi-ciudad",
      "Necesitas asesoría visados + seguros + tarjetas crédito",
      "Vuelo business class — quieres saber si vale la pena upgrade",
    ],
    whoNotFor: [
      "Escapada europea fin de semana simple (mejor Standard €19)",
      "Viaje turn-key con actividades coordinadas (mejor Pro €99)",
    ],
    process: [
      { step: 1, title: "Pago seguro €49", description: "Stripe Checkout — único cargo" },
      { step: 2, title: "Llamada / chat consultivo", description: "Si quieres, agendamos 15 min Zoom/WhatsApp para entender el viaje" },
      { step: 3, title: "Cazador trabaja 72h", description: "Multi-ruta optimization + hotel + visados + seguros + tarjetas crédito" },
      { step: 4, title: "Plan PDF + email", description: "Resumen completo con todos los enlaces, costos, alternativas y deadlines" },
    ],
    guarantee: "Si tras revisar el plan no estás satisfecho, te devolvemos €49 menos los gastos reales de búsqueda (Aviasales API, hotel checks). Típicamente €30-40 reembolsados.",
    faq: [
      { q: "¿Qué quiere decir multi-ruta?", a: "Ej: Madrid → Tokio → Sídney → Madrid (round-the-world). O Madrid → Bangkok 10 días → Bali 7 días → Madrid (open-jaw stopover). Premium optimiza estas combinaciones." },
      { q: "¿Cubrís visados?", a: "Te decimos qué visados necesitas, dónde tramitarlos, coste y plazo. La tramitación es tu responsabilidad (no podemos hacerla por ti)." },
      { q: "¿Asesoría tarjetas crédito?", a: "Comparamos qué tarjetas son útiles para tu viaje específico (no cambio comisión, seguro viaje, sala VIP). Sin sesgo comercial — recomendamos lo mejor." },
    ],
  },
  pro: {
    hero: "Viaje completo turn-key: vuelos + hoteles + actividades coordinados. Itinerario día-a-día PDF + soporte WhatsApp 7 días. Para quien valora tiempo > €99.",
    whoFor: [
      "Viaje importante (luna de miel, aniversario, vacaciones familiares grandes)",
      "Valoras delegar TODO + tener soporte 24/7 durante el viaje",
      "Presupuesto >€2000/persona (Pro tiene sentido para viajes con stake alto)",
    ],
    whoNotFor: [
      "Escapadas de fin de semana — overkill",
      "Viajeros que disfrutan planificar (no es para todos)",
    ],
    process: [
      { step: 1, title: "Pago seguro €99", description: "Stripe Checkout — único cargo, soporte 7d incluido" },
      { step: 2, title: "Onboarding 30 min", description: "Zoom call para entender intereses, ritmo, restricciones, presupuesto" },
      { step: 3, title: "Cazador trabaja 5 días", description: "Vuelos + hoteles + actividades + transporte interno + reservas restaurantes top" },
      { step: 4, title: "PDF itinerario + soporte WhatsApp", description: "Día-a-día detallado + soporte WhatsApp durante todo el viaje (cambios, emergencias, recomendaciones)" },
    ],
    guarantee: "Si no estás 100% satisfecho con el itinerario inicial, lo replanteamos sin coste extra (1 round de revisión incluido). Si tras la 2ª revisión sigues no satisfecho, reembolso parcial €70.",
    faq: [
      { q: "¿Reservas vosotros TODO?", a: "Vuelos sí (con tu autorización), hoteles sí, actividades top sí. Restaurantes te enviamos enlaces con horarios sugeridos para reservar tú (control del calendario)." },
      { q: "¿Y si durante el viaje hay problemas?", a: "Soporte WhatsApp durante 7 días contigo. Cancelación vuelo / huelga / pérdida vuelo / problema hotel — gestionamos contigo en vivo." },
      { q: "¿Cuántos viajes podéis llevar a la vez?", a: "Limitamos a 5 clientes Pro activos simultáneos para garantizar atención. Si está saturado, te avisamos antes del pago." },
    ],
  },
};

export function generateStaticParams() {
  return CONCIERGE_TIER_IDS.map((tier) => ({ tier }));
}

export async function generateMetadata({
  params,
}: {
  params: { tier: string };
}): Promise<Metadata> {
  if (!isValidTier(params.tier)) return { title: "Tier no encontrado | TripCazador" };
  const t = CONCIERGE_TIERS[params.tier];
  const title = `Concierge ${t.name} €${t.amount_eur} — ${t.delivery_label} | TripCazador`;
  const description = TIER_CONTENT[params.tier].hero.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/concierge/${params.tier}` },
    openGraph: {
      title: `🧳 Concierge ${t.name} — €${t.amount_eur}`,
      description,
      url: `${SITE}/concierge/${params.tier}`,
      siteName: "TripCazador",
      type: "website",
      locale: "es_ES",
    },
  };
}

export const revalidate = 3600;

export default function TierLandingPage({
  params,
}: {
  params: { tier: string };
}) {
  if (!isValidTier(params.tier)) return notFound();
  const t = CONCIERGE_TIERS[params.tier];
  const c = TIER_CONTENT[params.tier];

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Concierge", item: `${SITE}/concierge` },
      { "@type": "ListItem", position: 3, name: t.name, item: `${SITE}/concierge/${params.tier}` },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `TripCazador Concierge ${t.name}`,
    description: c.hero,
    provider: { "@type": "Organization", name: "TripCazador" },
    offers: {
      "@type": "Offer",
      price: t.amount_eur,
      priceCurrency: "EUR",
      url: `${SITE}/concierge/${params.tier}`,
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={breadcrumb} />
      <JsonLd data={productJsonLd} />
      <JsonLd data={faqJsonLd} />

      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span>/</span>
          <Link href="/concierge" className="hover:text-white">Concierge</Link>
          <span>/</span>
          <span className="text-white">{t.name}</span>
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-5xl">🧳</div>
          <div>
            <h1 className="text-4xl font-bold text-white">Concierge {t.name}</h1>
            <div className="text-amber-400 mt-1">
              €{t.amount_eur} · {t.delivery_label}
              {t.popular && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 rounded-full">
                  Más popular
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-gray-300 max-w-2xl text-lg">{c.hero}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-bold text-emerald-400">✓ Es perfecto para ti si</h2>
          <ul className="space-y-2">
            {c.whoFor.map((item, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-bold text-rose-400">✗ NO es para ti si</h2>
          <ul className="space-y-2">
            {c.whoNotFor.map((item, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-rose-400 flex-shrink-0">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Cómo funciona</h2>
        <div className="space-y-4">
          {c.process.map((p) => (
            <div key={p.step} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center">
                {p.step}
              </div>
              <div>
                <h3 className="font-bold text-white">{p.title}</h3>
                <p className="text-sm text-gray-300 mt-1">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-amber-400 mb-2">🛡 Garantía {t.name}</h2>
        <p className="text-gray-300">{c.guarantee}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Pedir Concierge {t.name}</h2>
        <ConciergeForm initialTier={t.id} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {c.faq.map((f) => (
            <details
              key={f.q}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
            >
              <summary className="font-semibold text-white cursor-pointer">
                {f.q}
              </summary>
              <p className="mt-3 text-gray-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="text-center pt-6 border-t border-gray-800">
        <Link
          href="/concierge"
          className="text-amber-400 hover:text-amber-300 underline"
        >
          ← Comparar todos los tiers Concierge
        </Link>
      </section>
    </div>
  );
}
