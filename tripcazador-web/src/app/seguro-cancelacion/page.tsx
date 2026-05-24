/**
 * /seguro-cancelacion — AUDIT-FULL-3 (24 may 2026)
 *
 * Landing high-intent SEO para "seguro cancelación viaje". Explica cuándo
 * vale la pena, compara coberturas + cross-link a Heymondo (afiliado existente).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, faqPageSchema, articleSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Seguro cancelación viaje: cuándo merece la pena 2026",
  description:
    "Guía honesta del seguro de cancelación: cuándo cubre, cuándo NO, alternativas (tarjeta crédito, política aerolínea). Comparativa Heymondo, Mapfre, IATI.",
  alternates: { canonical: `${SITE_URL}/seguro-cancelacion` },
  openGraph: {
    title: "Seguro cancelación viaje 2026: ¿merece la pena?",
    description: "Cuándo cubre, cuándo no, alternativas y comparativa.",
    url: `${SITE_URL}/seguro-cancelacion`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const COMPARATIVA = [
  {
    provider: "Heymondo",
    coveredReasons: 22,
    cancelAnyReason: true,
    cancelAnyReasonExtra: "+30%",
    pricePerEur100: 6.5,
    affiliate: true,
  },
  {
    provider: "Mapfre Viajes",
    coveredReasons: 17,
    cancelAnyReason: false,
    cancelAnyReasonExtra: null,
    pricePerEur100: 5.8,
    affiliate: false,
  },
  {
    provider: "IATI",
    coveredReasons: 24,
    cancelAnyReason: true,
    cancelAnyReasonExtra: "+25%",
    pricePerEur100: 7.2,
    affiliate: false,
  },
  {
    provider: "Allianz Travel",
    coveredReasons: 19,
    cancelAnyReason: true,
    cancelAnyReasonExtra: "+40%",
    pricePerEur100: 6.9,
    affiliate: false,
  },
];

const MERECE_LA_PENA = [
  {
    icon: "✅",
    title: "SÍ merece la pena si...",
    items: [
      "Viaje >€800/persona (proporción coste/beneficio mejor)",
      "Reservas no reembolsables (hoteles boutique, tours pre-pagados)",
      "Tienes familiares mayores 65+ (riesgo cancelación por salud familia)",
      "Trabajo con guardias o cambios last-minute (despidos, cambios contrato)",
      "Embarazo (cancelación por reposo médico cubierta)",
      "Destinos con visa rechazable (embajada deniega → cobertura)",
    ],
  },
  {
    icon: "⚠️",
    title: "NO merece la pena si...",
    items: [
      "Vuelo barato/error fare <€300: la prima (6%) supera el ahorro esperado",
      "Reserva flexible/reembolsable: la aerolínea ya devuelve sin penalización",
      "Tarjeta Amex Platinum/Gold ES: incluye cancelación viaje gratis",
      "Compras con Booking.com Genius L3: ofrece cancelación gratis 7d antes",
      "Trip cancellation is el único riesgo y el monto es bajo",
    ],
  },
];

const FAQ = [
  {
    q: "¿Qué cubre exactamente el seguro de cancelación?",
    a: "Reembolso del coste no reembolsable (hotel, vuelo, tour) si cancelas por motivo cubierto: enfermedad propia o familiar grave, despido, citación judicial, robo del DNI, daño en residencia, etc. Cobertura típica: 17-24 motivos según póliza.",
  },
  {
    q: "¿Qué es 'cancel for any reason' (CFAR)?",
    a: "Extra opcional (+25-40% sobre prima base) que permite cancelar por CUALQUIER motivo y recuperar 60-75% del viaje. Útil si planeas con incertidumbre alta (work-from-anywhere, situación pareja). Heymondo, IATI y Allianz lo ofrecen.",
  },
  {
    q: "¿Cuánto antes debo comprar el seguro?",
    a: "Idealmente en las primeras 24-48h tras reservar el viaje. Algunas pólizas cubren preexistencias solo si compras dentro de 14 días del primer pago. Si compras última semana antes del viaje, varias coberturas se reducen.",
  },
  {
    q: "¿Mi tarjeta de crédito ya me cubre?",
    a: "Algunas premium sí (Amex Platinum/Gold ES, Diners, Visa Infinite ciertos bancos). Cubren 'trip cancellation' pero NO siempre 'cancel for any reason'. Lee letra pequeña — la mayoría exige pagar el viaje COMPLETO con esa tarjeta para activar cobertura.",
  },
  {
    q: "¿El seguro cubre cancelación por COVID o pandemia?",
    a: "Heymondo e IATI sí cubren cancelación por dar positivo COVID antes del viaje. Allianz solo si das positivo Y tienes síntomas. Mapfre tradicional NO (clausula 'enfermedades epidémicas/pandémicas' excluida).",
  },
  {
    q: "¿Cuánto cuesta un seguro de cancelación típico?",
    a: "5-8% del precio del viaje. Para un viaje €1.500/persona: ~€90-120 prima. Con 'cancel for any reason': sube a €120-180. Tarifas suben con edad (+30% si >65 años) y duración (>30 días viaje +20%).",
  },
];

export default function SeguroCancelacionPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Seguro cancelación", url: "/seguro-cancelacion" },
  ]);

  const faqJsonLd = faqPageSchema(FAQ.map((f) => ({ q: f.q, a: f.a })));

  const articleJsonLd = articleSchema({
    headline: "Seguro cancelación viaje 2026: cuándo merece la pena",
    description: "Guía honesta para decidir si comprar seguro de cancelación. Cobertura, comparativa, FAQ.",
    authorName: "Equipo TripCazador",
    datePublished: "2026-05-24",
    imageUrl: `${SITE_URL}/icon-512.png`,
    url: `${SITE_URL}/seguro-cancelacion`,
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
        <span className="text-slate-200">Seguro cancelación</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🛡️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Seguro cancelación viaje
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Guía honesta para decidir si comprarlo. No es un afiliado disfrazado:
          a veces merece la pena, otras NO. Aquí explicamos cuándo cada caso.
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        {MERECE_LA_PENA.map((m, i) => (
          <article
            key={i}
            className={`rounded-2xl border p-5 ${
              i === 0
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            }`}
          >
            <h2 className={`mb-3 text-lg font-bold ${i === 0 ? "text-emerald-300" : "text-amber-300"}`}>
              {m.icon} {m.title}
            </h2>
            <ul className="space-y-2">
              {m.items.map((it, k) => (
                <li key={k} className="text-sm text-slate-300">
                  • {it}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mb-10 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">📊 Comparativa 4 aseguradoras</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 text-left">Proveedor</th>
                <th className="py-2 text-center">Motivos</th>
                <th className="py-2 text-center">CFAR*</th>
                <th className="py-2 text-right">€/100€ viaje</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {COMPARATIVA.map((c, i) => (
                <tr key={i} className="border-t border-slate-700/50">
                  <td className="py-2.5">
                    <strong className="text-white">{c.provider}</strong>
                    {c.affiliate && <span className="ml-2 text-xs text-amber-400">★</span>}
                  </td>
                  <td className="py-2.5 text-center font-mono">{c.coveredReasons}</td>
                  <td className="py-2.5 text-center text-xs">
                    {c.cancelAnyReason ? (
                      <span className="text-emerald-300">✓ {c.cancelAnyReasonExtra}</span>
                    ) : (
                      <span className="text-red-300">No disponible</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono">€{c.pricePerEur100.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          * CFAR = Cancel For Any Reason, extra opcional. ★ Heymondo es partner afiliado de TripCazador.
        </p>
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
        <h2 className="text-xl font-bold text-white">🛡️ ¿Listo para contratar?</h2>
        <p className="mt-2 max-w-xl mx-auto text-sm text-slate-300">
          Recomendamos Heymondo si tu viaje cumple los criterios "SÍ merece la pena".
          Es nuestro partner — recibimos comisión sin coste extra para ti.
        </p>
        <Link
          href="/seguro-viaje/japon"
          className="mt-5 inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
        >
          Ver seguros Heymondo por destino →
        </Link>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link href="/vuelo-cancelado" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">⚖️</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelo cancelado</div>
          <div className="text-xs text-slate-400">EU 261/2004</div>
        </Link>
        <Link href="/maleta-perdida" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🧳</div>
          <div className="mt-1 text-sm font-bold text-white">Maleta perdida</div>
          <div className="text-xs text-slate-400">Cómo reclamar</div>
        </Link>
        <Link href="/tarjetas-viaje" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">💳</div>
          <div className="mt-1 text-sm font-bold text-white">Tarjetas con cobertura</div>
          <div className="text-xs text-slate-400">Amex, Visa premium</div>
        </Link>
      </section>
    </main>
  );
}
