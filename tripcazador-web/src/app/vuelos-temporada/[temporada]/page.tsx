/**
 * /vuelos-temporada/[temporada] — SSS283 (17 may 2026)
 *
 * Programmatic SEO seasonal landings. Long-tail high-intent:
 * "vuelos baratos semana santa 2026", "vuelos verano 2026", "puente diciembre".
 *
 * 5 temporadas iniciales:
 *  - semana-santa-2026 (marzo-abril, alta demanda)
 *  - verano-2026 (jul-ago, peak)
 *  - puente-diciembre-2026 (dic 5-9)
 *  - puente-octubre-2026 (oct 9-13)
 *  - navidad-2026 (dic 24-ene 6)
 *
 * Cada landing: hero copy + 6-10 destinos sugeridos + tip cazador + CTA
 * PremiumInlineCTA + ConciergeInlineCTA. Generate static.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PremiumInlineCTA } from "@/components/PremiumInlineCTA";
import { ConciergeInlineCTA } from "@/components/ConciergeInlineCTA";

const SITE = "https://tripcazador.com";

interface Temporada {
  slug: string;
  label: string;
  emoji: string;
  range: string;
  hero: string;
  whenToBook: string;
  insights: string[];
  topDestinations: Array<{
    name: string;
    typicalPriceEur: number;
    minPriceEur: number;
    tip: string;
  }>;
  faq: Array<{ q: string; a: string }>;
}

const TEMPORADAS: Record<string, Temporada> = {
  "semana-santa-2026": {
    slug: "semana-santa-2026",
    label: "Vuelos Semana Santa 2026",
    emoji: "🌸",
    range: "27 marzo – 5 abril 2026",
    hero: "Semana Santa 2026 cae temprano (27 mar – 5 abr), lo que la hace más barata que años con SS de abril. La ventana de oro para reservar fue dic 2025-ene 2026; ahora (mayo) sigue habiendo error fares pero más espaciados.",
    whenToBook:
      "Para SS 2026 ya tarde. Si aún no tienes vuelo: cazar error fares es la única vía a precios decentes. Para SS 2027 (26 mar – 4 abr): reservar nov 2026 - ene 2027.",
    insights: [
      "SS 2026 demanda pico → low-cost (Ryanair/Vueling/Wizz) sube +60-80% vs media anual",
      "Conexiones vía DUB/STN/BUD a veces saltan limit de saturación → tickets €30-50 cuando rutas directas están a €180",
      "Hoteles en destinos top (Lisboa, Roma, Praga) suben 2-3× — busca pueblos a 30 min en tren",
    ],
    topDestinations: [
      { name: "Roma", typicalPriceEur: 165, minPriceEur: 48, tip: "Volar martes 31 mar evita peak fin de semana" },
      { name: "Lisboa", typicalPriceEur: 145, minPriceEur: 35, tip: "Ryanair MAD-LIS suele tener glitch viernes 27 mar" },
      { name: "Praga", typicalPriceEur: 180, minPriceEur: 65, tip: "Wizz BCN-PRG es 30% más barato que Ryanair MAD-PRG" },
      { name: "Marrakech", typicalPriceEur: 165, minPriceEur: 55, tip: "Domingo de Resurrección llegadas suelen estar baratas — pocos viajan ese día" },
      { name: "Atenas", typicalPriceEur: 195, minPriceEur: 78, tip: "Aegean A3 mistake fares 2-3× SS — vigilar conexiones MAD-LHR-ATH" },
      { name: "Estambul", typicalPriceEur: 210, minPriceEur: 95, tip: "Pegasus PC desde aeropuertos secundarios (SAW) más barato que Turkish (IST)" },
    ],
    faq: [
      {
        q: "¿Cuánto cuesta un vuelo a Roma en Semana Santa 2026?",
        a: "Precio típico ida + vuelta MAD-FCO en SS 2026 es €165 si reservas 6+ semanas antes. Mistake fares hasta €48 RT se han observado.",
      },
      {
        q: "¿Es mejor volar la víspera o el Viernes Santo?",
        a: "Viernes Santo (mañana) suele ser 30-40% más caro. Volar miércoles 1 abril o jueves 2 abril por la tarde es el sweet-spot precio/aprovechamiento del viaje.",
      },
    ],
  },
  "verano-2026": {
    slug: "verano-2026",
    label: "Vuelos baratos verano 2026",
    emoji: "☀️",
    range: "junio – septiembre 2026",
    hero: "El verano europeo es el peak más predecible del calendario aéreo. Para mantener precios sub-€200 RT, hay 3 estrategias: vacaciones en septiembre (15-30%), destinos contraseason (Latinoamérica, Sudáfrica), o volar fechas no-pico dentro de jul-ago (lunes/martes).",
    whenToBook:
      "Sweet-spot: 8-10 semanas antes de la fecha de salida. Si vuelas última semana julio o primera de agosto, reservar dic 2025-ene 2026 fue ideal. En mayo aún quedan oportunidades específicas — vigila error fares.",
    insights: [
      "Julio-agosto pico → tarifas Europa sube +120-150% sobre media anual",
      "Septiembre = mismo clima, 30% menos precio + 40% menos turistas",
      "Long-haul a hemisferio sur (Argentina, Chile, Sudáfrica) suele ser más barato en verano EU (= invierno allí)",
    ],
    topDestinations: [
      { name: "Bali", typicalPriceEur: 720, minPriceEur: 420, tip: "Singapore SQ via SIN suele tener mistakes en julio" },
      { name: "Buenos Aires", typicalPriceEur: 850, minPriceEur: 380, tip: "Latam, Iberia o Air Europa — codeshare con Sky Team frecuentes glitches" },
      { name: "Tokio", typicalPriceEur: 980, minPriceEur: 480, tip: "Volar via FRA o ZRH suele ser 30% más barato que directo MAD-NRT" },
      { name: "Reikiavik", typicalPriceEur: 320, minPriceEur: 145, tip: "Mejor mes para vuelos a Islandia (verano = mucha demanda, pero capacidad alta)" },
      { name: "Berlín", typicalPriceEur: 165, minPriceEur: 38, tip: "Sept último fin de semana = Maratón Berlín → vuelos vuelven a subir" },
      { name: "Tirana", typicalPriceEur: 175, minPriceEur: 65, tip: "Wizz BCN-TIA o MAD-TIA — Albania es el sweet-spot precio/exotismo verano 2026" },
    ],
    faq: [
      {
        q: "¿Cuándo es más barato volar en verano 2026?",
        a: "Primera quincena de junio + segunda de septiembre. Dentro de jul-ago: martes y miércoles 30-40% más baratos que viernes y domingos.",
      },
      {
        q: "¿Cuál es el destino verano más barato desde Madrid?",
        a: "Marruecos (€85-150 RT), Albania (€175 RT) y Croacia (€180-250 RT). Tirana es el outlier en relación calidad/precio para 2026.",
      },
    ],
  },
  "puente-diciembre-2026": {
    slug: "puente-diciembre-2026",
    label: "Vuelos puente diciembre 2026",
    emoji: "❄️",
    range: "5 – 9 diciembre 2026",
    hero: "El puente de Constitución + Inmaculada (5-9 dic 2026) cae sábado–miércoles → 4 días libres con 2 de vacaciones. Demanda alta para destinos europeos y mercadillos navideños.",
    whenToBook:
      "Para puente 2026: reservar junio-agosto 2026 es óptimo. Pasada la mitad de octubre los precios se disparan.",
    insights: [
      "Mercados navideños (Praga, Budapest, Viena, Estrasburgo, Núremberg) son los destinos peak este puente",
      "Lapland Finland (Rovaniemi) → llegadas Papá Noel: precios premium para families con niños",
      "Cancún + Caribe → puente bueno para ir a sol (alta temporada allí pero precio aún ok antes de Navidad)",
    ],
    topDestinations: [
      { name: "Praga", typicalPriceEur: 195, minPriceEur: 75, tip: "Mercado navideño Plaza Vieja + Castillo iluminado" },
      { name: "Budapest", typicalPriceEur: 210, minPriceEur: 85, tip: "Wizz desde BCN/MAD/VLC más barato que Ryanair Lufthansa" },
      { name: "Viena", typicalPriceEur: 245, minPriceEur: 110, tip: "Tren Viena→Salzburg combinado = doble mercado en un viaje" },
      { name: "Estrasburgo", typicalPriceEur: 280, minPriceEur: 145, tip: "Vía CDG + TGV es más barato que vuelo directo SXB" },
      { name: "Núremberg", typicalPriceEur: 195, minPriceEur: 88, tip: "Lufthansa MAD-FRA + tren a NUR es la opción más económica" },
      { name: "Cancún", typicalPriceEur: 680, minPriceEur: 320, tip: "Air Europa + Iberia mistake fares en noviembre frecuentes" },
    ],
    faq: [
      {
        q: "¿Cuántos días libres son en el puente de diciembre 2026?",
        a: "Del sábado 5 al miércoles 9 = 5 días con solo 2 de vacaciones (lunes y martes). Si añades jueves 10 y viernes 11 = 9 días seguidos.",
      },
      {
        q: "¿Cuál es el destino más barato para el puente de diciembre?",
        a: "Praga (€195 RT típico, €75 floor) y Budapest (€210 / €85). Ambos con mercados navideños y temperaturas frías pero llevaderas.",
      },
    ],
  },
  "puente-octubre-2026": {
    slug: "puente-octubre-2026",
    label: "Vuelos puente Hispanidad octubre 2026",
    emoji: "🍂",
    range: "10 – 12 octubre 2026",
    hero: "El puente de Hispanidad 2026 cae sábado–lunes (3 días). Corto pero suficiente para escapadas europeas o Marruecos. Demanda media — mejor precio/calidad del año entre Semana Santa y Navidad.",
    whenToBook:
      "Reservar julio-agosto 2026 ideal. A 4-6 semanas (fin de agosto) aún hay buenas opciones.",
    insights: [
      "Otoño = mejor visibilidad fotográfica en Europa (luz suave)",
      "Marruecos peak season comienza octubre — sigue siendo asequible pero subiendo",
      "Berlín / Praga / Budapest baratos pero temperatura baja (8-15°C)",
    ],
    topDestinations: [
      { name: "Marrakech", typicalPriceEur: 145, minPriceEur: 48, tip: "Ryanair BCN-RAK glitches frecuentes 2-3 semanas antes del puente" },
      { name: "Lisboa", typicalPriceEur: 125, minPriceEur: 38, tip: "Octubre = mejor mes para Lisboa (sin calor, lluvia rara)" },
      { name: "Atenas", typicalPriceEur: 185, minPriceEur: 78, tip: "Temperatura 22°C diurna = visitas Acrópolis sin agobio verano" },
      { name: "Estambul", typicalPriceEur: 195, minPriceEur: 88, tip: "Pegasus desde BCN/MAD sub-€100 si vigilas error fares" },
      { name: "Edimburgo", typicalPriceEur: 165, minPriceEur: 62, tip: "Cambio de hora 25 oct → llega oscuridad pronto, lleva linterna" },
      { name: "Madeira", typicalPriceEur: 185, minPriceEur: 95, tip: "Single isla España + Portugal — sin trámites + sin moneda" },
    ],
    faq: [
      {
        q: "¿Qué destinos son baratos para el puente de octubre 2026?",
        a: "Marrakech (€145 RT), Lisboa (€125 RT) y Atenas (€185 RT). Los precios más bajos suelen estar 4-6 semanas antes del puente.",
      },
    ],
  },
  "navidad-2026": {
    slug: "navidad-2026",
    label: "Vuelos Navidad 2026",
    emoji: "🎄",
    range: "20 dic 2026 – 6 ene 2027",
    hero: "Navidad 2026 demanda muy alta — para mantener precios razonables hay 3 estrategias: reservar antes de junio 2026, viajar contra-flujo (España → España no, España → América sí), o aprovechar fechas valle (24 dic ida + 1 ene vuelta = más barato que 23 + 3 ene).",
    whenToBook:
      "Para Navidad 2026: ideal reservar marzo-mayo 2026. Después de septiembre los precios se disparan +80%.",
    insights: [
      "Vuelos a Latam (Buenos Aires, Lima, México) suben 2-3× vs media anual",
      "Fechas valle: salir 24 dic, volver 1 ene → ahorro 30-40% vs salir 22 vol 5",
      "Lapland Finland peak — el destino familiar con padre Noel cuesta x3 cabeza",
    ],
    topDestinations: [
      { name: "Buenos Aires", typicalPriceEur: 1450, minPriceEur: 720, tip: "Iberia / Air Europa codeshare con LATAM — mistake fares oct-nov frecuentes" },
      { name: "México DF", typicalPriceEur: 920, minPriceEur: 480, tip: "Aeromexico via MAD-MEX directo o IB / UX con escala" },
      { name: "Reikiavik", typicalPriceEur: 380, minPriceEur: 195, tip: "Luces del norte alto pico — busca alquiler coche con 4WD" },
      { name: "Marrakech", typicalPriceEur: 195, minPriceEur: 78, tip: "Navidad no es festival local en Marruecos → no hay sobreprecio cultural" },
      { name: "Nueva York", typicalPriceEur: 880, minPriceEur: 380, tip: "Tickets MAD-JFK glitches 4-5× al año, especialmente martes/miércoles octubre" },
      { name: "Tailandia", typicalPriceEur: 850, minPriceEur: 420, tip: "Vuela 24-25 dic (no popular en Asia) → vuelo más barato + hoteles también" },
    ],
    faq: [
      {
        q: "¿Cuándo bajan los precios de vuelos en Navidad?",
        a: "Los precios para Navidad 2026 suelen tocar mínimo 30-40 días antes (mediados de noviembre). Sin embargo, esperar tanto es arriesgado — solo recomendado si confías en flexibilidad de fecha.",
      },
      {
        q: "¿Qué fechas son más baratas en Navidad 2026?",
        a: "Salida 24 dic (la mayoría no viaja ese día — está con familia). Vuelta 1-2 enero. Si solo puedes salir 22-23 dic: vuelve 28-29 dic en lugar de 5 ene.",
      },
    ],
  },
};

const ALL_SLUGS = Object.keys(TEMPORADAS);

export function generateStaticParams() {
  return ALL_SLUGS.map((temporada) => ({ temporada }));
}

export async function generateMetadata({
  params,
}: {
  params: { temporada: string };
}): Promise<Metadata> {
  const t = TEMPORADAS[params.temporada];
  if (!t) return { title: "Temporada no encontrada | TripCazador" };
  const title = `${t.label} | TripCazador`;
  const description = `${t.hero.slice(0, 155)}`;
  const url = `${SITE}/vuelos-temporada/${params.temporada}`;
  return {
    title,
    description,
    alternates: { canonical: `/vuelos-temporada/${params.temporada}` },
    openGraph: {
      title: `${t.emoji} ${t.label}`,
      description,
      url,
      siteName: "TripCazador",
      type: "website",
      locale: "es_ES",
    },
  };
}

export const revalidate = 86400;

export default function TemporadaPage({
  params,
}: {
  params: { temporada: string };
}) {
  const t = TEMPORADAS[params.temporada];
  if (!t) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <a href="/vuelos-baratos-mes" className="hover:text-white">
            Vuelos por temporada
          </a>
          <span>/</span>
          <span className="text-white">{t.label}</span>
        </nav>
        <div className="text-5xl">{t.emoji}</div>
        <h1 className="text-4xl font-bold text-white">{t.label}</h1>
        <div className="text-amber-400 text-sm">{t.range}</div>
        <p className="text-gray-300 max-w-2xl text-lg">{t.hero}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Cuándo reservar</h2>
        <p className="text-gray-300">{t.whenToBook}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Trucos cazador para esta temporada</h2>
        <ul className="space-y-2">
          {t.insights.map((insight, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 flex-shrink-0">▸</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Top 6 destinos para {t.label.replace("Vuelos ", "").replace(" 2026", "").toLowerCase()}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.topDestinations.map((d) => (
            <div
              key={d.name}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-white">{d.name}</h3>
                <div className="text-right">
                  <div className="text-xs text-gray-500">desde</div>
                  <div className="text-2xl font-bold text-amber-400">€{d.minPriceEur}</div>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Precio típico: <span className="text-gray-200">€{d.typicalPriceEur}</span> · Mínimo observado: <span className="text-amber-400">€{d.minPriceEur}</span>
              </div>
              <p className="text-sm text-gray-300 border-t border-gray-800 pt-3">
                💡 {d.tip}
              </p>
            </div>
          ))}
        </div>
      </section>

      <PremiumInlineCTA
        source={`temporada-${t.slug}`}
        variant="card"
        title={`Recibe alertas SMS para ${t.label.toLowerCase()}`}
        subtitle="Error fares para tu temporada elegida — directo a tu móvil antes de que se agoten. €9.99/mes · 7 días gratis"
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {t.faq.map((f) => (
            <details
              key={f.q}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
            >
              <summary className="font-semibold text-white cursor-pointer">
                {f.q}
              </summary>
              <p className="mt-3 text-gray-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <ConciergeInlineCTA
        source={`temporada-${t.slug}`}
        variant="banner"
        highlightTier="standard"
      />
    </div>
  );
}
