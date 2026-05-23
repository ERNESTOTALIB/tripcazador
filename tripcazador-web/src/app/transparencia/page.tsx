/**
 * /transparencia — SSS435 (23 may 2026)
 *
 * Página pública con métricas verificables del proyecto. Trust signal
 * para usuarios, periodistas y partners.
 *
 * Datos:
 * - Verticales SEO contadas en runtime de los catálogos (source of truth)
 * - Stack tecnológico
 * - Política de afiliados
 * - Compromisos públicos
 *
 * Renderiza estático (force-static) para no hammer cualquier backend.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ESCAPADAS_CATALOG } from "@/lib/escapadas_catalog";
import { AIRPORTS_ES } from "@/lib/airports_es_catalog";
import { CHECK_IN_RULES } from "@/lib/check_in_rules";
import { DESTINOS_CATALOG } from "@/lib/destinos_catalog";
import { GLOSARIO_CATALOG } from "@/lib/glosario_landings";
import { VUELO_TREN_CATALOG } from "@/lib/vuelo_tren_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Transparencia y métricas | TripCazador",
  description:
    "Cifras públicas sobre TripCazador: verticales SEO cubiertas, partners afiliados, compromisos editoriales y stack tecnológico.",
  alternates: { canonical: `${SITE_URL}/transparencia` },
  openGraph: {
    title: "Transparencia TripCazador",
    description: "Cifras públicas + compromisos editoriales.",
    url: `${SITE_URL}/transparencia`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function TransparenciaPage() {
  const totalSeoVerticals = [
    { name: "Destinos", count: DESTINOS_CATALOG.length, href: "/destinos" },
    { name: "Escapadas fin de semana", count: ESCAPADAS_CATALOG.length, href: "/escapadas" },
    { name: "Aeropuertos ES", count: AIRPORTS_ES.length, href: "/aeropuertos" },
    { name: "Check-in por aerolínea", count: CHECK_IN_RULES.length, href: "/check-in" },
    { name: "Glosario guías ampliadas", count: GLOSARIO_CATALOG.length, href: "/glosario" },
    { name: "Tren vs Avión comparadores", count: VUELO_TREN_CATALOG.length, href: "/vuelos-vs-tren" },
  ];

  const totalLandings = totalSeoVerticals.reduce((s, v) => s + v.count, 0);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <div className="text-5xl">📊</div>
        <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
          Transparencia
        </h1>
        <p className="mt-3 text-slate-300">
          Cifras públicas de lo que hacemos, cómo monetizamos, y qué prometemos.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">Contenido editorial</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
          <p className="text-sm text-slate-300">
            TripCazador mantiene <strong className="text-white">{totalLandings} guías editoriales</strong> repartidas
            en {totalSeoVerticals.length} verticales:
          </p>
          <ul className="mt-3 space-y-2">
            {totalSeoVerticals.map((v) => (
              <li key={v.name} className="flex items-center justify-between gap-3 text-sm">
                <Link href={v.href} className="text-slate-200 hover:text-amber-400">
                  {v.name}
                </Link>
                <span className="font-mono font-bold text-amber-300">{v.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Estos números se calculan en runtime desde los catálogos source-of-truth — no son una promesa de marketing.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">Modelo de monetización</h2>
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
            <h3 className="font-bold text-white">1. Suscripción Premium</h3>
            <p className="mt-1 text-sm text-slate-300">
              €9,99/mes o €99/año. Da alertas en tiempo real de tus rutas favoritas,
              filtros pro, secret deals 24h, watchlist. Prueba 7 días gratis.{" "}
              <Link href="/premium" className="text-amber-400 hover:underline">Ver</Link>
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
            <h3 className="font-bold text-white">2. Servicio Concierge</h3>
            <p className="mt-1 text-sm text-slate-300">
              €9-99 según tier. Te buscamos 5 opciones de vuelo+hotel personalizadas en 24-120h.{" "}
              <Link href="/concierge" className="text-amber-400 hover:underline">Ver</Link>
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
            <h3 className="font-bold text-white">3. Comisiones de afiliación</h3>
            <p className="mt-1 text-sm text-slate-300">
              Cuando reservas un vuelo, hotel, seguro, eSIM o parking siguiendo nuestros links,
              recibimos una comisión del proveedor (sin coste adicional para ti). Marcamos los
              enlaces con <code className="rounded bg-slate-900 px-1 text-xs">rel=&quot;sponsored&quot;</code>.
              <Link href="/legal#afiliacion" className="ml-1 text-amber-400 hover:underline">Más detalle legal</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">Compromisos editoriales</h2>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <span className="mt-1 text-emerald-400">✓</span>
            <span>
              <strong className="text-white">Ordenamos resultados por valor real al usuario</strong>,
              no por la comisión que pagamos. Los precios mostrados son los detectados por el motor, no
              negociados con la aerolínea.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-emerald-400">✓</span>
            <span>
              <strong className="text-white">No vendemos tu email</strong>. Tus datos solo se usan para
              enviarte chollos según tus preferencias. Baja en un clic en cualquier email o en{" "}
              <Link href="/newsletter/unsubscribe" className="text-amber-400 hover:underline">/newsletter/unsubscribe</Link>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-emerald-400">✓</span>
            <span>
              <strong className="text-white">Los precios cambian rápido</strong>. Mostramos timestamps
              de cuándo detectamos cada chollo. La aerolínea es la fuente de verdad — siempre confirma
              antes de reservar.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-emerald-400">✓</span>
            <span>
              <strong className="text-white">Si encuentras precio mejor en otro sitio</strong> tras
              comprar el servicio Concierge (€19+), te devolvemos el importe. Ver garantía en{" "}
              <Link href="/concierge" className="text-amber-400 hover:underline">/concierge</Link>.
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">Stack tecnológico</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-sm text-slate-300">
          <p>
            <strong className="text-white">Frontend</strong>: Next.js 14 (App Router) en Vercel.
            <br />
            <strong className="text-white">Backend motor detección</strong>: FastAPI en VPS Hetzner
            (Frankfurt).
            <br />
            <strong className="text-white">Cache + storage</strong>: Upstash KV (eventos, scoring,
            outcomes).
            <br />
            <strong className="text-white">Pagos</strong>: Stripe LIVE.
            <br />
            <strong className="text-white">Errores</strong>: Sentry.
            <br />
            <strong className="text-white">Email</strong>: Resend.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">Contacto</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>
            📧 <a href="mailto:hola@tripcazador.com" className="text-amber-400 hover:underline">hola@tripcazador.com</a>{" "}
            — consultas generales
          </li>
          <li>
            📰 <a href="mailto:prensa@tripcazador.com" className="text-amber-400 hover:underline">prensa@tripcazador.com</a>{" "}
            — medios y prensa (kit en{" "}
            <Link href="/prensa" className="text-amber-400 hover:underline">/prensa</Link>)
          </li>
          <li>
            🤝 <a href="mailto:partners@tripcazador.com" className="text-amber-400 hover:underline">partners@tripcazador.com</a>{" "}
            — partnerships y agencias (info en{" "}
            <Link href="/partners/agencia" className="text-amber-400 hover:underline">/partners/agencia</Link>)
          </li>
        </ul>
      </section>

      <footer className="mt-10 border-t border-slate-800 pt-4 text-center text-xs text-slate-500">
        Última revisión {new Date().toISOString().slice(0, 10)} ·{" "}
        <Link href="/legal" className="hover:text-amber-400">Legal</Link> ·{" "}
        <Link href="/privacy" className="hover:text-amber-400">Privacidad</Link>
      </footer>
    </main>
  );
}
