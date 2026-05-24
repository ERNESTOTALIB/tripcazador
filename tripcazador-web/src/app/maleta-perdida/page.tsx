/**
 * /maleta-perdida — SSS451 (23 may 2026)
 *
 * Guía completa cuando una aerolínea pierde tu equipaje. Procedimiento
 * paso a paso (PIR, reclamación, compensación EU 261), plazos, seguros.
 *
 * HowTo + FAQPage + Breadcrumb JSON-LD.
 *
 * SEO: "maleta perdida ryanair", "como reclamar equipaje perdido",
 * "compensacion maleta perdida UE", "PIR equipaje".
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Maleta perdida: guía completa de reclamación 2026",
  description:
    "Paso a paso si la aerolínea pierde tu maleta: PIR, plazos legales, compensación máxima EU 261, seguro de viaje cubre. Ejemplos reales de reembolso.",
  alternates: { canonical: `${SITE_URL}/maleta-perdida` },
  openGraph: {
    title: "Maleta perdida: guía de reclamación",
    description: "PIR + compensación + plazos. Procedimiento paso a paso.",
    url: `${SITE_URL}/maleta-perdida`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const STEPS = [
  {
    title: "1. Antes de salir del aeropuerto: presenta el PIR",
    text:
      "Acude al mostrador del 'Lost & Found' de tu aerolínea (no de Aena/aeropuerto) ANTES de salir de la zona de llegadas. Rellena el PIR (Property Irregularity Report). Sin PIR no hay reclamación legal posible.",
  },
  {
    title: "2. Guarda número de referencia + descripción detallada",
    text:
      "El PIR te genera un número de referencia (ej. MAD/IB/123456). Anótalo. Aporta descripción detallada (marca, color, tags, contenido aproximado). Foto de la maleta facturada antes del viaje ayuda mucho.",
  },
  {
    title: "3. Compra esenciales — guarda tickets (24-48h)",
    text:
      "Hasta que llegue la maleta, puedes comprar lo esencial (ropa interior, neceser, ropa básica). Guarda TODOS los tickets — la aerolínea reembolsará gastos razonables tras devolver maleta. Importe razonable: 50-150€ por persona.",
  },
  {
    title: "4. Si 21 días sin maleta: declárala perdida",
    text:
      "Por convenio Montreal, tras 21 días sin localizar la maleta se considera oficialmente perdida. En ese momento aplica la compensación máxima legal (~€1.288 por convenio Montreal SDR 1131).",
  },
  {
    title: "5. Reclama compensación dentro de 21 días tras recibo (o pérdida)",
    text:
      "Envía reclamación formal por escrito (carta certificada o web aerolínea) en máximo 21 días tras recibir la maleta dañada / aceptar pérdida. Adjunta: PIR, tickets compras esenciales, foto maleta antes, lista contenido valorada.",
  },
  {
    title: "6. Si no responden 60 días: AESA",
    text:
      "Si la aerolínea no resuelve en 60 días, presenta reclamación en AESA (Agencia Estatal Seguridad Aérea). Web: aesa.gob.es. Trámite gratuito. AESA media con la aerolínea y emite resolución.",
  },
];

const FAQ = [
  {
    q: "¿Cuánto tarda la aerolínea en encontrar mi maleta perdida?",
    a: "Estadísticamente el 95% aparece en 24-48h y 99% en 5 días. Si pasados 5 días sigue desaparecida, escalad — pide updates por escrito. A los 21 días se considera oficialmente perdida.",
  },
  {
    q: "¿Cuánto puedo gastar en ropa de emergencia mientras llega mi maleta?",
    a: "Razonable: 50-150€ por persona y día sin maleta. La aerolínea reembolsa esto pero exige tickets y prueba de necesidad (ej. estás en viaje de negocios y faltan trajes). Lujo no cubierto.",
  },
  {
    q: "¿Cuál es la compensación máxima legal por maleta perdida?",
    a: "Convenio Montreal (vuelos internacionales): ~€1.288 por pasajero (SDR 1131). EU 261/2004 confirma este límite. Para mayor cantidad necesitas seguro de viaje específico o cobertura tarjeta crédito.",
  },
  {
    q: "¿El seguro de viaje cubre maleta perdida?",
    a: "Sí — los seguros de viaje suelen cubrir hasta €600-3000 por equipaje perdido (por encima del límite Montreal). Heymondo, AXA y Mondo tienen pólizas específicas. Verifica las exclusiones (ej. objetos valor > €300 separados).",
  },
  {
    q: "¿Y si la maleta llega dañada?",
    a: "Mismo procedimiento — PIR en el aeropuerto antes de salir. Plazo de reclamación: 7 días para daño, 21 días para retraso. Sin PIR la reclamación se desestima automáticamente.",
  },
  {
    q: "¿Puedo reclamar a Ryanair / aerolíneas low-cost igual?",
    a: "Sí — las low-cost están sujetas al Convenio Montreal igual que las legacy. Ryanair, Vueling, Wizz, easyJet TIENEN que indemnizar. Su política interna suele ser más restrictiva, pero la ley europea prevalece.",
  },
];

export default function MaletaPerdidaPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Cómo reclamar una maleta perdida en avión",
    description:
      "Procedimiento paso a paso para reclamar a la aerolínea cuando pierde tu equipaje facturado. Compensación legal y plazos según Convenio Montreal y EU 261/2004.",
    totalTime: "PT60D",
    estimatedCost: { "@type": "MonetaryAmount", currency: "EUR", value: "0" },
    supply: ["PIR (Property Irregularity Report)", "Tickets de compras esenciales", "Foto maleta antes del viaje"],
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Maleta perdida", item: `${SITE_URL}/maleta-perdida` },
    ],
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Maleta perdida</span>
      </nav>

      <header className="mb-8">
        <div className="text-5xl">🧳</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Maleta perdida: cómo reclamar paso a paso
        </h1>
        <p className="mt-3 text-slate-300">
          Tu aerolínea es legalmente responsable si pierde tu equipaje
          facturado. Sigue estos 6 pasos para maximizar la compensación según
          Convenio Montreal y EU 261/2004.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="text-base font-bold text-amber-300">⚠️ Lo más importante</h2>
        <p className="mt-2 text-sm text-slate-200">
          <strong>Presenta el PIR ANTES de salir del aeropuerto.</strong> Sin PIR no
          hay reclamación legal posible — perderás compensación incluso si la
          maleta tarda meses en aparecer.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">Procedimiento — 6 pasos</h2>
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

      <section className="mb-10 rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">📋 Compensación legal — referencia</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>
            <strong>Convenio Montreal</strong> (vuelos internacionales): hasta{" "}
            <span className="font-mono text-amber-300">€1.288</span> por pasajero (1131 SDR).
          </li>
          <li>
            <strong>EU 261/2004</strong>: refuerza derechos UE — denegación embarque,
            retrasos, cancelaciones (no cubre maleta perdida específicamente, pero sí
            equipaje retrasado &gt;3h junto a vuelo cancelado).
          </li>
          <li>
            <strong>Seguro de viaje</strong> (recomendado): cobertura adicional hasta
            €600-3000 dependiendo de la póliza. Cubre los gastos por encima del límite
            Montreal.
          </li>
        </ul>
      </section>

      <section className="mb-10">
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

      <section className="mb-10 grid gap-3 sm:grid-cols-2">
        <Link
          href="/seguro-viaje"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🛡️</div>
          <div className="mt-1 text-sm font-bold text-white">Seguros con cobertura equipaje</div>
          <div className="text-xs text-amber-300">Heymondo, AXA, Mondo comparados</div>
        </Link>
        <Link
          href="/equipaje"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-1 text-sm font-bold text-white">Reglas equipaje aerolíneas</div>
          <div className="text-xs text-slate-400">15 guías por aerolínea</div>
        </Link>
      </section>

      <footer className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-xs text-slate-500">
        Esta guía es informativa. Para situaciones complejas, consulta con
        abogado especializado o asociaciones de consumidores (OCU, Adicae).
        Las indemnizaciones varían por jurisdicción y aerolínea.
      </footer>
    </main>
  );
}
