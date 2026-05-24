/**
 * /apps-imprescindibles — AUDIT-FULL-2 (24 may 2026)
 *
 * Listing curado de apps para viajeros (eSIM, mapas offline, traductor,
 * gastos compartidos, fotos, seguro). Afiliado a Holafly + cross-link a
 * landings existentes (/esim, /seguro-viaje, /tarjetas-viaje).
 *
 * Captura "mejores apps para viajar", "apps esenciales viajeros".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Apps imprescindibles para viajar: 12 esenciales 2026",
  description:
    "Las 12 apps que todo viajero necesita en su móvil: eSIM, mapas offline, traductor, gestor gastos compartidos, fotos cloud y más. Probadas 2026.",
  alternates: { canonical: `${SITE_URL}/apps-imprescindibles` },
  openGraph: {
    title: "Apps imprescindibles para viajar 2026",
    description: "Las 12 apps esenciales para viajeros — probadas en ruta.",
    url: `${SITE_URL}/apps-imprescindibles`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

interface App {
  name: string;
  category: string;
  emoji: string;
  description: string;
  priceModel: "gratis" | "freemium" | "pago-único" | "suscripción";
  bestFor: string;
  link?: { href: string; label: string };
}

const APPS: App[] = [
  {
    name: "Holafly eSIM",
    category: "Conectividad",
    emoji: "📡",
    description: "eSIM instantánea sin físico. Activación en 5 min, planes desde €19 para 7 días USA. Mantiene WhatsApp de tu número español.",
    priceModel: "pago-único",
    bestFor: "Conexión instantánea en destino sin SIM física.",
    link: { href: "/esim/japon", label: "Comparar eSIM por destino →" },
  },
  {
    name: "Google Maps (offline)",
    category: "Mapas",
    emoji: "🗺️",
    description: "Descarga zonas enteras antes del viaje (1-2 GB típico ciudad grande). Funciona sin datos, incluye rutas a pie y transporte público.",
    priceModel: "gratis",
    bestFor: "Navegación sin datos en países sin eSIM activo.",
  },
  {
    name: "Maps.me",
    category: "Mapas",
    emoji: "🌍",
    description: "Alternativa a Google Maps con mejor cobertura zonas rurales (Marruecos interior, Vietnam norte). Mapas OpenStreetMap descargables.",
    priceModel: "gratis",
    bestFor: "Rutas de senderismo + zonas remotas.",
  },
  {
    name: "DeepL Translator",
    category: "Traductor",
    emoji: "🌐",
    description: "Calidad de traducción 3-4× mejor que Google Translate para idiomas europeos + asiáticos. Modo cámara funcional + descarga offline 12 idiomas.",
    priceModel: "freemium",
    bestFor: "Conversaciones complejas + leer menús/letreros.",
  },
  {
    name: "Splitwise",
    category: "Gastos",
    emoji: "💰",
    description: "Gestión gastos compartidos con amigos en viaje. Multi-divisa con conversión automática. Saldo claro entre todos.",
    priceModel: "gratis",
    bestFor: "Viajes grupo (2+ personas) — evita discusiones de dinero.",
  },
  {
    name: "Revolut / Wise",
    category: "Finanzas",
    emoji: "💳",
    description: "Tarjetas multi-divisa con cambio interbancario + 0% comisión retirada cajeros (límites). Notificaciones instant de cada compra.",
    priceModel: "freemium",
    bestFor: "Pagos en local sin recargo del 3-5% banca tradicional.",
    link: { href: "/tarjetas-viaje", label: "Comparar tarjetas viaje →" },
  },
  {
    name: "Google Translate (modo conversación)",
    category: "Traductor",
    emoji: "🗣️",
    description: "Modo conversación en tiempo real con micro: hablas español, sale chino al hablante; responde, sale español. Funciona offline 50+ idiomas.",
    priceModel: "gratis",
    bestFor: "Interacciones básicas (taxi, restaurante, dirección).",
  },
  {
    name: "Google Photos",
    category: "Fotos",
    emoji: "📸",
    description: "Backup automático fotos al cloud + búsqueda inteligente (busca 'playa Bali' encuentra todas tus fotos de Bali). 15 GB gratis.",
    priceModel: "freemium",
    bestFor: "No perder fotos si el móvil se rompe/roba.",
  },
  {
    name: "TripCazador (PWA)",
    category: "Vuelos",
    emoji: "✈️",
    description: "Alertas error fares + chollos verificados desde España. Instalable como PWA en home screen. Modo offline ultima ronda de deals.",
    priceModel: "gratis",
    bestFor: "Cazar vuelos baratos sin estar pegado al móvil.",
    link: { href: "/", label: "Ver TripCazador →" },
  },
  {
    name: "TripIt",
    category: "Itinerario",
    emoji: "📅",
    description: "Reenvías emails de confirmación (vuelo, hotel, alquiler coche) a plans@tripit.com y arma itinerario unificado con tiempos y direcciones.",
    priceModel: "freemium",
    bestFor: "Viajes complejos multi-destino — no perder reservas.",
  },
  {
    name: "Citymapper",
    category: "Transporte",
    emoji: "🚇",
    description: "Mejor app de transporte público en ciudades grandes (Londres, NYC, París, Tokio). Incluye horarios reales, atajos, alternativas.",
    priceModel: "gratis",
    bestFor: "Ciudades con metro complejo (Tokio especialmente).",
  },
  {
    name: "AllTrails",
    category: "Senderismo",
    emoji: "🥾",
    description: "Catálogo +400.000 rutas mundiales con reviews + GPS tracking. Modo offline para parques nacionales sin cobertura.",
    priceModel: "freemium",
    bestFor: "Hiking + naturaleza en USA, Europa, Patagonia.",
  },
];

const CATEGORIES = Array.from(new Set(APPS.map((a) => a.category)));

const FAQ = [
  {
    q: "¿Qué apps son realmente imprescindibles para un viaje básico?",
    a: "Top 5: Google Maps offline + Holafly eSIM + DeepL + Revolut + Google Photos backup. Con estas cinco cubres mapas, datos, comunicación, pagos y memoria del viaje.",
  },
  {
    q: "¿Holafly vs SIM local?",
    a: "Holafly es más cómodo (activación instantánea sin tienda) pero más caro (€19 vs €5-10 SIM local). Para viajes <14 días, Holafly compensa el tiempo perdido buscando SIM. Para viajes >2 semanas, SIM local mejor coste-beneficio.",
  },
  {
    q: "¿Las apps offline funcionan sin datos en avión modo avión?",
    a: "Sí. Google Maps offline, DeepL offline, Maps.me, AllTrails offline cargan datos previamente descargados. Necesitas WiFi en hotel/aeropuerto inicialmente para descargar.",
  },
  {
    q: "¿Cuánto espacio ocupan en el móvil estas apps?",
    a: "Las apps en sí: ~500 MB todas instaladas. Pero los mapas offline (Google Maps grandes ciudades): 1-2 GB cada uno. Plan ~5-10 GB libres en móvil antes del viaje.",
  },
];

export default function AppsImprescindiblesPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Apps imprescindibles", url: "/apps-imprescindibles" },
  ]);

  const faqJsonLd = faqPageSchema(FAQ.map((f) => ({ q: f.q, a: f.a })));

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
        <span className="text-slate-200">Apps imprescindibles</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">📱</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          12 apps imprescindibles para viajar
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Listado curado y probado en ruta. Conectividad, mapas, traductor,
          gastos, fotos. Todo lo que necesitas en tu móvil para no quedarte
          colgado en el extranjero.
        </p>
      </header>

      <section className="mb-8 flex flex-wrap justify-center gap-2 text-xs">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-slate-700 bg-slate-800/40 px-3 py-1 text-slate-300"
          >
            {c}
          </span>
        ))}
      </section>

      <section className="space-y-4">
        {APPS.map((a, i) => (
          <article
            key={i}
            className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{a.emoji}</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-bold text-white">{a.name}</h2>
                  <span className="text-xs text-slate-500">
                    {a.category} · <span className="capitalize text-amber-300">{a.priceModel}</span>
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{a.description}</p>
                <p className="mt-2 text-xs italic text-slate-400">
                  <strong className="text-emerald-300">Ideal para:</strong> {a.bestFor}
                </p>
                {a.link && (
                  <Link
                    href={a.link.href}
                    className="mt-3 inline-block text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    {a.link.label}
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-white">❓ Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
            >
              <summary className="cursor-pointer text-sm font-bold text-white">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link href="/esim/japon" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">📡</div>
          <div className="mt-1 text-sm font-bold text-white">eSIM por destino</div>
        </Link>
        <Link href="/tarjetas-viaje" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">💳</div>
          <div className="mt-1 text-sm font-bold text-white">Tarjetas viaje</div>
        </Link>
        <Link href="/preparar-viaje/japon" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">📋</div>
          <div className="mt-1 text-sm font-bold text-white">Checklist viaje</div>
        </Link>
      </section>
    </main>
  );
}
