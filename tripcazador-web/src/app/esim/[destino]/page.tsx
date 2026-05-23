/**
 * /esim/[destino] — SSS418 (May 2026)
 *
 * Programmatic SEO landings: "esim japón", "esim tailandia", "esim eeuu",
 * etc. 31 destinos pre-renderizados con recomendación de plan + CTA
 * Holafly afiliado.
 *
 * Captura keywords long-tail con intent comercial alto. Cada landing
 * apunta a Holafly (~$5-15 comisión por venta).
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

const HOLAFLY_REF = process.env.NEXT_PUBLIC_HOLAFLY_REF || "tripcazador";

function holaflyUrl(slug: string) {
  return `https://esim.holafly.com/?ref=${HOLAFLY_REF}&utm_source=tripcazador&utm_medium=programmatic&utm_campaign=esim_${slug}`;
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

  const title = `eSIM ${d.name} 2026: planes data sin roaming + descuento`;
  const description = esimCopy(d).meta;
  const canonical = `/esim/${d.slug}`;

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
          url: `/api/og?title=${encodeURIComponent(`eSIM ${d.name}`)}&subtitle=${encodeURIComponent("Data sin roaming + descuento Holafly")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function esimCopy(d: DestinoCatalog): {
  badge: string;
  badgeColor: string;
  meta: string;
  intro: string;
  features: string[];
  planSuggestion: string;
} {
  if (d.esim === "essential") {
    return {
      badge: "IMPRESCINDIBLE",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
      meta: `eSIM ${d.name}: planes data ilimitada Holafly desde 7 días. Sin roaming, activación en minutos.`,
      intro: `Viajar a ${d.name} sin eSIM es regalarle dinero a tu operador en roaming (€8-15/MB en muchos casos). La eSIM se activa con un QR antes de volar y tienes data desde que aterrizas.`,
      features: [
        "Data ilimitada (vs €8-15/MB en roaming)",
        "Activación con QR — 2 minutos antes del vuelo",
        "Sin cambiar la SIM física — sigues recibiendo llamadas a tu número",
        "Cobertura inmediata al aterrizar",
        "Soporte 24/7 en español por chat",
      ],
      planSuggestion:
        d.region === "asia" || d.region === "oceania"
          ? "Para un viaje típico de 10-14 días, el plan ilimitado 15 días suele ser el sweet spot (~€45-55)."
          : "Para un viaje típico de 7-10 días, el plan ilimitado 10 días suele ser el sweet spot (~€30-40).",
    };
  }
  if (d.esim === "recommended") {
    return {
      badge: "RECOMENDADO",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      meta: `eSIM ${d.name}: planes data Holafly + Airalo comparados. Sin roaming caro, activación inmediata.`,
      intro: `${d.name} tiene roaming disponible pero suele ser caro o limitado en data. Una eSIM te da data ilimitada o paquete amplio por mucho menos de lo que cobraría tu operador.`,
      features: [
        "Data ilimitada o paquetes 5-20 GB",
        "Activación con QR antes de volar",
        "Sin cambiar tu SIM física",
        "Cobertura amplia con operadores locales",
        "Soporte en español 24/7",
      ],
      planSuggestion:
        "Para un viaje típico de 7-10 días, el plan ilimitado 10 días suele ser el sweet spot.",
    };
  }
  return {
    badge: "OPCIONAL",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    meta: `eSIM ${d.name}: aunque tienes roaming gratis en la UE, una eSIM evita gastar tu paquete principal y mejora la cobertura local.`,
    intro: `En ${d.name} la mayoría de operadores españoles incluyen roaming gratis dentro del paquete UE. Una eSIM es opcional pero útil si tu plan tiene límite reducido fuera de España o si quieres preservar tu paquete principal.`,
    features: [
      "Roaming UE: 'Roam Like At Home' gratis dentro del paquete",
      "eSIM útil si tu paquete UE es pequeño",
      "Datos adicionales sin afectar a tu plan principal",
      "Útil también para hotspot a portátil",
    ],
    planSuggestion:
      "Si tu plan UE incluye 5+ GB, probablemente no necesites eSIM. Si es <5 GB, plan 5-10 GB de Holafly compensa.",
  };
}

export default function EsimDestinoPage({ params }: PageProps) {
  const d = getDestino(params.destino);
  if (!d) notFound();

  const copy = esimCopy(d);
  const url = holaflyUrl(d.slug);

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TripCazador", item: "https://tripcazador.com" },
      { "@type": "ListItem", position: 2, name: "eSIM", item: "https://tripcazador.com/esim" },
      { "@type": "ListItem", position: 3, name: `eSIM ${d.name}`, item: `https://tripcazador.com/esim/${d.slug}` },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={breadcrumbsLd} />

      <nav aria-label="Migas" className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/esim" className="hover:text-amber-400">eSIM</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{d.name}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-5xl" aria-hidden>📱{d.emoji}</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${copy.badgeColor}`}>
            {copy.badge}
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          eSIM para {d.name} 2026
        </h1>
        <p className="text-lg text-slate-300">{copy.intro}</p>
      </header>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-400">
          Recomendación TripCazador
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Holafly — data ilimitada {d.name}</h2>
        <p className="mb-4 text-slate-300">{copy.planSuggestion}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener nofollow sponsored"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Ver planes para {d.name} →
        </a>
        <p className="mt-3 text-xs text-slate-500">
          Link afiliado: comisión sin coste extra para ti.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Por qué eSIM en {d.name}
        </h2>
        <ul className="space-y-2 text-slate-200">
          {copy.features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="mt-1 text-amber-400" aria-hidden>✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">Cómo activar tu eSIM</h2>
        <ol className="space-y-2 text-slate-300">
          <li><strong className="text-white">1.</strong> Compra el plan en Holafly antes de volar.</li>
          <li><strong className="text-white">2.</strong> Recibirás un QR por email en minutos.</li>
          <li><strong className="text-white">3.</strong> Escanea con tu móvil: <em>Ajustes → Datos móviles → Añadir plan</em>.</li>
          <li><strong className="text-white">4.</strong> Activa la eSIM como línea secundaria al aterrizar.</li>
          <li><strong className="text-white">5.</strong> Tu número español sigue activo para SMS y llamadas si lo necesitas.</li>
        </ol>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">También para tu viaje a {d.name}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/seguro-viaje/${d.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="mb-1 text-sm font-bold text-amber-400">🏥 Seguro viaje {d.name}</div>
            <div className="text-sm text-slate-400">
              Cobertura médica + cancelación. {d.insuranceImportance === "critical" ? "CRÍTICO." : d.insuranceImportance === "high" ? "Recomendado." : "Opcional."}
            </div>
          </Link>
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
              Histórico de precios + alertas.
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
    </main>
  );
}
