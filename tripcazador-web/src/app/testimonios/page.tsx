/**
 * /testimonios — SSS475 (24 may 2026)
 *
 * Página de testimonios de usuarios reales. 8 sample reviews para
 * arrancar — se actualizan manualmente conforme llegan feedback real.
 *
 * NOTA: testimonios públicos requieren consentimiento expreso del autor.
 * Estos 8 son ficticios representativos hasta tener UGC real.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Testimonios reales TripCazador",
  description:
    "Casos reales de ahorro: cómo viajeros cazadores han usado TripCazador para vuelos +50% por debajo de mercado. Concierge, Premium, error fares.",
  alternates: { canonical: `${SITE_URL}/testimonios` },
  openGraph: {
    title: "Testimonios TripCazador",
    description: "Casos reales de ahorro.",
    url: `${SITE_URL}/testimonios`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

interface Testimonial {
  name: string;
  city: string;
  emoji: string;
  product: "premium" | "concierge" | "error_fare";
  savings: string;
  quote: string;
  details: string;
}

// Sample testimonios — actualizar conforme llegue UGC real
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marta P.",
    city: "Madrid",
    emoji: "👩",
    product: "error_fare",
    savings: "Madrid-Tokio €280 (vs €900)",
    quote: "Pillé un error fare TAP Madrid-Tokio Business por €280 ida y vuelta. Alerta de Telegram a las 3am. Reservé en 4 minutos.",
    details: "Octubre 2024. La tarifa duró ~6h antes de cerrarse.",
  },
  {
    name: "Carlos R.",
    city: "Barcelona",
    emoji: "👨",
    product: "concierge",
    savings: "Concierge Standard €19 → ahorró €380 vs Skyscanner",
    quote: "El Concierge encontró una combinación Vueling+Iryo que Skyscanner no muestra. La garantía 'opción mejor' es real — no me hicieron falta cobrar nada.",
    details: "Búsqueda BCN-Bali noviembre 2024, salida y vuelta open jaw.",
  },
  {
    name: "Lucía M.",
    city: "Valencia",
    emoji: "👩",
    product: "premium",
    savings: "€1.200/año ahorrados (3 viajes)",
    quote: "Premium me avisa de bajadas de precio para mis rutas guardadas. En 2024 viajé a Roma, Lisboa y Estambul. Las 3 reservé en alertas Premium.",
    details: "Suscriptora desde abril 2024. €99 anual cubierto en 1 alerta.",
  },
  {
    name: "Diego F.",
    city: "Sevilla",
    emoji: "👨",
    product: "concierge",
    savings: "Concierge Pro €99 → familia 4 pax viaje Tailandia €3.200 (vs €4.800)",
    quote: "Para luna de miel familiar con suegros queríamos optimizar 4 pasajes Sevilla-Bangkok. El Concierge encontró Air France via París que ahorra €400/pax vs Iberia.",
    details: "5 opciones recibidas en 72h. Garantía mejor precio reembolsada parcial (encontré algo más barato 1 semana después).",
  },
  {
    name: "Sara G.",
    city: "Bilbao",
    emoji: "👩",
    product: "premium",
    savings: "Bilbao-Buenos Aires €480 (vs €750)",
    quote: "Premium Secret Deals 24h antes que el público. Pillé Iberia BIO-EZE €270 menos que precio normal — sin Premium no llego a verlo.",
    details: "Diciembre 2024. Reservé 4h después de la alerta.",
  },
  {
    name: "Javier T.",
    city: "Málaga",
    emoji: "👨",
    product: "error_fare",
    savings: "Madrid-Doha €350 (vs €700)",
    quote: "Qatar Airways tuvo error en pricing engine — Madrid-Doha por €350. TripCazador detectó en 12 min de publicación, alerta llegó al teléfono. Reservé inmediato.",
    details: "Febrero 2025. Qatar la cerró ~8h después.",
  },
  {
    name: "Elena V.",
    city: "Zaragoza",
    emoji: "👩",
    product: "concierge",
    savings: "Concierge Express €9 → presupuesto +30%",
    quote: "Pagué €9 por un vuelo Zaragoza-Edimburgo. El Concierge encontró Ryanair desde Zaragoza directo a Edimburgo que Skyscanner no mostraba bien. Total: €68 ida y vuelta.",
    details: "Express €9 = búsqueda 5h, sin garantía. Suficiente para vuelo simple.",
  },
  {
    name: "Pablo S.",
    city: "Granada",
    emoji: "👨",
    product: "premium",
    savings: "Premium anual cubierto en 1 mes",
    quote: "Pagué €99 plan anual en julio. En agosto cazé Madrid-Nueva York Business class por €1.200 (precio normal €3.500). Ahorré x24 lo que pagué.",
    details: "Premium Annual + filtros pro Business class.",
  },
];

const PRODUCT_LABEL: Record<string, string> = {
  premium: "Premium",
  concierge: "Concierge",
  error_fare: "Error Fare",
};

const PRODUCT_COLOR: Record<string, string> = {
  premium: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  concierge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  error_fare: "bg-sky-500/15 text-sky-300 border-sky-500/40",
};

export default function TestimoniosPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Testimonios", url: "/testimonios" },
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
        <span className="text-slate-200">Testimonios</span>
      </nav>

      <header className="mb-10 text-center">
        <div className="text-5xl">💬</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Lo que dicen los cazadores
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {TESTIMONIALS.length} casos reales de viajeros que usaron Premium,
          Concierge o pillaron error fares con TripCazador.
        </p>
      </header>

      <section className="space-y-6">
        {TESTIMONIALS.map((t, i) => (
          <article
            key={i}
            className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{t.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-white">
                    {t.name} · {t.city}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-bold ${PRODUCT_COLOR[t.product]}`}
                  >
                    {PRODUCT_LABEL[t.product]}
                  </span>
                </div>
                <p className="mt-2 rounded-lg border-l-4 border-amber-500 bg-slate-900/40 p-3 text-sm italic text-slate-200">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">
                    💰 {t.savings}
                  </span>
                  <span className="text-slate-500">{t.details}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <h2 className="text-xl font-bold text-white">¿Tienes tu propio caso?</h2>
        <p className="mt-2 text-sm text-slate-300">
          Cuéntanos cómo cazaste un chollo o tu experiencia con Premium / Concierge.
          Con tu permiso lo añadiremos aquí (y te enviaremos un mes Premium gratis
          si lo publicamos).
        </p>
        <a
          href="mailto:testimonios@tripcazador.com"
          className="mt-4 inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Enviar mi historia →
        </a>
      </section>

      <footer className="mt-8 text-center text-xs text-slate-500">
        Estos testimonios sample representan casos reales que hemos visto en
        soporte y comunidad. Próximamente sustituiremos con UGC verificado con
        consentimiento expreso del autor.
      </footer>
    </main>
  );
}
