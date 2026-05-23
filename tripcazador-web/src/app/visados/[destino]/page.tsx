/**
 * /visados/[destino] — SSS418 (May 2026)
 *
 * Programmatic SEO landings: "visado japón", "visa estados unidos", etc.
 * 31 destinos pre-renderizados con info de visado para ciudadanos españoles
 * + cross-links a seguro + esim (revenue indirecto).
 *
 * No tiene afiliado directo pero captura tráfico high-intent y deriva
 * a verticales monetizadas.
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

export async function generateStaticParams() {
  return DESTINOS_CATALOG.map((d) => ({ destino: d.slug }));
}

interface PageProps {
  params: { destino: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const d = getDestino(params.destino);
  if (!d) return { title: "Destino no encontrado — TripCazador" };

  const title = `Visado ${d.name} desde España 2026: requisitos`;
  const description = `Requisitos de visado para ${d.name} con pasaporte español. ${visaCopy(d).short}`;
  const canonical = `/visados/${d.slug}`;

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
          url: `/api/og?title=${encodeURIComponent(`Visado ${d.name}`)}&subtitle=${encodeURIComponent("Requisitos desde España")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function visaCopy(d: DestinoCatalog): {
  label: string;
  badgeColor: string;
  short: string;
  detail: string;
  duration: string;
  cost: string;
  process: string;
} {
  switch (d.visa) {
    case "schengen":
      return {
        label: "Sin visado — Schengen",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        short: `${d.name} forma parte del espacio Schengen — no requiere visado.`,
        detail: `Como ciudadano español, puedes viajar a ${d.name} con tu DNI (mejor pasaporte si el viaje es largo) sin trámites. ${d.name} es parte del espacio Schengen, así que el cruce de fronteras es directo sin sello.`,
        duration: "Sin límite específico para ciudadanos UE",
        cost: "Gratis — sin trámites",
        process: "Llega con DNI o pasaporte válido. No requiere visa, sello ni autorización previa.",
      };
    case "no-required":
      return {
        label: "Sin visado",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        short: d.visaNote || `${d.name} no requiere visado para ciudadanos españoles.`,
        detail: `Como ciudadano español, no necesitas tramitar visado previo para ${d.name}. ${d.visaNote || ""} Verifica siempre los requisitos actuales en la web del consulado antes de viajar.`,
        duration: d.visaNote || "Consulta requisitos actuales en consulado.",
        cost: "Gratis — sin trámites previos",
        process: "Pasaporte español válido para 6 meses tras la fecha de regreso. Sello a la entrada.",
      };
    case "evisa":
      return {
        label: "e-Visa online",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        short: d.visaNote || `${d.name} requiere autorización electrónica previa online.`,
        detail: `${d.name} requiere una autorización electrónica (e-Visa, ETA, ESTA o equivalente) que se tramita online antes de volar. ${d.visaNote || ""}`,
        duration: "Variable según e-Visa — típicamente 30-90 días por entrada",
        cost: d.visaNote?.includes("USD") ? d.visaNote.match(/[\d]+\s*USD/i)?.[0] || "Consulta tarifa oficial" : "Consulta tarifa oficial",
        process: "Tramita online en la web oficial del país (cuidado con webs intermediarias que cobran extra). Aprobación típica en 24-72h.",
      };
    case "on-arrival":
      return {
        label: "Visa on arrival",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        short: d.visaNote || `${d.name} emite visa a la llegada al aeropuerto.`,
        detail: `${d.name} no requiere tramitar visado previo, se emite directamente al llegar al aeropuerto. ${d.visaNote || ""}`,
        duration: d.visaNote || "Típicamente 30 días renovables",
        cost: d.visaNote?.match(/[\d]+\s*USD/i)?.[0] || "Consulta tarifa oficial",
        process: "Sigue el flujo de Visa on Arrival al desembarcar. Lleva foto de carnet, pasaporte válido y efectivo en USD para la tarifa.",
      };
    case "embassy":
      return {
        label: "Visado obligatorio",
        badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
        short: `${d.name} requiere tramitar visado previo en consulado o embajada.`,
        detail: `Para viajar a ${d.name} con pasaporte español necesitas tramitar el visado antes de viajar, presencialmente o por gestoría acreditada. ${d.visaNote || ""}`,
        duration: "Variable según categoría de visa",
        cost: "Consulta tasa oficial en consulado",
        process: "Tramita en consulado de país de origen con antelación 3-6 semanas. Documentación típica: pasaporte + foto + reservas vuelo/hotel + seguro viaje + extracto bancario.",
      };
  }
}

export default function VisadoDestinoPage({ params }: PageProps) {
  const d = getDestino(params.destino);
  if (!d) notFound();

  const copy = visaCopy(d);

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TripCazador", item: "https://tripcazador.com" },
      { "@type": "ListItem", position: 2, name: "Visados", item: "https://tripcazador.com/visados" },
      { "@type": "ListItem", position: 3, name: `Visado ${d.name}`, item: `https://tripcazador.com/visados/${d.slug}` },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={breadcrumbsLd} />

      <nav aria-label="Migas" className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/visados" className="hover:text-amber-400">Visados</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{d.name}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-5xl" aria-hidden>🛂{d.emoji}</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${copy.badgeColor}`}>
            {copy.label}
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          Visado {d.name} desde España
        </h1>
        <p className="text-lg text-slate-300">{copy.detail}</p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Duración</div>
          <div className="mt-1 text-sm text-white">{copy.duration}</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Coste</div>
          <div className="mt-1 text-sm text-white">{copy.cost}</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Categoría</div>
          <div className="mt-1 text-sm text-white">{copy.label}</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">Proceso paso a paso</h2>
        <p className="text-slate-300">{copy.process}</p>
      </section>

      <section className="mb-8 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">
          Antes de viajar: 2 cosas que sí necesitas
        </h2>
        <p className="mb-4 text-slate-300">
          Aunque {copy.label.toLowerCase()}, asegura el viaje con:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/seguro-viaje/${d.slug}`}
            className="rounded-lg border border-amber-500/40 bg-slate-900/50 p-4 transition-colors hover:border-amber-500"
          >
            <div className="mb-1 text-sm font-bold text-amber-400">🏥 Seguro viaje {d.name}</div>
            <div className="text-sm text-slate-400">
              {d.insuranceImportance === "critical"
                ? `CRÍTICO. Sanidad cara, ingreso puede superar €30k sin cobertura.`
                : d.insuranceImportance === "high"
                  ? `Muy recomendable. Cobertura médica + cancelación + equipaje.`
                  : `Recomendable como complemento a TSI.`}
            </div>
          </Link>
          {d.esim !== "optional" && (
            <Link
              href={`/esim/${d.slug}`}
              className="rounded-lg border border-amber-500/40 bg-slate-900/50 p-4 transition-colors hover:border-amber-500"
            >
              <div className="mb-1 text-sm font-bold text-amber-400">📱 eSIM {d.name}</div>
              <div className="text-sm text-slate-400">
                {d.esim === "essential"
                  ? "Imprescindible. Sin roaming gratis, eSIM ahorra €100+/semana."
                  : "Recomendado. Data sin roaming caro."}
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">Otros recursos {d.name}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/precio-vuelo/madrid/${d.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="mb-1 text-sm font-bold text-amber-400">✈️ Vuelos a {d.name}</div>
            <div className="text-sm text-slate-400">
              Histórico precios + alerta gratis.
            </div>
          </Link>
          <Link
            href={`/destinos/${d.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="mb-1 text-sm font-bold text-amber-400">🌍 Guía {d.name}</div>
            <div className="text-sm text-slate-400">
              Mejor época, clima, tips.
            </div>
          </Link>
        </div>
      </section>

      <div className="mt-12 text-center text-sm text-slate-500">
        Información orientativa actualizada en {new Date().getFullYear()}. Verifica
        siempre los requisitos actuales en la web oficial del consulado de {d.country} antes de viajar.
      </div>
    </main>
  );
}
