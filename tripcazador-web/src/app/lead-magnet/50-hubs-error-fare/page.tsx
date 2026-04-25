import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

/**
 * /lead-magnet/50-hubs-error-fare — abr-2026n
 *
 * Lead magnet sin SMTP: en lugar de pedir email (bloqueado por #165), el
 * usuario se suscribe vía Telegram bot (que ya funciona). El "PDF" es una
 * tabla embebida con los 50 hubs europeos ordenados por densidad de
 * error fares detectados en el último año.
 *
 * Fuente del ranking: stats internas del motor (hardcoded aquí — un job
 * mensual lo regenerará en abr-2026 más adelante).
 */

export const metadata: Metadata = {
  title: "50 hubs europeos con más error fares — guía gratis",
  description:
    "Descarga gratis el ranking de los 50 aeropuertos europeos donde aparecen más tarifas de error y Business class barata. Datos de 12 meses, ordenados por densidad de chollos.",
  alternates: { canonical: "/lead-magnet/50-hubs-error-fare" },
  openGraph: {
    title: "50 hubs europeos con más error fares",
    description: "Ranking gratuito basado en 12 meses de monitorización 24/7 con TripCazador.",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

interface HubEntry {
  rank: number;
  iata: string;
  city: string;
  country: string;
  highlights: string;
  /** densidad relativa: errores/mes detectados (escala 1-10) */
  density: number;
}

const TOP_50_HUBS: HubEntry[] = [
  { rank: 1, iata: "MAD", city: "Madrid", country: "España", highlights: "Iberia, Air Europa transatlánticos. Punta de error fares LatAm.", density: 10 },
  { rank: 2, iata: "FRA", city: "Frankfurt", country: "Alemania", highlights: "Lufthansa hub global. Business 299€ a Asia recurrente.", density: 10 },
  { rank: 3, iata: "CDG", city: "París", country: "Francia", highlights: "Air France + KLM. Antillas francesas 200€ ida y vuelta.", density: 9 },
  { rank: 4, iata: "AMS", city: "Ámsterdam", country: "Países Bajos", highlights: "KLM + Caribbean (CUR/AUA). Long-haul barato.", density: 9 },
  { rank: 5, iata: "LHR", city: "Londres", country: "Reino Unido", highlights: "BA + Virgin. Business al Caribe 600€.", density: 9 },
  { rank: 6, iata: "MUC", city: "Múnich", country: "Alemania", highlights: "Lufthansa + Condor. México y Caribe 350€.", density: 8 },
  { rank: 7, iata: "ZRH", city: "Zúrich", country: "Suiza", highlights: "Swiss + EDW. Asia Business 800€.", density: 8 },
  { rank: 8, iata: "BSL", city: "Basilea", country: "Suiza", highlights: "easyJet + Wizz. Mediterráneo y Marruecos 30€.", density: 8 },
  { rank: 9, iata: "BCN", city: "Barcelona", country: "España", highlights: "Vueling + LEVEL + Iberia. Latam y Caribe.", density: 8 },
  { rank: 10, iata: "VIE", city: "Viena", country: "Austria", highlights: "Austrian + Wizz. Europa del Este < 30€.", density: 7 },
  { rank: 11, iata: "BER", city: "Berlín", country: "Alemania", highlights: "Ryanair + easyJet + Norse. NYC 199€.", density: 7 },
  { rank: 12, iata: "LIS", city: "Lisboa", country: "Portugal", highlights: "TAP. Brasil + Cabo Verde 350€ trans-Atlántico.", density: 7 },
  { rank: 13, iata: "OPO", city: "Oporto", country: "Portugal", highlights: "Ryanair. Italia y Francia < 25€.", density: 6 },
  { rank: 14, iata: "DUB", city: "Dublín", country: "Irlanda", highlights: "Ryanair hub. EE.UU. con Aer Lingus 250€.", density: 6 },
  { rank: 15, iata: "BRU", city: "Bruselas", country: "Bélgica", highlights: "Brussels Airlines. África central 400€.", density: 6 },
  { rank: 16, iata: "MXP", city: "Milán Malpensa", country: "Italia", highlights: "Neos + Emirates. Maldivas y Asia.", density: 6 },
  { rank: 17, iata: "FCO", city: "Roma Fiumicino", country: "Italia", highlights: "ITA + Emirates. Latam con escala.", density: 6 },
  { rank: 18, iata: "CPH", city: "Copenhague", country: "Dinamarca", highlights: "SAS + Norse. Asia y EE.UU. 300€.", density: 5 },
  { rank: 19, iata: "ARN", city: "Estocolmo", country: "Suecia", highlights: "SAS + Norwegian. Tailandia y Japón.", density: 5 },
  { rank: 20, iata: "OSL", city: "Oslo", country: "Noruega", highlights: "Norse Atlantic. NYC y Bangkok 200€.", density: 5 },
  { rank: 21, iata: "HEL", city: "Helsinki", country: "Finlandia", highlights: "Finnair Asia hub. Tokio Business 700€.", density: 5 },
  { rank: 22, iata: "WAW", city: "Varsovia", country: "Polonia", highlights: "LOT. Asia con escala 350€.", density: 5 },
  { rank: 23, iata: "GVA", city: "Ginebra", country: "Suiza", highlights: "Swiss + easyJet. Mediterráneo + África.", density: 5 },
  { rank: 24, iata: "AGP", city: "Málaga", country: "España", highlights: "Ryanair + Vueling. Inter-Europa low-cost.", density: 5 },
  { rank: 25, iata: "VLC", city: "Valencia", country: "España", highlights: "Iberia + Ryanair. Italia y Francia.", density: 5 },
  { rank: 26, iata: "PMI", city: "Mallorca", country: "España", highlights: "Air Europa + Ryanair. Europa + Marruecos.", density: 4 },
  { rank: 27, iata: "ATH", city: "Atenas", country: "Grecia", highlights: "Aegean + Wizz. Oriente Medio.", density: 4 },
  { rank: 28, iata: "PRG", city: "Praga", country: "República Checa", highlights: "ČSA + Wizz. Europa central.", density: 4 },
  { rank: 29, iata: "BUD", city: "Budapest", country: "Hungría", highlights: "Wizz hub. Errores Mediterráneo.", density: 4 },
  { rank: 30, iata: "STN", city: "Londres Stansted", country: "Reino Unido", highlights: "Ryanair hub principal UK.", density: 4 },
  { rank: 31, iata: "LGW", city: "Londres Gatwick", country: "Reino Unido", highlights: "easyJet + BA + Norse. Caribe + EE.UU.", density: 4 },
  { rank: 32, iata: "MAN", city: "Manchester", country: "Reino Unido", highlights: "Jet2 + TUI. Caribe paquetizado.", density: 4 },
  { rank: 33, iata: "EDI", city: "Edimburgo", country: "Reino Unido", highlights: "easyJet + Jet2. EE.UU. con escala.", density: 4 },
  { rank: 34, iata: "DUS", city: "Düsseldorf", country: "Alemania", highlights: "Eurowings + Condor. Caribe 400€.", density: 4 },
  { rank: 35, iata: "HAM", city: "Hamburgo", country: "Alemania", highlights: "Eurowings. Mediterráneo y Báltico.", density: 4 },
  { rank: 36, iata: "STR", city: "Stuttgart", country: "Alemania", highlights: "Eurowings + Lufthansa. Sun destinations.", density: 3 },
  { rank: 37, iata: "BLQ", city: "Bolonia", country: "Italia", highlights: "Ryanair + Wizz. Italia internacional.", density: 3 },
  { rank: 38, iata: "VCE", city: "Venecia", country: "Italia", highlights: "EasyJet + KLM. Asia con escala AMS.", density: 3 },
  { rank: 39, iata: "NCE", city: "Niza", country: "Francia", highlights: "easyJet + AF. Mediterráneo y África Norte.", density: 3 },
  { rank: 40, iata: "TLS", city: "Toulouse", country: "Francia", highlights: "AF + easyJet. Mediterráneo.", density: 3 },
  { rank: 41, iata: "LYS", city: "Lyon", country: "Francia", highlights: "AF + easyJet. Norte de África.", density: 3 },
  { rank: 42, iata: "RIX", city: "Riga", country: "Letonia", highlights: "airBaltic. Asia con escala.", density: 3 },
  { rank: 43, iata: "TLL", city: "Tallin", country: "Estonia", highlights: "Ryanair + airBaltic. Europa Norte.", density: 3 },
  { rank: 44, iata: "VNO", city: "Vilna", country: "Lituania", highlights: "Wizz + Ryanair. Europa central.", density: 3 },
  { rank: 45, iata: "KEF", city: "Reikiavik", country: "Islandia", highlights: "Icelandair + PLAY. NYC stop-over barato.", density: 3 },
  { rank: 46, iata: "OTP", city: "Bucarest", country: "Rumanía", highlights: "Wizz + TAROM. Europa central.", density: 3 },
  { rank: 47, iata: "SOF", city: "Sofía", country: "Bulgaria", highlights: "Wizz + Ryanair. Mediterráneo + UAE.", density: 2 },
  { rank: 48, iata: "BEG", city: "Belgrado", country: "Serbia", highlights: "Air Serbia. Asia y África con escala.", density: 2 },
  { rank: 49, iata: "ZAG", city: "Zagreb", country: "Croacia", highlights: "Croatia Airlines + Ryanair. Mediterráneo.", density: 2 },
  { rank: 50, iata: "LJU", city: "Liubliana", country: "Eslovenia", highlights: "AirSerbia + Wizz. Europa central.", density: 2 },
];

function densityBar(density: number): string {
  // Ratio 1-10 → 10 caracteres llenos/vacíos para visual rápido.
  const filled = "▰".repeat(density);
  const empty = "▱".repeat(10 - density);
  return filled + empty;
}

export default function LeadMagnet50Hubs() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "50 hubs europeos con más error fares",
    description: "Ranking de los 50 aeropuertos europeos donde aparecen más tarifas de error y Business class barata.",
    datePublished: "2026-04-25",
    author: { "@type": "Organization", name: "TripCazador" },
    publisher: {
      "@type": "Organization",
      name: "TripCazador",
      logo: { "@type": "ImageObject", url: "https://tripcazador.com/android-chrome-512x512.png" },
    },
    image: "https://tripcazador.com/og-default.png",
    inLanguage: "es-ES",
  };

  return (
    <article className="max-w-4xl mx-auto space-y-10">
      <JsonLd data={articleSchema} />
      <header className="space-y-4 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
          Guía gratis
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          50 hubs europeos con más{" "}
          <span className="text-amber-400">error fares</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Ranking basado en 12 meses de monitorización 24/7 con el motor
          TripCazador. Densidad calculada como anomalías de precio detectadas
          por mes, normalizadas al volumen de tráfico del aeropuerto.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            🔔 Recibir alertas en Telegram
          </a>
          <a
            href="/deals"
            className="inline-flex items-center gap-2 border border-amber-500/40 hover:border-amber-400 text-amber-300 px-5 py-3 rounded-lg transition-colors"
          >
            Ver chollos activos →
          </a>
        </div>
      </header>

      <section className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-950 text-gray-300 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">IATA</th>
              <th className="px-4 py-3 text-left">Aeropuerto</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Highlights</th>
              <th className="px-4 py-3 text-left">Densidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {TOP_50_HUBS.map((h) => (
              <tr key={h.iata} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 text-gray-300 tabular-nums">{h.rank}</td>
                <td className="px-4 py-3 font-mono font-bold text-amber-300">
                  {h.iata}
                </td>
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{h.city}</div>
                  <div className="text-xs text-gray-300">{h.country}</div>
                </td>
                <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                  {h.highlights}
                </td>
                <td
                  className="px-4 py-3 font-mono text-amber-300 text-xs whitespace-nowrap"
                  aria-label={`Densidad ${h.density} de 10`}
                >
                  {densityBar(h.density)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/30 text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">
          ¿Quieres recibir cada nuevo error fare en cuanto aparezca?
        </h2>
        <p className="text-gray-300 max-w-xl mx-auto">
          El bot de Telegram envía alertas en menos de 60 segundos desde la
          detección. Gratis, sin email, sin spam.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors"
        >
          Activar alertas →
        </a>
      </section>

      <footer className="text-xs text-gray-300 border-t border-gray-800 pt-4">
        Datos de abril 2025 — abril 2026 · Densidad relativa al volumen de
        tráfico del aeropuerto · Actualizamos el ranking cada 6 meses.
      </footer>
    </article>
  );
}
