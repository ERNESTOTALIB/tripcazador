import type { Metadata } from "next";
import Link from "next/link";

// SSS36: stub /alertas — antes estaba referenciado en precio-mes-a-mes
// pero la página no existía (broken href detectado por test linker).
export const metadata: Metadata = {
  title: "Alertas de precio — TripCazador",
  description:
    "Crea alertas de precio para cualquier ruta de vuelo. Te avisamos cuando baje al precio que quieras.",
  alternates: { canonical: "/alertas" },
};

export const revalidate = 86400;

export default function AlertasPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
        Alertas de precio
      </h1>

      <p className="text-lg text-slate-700 leading-relaxed">
        Configura una alerta para cualquier ruta y recibe un email en cuanto
        el precio baje del umbral que elijas. Cazamos error fares 24h/día y
        comparamos contra histórico de 90 días.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/deals"
          className="block rounded-2xl border border-amber-300/40 bg-amber-50 hover:bg-amber-100 transition p-5 shadow-sm"
        >
          <h2 className="font-semibold text-amber-900 mb-1">
            Ver chollos actuales
          </h2>
          <p className="text-sm text-amber-800">
            Explora los chollos de hoy y crea una alerta desde cualquiera.
          </p>
        </Link>

        <Link
          href="/favoritos"
          className="block rounded-2xl border border-sky-300/40 bg-sky-50 hover:bg-sky-100 transition p-5 shadow-sm"
        >
          <h2 className="font-semibold text-sky-900 mb-1">
            Mis favoritos & alertas
          </h2>
          <p className="text-sm text-sky-800">
            Gestiona tus alertas activas y rutas guardadas.
          </p>
        </Link>
      </div>

      <section className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">
          ¿Cómo funcionan?
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-slate-700">
          <li>Entra a un chollo o página de ruta (ej. Madrid → Bangkok).</li>
          <li>Pulsa &ldquo;Crear alerta&rdquo; y elige tu precio máximo.</li>
          <li>
            Confirma tu email — te enviaremos un mensaje al instante en cuanto
            detectemos un precio por debajo de tu umbral.
          </li>
          <li>
            Cancela cuando quieras desde el enlace de cada email (RGPD ok).
          </li>
        </ol>
      </section>

      <p className="text-sm text-slate-500">
        Las alertas son completamente gratuitas. Sin spam — solo emails con
        chollos reales que cumplan tus criterios.
      </p>
    </main>
  );
}
