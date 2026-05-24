/**
 * /jet-lag/[ruta] — AUDIT-FULL-3 (24 may 2026)
 *
 * 8 landings programmatic con plan recovery jet lag por ruta long-haul.
 * Captura long-tail "jet lag madrid tokio", "como evitar jet lag bali".
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  JETLAG_CATALOG,
  JETLAG_SLUGS,
  getJetlag,
} from "@/lib/jetlag_catalog";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ ruta: string }> {
  return JETLAG_SLUGS.map((ruta) => ({ ruta }));
}

const SEV_BADGE: Record<string, string> = {
  leve: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  moderado: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  severo: "bg-red-500/15 text-red-300 border-red-500/40",
};

export async function generateMetadata({
  params,
}: {
  params: { ruta: string };
}): Promise<Metadata> {
  const j = getJetlag(params.ruta);
  if (!j) return { title: "Jet lag — ruta no encontrada" };
  const title = `Jet lag ${j.routeName}: plan recovery día a día`;
  const description = `Plan recovery jet lag ${j.routeName} (${j.tzDiffHours}h ${j.direction}, ${j.flightHours}h vuelo). ${j.recoveryDays} días recovery. Acciones específicas día a día.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/jet-lag/${j.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/jet-lag/${j.slug}`,
      type: "article",
    },
  };
}

export default function JetlagRutaPage({ params }: { params: { ruta: string } }) {
  const j = getJetlag(params.ruta);
  if (!j) notFound();

  const others = JETLAG_CATALOG.filter((x) => x.slug !== j.slug).slice(0, 4);
  const hasDestino = j.destinoSlug && DESTINO_SLUGS.includes(j.destinoSlug);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Jet lag por ruta", url: "/jet-lag" },
    { name: j.routeName, url: `/jet-lag/${j.slug}` },
  ]);

  const faqJsonLd = faqPageSchema([
    {
      q: `¿Cuántos días tarda el jet lag de ${j.routeName} en pasar?`,
      a: `Recovery estimada: ${j.recoveryDays} días. Sigue la regla universal de 1 día por hora de diferencia (${j.tzDiffHours}h en este caso). ${j.direction === "eastbound" ? "Eastbound es más duro que westbound porque el cuerpo se adapta peor a adelantar el reloj." : "Westbound es más fácil — atrasar el reloj se tolera mejor."}`,
    },
    {
      q: `¿Debo dormir en el vuelo ${j.routeName}?`,
      a: `Depende del horario de llegada. Si llegas de noche al destino, duerme. Si llegas de mañana/tarde, intenta NO dormir o solo siesta corta — necesitas activar el ritmo del destino al llegar.`,
    },
    {
      q: `¿La melatonina ayuda en ${j.routeName}?`,
      a: `Para diferencias >5h y eastbound puede ayudar (0.5mg al acostarte hora local). Para <4h o westbound, normalmente no es necesaria. Consulta tu médico antes.`,
    },
    {
      q: `¿Cuándo notaré que estoy ajustado?`,
      a: `Día ${Math.min(j.recoveryDays, 5)} suele ser cuando duermes y comes a horario sin esfuerzo. Antes de ese día, sentirás cansancio media tarde y despertares 3-4am.`,
    },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/jet-lag" className="hover:text-amber-400">Jet lag</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{j.routeName}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🛬</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Jet lag {j.routeName}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Plan recovery día a día. {j.tzDiffHours}h diferencia,
          {" "}{j.flightHours}h vuelo, {j.direction === "eastbound" ? "este" : "oeste"}.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${SEV_BADGE[j.severity]}`}>
            Severidad: {j.severity}
          </span>
          <span className="text-xs text-slate-400">
            Recovery: <strong className="text-amber-300">{j.recoveryDays} días</strong>
          </span>
        </div>
      </header>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-3 text-xl font-bold text-amber-300">⏱️ Datos clave</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Origen → Destino</dt>
            <dd className="font-bold text-white">{j.origin} → {j.destination}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Diferencia horaria</dt>
            <dd className="font-bold text-white">{j.tzDiffHours}h {j.direction === "eastbound" ? "adelante" : "atrás"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Vuelo</dt>
            <dd className="font-bold text-white">{j.flightHours} horas</dd>
          </div>
          <div>
            <dt className="text-slate-400">Recovery completa</dt>
            <dd className="font-bold text-white">{j.recoveryDays} días</dd>
          </div>
        </dl>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">📋 Plan recovery día a día</h2>
        <div className="space-y-3">
          {j.plan.map((p, i) => (
            <article
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <h3 className="text-base font-bold text-amber-300">{p.day}</h3>
              <ul className="mt-2 space-y-1.5">
                {p.actions.map((a, k) => (
                  <li key={k} className="text-sm text-slate-300">
                    • {a}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
        <h2 className="mb-3 text-xl font-bold text-white">💡 Reglas universales</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li><strong className="text-amber-300">1 día por hora de diferencia</strong> es la regla base (8h diff → 8 días recovery completa).</li>
          <li><strong className="text-amber-300">Eastbound más duro</strong> que westbound. El cuerpo adelanta peor que retrasa.</li>
          <li><strong className="text-amber-300">Luz solar mañana</strong> es la herramienta más potente para ajustar el ritmo circadiano.</li>
          <li><strong className="text-amber-300">Hidratación 2.5L/día</strong> mínimo durante recovery. La deshidratación intensifica el jet lag.</li>
          <li><strong className="text-amber-300">Sin alcohol durante el vuelo</strong> ni primer día. Empeora todo significativamente.</li>
        </ul>
      </section>

      {hasDestino && (
        <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-bold text-white">¿Volando a {j.destination}?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/destinos/${j.destinoSlug}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Ver vuelos →
            </Link>
            <Link
              href={`/preparar-viaje/${j.destinoSlug}`}
              className="rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
            >
              Checklist viaje
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Jet lag de otras rutas
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/jet-lag/${o.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.routeName}
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/calculadora-jetlag"
            className="text-xs text-amber-400 hover:underline"
          >
            ¿Otra ruta? Usa nuestra calculadora →
          </Link>
        </div>
      </section>
    </main>
  );
}
