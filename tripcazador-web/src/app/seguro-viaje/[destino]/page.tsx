/**
 * /seguro-viaje/[destino] — SSS418 (May 2026)
 *
 * Programmatic SEO landings: "seguro viaje japón", "seguro viaje tailandia",
 * "seguro viaje EE.UU.", etc. 31 destinos pre-renderizados con cobertura
 * recomendada por destino + CTA Heymondo afiliado.
 *
 * Captura keywords long-tail con intent comercial muy alto. Cada landing
 * apunta a Heymondo (~$25-60 comisión por venta).
 *
 * Server Component puro (anti-SSS143 regression).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DESTINOS_CATALOG,
  getDestino,
  type DestinoCatalog,
} from "@/lib/destinos_catalog";
import { JsonLd } from "@/components/JsonLd";

const HEYMONDO_REF = process.env.NEXT_PUBLIC_HEYMONDO_REF || "tripcazador";

function heymondoUrl(slug: string) {
  return `https://www.heymondo.com/?ref=${HEYMONDO_REF}&utm_source=tripcazador&utm_medium=programmatic&utm_campaign=seguro_${slug}`;
}

export async function generateStaticParams() {
  return DESTINOS_CATALOG.map((d) => ({ destino: d.slug }));
}

interface PageProps {
  params: { destino: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const d = getDestino(params.destino);
  if (!d) return { title: "Destino no encontrado — TripCazador" };

  const title = `Seguro de viaje ${d.name} 2026: cobertura + descuento`;
  const description = importanceCopy(d).meta;
  const canonical = `/seguro-viaje/${d.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Seguro viaje ${d.name}`)}&subtitle=${encodeURIComponent("Cobertura recomendada + descuento Heymondo")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function importanceCopy(d: DestinoCatalog): {
  badge: string;
  badgeColor: string;
  meta: string;
  body: string;
  coverage: string[];
} {
  switch (d.insuranceImportance) {
    case "critical":
      return {
        badge: "CRÍTICO",
        badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
        meta: `Seguro de viaje a ${d.name}: cobertura €30.000+ médico esencial. Heymondo, IATI y Mondo comparados con descuento 5%.`,
        body: `Viajar a ${d.name} sin seguro de viaje es uno de los errores más caros que puedes cometer. La sanidad pública no aplica y un ingreso hospitalario puede superar fácilmente €30.000.`,
        coverage: [
          "Asistencia médica mínima €500.000 (€1M recomendado)",
          "Cobertura COVID-19 y enfermedades infecciosas",
          "Repatriación sanitaria y de restos mortales",
          "Anulación de viaje (causa cubierta) — recupera tu vuelo",
          "Robo, pérdida o retraso de equipaje",
          "Responsabilidad civil €60.000+",
          "Deportes de aventura si vas a hacer alguno",
        ],
      };
    case "high":
      return {
        badge: "RECOMENDADO",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        meta: `Seguro de viaje a ${d.name}: cobertura médica esencial + cancelación + equipaje. Heymondo con descuento 5%.`,
        body: `Para ${d.name}, el seguro de viaje es muy recomendable. Aunque hay opciones médicas, los costes pueden ser altos y el reembolso por convenios bilaterales suele ser parcial o difícil.`,
        coverage: [
          "Asistencia médica mínima €200.000",
          "Cobertura COVID-19 incluida",
          "Repatriación sanitaria",
          "Cancelación de viaje (causa cubierta)",
          "Robo, pérdida o retraso de equipaje",
          "Asistencia 24/7 en español",
        ],
      };
    case "medium":
      return {
        badge: "RECOMENDADO",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        meta: `Seguro de viaje a ${d.name}: cobertura complementaria a la TSI. Comparativa Heymondo / IATI con descuento.`,
        body: `${d.name} tiene cobertura sanitaria razonable, pero un seguro de viaje cubre lo que la TSI no: dental urgente, repatriación, anulación, equipaje y deportes de aventura.`,
        coverage: [
          "Asistencia médica complementaria a TSI/seguridad social",
          "Repatriación sanitaria",
          "Cancelación de viaje (causa cubierta)",
          "Robo, pérdida o retraso de equipaje",
          "Asistencia jurídica si la necesitas",
        ],
      };
    case "low":
      return {
        badge: "OPCIONAL",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        meta: `Seguro de viaje a ${d.name}: con TSI cubres lo médico esencial. Heymondo añade equipaje, cancelación y asistencia 24/7.`,
        body: `En ${d.name}, la Tarjeta Sanitaria Europea (TSI) ya cubre lo médico esencial gratis. Un seguro de viaje cubre lo que la TSI no: equipaje, cancelación, retrasos y asistencia 24/7 en español.`,
        coverage: [
          "TSI cubre asistencia médica básica gratis (gestiona la tuya antes de volar)",
          "Cancelación de viaje (causa cubierta)",
          "Robo, pérdida o retraso de equipaje",
          "Retraso de vuelo > 4-6h",
          "Asistencia 24/7 en español",
        ],
      };
  }
}

export default function SeguroViajeDestinoPage({ params }: PageProps) {
  const d = getDestino(params.destino);
  if (!d) notFound();

  const copy = importanceCopy(d);
  const url = heymondoUrl(d.slug);

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TripCazador", item: "https://tripcazador.com" },
      { "@type": "ListItem", position: 2, name: "Seguro de viaje", item: "https://tripcazador.com/seguro-viaje" },
      { "@type": "ListItem", position: 3, name: `Seguro viaje ${d.name}`, item: `https://tripcazador.com/seguro-viaje/${d.slug}` },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `¿Es obligatorio el seguro de viaje para ${d.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            d.insuranceImportance === "critical"
              ? `No es legalmente obligatorio, pero es muy recomendable. La sanidad en ${d.name} es muy cara y un ingreso hospitalario puede superar €30.000 sin cobertura.`
              : d.insuranceImportance === "low"
                ? `No, con la Tarjeta Sanitaria Europea (TSI) cubres lo médico esencial gratis. Un seguro de viaje cubre extras como cancelación, equipaje y asistencia 24/7 en español.`
                : `No es obligatorio pero muy recomendable. La sanidad puede tener costes elevados y el reembolso por convenios bilaterales suele ser parcial.`,
        },
      },
      {
        "@type": "Question",
        name: `¿Qué cobertura mínima de seguro necesito para ${d.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: copy.coverage.slice(0, 3).join(". ") + ".",
        },
      },
      {
        "@type": "Question",
        name: "¿Cuánto cuesta un seguro de viaje?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Para un viaje de 7-10 días, el precio típico está entre €15-40 por persona dependiendo de la cobertura. Con el descuento del 5% de Heymondo aplicado automáticamente desde este enlace.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={breadcrumbsLd} />
      <JsonLd data={faqLd} />

      <nav aria-label="Migas" className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/seguro-viaje" className="hover:text-amber-400">Seguro de viaje</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{d.name}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-5xl" aria-hidden>{d.emoji}</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${copy.badgeColor}`}>
            {copy.badge}
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          Seguro de viaje {d.name} 2026
        </h1>
        <p className="text-lg text-slate-300">{copy.body}</p>
      </header>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-400">
          Recomendación TripCazador
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Heymondo — descuento 5% TripCazador</h2>
        <p className="mb-4 text-slate-300">
          Heymondo es nuestra recomendación principal para {d.name}: cobertura COVID
          incluida, asistencia 24/7 en español, app móvil para consulta inmediata y
          el {d.insuranceImportance === "critical" ? "tope de cobertura médica más alto del mercado (hasta €5M)" : "mejor ratio cobertura / precio del mercado"}.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener nofollow sponsored"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Ver precio con 5% descuento →
        </a>
        <p className="mt-3 text-xs text-slate-500">
          Link afiliado: si contratas a través de este enlace, recibimos una pequeña
          comisión sin coste extra para ti. Esto financia el motor TripCazador.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Cobertura recomendada para {d.name}
        </h2>
        <ul className="space-y-2 text-slate-200">
          {copy.coverage.map((c) => (
            <li key={c} className="flex items-start gap-3">
              <span className="mt-1 text-amber-400" aria-hidden>✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">También para tu viaje a {d.name}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {d.esim !== "optional" && (
            <Link
              href={`/esim/${d.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-amber-500/50"
            >
              <div className="mb-1 text-sm font-bold text-amber-400">📱 eSIM {d.name}</div>
              <div className="text-sm text-slate-400">
                Data prepago sin roaming. {d.esim === "essential" ? "Imprescindible." : "Recomendado."}
              </div>
            </Link>
          )}
          <Link
            href={`/visados/${d.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="mb-1 text-sm font-bold text-amber-400">🛂 Visado {d.name}</div>
            <div className="text-sm text-slate-400">
              Requisitos para ciudadanos españoles.
            </div>
          </Link>
          <Link
            href={`/precio-vuelo/madrid/${d.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="mb-1 text-sm font-bold text-amber-400">✈️ Precio vuelo {d.name}</div>
            <div className="text-sm text-slate-400">
              Histórico de precios + alerta gratis.
            </div>
          </Link>
          <Link
            href={`/destinos/${d.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="mb-1 text-sm font-bold text-amber-400">🌍 Guía {d.name}</div>
            <div className="text-sm text-slate-400">
              Mejor época, clima, vuelos y tips.
            </div>
          </Link>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="mb-4 text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <details className="mb-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
          <summary className="cursor-pointer font-semibold text-white">
            ¿Es obligatorio el seguro de viaje para {d.name}?
          </summary>
          <p className="mt-3 text-slate-300">
            {d.insuranceImportance === "critical"
              ? `No es legalmente obligatorio, pero es muy recomendable. La sanidad en ${d.name} es muy cara y un ingreso hospitalario puede superar €30.000 sin cobertura.`
              : d.insuranceImportance === "low"
                ? `No. Con la Tarjeta Sanitaria Europea (TSI) tienes acceso gratis a sanidad pública. Un seguro complementa con extras como cancelación, equipaje y asistencia 24/7 en español.`
                : `No es obligatorio pero muy recomendable.`}
          </p>
        </details>
        <details className="mb-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
          <summary className="cursor-pointer font-semibold text-white">¿Cuánto cuesta un seguro para {d.name}?</summary>
          <p className="mt-3 text-slate-300">
            Para un viaje de 7-10 días el precio típico está entre €15-40 por persona,
            dependiendo de la cobertura y de tu edad. Con el descuento del 5% de
            Heymondo aplicado automáticamente desde este enlace.
          </p>
        </details>
        <details className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
          <summary className="cursor-pointer font-semibold text-white">¿Cubre el COVID-19?</summary>
          <p className="mt-3 text-slate-300">
            Sí. Heymondo, IATI y Mondo incluyen cobertura por COVID-19 dentro de
            la asistencia médica estándar desde 2022.
          </p>
        </details>
      </section>

      <div className="mt-12 text-center text-sm text-slate-500">
        Información orientativa actualizada en {new Date().getFullYear()}. Verifica
        siempre los términos del seguro en la web del proveedor antes de contratar.
      </div>
    </main>
  );
}
