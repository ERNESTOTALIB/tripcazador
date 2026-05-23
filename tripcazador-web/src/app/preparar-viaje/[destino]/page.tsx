/**
 * /preparar-viaje/[destino] — SSS436 (23 may 2026)
 *
 * Checklist pre-trip por destino. Reusa DESTINOS_CATALOG (visa,
 * insurance, esim) + lookup local de adaptador eléctrico por país.
 *
 * Cross-link a /seguro-viaje, /esim, /visados, /equipaje, /escapadas.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  DESTINOS_CATALOG,
  DESTINO_SLUGS,
  getDestino,
} from "@/lib/destinos_catalog";
// FIX-CQ-1: /escapadas/[slug] tiene dynamicParams=false con solo 12 slugs.
// Importamos ESCAPADAS_SLUGS para guard del link y evitar 404 garantizado.
import { ESCAPADAS_SLUGS } from "@/lib/escapadas_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ destino: string }> {
  return DESTINO_SLUGS.map((destino) => ({ destino }));
}

// Mapa de adaptador eléctrico por país. Si no está aquí, fallback "Type C/F (220V) — Europa estándar".
const ADAPTER_BY_COUNTRY: Record<string, { type: string; voltage: string; note: string }> = {
  "Japón": { type: "Type A (2 pin plano)", voltage: "100V / 50-60Hz", note: "Voltaje 100V es el más bajo del mundo. Tu cargador móvil/laptop suele aceptar (verificar 'INPUT 100-240V')." },
  "Tailandia": { type: "Type A/B/C/F", voltage: "230V / 50Hz", note: "Multi-estándar — adaptador universal recomendado." },
  "Vietnam": { type: "Type A/C/F", voltage: "220V / 50Hz", note: "Acepta 2 pin europeo + plano US — adaptador universal seguro." },
  "Indonesia": { type: "Type C/F (2 pin)", voltage: "230V / 50Hz", note: "Mismo enchufe europeo — NO necesitas adaptador desde España." },
  "Singapur": { type: "Type G (UK)", voltage: "230V / 50Hz", note: "Enchufe británico — necesitas adaptador desde España." },
  "Hong Kong": { type: "Type G (UK)", voltage: "220V / 50Hz", note: "Enchufe británico — adaptador necesario desde España." },
  "Maldivas": { type: "Type C/D/G/J", voltage: "230V / 50Hz", note: "Resorts suelen ser Type G (UK). Confirma con tu hotel." },
  "Reino Unido": { type: "Type G", voltage: "230V / 50Hz", note: "Enchufe británico exclusivo — adaptador G obligatorio." },
  "Turquía": { type: "Type C/F (2 pin)", voltage: "230V / 50Hz", note: "Mismo enchufe europeo — NO necesitas adaptador." },
  "Islandia": { type: "Type C/F", voltage: "230V / 50Hz", note: "Enchufe europeo — sin adaptador." },
  "Marruecos": { type: "Type C/E (2 pin)", voltage: "220V / 50Hz", note: "Enchufe europeo — sin adaptador." },
  "Egipto": { type: "Type C/F", voltage: "220V / 50Hz", note: "Enchufe europeo — sin adaptador." },
  "Tanzania": { type: "Type D/G (UK style)", voltage: "230V / 50Hz", note: "Mayoría Type G británico — adaptador necesario." },
  "Sudáfrica": { type: "Type M (3 pin grande)", voltage: "230V / 50Hz", note: "Sistema único sudafricano — adaptador M específico necesario. Universal puede no encajar." },
  "EAU": { type: "Type G (UK)", voltage: "220V / 50Hz", note: "Enchufe británico — adaptador necesario." },
  "EE.UU.": { type: "Type A/B (2-3 pin plano)", voltage: "120V / 60Hz", note: "Voltaje 120V — verifica que tu cargador acepte 'INPUT 100-240V'. La mayoría modernos sí." },
  "Argentina": { type: "Type C/I", voltage: "220V / 50Hz", note: "Type C europeo funciona en mayoría. Type I (Australia) para enchufes nuevos." },
  "Costa Rica": { type: "Type A/B", voltage: "120V / 60Hz", note: "Sistema EE.UU. — verifica voltaje en tu cargador." },
  "Australia": { type: "Type I (3 pin angular)", voltage: "230V / 50Hz", note: "Sistema único Australia/NZ — adaptador I específico necesario." },
};

function getAdapterInfo(country: string): { type: string; voltage: string; note: string } {
  return (
    ADAPTER_BY_COUNTRY[country] ?? {
      type: "Type C/F (2 pin europeo)",
      voltage: "220-230V / 50Hz",
      note: "Enchufe europeo estándar — no necesitas adaptador desde España.",
    }
  );
}

const VISA_LABELS: Record<string, { label: string; bg: string }> = {
  schengen: { label: "Schengen — sin visa", bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  "no-required": { label: "Sin visa requerida", bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  evisa: { label: "eVisa online", bg: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  "on-arrival": { label: "Visa on arrival", bg: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  embassy: { label: "Tramitación embajada", bg: "bg-red-500/15 text-red-300 border-red-500/40" },
};

const INSURANCE_LABELS: Record<string, { label: string; bg: string }> = {
  critical: { label: "CRÍTICO — €30k+ riesgo", bg: "bg-red-500/15 text-red-300 border-red-500/40" },
  high: { label: "Alto — recomendado", bg: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  medium: { label: "Medio", bg: "bg-amber-500/10 text-amber-200 border-amber-500/30" },
  low: { label: "Bajo (TSI/EHIC cubre)", bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
};

export async function generateMetadata({
  params,
}: {
  params: { destino: string };
}): Promise<Metadata> {
  const d = getDestino(params.destino);
  if (!d) return { title: "Destino no encontrado | TripCazador" };
  const title = `Preparar viaje a ${d.name}: checklist | TripCazador`;
  const description = `Todo lo que necesitas antes de viajar a ${d.name}: visa, seguro, eSIM, adaptador eléctrico, equipaje. Checklist completa actualizada 2026.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/preparar-viaje/${d.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/preparar-viaje/${d.slug}`,
      type: "article",
    },
  };
}

export default function PrepararViajeDestinoPage({
  params,
}: {
  params: { destino: string };
}) {
  const d = getDestino(params.destino);
  if (!d) notFound();

  const adapter = getAdapterInfo(d.country);
  const visa = VISA_LABELS[d.visa] || VISA_LABELS.embassy;
  const insurance = INSURANCE_LABELS[d.insuranceImportance] || INSURANCE_LABELS.medium;

  const others = DESTINOS_CATALOG.filter((x) => x.slug !== d.slug).slice(0, 6);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Preparar viaje", item: `${SITE_URL}/preparar-viaje` },
      { "@type": "ListItem", position: 3, name: d.name, item: `${SITE_URL}/preparar-viaje/${d.slug}` },
    ],
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/preparar-viaje" className="hover:text-amber-400">Preparar viaje</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{d.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {d.emoji} Preparar viaje a {d.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{d.country} · región {d.region}</p>
      </header>

      <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="text-lg font-bold text-white">📋 Checklist resumen</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          <li>
            <input type="checkbox" disabled className="mr-2 accent-amber-500" />
            <strong>Documentación</strong>: {d.visa === "schengen" || d.visa === "no-required"
              ? "DNI/pasaporte (válido 6 meses)"
              : "Pasaporte válido 6 meses + " + (d.visa === "evisa" ? "eVisa tramitada online" : d.visa === "on-arrival" ? "dinero efectivo para visa on arrival" : "visado embajada confirmado")}
          </li>
          <li>
            <input type="checkbox" disabled className="mr-2 accent-amber-500" />
            <strong>Seguro de viaje</strong>: {d.insuranceImportance === "critical" ? "OBLIGATORIO" : d.insuranceImportance === "low" ? "TSI/EHIC suficiente para EU" : "Recomendado"}
          </li>
          <li>
            <input type="checkbox" disabled className="mr-2 accent-amber-500" />
            <strong>eSIM/conexión</strong>: {d.esim === "essential" ? "ESENCIAL — comprar antes de salir" : d.esim === "recommended" ? "Recomendada (roaming caro)" : "Opcional (roaming EU gratis)"}
          </li>
          <li>
            <input type="checkbox" disabled className="mr-2 accent-amber-500" />
            <strong>Adaptador eléctrico</strong>: {adapter.type}
          </li>
          <li>
            <input type="checkbox" disabled className="mr-2 accent-amber-500" />
            <strong>Equipaje</strong>: verifica reglas de tu aerolínea (low-cost cobra extra)
          </li>
        </ul>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-xl border p-4 ${visa.bg}`}>
          <h3 className="text-sm font-bold uppercase tracking-wide">Visa</h3>
          <p className="mt-1 text-base font-bold">{visa.label}</p>
          {d.visaNote && <p className="mt-2 text-xs">{d.visaNote}</p>}
          <Link href={`/visados/${d.slug}`} className="mt-3 inline-block text-xs underline">
            Ver detalle visa →
          </Link>
        </div>
        <div className={`rounded-xl border p-4 ${insurance.bg}`}>
          <h3 className="text-sm font-bold uppercase tracking-wide">Seguro</h3>
          <p className="mt-1 text-base font-bold">{insurance.label}</p>
          <Link href={`/seguro-viaje/${d.slug}`} className="mt-3 inline-block text-xs underline">
            Ver seguro recomendado →
          </Link>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="text-lg font-bold text-white">🔌 Adaptador eléctrico</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase text-slate-500">Tipo</div>
            <div className="font-bold text-white">{adapter.type}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Voltaje</div>
            <div className="font-bold text-white">{adapter.voltage}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-300">{adapter.note}</p>
      </section>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="text-lg font-bold text-white">📱 eSIM al aterrizar</h2>
        <p className="mt-2 text-sm text-slate-300">
          {d.esim === "essential" ? (
            <>
              Sin roaming gratis en {d.country}. Comprar eSIM en{" "}
              <Link href={`/esim/${d.slug}`} className="text-amber-400 hover:underline">/esim/{d.slug}</Link>{" "}
              y activarla justo antes de salir te ahorra €50-200 fácilmente.
            </>
          ) : d.esim === "recommended" ? (
            <>
              Tu operador puede tener roaming caro en {d.country}. eSIM Holafly es la opción más
              fácil — comprar en{" "}
              <Link href={`/esim/${d.slug}`} className="text-amber-400 hover:underline">/esim/{d.slug}</Link>.
            </>
          ) : (
            <>
              Estás en UE/EEA — tu operador español suele incluir roaming gratis. eSIM opcional
              salvo que necesites múltiples países con datos más rápidos.
            </>
          )}
        </p>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        {/* FIX-CQ-1: solo link a escapada si el slug existe en ESCAPADAS_SLUGS
            (12 destinos). Antes generábamos 404 para ~25 destinos. */}
        {ESCAPADAS_SLUGS.includes(d.slug) && (
          <Link
            href={`/escapadas/${d.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="text-2xl">🎒</div>
            <div className="mt-1 text-sm font-bold text-white">Escapada {d.name}</div>
            <div className="text-xs text-slate-400">Itinerario 2-3 días</div>
          </Link>
        )}
        <Link
          href="/equipaje"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-1 text-sm font-bold text-white">Reglas equipaje</div>
          <div className="text-xs text-slate-400">Por aerolínea</div>
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-white">Otros destinos</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/preparar-viaje/${o.slug}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {o.emoji} {o.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
