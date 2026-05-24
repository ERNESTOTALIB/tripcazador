/**
 * /error-fares — SUPERSESSION (24 may 2026)
 *
 * Hub high-intent SEO para "error fares". Explica qué son, cómo se
 * detectan, ejemplos históricos famosos, técnicas y Premium upsell.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, faqPageSchema, articleSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Error fares: qué son, cómo cazarlos, ejemplos famosos",
  description:
    "Guía completa de error fares (vuelos con precio erróneo): qué son, cómo se generan, ejemplos históricos top 10, técnicas para cazarlos. Premium ofrece alertas instantáneas.",
  alternates: { canonical: `${SITE_URL}/error-fares` },
  openGraph: {
    title: "Error fares: la guía completa 2026",
    description: "Vuelos con precio erróneo — qué son y cómo cazarlos.",
    url: `${SITE_URL}/error-fares`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const EJEMPLOS_HISTORICOS = [
  { route: "MAD-PUJ Business (Air Europa)", price: 99, normal: 2400, year: 2014, descuento: "96%", note: "El más famoso — Air Europa los honró todos" },
  { route: "NYC-TLV Business (American)", price: 130, normal: 1500, year: 2014, descuento: "91%", note: "Glitch durante actualización pricing engine" },
  { route: "MAD-EZE Business (Iberia)", price: 380, normal: 2200, year: 2024, descuento: "83%", note: "Premium Economy upgrade misclasificado" },
  { route: "LHR-PEK (Cathay)", price: 561, normal: 16000, year: 2019, descuento: "96%", note: "First class Hong Kong-Beijing por menos que economy normal" },
  { route: "ZRH-DXB First (Etihad)", price: 800, normal: 17000, year: 2020, descuento: "95%", note: "Pandemic-era pricing tool glitch" },
  { route: "MAD-JFK (Iberia)", price: 290, normal: 1500, year: 2023, descuento: "81%", note: "Avios→cash conversion bug" },
  { route: "BCN-NRT (Air France)", price: 450, normal: 3800, year: 2025, descuento: "88%", note: "Codeshare ANA con glitch ventana 12h" },
];

const COMO_SE_GENERAN = [
  {
    icon: "🤖",
    title: "Error de software pricing",
    desc: "Las aerolíneas calculan precios con motores que combinan demanda, fecha, ocupación y reglas de revenue management. Un bug en update puede dar precios surrealmente bajos por horas.",
  },
  {
    icon: "💱",
    title: "Error de cambio de divisa",
    desc: "Precio cargado en moneda local pero mostrado en EUR sin conversión: 100 ARS (€0.40) mostrado como €100. Affil pages con scraping de prices nuevos extranjero típico.",
  },
  {
    icon: "🤝",
    title: "Error en codeshare/interlining",
    desc: "Cuando aerolínea A vende segmento de B, cada una usa su propio motor. Si los precios no se sincronizan, el segmento entero a veces se mete con precio de aerolínea que no debería.",
  },
  {
    icon: "🏷️",
    title: "Promo mal-targetada",
    desc: "Promoción para una región (ej. India) que se cuela en motores globales. Comprado desde Europa con VPN era una de las técnicas en 2015-2018.",
  },
];

const TECNICAS = [
  "Suscríbete a sites de error fare (TripCazador, Secret Flying, Fly4Free)",
  "Activa notificaciones push del navegador o WhatsApp",
  "Reserva en máximo 30 minutos — la mayoría se corrigen en 1-12h",
  "Paga con tarjeta crédito (no débito) — protección si la aerolínea cancela",
  "NO publiques el error fare en redes hasta tenerlo confirmado pagado",
  "No reserves hotel/visas hasta tener el vuelo emitido (ticket number con prefix carrier)",
  "Si te cancelan: pide compensación EU 261 + alternative routing equivalente",
];

const FAQ = [
  {
    q: "¿Las aerolíneas honran los error fares?",
    a: "85-90% de las veces sí. Iberia, Lufthansa históricamente respetan todos. American Airlines y Etihad tras 2014 también. Air France/KLM mas variable. Si cancelan, EU 261/2004 te obliga reembolso + compensación de gastos.",
  },
  {
    q: "¿Cuánto duran los error fares activos?",
    a: "Promedio: 4-8 horas. Algunos famosos (MAD-PUJ Air Europa 2014) duraron 36 horas. Otros se corrigen en 30 minutos. Por eso la velocidad de notificación es clave.",
  },
  {
    q: "¿Es legal cazar error fares?",
    a: "100% legal. Tú compras a la tarifa publicada. La aerolínea es responsable de sus precios. EU 261/2004 protege al consumidor incluso si el precio era 'erróneo'.",
  },
  {
    q: "¿Qué destinos suelen tener más error fares?",
    a: "Long-haul desde Europa: España-Latam (Iberia/Air Europa), Europa-Asia (KLM/AF/LH), Europa-Oceanía (varias con escalas). Business class son los más jugosos (descuentos 80-95%).",
  },
  {
    q: "¿Cuánto cuesta el servicio de alertas?",
    a: "Gratis los públicos (delay 1-6h). TripCazador Premium €9.99/mes ofrece alertas instant + filtros avanzados (aerolínea, cabina, ruta). Para cazadores serios, el ROI es positivo desde el 1er error fare cazado.",
  },
];

export default function ErrorFaresPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Error fares", url: "/error-fares" },
  ]);

  const faqJsonLd = faqPageSchema(FAQ.map((f) => ({ q: f.q, a: f.a })));

  const articleJsonLd = articleSchema({
    headline: "Error fares: la guía completa 2026",
    description: "Qué son los error fares, cómo se generan, ejemplos históricos top 10, técnicas para cazarlos.",
    authorName: "Equipo TripCazador",
    datePublished: "2026-05-24",
    imageUrl: `${SITE_URL}/icon-512.png`,
    url: `${SITE_URL}/error-fares`,
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
        <span className="text-slate-200">Error fares</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🎯</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Error fares
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Qué son, cómo se generan, ejemplos históricos top y cómo cazarlos.
          La guía definitiva del 2026 para entender el mundo del error fare.
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-3 text-xl font-bold text-amber-300">⚡ Definición rápida</h2>
        <p className="text-sm text-slate-300">
          Un <strong className="text-white">error fare</strong> es un billete de avión publicado
          con precio incorrecto en el sistema de la aerolínea — bug de software, cambio de divisa
          mal aplicado, o error humano. Descuentos típicos: 70-95% del precio normal.
          Las aerolíneas, por ley UE/USA, suelen honrar la tarifa publicada.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-bold text-white">🔧 Cómo se generan</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {COMO_SE_GENERAN.map((c, i) => (
            <article
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <div className="text-2xl">{c.icon}</div>
              <h3 className="mt-2 text-base font-bold text-white">{c.title}</h3>
              <p className="mt-2 text-xs text-slate-400">{c.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-bold text-white">📊 Top 7 error fares históricos</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 text-left">Ruta</th>
                <th className="py-2 text-right">Precio</th>
                <th className="py-2 text-right">Normal</th>
                <th className="py-2 text-right">Off</th>
                <th className="py-2 text-right">Año</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {EJEMPLOS_HISTORICOS.map((e, i) => (
                <tr key={i} className="border-t border-slate-700/50">
                  <td className="py-2.5">
                    <div className="font-semibold text-white">{e.route}</div>
                    <div className="text-xs text-slate-500">{e.note}</div>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-amber-300">€{e.price}</td>
                  <td className="py-2.5 text-right font-mono text-slate-500 line-through">€{e.normal}</td>
                  <td className="py-2.5 text-right font-bold text-emerald-300">{e.descuento}</td>
                  <td className="py-2.5 text-right text-slate-400">{e.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-4 text-xl font-bold text-amber-300">⚡ 7 técnicas para cazarlos</h2>
        <ol className="space-y-2">
          {TECNICAS.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300">
              <span className="flex-shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">❓ Preguntas frecuentes</h2>
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
        <h2 className="text-2xl font-bold text-white">🔔 ¿Quieres cazar el próximo?</h2>
        <p className="mt-2 max-w-xl mx-auto text-sm text-slate-300">
          TripCazador detecta error fares 24/7. Premium (€9.99/mes) recibe alertas
          instant + filtros aerolínea/ruta/cabina. ROI positivo desde el 1er cazado.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/premium"
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
          >
            Ver Premium →
          </Link>
          <Link
            href="/deals?classification=ERROR%20FARE"
            className="rounded-lg border border-amber-500/40 px-5 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-500/10"
          >
            Ver error fares activos
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link href="/business-class-barato" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">👑</div>
          <div className="mt-1 text-sm font-bold text-white">Business barato</div>
        </Link>
        <Link href="/black-friday" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Black Friday vuelos</div>
        </Link>
        <Link href="/anuario-2026" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">📊</div>
          <div className="mt-1 text-sm font-bold text-white">Anuario 2026</div>
        </Link>
      </section>
    </main>
  );
}
