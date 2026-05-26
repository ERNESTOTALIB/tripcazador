/**
 * /viajar-mascotas — NEXT batch (26 may 2026)
 *
 * Guía completa viajar con perro/gato en avión.
 * "viajar con perro avion" 3-5k búsquedas/mes ES + LATAM combined.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  breadcrumbSchema,
  faqPageSchema,
  howToSchema,
  articleSchema,
} from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Viajar con perro o gato en avión: guía 2026",
  description: "Guía completa viajar con mascota: documentación, microchip, vacuna rabia, jaula IATA, mascota cabina vs bodega, restricciones por país y aerolínea.",
  alternates: { canonical: `${SITE_URL}/viajar-mascotas` },
  openGraph: {
    title: "Viajar con perro o gato en avión 2026",
    description: "Requisitos completos para viajar con mascota: pasaporte, vacuna, jaula IATA, comparativa aerolíneas ES.",
    url: `${SITE_URL}/viajar-mascotas`,
    type: "article",
  },
};

const AEROLINEAS_TARIFAS = [
  { code: "IB", name: "Iberia", cabinaEur: 25, bodegaEur: 100, cabinaPesoKg: 8, bodegaPesoKg: 75, notas: "Mascotas grandes: max 75kg (mascota + jaula). Razas braquicéfalas restricción verano." },
  { code: "FR", name: "Ryanair", cabinaEur: 0, bodegaEur: 0, cabinaPesoKg: 0, bodegaPesoKg: 0, notas: "NO acepta mascotas (excepto perros de asistencia para personas con discapacidad)." },
  { code: "VY", name: "Vueling", cabinaEur: 50, bodegaEur: 0, cabinaPesoKg: 8, bodegaPesoKg: 0, notas: "Solo cabina (no bodega). Max 8kg incluida jaula. Reserva online +24h antes." },
  { code: "U2", name: "easyJet", cabinaEur: 0, bodegaEur: 0, cabinaPesoKg: 0, bodegaPesoKg: 0, notas: "NO acepta mascotas (excepto perros de asistencia)." },
  { code: "LH", name: "Lufthansa", cabinaEur: 70, bodegaEur: 200, cabinaPesoKg: 8, bodegaPesoKg: 75, notas: "Bodega calefactada hasta 75kg. Excelente reputación animales." },
  { code: "AF", name: "Air France", cabinaEur: 75, bodegaEur: 200, cabinaPesoKg: 8, bodegaPesoKg: 75, notas: "Hold pet program premium. Excelente experience for big dogs." },
  { code: "KL", name: "KLM", cabinaEur: 75, bodegaEur: 200, cabinaPesoKg: 8, bodegaPesoKg: 75, notas: "Animal Hotel Schiphol — para conexiones largas." },
  { code: "TP", name: "TAP Portugal", cabinaEur: 35, bodegaEur: 80, cabinaPesoKg: 8, bodegaPesoKg: 32, notas: "Más permisivo razas braquicéfalas que otras." },
  { code: "BA", name: "British Airways", cabinaEur: 0, bodegaEur: 1200, cabinaPesoKg: 0, bodegaPesoKg: 75, notas: "Solo bodega (IAG Cargo). Caro pero excelente cuidado. UK no permite cabina." },
  { code: "EK", name: "Emirates", cabinaEur: 0, bodegaEur: 800, cabinaPesoKg: 0, bodegaPesoKg: 75, notas: "Solo bodega (Skycargo). Bien acondicionada. Caro." },
];

const HOWTO_STEPS = [
  {
    name: "1. Microchip + vacuna rabia",
    text: "Mascota debe tener microchip ISO 11784/11785 + vacuna rabia válida (mínimo 21 días, máximo 12 meses antes del vuelo).",
  },
  {
    name: "2. Pasaporte europeo",
    text: "Pasaporte UE para mascotas (formato libreta) emitido por veterinario autorizado. Incluye datos identificación, vacunas, microchip.",
  },
  {
    name: "3. Reservar plaza mascota con aerolínea",
    text: "Plazas mascotas son limitadas (típicamente 2-6 por vuelo). Reserva ANTES de comprar tu billete o min 48h antes.",
  },
  {
    name: "4. Jaula IATA aprobada",
    text: "Cabina: jaula blanda con medidas según aerolínea (típico 45×35×25 cm). Bodega: jaula rígida IATA con ventilación 4 lados, base estanca, bebedero externo.",
  },
  {
    name: "5. Aclimatación a la jaula",
    text: "Mínimo 2 semanas antes: dejar jaula en casa, premiar entrada, hacer trayectos cortos en coche con ella. Reduce stress vuelo en 70%.",
  },
  {
    name: "6. Día del vuelo",
    text: "No alimentar 4-6h antes. Agua sí. Paseo largo justo antes del check-in. Llevar documentación + pasaporte mascota + reserva confirmada plaza.",
  },
];

const FAQ = [
  {
    q: "¿Puede mi perro viajar en cabina conmigo?",
    a: "Sí en la mayoría de aerolíneas si mascota + jaula pesa ≤8kg. Iberia, Vueling, Lufthansa, Air France, KLM permiten cabina. Ryanair y easyJet NO (excepto perros asistencia). Británica BA solo bodega.",
  },
  {
    q: "¿Cuánto cuesta llevar un perro en avión?",
    a: "Cabina: 25-75€ vuelos europeos (Iberia 25€, AF 75€). Bodega: 80-200€ Europa (TAP 80€, AF/KL/LH 200€). Larga distancia: 800-1500€ (Emirates 800$, BA 1200€).",
  },
  {
    q: "¿Necesito un certificado veterinario para el vuelo?",
    a: "Sí. Pasaporte mascota europeo + certificado salud emitido 7-10 días antes del vuelo. Para destinos extra-EU verifica requisitos país (algunos exigen test serológico rabia adicional).",
  },
  {
    q: "¿Mi perro puede ir suelto en cabina?",
    a: "No. Debe ir en jaula homologada bajo el asiento delantero durante todo el vuelo. Algunas aerolíneas permiten sacarlo brevemente sentado (verifica con asistente).",
  },
  {
    q: "¿Qué razas tienen restricciones?",
    a: "Razas braquicéfalas (bulldog, pug, boxer, persa, himalayo): muchas aerolíneas restringen en bodega Jun-Sep por riesgo asfixia. Iberia, BA, AF NO transportan en bodega verano. Lufthansa con seguro veterinario adicional.",
  },
  {
    q: "¿Puedo sedar a mi perro para el vuelo?",
    a: "NO recomendado por IATA, ACVA y mayoría veterinarios. Sedación + altitud = riesgo cardiorespiratorio. Si necesita tranquilizante por ansiedad severa, consultar veterinario para alternativas suaves (feromonas, hierbas).",
  },
  {
    q: "¿Mi gato puede viajar igual que un perro?",
    a: "Sí — mismas reglas básicas. Cabina solo si <8kg con jaula. Gatos tienden a estresarse más — aclimatación previa más importante. Algunas aerolíneas solo aceptan gatos en cabina, no bodega.",
  },
  {
    q: "¿Hay aerolíneas Pet-friendly recomendadas?",
    a: "Lufthansa y Air France/KLM tienen mejor reputación para mascotas grandes (bodega calefactada, programa dedicado). TAP es más permisiva con razas braquicéfalas. Iberia OK para cabina pequeño.",
  },
];

export default function ViajarMascotasPage() {
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Viajar con mascotas", url: "/viajar-mascotas" },
  ]);
  const faqLd = faqPageSchema(FAQ);
  const howToLd = howToSchema({
    name: "Cómo viajar con tu mascota en avión",
    description: "Guía paso a paso para viajar con perro o gato en avión desde España",
    totalTime: "P14D",
    estimatedCost: { currency: "EUR", value: 100 },
    steps: HOWTO_STEPS,
  });
  const articleLd = articleSchema({
    headline: "Viajar con perro o gato en avión",
    description: "Guía completa con requisitos, jaula, aerolíneas y FAQ",
    url: `${SITE_URL}/viajar-mascotas`,
    datePublished: "2026-05-26",
    articleSection: "Viajar con mascotas",
    imageUrl: `${SITE_URL}/api/og?title=${encodeURIComponent("Viajar con mascotas en avión")}`,
  });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Viajar con mascotas</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🐶🐱✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Viajar con perro o gato en avión
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Requisitos completos para viajar con tu mascota: documentación,
          microchip, vacuna rabia, jaula IATA aprobada, mascota cabina vs
          bodega. Comparativa aerolíneas españolas y europeas.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-white">📋 Pasos en orden</h2>
        <ol className="space-y-3">
          {HOWTO_STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-white">{s.name.replace(/^\d+\. /, "")}</h3>
                <p className="mt-1 text-sm text-slate-200">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Comparativa aerolíneas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-700">
                <th className="py-2">Aerolínea</th>
                <th className="py-2">Cabina (€/kg)</th>
                <th className="py-2">Bodega (€/kg)</th>
                <th className="py-2">Notas</th>
              </tr>
            </thead>
            <tbody>
              {AEROLINEAS_TARIFAS.map((a, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-3 font-bold text-white">{a.name}</td>
                  <td className="py-3 text-slate-300">
                    {a.cabinaPesoKg > 0 ? `${a.cabinaEur} € / ${a.cabinaPesoKg}kg max` : "—"}
                  </td>
                  <td className="py-3 text-slate-300">
                    {a.bodegaPesoKg > 0 ? `${a.bodegaEur} € / ${a.bodegaPesoKg}kg max` : "—"}
                  </td>
                  <td className="py-3 text-xs text-slate-400">{a.notas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-lg font-bold text-amber-300 mb-3">📏 Medidas jaula IATA</h2>
        <div className="space-y-3 text-sm text-slate-200">
          <div>
            <strong className="text-white">Cabina (perro pequeño / gato):</strong>
            <p className="mt-1 text-slate-300">Jaula blanda con medidas típicas 45×35×25 cm. Verifica tu aerolínea — Iberia y Vueling son ligeramente más restrictivas (43×27×30 cm). Mascota + jaula ≤8kg.</p>
          </div>
          <div>
            <strong className="text-white">Bodega:</strong>
            <p className="mt-1 text-slate-300">Jaula rígida IATA con ventilación en 4 lados, base impermeable, bebedero externo accesible sin abrir. Suficiente para que la mascota se levante y dé media vuelta cómodamente.</p>
          </div>
          <div>
            <strong className="text-white">Etiquetas requeridas:</strong>
            <p className="mt-1 text-slate-300">"Live Animal" (Animal Vivo), pegatinas dirección casa + destino, datos contacto teléfono 24h, microchip número.</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
        <h2 className="mb-3 text-lg font-bold text-rose-300">⚠️ Razas con restricciones</h2>
        <p className="text-sm text-slate-200 mb-3">
          Razas braquicéfalas (cara plana) tienen riesgo respiratorio elevado en altitud:
        </p>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>• <strong>Perros:</strong> Bulldog inglés/francés, Pug, Boxer, Boston Terrier, Pekinés, Shih Tzu</li>
          <li>• <strong>Gatos:</strong> Persa, Himalayo, Exótico de pelo corto, British Shorthair (algunos)</li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Muchas aerolíneas restringen estas razas en bodega entre junio y septiembre.
          Algunas exigen carta veterinaria + seguro especial. Considera transporte
          terrestre o cabina (si peso permite) para estos casos.
        </p>
      </section>

      <section className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
        <h2 className="mb-3 text-lg font-bold text-indigo-300">🌍 Destinos con requisitos especiales</h2>
        <ul className="space-y-2 text-sm text-slate-200">
          <li><strong>UK / Irlanda:</strong> Pet Travel Scheme — chip + rabia + tratamiento tenia 24-120h antes (perros). Solo bodega comercial (no cabina).</li>
          <li><strong>USA / Canadá:</strong> Certificado salud + rabia. EE.UU. no requiere cuarentena pero algunos estados sí (Hawaii).</li>
          <li><strong>Australia / Nueva Zelanda:</strong> Cuarentena obligatoria 10-30 días. Coste alto (1500-3000€). Solo bodega con cargo agent autorizado.</li>
          <li><strong>Japón:</strong> Procedimiento avanzado 7+ meses antes — test serológico, observación. Sin cuarentena si cumples plan.</li>
          <li><strong>Resto Asia / África / LATAM:</strong> Verifica cada país consulado — requisitos varían (algunos sin restricciones más allá de rabia).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">❓ Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details key={i} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <summary className="cursor-pointer font-semibold text-white text-sm">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Relacionado
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/equipaje" className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">🧳 Equipaje aerolíneas</Link>
          <Link href="/viajar-bebes" className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">👶 Viajar con bebés</Link>
          <Link href="/preparar-viaje/japon" className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">📋 Preparar viaje</Link>
          <Link href="/equipo-viaje" className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">🎒 Equipo viaje</Link>
        </div>
      </section>
    </main>
  );
}
