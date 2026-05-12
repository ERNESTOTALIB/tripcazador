/**
 * /seguro-viaje — Landing SEO + afiliado Heymondo (SSS152, may 2026)
 *
 * Creada porque 14+ páginas (visados, cuando-viajar/*, 11 blog posts) linkean
 * a /seguro-viaje y la ruta no existía (test_all_static_hrefs_resolve falla).
 *
 * Doble función:
 *   1. Fix tests (href válido)
 *   2. Landing SEO para keyword "seguro de viaje 2026 España" + monetiza
 *      via Heymondo afiliado ($25-60 comisión por venta).
 *
 * Server Component puro (anti-SSS143 regression).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { PARTNERS } from "@/lib/travel_partners";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Seguro de viaje 2026: comparativa Heymondo, IATI, Mondo — TripCazador",
  description:
    "Guía completa del mejor seguro de viaje 2026 para España. Comparativa Heymondo vs IATI vs Mondo + cobertura recomendada por destino. Descuento 5% Heymondo.",
  alternates: { canonical: "/seguro-viaje" },
  openGraph: {
    title: "Seguro de viaje 2026: comparativa + descuento",
    description:
      "El seguro de viaje correcto te ahorra €30.000+ en una urgencia médica en EE.UU. o Asia. Comparativa real Heymondo vs IATI vs Mondo.",
    type: "article",
  },
};

export const revalidate = 86400; // 24h

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export default function SeguroViajePage() {
  const heymondo = PARTNERS.find((p) => p.slug === "heymondo");
  const heymondoUrl = heymondo?.affiliateUrl() || "https://heymondo.com/";

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Seguro de viaje", item: `${SITE}/seguro-viaje` },
    ],
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Seguro de viaje 2026: comparativa Heymondo, IATI, Mondo",
    description:
      "Guía completa del mejor seguro de viaje 2026 para España. Comparativa Heymondo vs IATI vs Mondo.",
    datePublished: "2026-05-12",
    dateModified: "2026-05-12",
    author: { "@type": "Organization", name: "TripCazador" },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Seguro de viaje</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          🛡️ Seguro de viaje 2026 — comparativa real
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Un buen seguro de viaje cuesta <strong>1-3€/día</strong> y te puede ahorrar
          decenas de miles de euros en una urgencia médica en EE.UU., Asia o África.
          Esta es la comparativa honesta de las 3 opciones que merecen la pena en 2026.
        </p>
      </header>

      <section className="mb-10 rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-bold text-amber-900">⚡ Recomendación rápida</h2>
        <p className="mt-3 text-slate-700">
          Para la mayoría de viajeros desde España: <strong>Heymondo</strong> es nuestra
          recomendación. Buena cobertura, español 24h, app fácil, y con el descuento
          activado sale alrededor de 1.5-2€/día para destinos estándar.
        </p>
        <p className="mt-4">
          <a
            href={heymondoUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-white shadow hover:bg-amber-600"
          >
            Cotizar Heymondo con 5% descuento →
          </a>
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Enlace de afiliado. Si contratas a través de él, TripCazador recibe una pequeña
          comisión sin coste extra para ti — es lo que mantiene este radar de chollos
          gratis.
        </p>
      </section>

      <section className="prose prose-slate mb-10 max-w-none">
        <h2>¿Cuándo merece la pena contratar un seguro?</h2>
        <p>
          Siempre que viajes fuera de la UE/EEE/UK, donde tu tarjeta sanitaria europea
          (TSE) no aplica. En particular:
        </p>
        <ul>
          <li>
            <strong>EE.UU., Canadá:</strong> imprescindible. Una noche en urgencias
            básica cuesta 5.000-15.000$. Un parto prematuro, 100.000$+.
          </li>
          <li>
            <strong>Sudeste asiático, India, Indonesia:</strong> el coste sanitario es
            bajo, pero la calidad varía. Necesitas asistencia para evacuar a un buen
            hospital o repatriar.
          </li>
          <li>
            <strong>África subsahariana:</strong> infraestructura sanitaria limitada
            fuera de capitales. Repatriación es casi obligatoria.
          </li>
          <li>
            <strong>América latina:</strong> recomendable. Cobertura de cancelación
            por motivos justificados también vale, especialmente en temporada
            huracanes (Caribe jun-nov).
          </li>
          <li>
            <strong>UE / Schengen:</strong> TSE cubre lo urgente. Pero seguro con
            cancelación + equipaje + responsabilidad civil aporta mucho por poco
            dinero.
          </li>
        </ul>

        <h2>Comparativa Heymondo vs IATI vs Mondo (mayo 2026)</h2>
        <table>
          <thead>
            <tr>
              <th>Característica</th>
              <th>Heymondo</th>
              <th>IATI</th>
              <th>Mondo</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Asistencia médica</td><td>250k-500k€</td><td>500k€</td><td>200k€</td></tr>
            <tr><td>Cancelación</td><td>2.500-5.000€</td><td>3.000€</td><td>2.500€</td></tr>
            <tr><td>Equipaje</td><td>1.200-2.000€</td><td>1.500€</td><td>1.000€</td></tr>
            <tr><td>App móvil</td><td>Sí, español</td><td>Sí</td><td>Sí, inglés</td></tr>
            <tr><td>Cobertura COVID</td><td>✅ Incluida</td><td>✅ Incluida</td><td>✅ Incluida</td></tr>
            <tr><td>Precio típico EU 7d</td><td>~12€</td><td>~14€</td><td>~10€</td></tr>
            <tr><td>Precio típico USA 14d</td><td>~45€</td><td>~50€</td><td>~38€</td></tr>
            <tr><td>Descuento TripCazador</td><td><strong>5%</strong></td><td>—</td><td>—</td></tr>
          </tbody>
        </table>

        <h2>Cuándo elegir uno u otro</h2>
        <ul>
          <li>
            <strong>Heymondo:</strong> mejor balance precio/calidad/UX. Soporte
            español 24/7. App muy fácil para abrir parte.
          </li>
          <li>
            <strong>IATI:</strong> coberturas más altas en caso médico extremo. Si
            vas a USA o Canadá durante 2+ semanas, su pólizas Estándar/Mochilero merecen
            mirarse.
          </li>
          <li>
            <strong>Mondo:</strong> los más baratos, suficiente para viajes cortos
            dentro de EU. Peor servicio post-venta según reviews.
          </li>
        </ul>

        <h2>Qué cobertura mínima necesitas</h2>
        <ol>
          <li><strong>Asistencia médica:</strong> mín. 200.000€ para EU, 500.000€ para USA/Asia.</li>
          <li><strong>Repatriación:</strong> siempre incluida en las 3 opciones.</li>
          <li><strong>Equipaje:</strong> al menos 1.000€ (Ryanair tarda mucho en compensar maletas perdidas).</li>
          <li><strong>Cancelación:</strong> el coste de tu viaje, en caso de imprevisto justificado.</li>
          <li><strong>Responsabilidad civil:</strong> 30.000€+ (si rompes algo o causas daños).</li>
          <li><strong>Deportes/aventura:</strong> SOLO si planeas senderismo &gt;3.000m, buceo, surf, esquí (suplemento aparte).</li>
        </ol>

        <h2>Errores comunes que pagan los novatos</h2>
        <ul>
          <li>
            Contratar el seguro <em>incluido</em> en la tarjeta de crédito sin leer la
            póliza — las coberturas son a menudo &lt;30.000€ y dejan fuera enfermedades
            previas.
          </li>
          <li>
            No declarar enfermedad previa (asma, diabetes, hipertensión) — luego la
            aseguradora rechaza el siniestro.
          </li>
          <li>
            Asumir que la tarjeta sanitaria europea cubre EE.UU. — no la cubre. UK
            tampoco desde Brexit.
          </li>
          <li>
            Comprar la póliza el día de salir — algunas coberturas (cancelación) se
            activan solo si contratas &gt;48h antes.
          </li>
        </ul>

        <h2>Preguntas frecuentes</h2>

        <h3>¿Puedo contratar el seguro después de salir de viaje?</h3>
        <p>
          Sí, Heymondo y IATI lo permiten, pero algunas coberturas (cancelación, ciertas
          asistencias) no se activan hasta 24-48h después de la contratación.
        </p>

        <h3>¿Cubre el seguro un vuelo cancelado por error fare?</h3>
        <p>
          No el vuelo en sí (eso lo gestionas con la aerolínea por reglamento UE/261), pero
          sí los gastos de noche extra, comida, etc. si te quedas tirado.
        </p>

        <h3>¿Existe seguro anual multiviaje?</h3>
        <p>
          Sí. Si haces 3+ viajes al año, suele compensar. Heymondo lo ofrece desde
          ~120€/año con cobertura para viajes hasta 30 días cada uno.
        </p>

        <h3>¿Y si compro el vuelo con tarjeta premium (Amex Platinum, etc.)?</h3>
        <p>
          Las tarjetas premium incluyen seguro decente pero con muchas exclusiones.
          Lee la póliza completa. En la mayoría de casos sigue mereciendo la pena un
          seguro complementario para destinos riesgo alto.
        </p>
      </section>

      <section className="mb-10 rounded-xl border bg-slate-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">Sigue explorando</h2>
        <ul className="mt-4 space-y-2 text-amber-700">
          <li>
            <Link className="underline hover:text-amber-900" href="/como-viajar/heymondo">
              Guía completa Heymondo (cómo usarlo, paso a paso)
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/visados">
              Visados por país (requisitos 2026)
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/cuando-viajar">
              Cuándo viajar a cada destino — mes a mes
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/deals">
              Chollos de vuelo activos hoy
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-amber-900" href="/calculadora">
              Calculadoras de viaje (CO₂, millas, cancelación, upgrade…)
            </Link>
          </li>
        </ul>
      </section>

      <footer className="mt-12 border-t pt-6 text-xs text-slate-500">
        Aviso: TripCazador recibe una comisión si contratas Heymondo a través de los
        enlaces de esta página. La recomendación es honesta y basada en uso real —
        nunca recomendamos un partner solo por comisión. Ver{" "}
        <Link href="/legal" className="underline">aviso legal completo</Link>.
      </footer>
    </main>
  );
}
