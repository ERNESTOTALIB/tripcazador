/**
 * /predicciones-vuelos-2026 — SSS482 (24 may 2026)
 *
 * Predicciones anuales del equipo TripCazador. PR-bait con backlinks
 * potenciales si medios citan.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Predicciones vuelos 2026: qué esperar | TripCazador",
  description:
    "Análisis del estado de la aviación europea 2026: precios, rutas, eventos clave, error fares probables. Predicciones del equipo TripCazador.",
  alternates: { canonical: `${SITE_URL}/predicciones-vuelos-2026` },
  openGraph: {
    title: "Predicciones vuelos 2026",
    description: "Qué esperar del año de la aviación.",
    url: `${SITE_URL}/predicciones-vuelos-2026`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const PREDICTIONS = [
  {
    emoji: "✈️",
    title: "Iberia consolidará Madrid–Buenos Aires como ruta más rentable",
    text:
      "Sin competencia directa Air Europa (perdió tracción tras 2024), Iberia mantendrá precios altos (€700+ ida y vuelta) pero ofrecerá Business class más accesible vía Avios para fidelizar.",
    confidence: "Alta",
  },
  {
    emoji: "🚆",
    title: "Iryo o Ouigo absorberá una ruta deficitaria de Renfe",
    text:
      "El mercado AVE liberalizado lleva 5 años. Renfe tiene rutas no rentables (ej. Galicia interior). Esperamos consolidación 2026-2027 con OPA tipo Ouigo+Renfe filial.",
    confidence: "Media",
  },
  {
    emoji: "📉",
    title: "Error fares MEN-OS frecuentes, pero MÁS profundos",
    text:
      "Sistemas de pricing engine cada vez más AI-resilientes. Pero cuando fallan, fallan a lo grande: esperamos al menos 1 error fare 'estilo Iberia 2014 MAD-PUJ €99' al año.",
    confidence: "Media",
  },
  {
    emoji: "🌍",
    title: "Premium económico (Premium Economy) será el nuevo Business mid-range",
    text:
      "Ryanair, easyJet introducen filas premium 2026. Iberia consolida Premium Economy en flota long-haul. Esperamos demanda creciente entre 30-50 años con presupuesto medio-alto.",
    confidence: "Alta",
  },
  {
    emoji: "🛂",
    title: "ETIAS UE entra en vigor — caos inicial 4-6 meses",
    text:
      "La nueva autorización tipo ESTA para no-UE entrará en 2026 (retrasada varias veces). Esperamos rechazos masivos por errores formulario, sobre todo turistas Latam/Asia con primer viaje.",
    confidence: "Alta",
  },
  {
    emoji: "📱",
    title: "Apps de bagaje miden por foto reemplazan al medidor físico",
    text:
      "Ryanair piloto 2025 escanea bolsos en gate con cámara IA. Si funciona, otras low-cost lo adoptan 2026. Resultado: menos discriminación humana, más rigor matemático.",
    confidence: "Media",
  },
  {
    emoji: "🏨",
    title: "Hoteles boutique ES bajarán precio en hombros temporada",
    text:
      "Exceso de hoteles boutique (Madrid, BCN, Sevilla) tras boom 2022-2024. Esperamos -10-15% en mayo-junio y septiembre-octubre para llenar inventario.",
    confidence: "Media",
  },
  {
    emoji: "🎟️",
    title: "Black Friday 2026 será más conservador",
    text:
      "Aerolíneas se han pasado quemándose en descuentos agresivos 2023-2024. Esperamos sales más segmentados (sólo Premium/Loyalty) en lugar de generales.",
    confidence: "Baja",
  },
];

const CONFIDENCE_BADGE: Record<string, string> = {
  Alta: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  Media: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Baja: "bg-slate-500/15 text-slate-300 border-slate-500/40",
};

export default function Predicciones2026Page() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Predicciones 2026", url: "/predicciones-vuelos-2026" },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Predicciones 2026</span>
      </nav>

      <header className="mb-10 text-center">
        <div className="text-5xl">🔮</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Predicciones vuelos 2026
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {PREDICTIONS.length} hipótesis del equipo TripCazador sobre el año de
          la aviación. Confidence labels para que sepas lo que es educated guess
          vs especulación.
        </p>
      </header>

      <section className="space-y-4">
        {PREDICTIONS.map((p, i) => (
          <article
            key={i}
            className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-3 text-lg font-bold text-white">
                <span className="text-2xl">{p.emoji}</span>
                <span>{p.title}</span>
              </h2>
              <span
                className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${CONFIDENCE_BADGE[p.confidence]}`}
              >
                Conf. {p.confidence}
              </span>
            </div>
            <p className="text-sm text-slate-300">{p.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-xl font-bold text-white">📝 Metodología</h2>
        <p className="mt-2 text-sm text-slate-300">
          Estas predicciones combinan: tendencias observadas por nuestro motor
          en 24 meses, conversaciones con stakeholders en el sector aviación,
          análisis de presentaciones públicas (Iberia, Lufthansa, Ryanair) y
          benchmarks intra-Europa.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Confidence Alta = &gt;70% probabilidad subjective. Media = 50-70%.
          Baja = &lt;50%. Esto es opinión analítica, no asesoramiento financiero.
        </p>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link href="/anuario-2026" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📊</div>
          <div className="mt-1 text-sm font-bold text-white">Anuario 2026</div>
          <div className="text-xs text-slate-400">El año en cifras</div>
        </Link>
        <Link href="/transparencia" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📈</div>
          <div className="mt-1 text-sm font-bold text-white">Transparencia</div>
          <div className="text-xs text-slate-400">Cifras live</div>
        </Link>
        <Link href="/prensa" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📰</div>
          <div className="mt-1 text-sm font-bold text-white">Prensa</div>
          <div className="text-xs text-slate-400">Kit para medios</div>
        </Link>
      </section>

      <footer className="mt-8 text-center text-xs text-slate-500">
        Para entrevistar sobre estas predicciones:{" "}
        <a href="mailto:prensa@tripcazador.com" className="text-amber-400 hover:underline">
          prensa@tripcazador.com
        </a>
      </footer>
    </main>
  );
}
