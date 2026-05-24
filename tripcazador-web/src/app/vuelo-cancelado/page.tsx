/**
 * /vuelo-cancelado — SSS460 (23 may 2026)
 *
 * Guía completa EU 261/2004 — compensación por vuelo cancelado o
 * gran retraso. HowTo + FAQPage JSON-LD para SERP rich snippets.
 *
 * SEO: "compensacion vuelo cancelado", "EU 261 reclamacion",
 * "aerolinea cancela vuelo derechos", "ryanair vuelo cancelado
 * reclamacion".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Vuelo cancelado: tus derechos según EU 261/2004 (2026)",
  description:
    "Cancelación, retraso >3h o overbooking: cuándo te corresponden €250/€400/€600 + asistencia obligatoria. Plazos para reclamar y AESA.",
  alternates: { canonical: `${SITE_URL}/vuelo-cancelado` },
  openGraph: {
    title: "Vuelo cancelado: guía EU 261/2004",
    description: "Compensación €250-600 + asistencia obligatoria.",
    url: `${SITE_URL}/vuelo-cancelado`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const COMPENSATION_TIERS = [
  {
    distance: "Vuelos cortos (<1.500 km)",
    examples: "Madrid-Barcelona, Madrid-París, Madrid-Lisboa",
    amount: "€250",
  },
  {
    distance: "Vuelos medios (1.500-3.500 km)",
    examples: "Madrid-Londres, Madrid-Moscú, Madrid-Estambul",
    amount: "€400",
  },
  {
    distance: "Vuelos largos (>3.500 km no-EU)",
    examples: "Madrid-Nueva York, Madrid-Buenos Aires, Madrid-Tokio",
    amount: "€600",
  },
];

const STEPS = [
  {
    title: "1. Documenta todo en el momento",
    text:
      "Pantallazo del panel de salidas mostrando 'Cancelado' o el retraso, email/SMS de la aerolínea, hora de comunicación, motivo si te lo dan. Sin pruebas la reclamación posterior se cae.",
  },
  {
    title: "2. Pide asistencia obligatoria (no opcional)",
    text:
      "EU 261/2004 obliga a la aerolínea a darte: comida, bebida (proporcional al retraso), 2 llamadas o emails, alojamiento si pernoctas, y transporte hotel-aeropuerto. Si no la dan, guarda tickets de tus gastos para reembolso posterior.",
  },
  {
    title: "3. Elige reembolso o re-routing",
    text:
      "Tienes derecho a: (a) reembolso completo en 7 días + vuelo gratis de regreso al origen si es escala, O (b) transporte alternativo lo antes posible al destino final. No te dejes empujar a vales de aerolínea — el dinero es tu derecho legal.",
  },
  {
    title: "4. Reclama compensación (€250-600) por escrito",
    text:
      "Envía reclamación formal con todos los datos en máximo 90 días tras el vuelo. Modelo en aesa.gob.es. Aerolínea tiene 30 días para responder. La compensación es ADICIONAL a reembolso/re-routing.",
  },
  {
    title: "5. Si rechazan o ignoran: AESA",
    text:
      "Reclamación en aesa.gob.es (trámite gratuito). AESA media y emite resolución vinculante. Si la aerolínea sigue sin pagar, demanda judicial via abogado especializado (mucha jurisprudencia a favor del pasajero).",
  },
];

const FAQ = [
  {
    q: "¿Cuándo tengo derecho a los €250/€400/€600?",
    a: "Cuando la cancelación se comunica con menos de 14 días de antelación, retraso >3 horas en la llegada, o denegación de embarque por overbooking. Excepción: 'circunstancias extraordinarias' (meteorología severa, terrorismo, huelgas externas) — la aerolínea no paga compensación pero SÍ asistencia.",
  },
  {
    q: "¿Aplica si la aerolínea cancela por huelga de pilotos?",
    a: "Sí. Sentencia TJUE 2018 estableció que huelgas internas de empleados aerolínea NO son 'circunstancias extraordinarias'. Compensación aplica. Si es huelga de controladores aéreos externos, la aerolínea puede no estar obligada (depende caso).",
  },
  {
    q: "¿Qué aerolíneas están sujetas a EU 261/2004?",
    a: "Vuelos: (a) salidas desde aeropuerto UE/EEA con cualquier aerolínea, O (b) llegadas a UE/EEA si operadora aerolínea UE. Iberia, Vueling, Ryanair, easyJet, Air Europa, Norwegian — todas obligadas. American, Delta solo si salen desde UE.",
  },
  {
    q: "¿Cuál es el plazo para reclamar?",
    a: "En España, 5 años (Código Civil Art 1968). Pero recomendado reclamar dentro de 90 días para que la aerolínea no pueda alegar 'extemporaneidad' o pérdida de pruebas. Cuanto antes mejor.",
  },
  {
    q: "¿Empresas como AirHelp o ReclamaFlights son legales?",
    a: "Sí. Cogen 25-30% comisión sobre lo cobrado pero hacen el trabajo (papeleo + abogados si necesario). Útil si reclamas a aerolínea difícil (Ryanair famosa por dilatar). DIY es 100% para ti pero requiere persistencia.",
  },
  {
    q: "Si gano la reclamación, ¿cuánto tardan en pagar?",
    a: "Por ley, 7 días tras decisión favorable. En la práctica: aerolíneas legacy (Iberia, Lufthansa) ~30 días. Low-cost (Ryanair) pueden alargar 3-6 meses sin presión judicial. AESA tiene poder vinculante pero no ejecutivo — para presionar pago, juzgado de lo mercantil.",
  },
];

export default function VueloCanceladoPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Vuelo cancelado", url: "/vuelo-cancelado" },
  ]);

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Cómo reclamar por vuelo cancelado o gran retraso (EU 261/2004)",
    description:
      "Procedimiento paso a paso para reclamar compensación €250-600 + asistencia obligatoria por vuelo cancelado, retrasado >3h o denegación de embarque.",
    totalTime: "P90D",
    estimatedCost: { "@type": "MonetaryAmount", currency: "EUR", value: "0" },
    supply: [
      "Tarjeta de embarque",
      "Email/SMS confirmación cancelación o retraso",
      "Tickets de gastos durante asistencia",
    ],
    step: STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.text,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Vuelo cancelado</span>
      </nav>

      <header className="mb-8">
        <div className="text-5xl">✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Vuelo cancelado o gran retraso: tus derechos
        </h1>
        <p className="mt-3 text-slate-300">
          Según Reglamento UE 261/2004 tienes derecho a compensación €250-600 +
          asistencia obligatoria si te cancelan, retrasan &gt;3h o te deniegan
          embarque por overbooking. Esta guía explica paso a paso cómo reclamar.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="mb-3 text-xl font-bold text-amber-300">💰 Compensación según distancia</h2>
        <div className="space-y-3">
          {COMPENSATION_TIERS.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{c.distance}</h3>
                  <p className="mt-1 text-xs text-slate-400">Ejemplos: {c.examples}</p>
                </div>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 font-mono text-base font-bold text-amber-300">
                  {c.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Compensación es ADICIONAL al reembolso del billete o transporte alternativo
          al destino final.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">Procedimiento — 5 pasos</h2>
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <h3 className="text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-slate-300">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="mb-3 text-xl font-bold text-red-300">⚠️ Cuándo NO pagan compensación</h2>
        <p className="text-sm text-slate-200">
          Las aerolíneas se libran de compensación (NO de asistencia) en{" "}
          <strong>circunstancias extraordinarias</strong>:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          <li>• Meteorología severa (tormenta, niebla, nevada)</li>
          <li>• Terrorismo o amenaza de bomba</li>
          <li>• Huelga de controladores aéreos (terceros)</li>
          <li>• Inestabilidad política en destino</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          NO son extraordinarias: avería técnica de la aerolínea, huelga de pilotos o
          tripulación propia (sentencia TJUE 2018), exceso de bookings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/maleta-perdida"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-1 text-sm font-bold text-white">Maleta perdida</div>
          <div className="text-xs text-slate-400">Guía Convenio Montreal + reclamación</div>
        </Link>
        <Link
          href="/seguro-viaje"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🛡️</div>
          <div className="mt-1 text-sm font-bold text-white">Seguros con cobertura cancelación</div>
          <div className="text-xs text-amber-300">Heymondo, AXA, Mondo comparados</div>
        </Link>
      </section>

      <footer className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-xs text-slate-500">
        Esta guía es informativa. Para casos complejos (acumulación múltiple,
        multiples pasajeros, daños psicológicos) consulta abogado especializado o
        asociaciones (OCU, Adicae). Las reclamaciones via empresas como AirHelp
        cobran 25-30% comisión pero hacen el papeleo.
      </footer>
    </main>
  );
}
