/**
 * /viajar-bebes — SSS489 (24 may 2026)
 *
 * Guía single-shot para viajeros con bebés (<2 años) y niños menores
 * desde España: equipaje permitido, carrito, cuna, asiento, documentación,
 * tasas, descuentos por aerolínea típica.
 *
 * Captura long-tail "viajar con bebé en Ryanair", "equipaje bebé Iberia",
 * "carrito avión". JSON-LD FAQ + HowTo + Breadcrumb.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, faqPageSchema, howToSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Viajar con bebés y niños: equipaje, asientos, normas | TripCazador",
  description:
    "Guía completa para volar con bebés (<2 años) y niños desde España: equipaje permitido, carrito, cuna, descuentos por aerolínea, documentación y tips.",
  alternates: { canonical: `${SITE_URL}/viajar-bebes` },
  openGraph: {
    title: "Viajar con bebés en avión",
    description: "Equipaje, carrito, cuna y descuentos por aerolínea.",
    url: `${SITE_URL}/viajar-bebes`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const POR_AEROLINEA = [
  {
    airline: "Ryanair",
    code: "ryanair",
    infantFee: "€25/trayecto (sin asiento, regazo)",
    infantBaggage: "Bolso 5kg incluido para bebé",
    stroller: "Gratis (1 por bebé hasta puerta embarque)",
    childDiscount: "No (precio adulto desde 2 años)",
    notes: "No reserva asientos preferentes con bebé. Comida no incluida.",
  },
  {
    airline: "Iberia",
    code: "iberia",
    infantFee: "10% precio adulto (regazo)",
    infantBaggage: "1 maleta facturada hasta 23kg + bolso mano 5kg",
    stroller: "Gratis hasta puerta embarque",
    childDiscount: "75-80% precio adulto 2-11 años",
    notes: "Asiento dedicado niño <2: precio adulto reducido. Cuna en cabina (long-haul, solicitar 48h antes).",
  },
  {
    airline: "Vueling",
    code: "vueling",
    infantFee: "€25/trayecto regazo",
    infantBaggage: "Bolso 6kg",
    stroller: "Gratis pero solo 1 por bebé",
    childDiscount: "No (precio adulto desde 2 años)",
    notes: "Asiento separado bebé: tarifa Premium o family con coste extra.",
  },
  {
    airline: "Air Europa",
    code: "air-europa",
    infantFee: "10% precio adulto (long-haul) / €40 (corto-medio)",
    infantBaggage: "1 maleta 23kg + bolso 5kg",
    stroller: "Gratis hasta puerta",
    childDiscount: "75% precio adulto 2-11 años",
    notes: "Cuna en cabina disponible Madrid-Latam (solicitar previa reserva).",
  },
  {
    airline: "easyJet",
    code: "easyjet",
    infantFee: "€32/trayecto regazo",
    infantBaggage: "Bolso 5kg + bolsa pañales (separada)",
    stroller: "Gratis + 2 items extra (silla coche, cuna porta)",
    childDiscount: "No (precio adulto desde 2 años)",
    notes: "Más generosa que Ryanair con items extra. Plus families.",
  },
  {
    airline: "Lufthansa",
    code: "lufthansa",
    infantFee: "10% precio adulto regazo",
    infantBaggage: "1 maleta 23kg + bolso 8kg",
    stroller: "Gratis hasta puerta + 1 carrito coche",
    childDiscount: "75% precio adulto 2-11 años",
    notes: "Cuna cabina garantizada economy long-haul si solicitas con 72h antes.",
  },
];

const FAQ = [
  {
    q: "¿Hasta qué edad un bebé vuela en regazo?",
    a: "Hasta cumplir 2 años. A partir de 2 años el niño debe tener asiento propio (precio reducido en muchas aerolíneas legacy, precio adulto en low-cost como Ryanair/Vueling/easyJet).",
  },
  {
    q: "¿El carrito cuenta como equipaje?",
    a: "No. Prácticamente todas las aerolíneas permiten 1 carrito por bebé gratis hasta la puerta de embarque (gate-check). Se etiqueta y se entrega al llegar al destino o, en algunos casos, a pie de escalera.",
  },
  {
    q: "¿Qué documentación necesita un bebé?",
    a: "DNI (España) o pasaporte para vuelos internacionales. Para Schengen basta DNI. Fuera UE: pasaporte siempre (incluso 0 meses). Si solo viaja con uno de los progenitores en algunos países exigen permiso notarial del otro (consulta consulado destino).",
  },
  {
    q: "¿Puedo usar la silla del coche en el avión?",
    a: "Sí, si tiene certificación aprobada para uso aéreo (busca etiqueta 'TÜV', 'AmSafe' o 'FAA approved'). Necesitas asiento propio para bebé (no regazo). Algunas aerolíneas (Iberia, Lufthansa) la permiten; Ryanair NO.",
  },
  {
    q: "¿Cuándo solicitar cuna en cabina?",
    a: "Solo disponible vuelos long-haul (>4h) en clase economy con asiento bulkhead (primera fila). Solicitar con 48-72h antes vía web/teléfono. Bebé debe pesar <10kg habitualmente.",
  },
  {
    q: "¿Líquidos para bebé pasan el control?",
    a: "Sí. Leche, agua, papilla, medicación líquida — todo lo necesario para el viaje exento del límite 100ml. Pero declárala al control (puede que pidan probar). Más fácil llevarla en cantidad razonable.",
  },
  {
    q: "¿Pañales en equipaje de mano cuentan?",
    a: "No habitualmente. La mayoría de aerolíneas no cuentan pañales/toallitas como peso. Si compras packs grandes en aeropuerto destino (más barato), puedes liberarte de llevar mucho desde España.",
  },
];

const HOWTO_STEPS = [
  {
    name: "Reserva bebé al hacer la reserva del adulto",
    text: "Casi todas las aerolíneas te piden añadir bebé en el momento de comprar el billete. Hacerlo después en web puede ser más caro o requerir llamada al call-center con espera.",
  },
  {
    name: "Solicita asiento bulkhead si vuelo es >4h",
    text: "El asiento de primera fila (bulkhead/baby bassinet) es el único donde se monta la cuna en cabina. Pídelo al hacer reserva o llama 48-72h antes.",
  },
  {
    name: "Empaca esenciales en cabina",
    text: "Pañales (10-15 unidades), 1-2 muda, leche/papilla para vuelo+escala, medicación, chupete, peluche favorito. NO confíes en equipaje facturado si pierde la conexión.",
  },
  {
    name: "Llega 30 minutos antes a embarque",
    text: "Con bebé, todo tarda más: cambio pañal de última hora, check con carrito, asiento prioritario. Llegar 2.5h antes para vuelo internacional, 1.5h doméstico.",
  },
  {
    name: "Pide embarque prioritario (family-with-children)",
    text: "Todas las aerolíneas ofrecen pre-embarque para familias con bebés (<2 años). Aprovecha — coloca carrito en cabina antes del bullicio general.",
  },
  {
    name: "Da pecho/biberón al despegue y aterrizaje",
    text: "Ayuda al bebé a equilibrar presión en oídos. Si no toma biberón, ofrece chupete o líquido. Llanto del bebé es común al cambio presión.",
  },
];

export default function ViajarBebesPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Viajar con bebés", url: "/viajar-bebes" },
  ]);

  const faqJsonLd = faqPageSchema(FAQ.map((f) => ({ q: f.q, a: f.a })));

  const howToJsonLd = howToSchema({
    name: "Cómo viajar con bebé en avión",
    description: "Pasos clave para volar con bebés <2 años desde aeropuertos españoles.",
    steps: HOWTO_STEPS,
  });

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Viajar con bebés</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">👶</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Viajar con bebés y niños
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Guía completa para volar con bebés (&lt;2 años) y menores desde España:
          equipaje, carrito, cuna, descuentos, documentación y tips probados.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">📋 Por aerolínea</h2>
        <div className="space-y-3">
          {POR_AEROLINEA.map((a, i) => (
            <article
              key={i}
              className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <h3 className="text-lg font-bold text-white">
                <Link
                  href={`/aerolineas/${a.code}`}
                  className="hover:text-amber-400"
                >
                  {a.airline} →
                </Link>
              </h3>
              <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-amber-300">Tasa bebé:</span>{" "}
                  {a.infantFee}
                </div>
                <div>
                  <span className="font-semibold text-amber-300">Equipaje bebé:</span>{" "}
                  {a.infantBaggage}
                </div>
                <div>
                  <span className="font-semibold text-amber-300">Carrito:</span>{" "}
                  {a.stroller}
                </div>
                <div>
                  <span className="font-semibold text-amber-300">Descuento niño:</span>{" "}
                  {a.childDiscount}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400 italic">{a.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-4 text-2xl font-bold text-amber-300">
          ⚙️ Cómo viajar con bebé — paso a paso
        </h2>
        <ol className="space-y-3">
          {HOWTO_STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">{s.name}</h3>
                <p className="mt-1 text-sm text-slate-300">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">❓ Preguntas frecuentes</h2>
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
        <Link
          href="/equipaje-medidor"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">📏</div>
          <div className="mt-1 text-sm font-bold text-white">Medidor equipaje</div>
          <div className="text-xs text-slate-400">¿Pasa tu maleta?</div>
        </Link>
        <Link
          href="/maleta-perdida"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-1 text-sm font-bold text-white">Maleta perdida</div>
          <div className="text-xs text-slate-400">Cómo reclamar</div>
        </Link>
        <Link
          href="/vuelo-cancelado"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">⚖️</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelo cancelado</div>
          <div className="text-xs text-slate-400">EU 261/2004</div>
        </Link>
      </section>
    </main>
  );
}
