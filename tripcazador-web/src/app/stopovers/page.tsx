import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Stopovers gratis 2026: 7 programas para alargar tu viaje sin pagar más",
  description:
    "Programas de stopover gratuitos: Turkish, Singapore, Icelandair, Etihad, Qatar, JAL. Reglas, ciudades y cómo bookearlo paso a paso.",
  alternates: { canonical: "/stopovers" },
  openGraph: {
    type: "website",
    title: "Stopovers gratis — TripCazador",
    description: "7 programas de stopover gratuitos comparados.",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

interface StopoverProgram {
  airline: string;
  iata: string;
  city: string;
  cityIata: string;
  freeNights: string;
  routeRequirement: string;
  fareRequirement: string;
  hotelIncluded: boolean;
  notes: string;
  url?: string;
}

const PROGRAMS: StopoverProgram[] = [
  {
    airline: "Turkish Airlines",
    iata: "TK",
    city: "Estambul",
    cityIata: "IST",
    freeNights: "1-2 noches",
    routeRequirement: "Cualquier ruta intercontinental con escala IST >20h",
    fareRequirement: "Cualquier tarifa válida (también economy básica)",
    hotelIncluded: true,
    notes: "1 noche hotel 4* incluida en business class. 2 noches en economy. El programa más generoso de Europa-Asia.",
  },
  {
    airline: "Singapore Airlines",
    iata: "SQ",
    city: "Singapur",
    cityIata: "SIN",
    freeNights: "1-3 noches",
    routeRequirement: "Vuelo internacional con escala SIN >24h y <72h",
    fareRequirement: "Singapore Stopover Holiday (SSH) — paquete dedicado",
    hotelIncluded: true,
    notes: "Hotel + transfer aeropuerto + visa + tour Singapore incluidos. Probablemente el mejor programa stopover del mundo.",
  },
  {
    airline: "Icelandair",
    iata: "FI",
    city: "Reikiavik",
    cityIata: "KEF",
    freeNights: "1-7 noches",
    routeRequirement: "Vuelo Europe-USA con escala KEF",
    fareRequirement: "Cualquier tarifa Icelandair",
    hotelIncluded: false,
    notes: "Programa pionero. Hasta 7 noches sin coste extra en pasaje. Hotel pagas por separado pero los precios son razonables fuera de temporada.",
  },
  {
    airline: "Etihad",
    iata: "EY",
    city: "Abu Dhabi",
    cityIata: "AUH",
    freeNights: "1-2 noches",
    routeRequirement: "Vuelo via AUH con escala mínimo 24h",
    fareRequirement: "Business o First class principalmente",
    hotelIncluded: true,
    notes: "Hotel 4-5* incluido en business. Atracciones (Louvre Abu Dhabi, Sheikh Zayed Mosque) descuento 50%.",
  },
  {
    airline: "Qatar Airways",
    iata: "QR",
    city: "Doha",
    cityIata: "DOH",
    freeNights: "1 noche",
    routeRequirement: "Vuelo via DOH con escala 12-72h",
    fareRequirement: "Qatar Stopover Program — opt-in en booking",
    hotelIncluded: true,
    notes: "Hotel 4* en Doha desde €23/noche o gratis con compra de paquete. Tour ciudad incluido.",
  },
  {
    airline: "JAL (Japan Airlines)",
    iata: "JL",
    city: "Tokio",
    cityIata: "NRT",
    freeNights: "1-3 noches",
    routeRequirement: "Vuelo Tokyo-Asia, escala NRT/HND >24h",
    fareRequirement: "Cualquier tarifa internacional",
    hotelIncluded: false,
    notes: "Llamada 'JAL Stopover'. Hotel pagas separado pero las tarifas en Tokio son razonables fuera de Sakura/Olympics.",
  },
  {
    airline: "Finnair",
    iata: "AY",
    city: "Helsinki",
    cityIata: "HEL",
    freeNights: "1-5 noches",
    routeRequirement: "Vuelo Europe-Asia via HEL >24h",
    fareRequirement: "Cualquier tarifa internacional",
    hotelIncluded: false,
    notes: "Stopover gratuito sin coste. Helsinki interesante 1-2 días. En invierno + Laponia accessible (1h45m vuelo interno).",
  },
];

export default function StopoversPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Programas de stopover gratuitos 2026",
      description: "Listado de programas que permiten escala extendida gratis o a coste reducido.",
      numberOfItems: PROGRAMS.length,
      itemListElement: PROGRAMS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${p.airline} — Stopover en ${p.city}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Stopovers", item: "https://tripcazador.com/stopovers" },
      ],
    },
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Stopovers</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Stopovers gratis: alarga tu viaje sin pagar</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          7 aerolíneas ofrecen escalas extendidas con hotel incluido o sin coste extra. Cómo aprovecharlas para sumar 1-3 ciudades a tu viaje sin gastar más.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">¿Qué es un stopover?</h2>
        <p className="text-gray-300">
          Un stopover es una escala intencional de más de 24 horas en una ciudad intermedia, normalmente sin coste adicional. Diferencia con layover: layover es {"<"}24h (solo conexión); stopover es {">"}24h (puedes salir del aeropuerto y conocer la ciudad).
        </p>
        <p className="text-gray-300">
          Las aerolíneas lo ofrecen porque les beneficia: te quedas en su hub mostrándole al mundo el destino. A cambio, tú obtienes 2 viajes por el precio de uno.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Comparativa de programas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-3">Aerolínea</th>
                <th className="py-2 pr-3">Ciudad</th>
                <th className="py-2 pr-3">Noches</th>
                <th className="py-2 pr-3 text-center">Hotel</th>
                <th className="py-2 pr-3">Cabina mínima</th>
              </tr>
            </thead>
            <tbody>
              {PROGRAMS.map((p) => (
                <tr key={p.airline} className="border-b border-gray-900">
                  <td className="py-3 pr-3">
                    <span className="font-mono text-xs text-amber-400 mr-2">{p.iata}</span>
                    <span className="text-white">{p.airline}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="font-mono text-xs text-amber-300">{p.cityIata}</span>{" "}
                    <span className="text-gray-300">{p.city}</span>
                  </td>
                  <td className="py-3 pr-3 text-gray-300">{p.freeNights}</td>
                  <td className="py-3 pr-3 text-center">
                    {p.hotelIncluded ? (
                      <span className="text-emerald-400">✓ Incluido</span>
                    ) : (
                      <span className="text-gray-500">Aparte</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-gray-400 text-xs">{p.fareRequirement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Detalle por programa</h2>
        <div className="space-y-4">
          {PROGRAMS.map((p) => (
            <article key={p.airline} className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-amber-400">{p.iata}</span>
                <h3 className="text-lg font-bold text-white">
                  {p.airline} — {p.city}
                </h3>
              </div>
              <p className="text-gray-300">{p.notes}</p>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-800">
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Noches</dt>
                  <dd className="text-gray-300">{p.freeNights}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Requisito ruta</dt>
                  <dd className="text-gray-300">{p.routeRequirement}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Hotel incluido</dt>
                  <dd className={p.hotelIncluded ? "text-emerald-400" : "text-gray-500"}>
                    {p.hotelIncluded ? "Sí" : "No (a tu cargo)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Tarifa mínima</dt>
                  <dd className="text-gray-300">{p.fareRequirement}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Cómo bookear un stopover paso a paso</h2>
        <ol className="space-y-3 text-gray-300 list-decimal list-inside">
          <li>Identifica tu ruta principal (ejemplo: Madrid-Tokio).</li>
          <li>Busca aerolíneas con stopover en hub intermedio (ejemplo: Turkish via IST).</li>
          <li>En la web de la aerolínea, busca "Multi-city" o "Stopover" en el modo de búsqueda.</li>
          <li>Configura: ida MAD-IST + estancia 2 noches + IST-NRT.</li>
          <li>Verifica que el precio total no aumenta más de €30-50 vs vuelo directo (suele ser igual o menor).</li>
          <li>Si la aerolínea ofrece programa específico (Singapore SSH, Qatar Stopover), añade el paquete con hotel + tour.</li>
          <li>Confirma reserva. Recibes 2 vouchers: vuelo principal + estancia stopover.</li>
        </ol>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Más estrategias avanzadas</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Stopovers son solo una de las técnicas de cazadores avanzados. Descarga gratis nuestro PDF "30 trucos avanzados".
        </p>
        <a
          href="/lead-magnet/30-trucos-avanzados"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Descargar PDF →
        </a>
      </section>
    </div>
  );
}
