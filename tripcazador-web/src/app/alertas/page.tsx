import type { Metadata } from "next";
import Link from "next/link";
import { AlertsForm } from "@/components/AlertsForm";

// SSS152: /alertas público — formulario funcional sin login que crea
// alertas vía POST /api/price-alerts. AlertsForm es Client Component;
// el resto de la página queda como Server Component (anti-SSS143).

export const metadata: Metadata = {
  title: "Alertas de precio — TripCazador",
  description:
    "Te avisamos cuando un vuelo baje a tu precio objetivo. Sin login, sin spam, gratis. Configura una alerta en 30 segundos.",
  alternates: { canonical: "/alertas" },
  openGraph: {
    title: "Alertas de precio — TripCazador",
    description: "Te avisamos cuando un vuelo baje a tu precio objetivo.",
    type: "website",
  },
};

export const revalidate = 86400;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "¿Cuánto cuesta?",
    a: "Las alertas son 100% gratuitas. No hay versión premium, no hay límite (hasta 10 alertas por hora desde la misma IP, pero más que suficiente para uso normal).",
  },
  {
    q: "¿Cuánto tarda en avisarme?",
    a: "Comprobamos precios cada hora. Cuando hay un match, recibes el email en menos de 5 minutos.",
  },
  {
    q: "¿Mi email lo veré spameado?",
    a: "No. Solo te escribimos cuando hay un match real. Si quieres recibir también el resumen semanal, suscríbete a la newsletter aparte.",
  },
  {
    q: "¿Puedo cancelar la alerta?",
    a: "Sí — cada email incluye un enlace 'desactivar esta alerta'. Un clic y fuera.",
  },
];

export default function AlertasPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: SITE,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Alertas de precio",
        item: `${SITE}/alertas`,
      },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto py-12 px-4 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-amber-600 font-bold">
          🔔 Radar personal
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Alertas de precio
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed">
          Te avisamos cuando un vuelo baje a tu precio objetivo.{" "}
          <strong>Sin login, sin spam, gratis.</strong>
        </p>
      </header>

      <section
        aria-label="Crear alerta de precio"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <AlertsForm />
      </section>

      <section
        aria-label="Cómo funciona"
        className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-4"
      >
        <h2 className="text-xl font-semibold text-slate-900">¿Cómo funciona?</h2>
        <ol className="grid sm:grid-cols-3 gap-4 text-sm">
          <li className="space-y-1">
            <div className="text-2xl">①</div>
            <p className="font-semibold text-slate-900">Defines ruta y precio</p>
            <p className="text-slate-600">
              Origen, destino y tu precio objetivo en euros.
            </p>
          </li>
          <li className="space-y-1">
            <div className="text-2xl">②</div>
            <p className="font-semibold text-slate-900">Te avisamos</p>
            <p className="text-slate-600">
              Cuando hay un match, llega un email con el link a la reserva.
            </p>
          </li>
          <li className="space-y-1">
            <div className="text-2xl">③</div>
            <p className="font-semibold text-slate-900">Reservas tú mismo</p>
            <p className="text-slate-600">
              Vas directo a la web de la aerolínea o agencia. Sin intermediarios.
            </p>
          </li>
        </ol>
      </section>

      <section aria-label="FAQ" className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-slate-200 bg-white p-4"
            >
              <summary className="cursor-pointer font-semibold text-slate-900 list-none flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav aria-label="Más herramientas" className="grid sm:grid-cols-2 gap-3 text-sm">
        <Link
          href="/deals"
          className="block rounded-xl border border-amber-300/40 bg-amber-50 hover:bg-amber-100 transition p-4"
        >
          <div className="font-semibold text-amber-900">Ver chollos actuales →</div>
          <div className="text-amber-800 text-xs mt-1">
            Empezamos por ahí si aún no tienes una ruta concreta en mente.
          </div>
        </Link>
        <Link
          href="/favoritos"
          className="block rounded-xl border border-sky-300/40 bg-sky-50 hover:bg-sky-100 transition p-4"
        >
          <div className="font-semibold text-sky-900">Mis favoritos guardados →</div>
          <div className="text-sky-800 text-xs mt-1">
            Rutas guardadas en el dispositivo (sin cuenta).
          </div>
        </Link>
      </nav>

      <p className="text-xs text-slate-500 text-center">
        Las alertas son completamente gratuitas. Sin spam, solo emails con
        chollos reales que cumplan tus criterios.
      </p>
    </main>
  );
}
