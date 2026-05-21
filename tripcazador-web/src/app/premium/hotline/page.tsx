/**
 * /premium/hotline — SSS372 (21 may 2026)
 *
 * Landing del Voice Hotline Premium. Audience: Premium users que
 * quieren chollos por voz (manos libres, conduciendo, en cocina).
 *
 * MVP UI: campo de texto + botón "preguntar AI". Iteración 2 añade
 * Web Speech API mic input. Iteración 3 push notifs.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { HotlineClient } from "@/components/HotlineClient";

export const metadata: Metadata = {
  title: "Hotline Premium — Pregunta por voz a tu AI Concierge | TripCazador",
  description:
    "Pregúntale a tu AI Concierge por chollos con voz: 'Tokio en agosto barato'. Respuesta en 3 segundos con audio + recomendación.",
  alternates: { canonical: "https://tripcazador.com/premium/hotline" },
  openGraph: {
    title: "Hotline Premium TripCazador — AI Concierge por voz",
    description: "Pregunta por voz, recibe chollos personalizados al instante.",
    url: "https://tripcazador.com/premium/hotline",
  },
};

export default function PremiumHotlinePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-purple-500/10 p-6 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">🎙️</div>
          <div>
            <h1 className="text-3xl font-bold text-white">Hotline Premium</h1>
            <p className="text-sm text-amber-300">Pregunta por voz a tu AI Concierge</p>
          </div>
        </div>
        <p className="text-gray-200">
          Pregúntale lo que quieras: <em>&quot;Vuelos a Tokio en agosto baratos&quot;</em> o{" "}
          <em>&quot;¿Bali en septiembre vale la pena?&quot;</em>. El AI Concierge te responde
          en 3 segundos con chollos del catálogo y, si Premium Anual, reserva via Concierge.
        </p>
      </div>

      <HotlineClient />

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-4">
          <div className="text-2xl mb-2">⚡</div>
          <h3 className="font-bold text-white text-sm">Respuesta en 3s</h3>
          <p className="text-xs text-gray-400 mt-1">
            GPT-4 + ElevenLabs procesan tu pregunta y devuelven audio en español natural.
          </p>
        </div>
        <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-4">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-bold text-white text-sm">Hot deals al instante</h3>
          <p className="text-xs text-gray-400 mt-1">
            Conoce el catálogo TripCazador y sugiere los chollos más relevantes.
          </p>
        </div>
        <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-4">
          <div className="text-2xl mb-2">🤝</div>
          <h3 className="font-bold text-white text-sm">Reserva con un &quot;sí&quot;</h3>
          <p className="text-xs text-gray-400 mt-1">
            Premium Anual incluye 1 reserva Concierge/mes — di &quot;sí&quot; y nos
            encargamos.
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-sm text-gray-400 mb-3">
          Hotline incluido en Premium Anual (€99/yr) · 5 llamadas/mes en mensual
        </p>
        <Link
          href="/premium"
          className="inline-block px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
        >
          Activar Premium →
        </Link>
      </div>
    </main>
  );
}
