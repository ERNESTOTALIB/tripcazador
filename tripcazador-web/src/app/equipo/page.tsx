/**
 * /equipo — SSS470 (24 may 2026)
 *
 * About page humanizando brand. Equipo TripCazador.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Equipo TripCazador: quiénes cazamos los chollos",
  description:
    "Detrás de TripCazador: equipo lean (founder + ingeniería + content) que opera el motor de detección 24/7 y mantiene 6.000+ landings SEO.",
  alternates: { canonical: `${SITE_URL}/equipo` },
  openGraph: {
    title: "Equipo TripCazador",
    description: "Quiénes somos.",
    url: `${SITE_URL}/equipo`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function EquipoPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Equipo", url: "/equipo" },
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
        <span className="text-slate-200">Equipo</span>
      </nav>

      <header className="mb-10 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          El equipo TripCazador
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Operamos un motor automático que detecta chollos de vuelo desde Europa
          y mantenemos 6.000+ landings editoriales. Equipo lean, foco maniático
          en producto.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-white">Qué hacemos cada día</h2>
        <ul className="space-y-3 text-slate-300">
          <li className="flex items-start gap-3">
            <span className="mt-1 text-amber-400">→</span>
            <span>
              <strong className="text-white">Motor de detección 24/7</strong>: scrapeo en
              tiempo real de tarifas, error fares, ofertas flash de aerolíneas españolas
              y europeas. Algoritmo de scoring v3 con feedback automático.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-amber-400">→</span>
            <span>
              <strong className="text-white">Contenido editorial</strong>: blog en
              español sobre estrategias de chollos, guías por destino, comparativas
              de aerolíneas. Sin contenido generado por IA sin revisión humana.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-amber-400">→</span>
            <span>
              <strong className="text-white">Concierge personalizado</strong>: 4
              tiers (€9-99) donde un humano busca tu vuelo+hotel con garantía
              de mejor precio.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-amber-400">→</span>
            <span>
              <strong className="text-white">Build in public</strong>: cada cambio en{" "}
              <Link href="/changelog" className="text-amber-400 hover:underline">
                /changelog
              </Link>
              , métricas en{" "}
              <Link href="/transparencia" className="text-amber-400 hover:underline">
                /transparencia
              </Link>
              .
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-10 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Estructura del equipo</h2>
        <div className="space-y-4 text-sm text-slate-300">
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
            <h3 className="font-bold text-white">Ernesto — Founder</h3>
            <p className="mt-1 text-xs text-slate-400">Producto, ingeniería, content lead</p>
            <p className="mt-2 text-sm">
              Madrid. Ex-software engineer, viajero compulsivo desde 2010 (40+
              países). Cansado de pagar precios sin sentido por vuelos →
              construye TripCazador como tool que él mismo usaría.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
            <h3 className="font-bold text-white">Equipo automatizado (motor)</h3>
            <p className="mt-1 text-xs text-slate-400">Servidores Hetzner Frankfurt</p>
            <p className="mt-2 text-sm">
              FastAPI workers monitorizando 25 aerolíneas + 168 ciudades hotel
              en paralelo. Scoring v3.1 con feedback loop diario. Stripe LIVE,
              Vercel Edge, Sentry, Resend.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-white">¿Cómo nos pagamos?</h2>
        <p className="text-sm text-slate-300">
          Tres canales transparentes — ver detalle en{" "}
          <Link href="/transparencia" className="text-amber-400 hover:underline">
            /transparencia
          </Link>
          .
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>1. Suscripciones Premium (€9,99/mes o €99/año)</li>
          <li>2. Servicio Concierge (€9-99 por búsqueda)</li>
          <li>3. Comisiones afiliados (Booking, Heymondo, Holafly, Parclick, Wise — siempre marcados <code className="rounded bg-slate-900 px-1 text-xs">rel=&quot;sponsored&quot;</code>)</li>
        </ul>
      </section>

      <section className="mb-10 grid gap-3 sm:grid-cols-2">
        <Link href="/changelog" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📜</div>
          <div className="mt-1 text-sm font-bold text-white">Changelog</div>
          <div className="text-xs text-slate-400">Build in public</div>
        </Link>
        <Link href="/transparencia" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📊</div>
          <div className="mt-1 text-sm font-bold text-white">Transparencia</div>
          <div className="text-xs text-slate-400">Cifras públicas</div>
        </Link>
      </section>

      <footer className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-center text-sm text-slate-300">
        <h3 className="text-base font-bold text-white">¿Quieres unirte?</h3>
        <p className="mt-2">
          Cuando contratamos lo hacemos público en Twitter/LinkedIn. Por ahora
          colaboramos con creators (8% comm) y partners agencia (rev share 70/30).
        </p>
        <div className="mt-3 flex justify-center gap-3">
          <Link href="/creators" className="text-sm text-amber-400 hover:underline">
            /creators
          </Link>
          <span className="text-slate-500">·</span>
          <Link href="/partners/agencia" className="text-sm text-amber-400 hover:underline">
            /partners/agencia
          </Link>
        </div>
      </footer>
    </main>
  );
}
