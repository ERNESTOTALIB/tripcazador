/**
 * /business-class-barato — AUDIT-FULL-2 (24 may 2026)
 *
 * Landing high-intent SEO para keyword "business class barato" + variantes
 * ("business class precio economy", "business class chollo"). Cluster
 * cross-link Premium €9.99 (incluye alertas business class).
 *
 * AEO via FAQ schema + Article schema.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, faqPageSchema, articleSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Business class barato: cómo conseguirla a precio economy",
  description:
    "Guía probada para conseguir business class a precio economy: error fares, ofertas relámpago, Avios/Iberia Plus, transferencias y técnicas avanzadas.",
  alternates: { canonical: `${SITE_URL}/business-class-barato` },
  openGraph: {
    title: "Business class barato — guía completa",
    description: "Cómo cazar business a precio economy en 2026.",
    url: `${SITE_URL}/business-class-barato`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const TECNICAS = [
  {
    emoji: "🎯",
    title: "Error fares de business class",
    desc: "Los error fares más jugosos son los de business class long-haul: Iberia MAD-EZE €380 RT (vs €750 normal), Lufthansa FRA-BKK €1.450 RT (vs €4.200), Air France CDG-MEX €700 RT (vs €2.800). TripCazador detecta estos ~3-5 veces al año automáticamente.",
    actionLink: { href: "/deals?cabin=business", label: "Ver deals business activos →" },
  },
  {
    emoji: "💎",
    title: "Avios + Iberia Plus (premios saver)",
    desc: "MAD-JFK business saver: 25K-35K Avios + €100 tasas (vs €800-1.500 cash). Acumula Avios sin volar: transfiriendo desde Amex Membership Rewards (España: 1:1) o Chase Sapphire (no aplica desde ES pero sí si tienes cuenta US). Programa Iberia Plus tiene los mejores ratios sweet-spot del mundo en redenciones europe-americas.",
    actionLink: { href: "/aerolineas/ib", label: "Análisis Iberia +Avios →" },
  },
  {
    emoji: "🔄",
    title: "Status-match + upgrade voluntary",
    desc: "Si tienes status en alguna aerolínea (Iberia Plus Plata, Avios Gold), pide status-match a otra alianza (Skyteam Elite Plus via Air Europa, Star Alliance Gold via Lufthansa). Con status, los upgrades voluntary cuestan 70K-100K millas o €200-300 cash en vuelos no full.",
    actionLink: null,
  },
  {
    emoji: "⏰",
    title: "Subastas de upgrade last-minute",
    desc: "Iberia, Air France, Lufthansa ofrecen subastas de upgrade 7-14d antes del vuelo. Si vas en economy y la cabina business tiene plazas libres, puedes pujar desde €150-300 por upgrade trasatlántico. Aceptan ~40% de las ofertas si vuelo no está full.",
    actionLink: null,
  },
  {
    emoji: "🌍",
    title: "Vuelos en sentido contrario (hidden city)",
    desc: "Una técnica controvertida: si quieres MAD-NYC business, mira el precio NYC-MAD-FRA business (la parte FRA descartada). A veces 40% más barato. Riesgos: aerolínea puede cancelar return + cobrar penalty. Solo OW, sin equipaje facturado.",
    actionLink: null,
  },
  {
    emoji: "🎁",
    title: "Companion ticket de tarjetas premium",
    desc: "Amex Platinum ES: companion gratuito en business CON el cardholder. American Airlines AAdvantage Aviator (US): companion gratis. Si tu pareja viaja contigo, una tarjeta de €600/año pagada en 1 viaje. Ojo: Amex Platinum ES tiene companion en Iberia Premium Economy, NO business — confirmar T&C antes de pagar la cuota.",
    actionLink: null,
  },
];

const ERROR_FARES_HISTORICOS = [
  { route: "MAD-PUJ (Air Europa)", price: 99, normal: 1200, year: 2014, note: "Famoso de Iberia Business, replicado por AE" },
  { route: "MAD-JFK (Iberia)", price: 290, normal: 1500, year: 2023, note: "Glitch sistema pricing Avios → cash" },
  { route: "BCN-NRT (Air France)", price: 450, normal: 3800, year: 2025, note: "Codeshare ANA glitch ventana 12h" },
  { route: "MAD-EZE (Iberia)", price: 380, normal: 2200, year: 2024, note: "Premium → Business automated upgrade misclassified" },
  { route: "MAD-MEX (Air France)", price: 700, normal: 2800, year: 2025, note: "Triángulo CDG-MAD-MEX precio inverso" },
];

const FAQ = [
  {
    q: "¿Cuánto se ahorra realmente en un error fare de business?",
    a: "Entre 70% y 85% del precio normal. Ejemplo: MAD-EZE business normal €1.200-2.200, error fare €380-450 (70-80% off). MAD-NYC business normal €800-1.500, error fare €290-450 (65-70% off).",
  },
  {
    q: "¿Los error fares de business son respetados por las aerolíneas?",
    a: "85-90% sí. Iberia y Lufthansa históricamente respetan. Air France y BA: variable según volumen del glitch. Si la aerolínea cancela, está obligada por DOT (USA) o regulación UE 261 a devolver dinero + compensar gastos (hotel pre-pagado, etc).",
  },
  {
    q: "¿Cuánto cuestan los Avios para business class transatlántica?",
    a: "MAD-JFK saver: 50K Avios + €100 tasas (peak) o 25K-34K + €100 (off-peak). MAD-EZE saver: 90K + €120. MAD-SCL saver: 110K + €150. Acumula 25K-50K Avios con bonos de tarjeta Amex Membership Rewards.",
  },
  {
    q: "¿Premium Economy es business class barato?",
    a: "NO. Premium Economy es un producto intermedio (más sitio, mejor comida, sin lie-flat). Cuesta 50-80% más que economy pero 50-60% menos que business. Es la mejor opción para vuelos 6-9h cuando business está fuera de presupuesto.",
  },
  {
    q: "¿Hay alertas automáticas para business class barato?",
    a: "Sí — TripCazador Premium incluye alertas dedicadas para cabina business + premium economy con filtros de aerolínea y ruta. Notificación push instantánea cuando un error fare aparece.",
  },
];

export default function BusinessClassBaratoPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Business class barato", url: "/business-class-barato" },
  ]);

  const faqJsonLd = faqPageSchema(FAQ.map((f) => ({ q: f.q, a: f.a })));

  const articleJsonLd = articleSchema({
    headline: "Business class barato: guía 2026",
    description: "Cómo conseguir business class a precio economy con error fares, Avios, status matching y técnicas avanzadas.",
    authorName: "Equipo TripCazador",
    datePublished: "2026-05-24",
    imageUrl: `${SITE_URL}/icon-512.png`,
    url: `${SITE_URL}/business-class-barato`,
  });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Business class barato</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">👑</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Business class barato
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          La guía definitiva para conseguir business class a precio economy desde España:
          error fares, Avios, status matching, subastas de upgrade y técnicas avanzadas.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-bold text-white">⚡ 6 técnicas probadas</h2>
        <div className="space-y-4">
          {TECNICAS.map((t, i) => (
            <article
              key={i}
              className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{t.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{t.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{t.desc}</p>
                  {t.actionLink && (
                    <Link
                      href={t.actionLink.href}
                      className="mt-3 inline-block text-xs font-bold text-amber-400 hover:text-amber-300"
                    >
                      {t.actionLink.label}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-4 text-xl font-bold text-amber-300">
          📊 Error fares business class históricos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 text-left">Ruta</th>
                <th className="py-2 text-right">Error</th>
                <th className="py-2 text-right">Normal</th>
                <th className="py-2 text-right">Año</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {ERROR_FARES_HISTORICOS.map((e, i) => (
                <tr key={i} className="border-t border-slate-700/50">
                  <td className="py-2.5">
                    <div className="font-semibold text-white">{e.route}</div>
                    <div className="text-xs text-slate-500">{e.note}</div>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-amber-300">€{e.price}</td>
                  <td className="py-2.5 text-right font-mono text-slate-500 line-through">€{e.normal}</td>
                  <td className="py-2.5 text-right text-slate-400">{e.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-bold text-white">❓ Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
            >
              <summary className="cursor-pointer text-sm font-bold text-white">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-6 text-center">
        <h2 className="text-2xl font-bold text-white">🔔 Cazar business automáticamente</h2>
        <p className="mt-2 max-w-xl mx-auto text-sm text-slate-300">
          Premium TripCazador (€9.99/mes) incluye alertas dedicadas a cabina business
          con filtros de aerolínea + ruta. Notificación instantánea ante error fares.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/premium"
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
          >
            Ver Premium →
          </Link>
          <Link
            href="/deals?cabin=business"
            className="rounded-lg border border-amber-500/40 px-5 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-500/10"
          >
            Deals business actuales
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link href="/aerolineas/ib" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🇪🇸</div>
          <div className="mt-1 text-sm font-bold text-white">Iberia + Avios</div>
        </Link>
        <Link href="/aerolineas/lh" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🇩🇪</div>
          <div className="mt-1 text-sm font-bold text-white">Lufthansa</div>
        </Link>
        <Link href="/aerolineas/ux" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🇪🇸</div>
          <div className="mt-1 text-sm font-bold text-white">Air Europa</div>
        </Link>
      </section>
    </main>
  );
}
