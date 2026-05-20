/**
 * /whatsapp — SSS365 (21 may 2026)
 *
 * Hub público de chats WhatsApp por destino + opt-in 1-on-1 alerts.
 * Tu idea original: subscribers en chats nicho con bot que filtra deals.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppOptInWidget } from "@/components/WhatsAppOptInWidget";
import { WHATSAPP_CHATS, getActiveChats } from "@/lib/whatsapp_chats";

export const metadata: Metadata = {
  title: "Chollos de vuelos por WhatsApp · alertas en <60s | TripCazador",
  description:
    "Recibe alertas de error fares y chollos de vuelos directamente en tu WhatsApp. Grupos por destino (Asia, América, Europa, África) o 1-on-1. Sin spam.",
  alternates: { canonical: "/whatsapp" },
};

export default function WhatsAppPage() {
  const activeChats = getActiveChats();
  return (
    <div className="space-y-10">
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          WhatsApp
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Chollos de vuelo en tu WhatsApp
        </h1>
        <p className="text-lg text-gray-300">
          Recibe los chollos en menos de 60 segundos. Sin grupos ruidosos, sin
          spam. Tu eliges: 1-on-1 personalizado o canal por destino.
        </p>
      </header>

      {/* 1-on-1 Opt-in */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-3 text-center">
          🎯 Opción A · Alertas personalizadas
        </h2>
        <p className="text-sm text-gray-400 text-center mb-4">
          Recibes los chollos que matchean tu perfil (origen, presupuesto, fechas). Más relevante, menos ruido.
        </p>
        <WhatsAppOptInWidget variant="inline" source="whatsapp_landing" />
      </section>

      {/* Grupos públicos */}
      <section>
        <h2 className="text-xl font-bold text-white mb-3 text-center">
          🌍 Opción B · Canales por destino
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6 max-w-2xl mx-auto">
          Únete a comunidades de viajeros con interés similar. Bot oficial postea
          solo deals matching ese destino. Tú decides cuántos canales sigues.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WHATSAPP_CHATS.map((chat) => (
            <div
              key={chat.slug}
              className={`rounded-2xl border p-5 ${
                chat.active
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60"
                  : "border-gray-800 bg-gray-900 opacity-70"
              }`}
            >
              <div className="text-3xl mb-2">{chat.emoji}</div>
              <h3 className="font-bold text-white">{chat.display}</h3>
              <p className="text-xs text-gray-400 mt-1">{chat.description}</p>
              <p className="text-[10px] text-gray-500 mt-2">
                {chat.destinations.includes("*")
                  ? "Todos los destinos"
                  : `${chat.destinations.length} destinos: ${chat.destinations.slice(0, 4).join(", ")}${chat.destinations.length > 4 ? "…" : ""}`}
              </p>
              {chat.active && chat.invite_link ? (
                <a
                  href={chat.invite_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold"
                >
                  Unirse al canal →
                </a>
              ) : (
                <p className="mt-3 text-center text-xs text-gray-500 italic">
                  Próximamente
                </p>
              )}
            </div>
          ))}
        </div>
        {activeChats.length === 0 && (
          <p className="text-center text-xs text-gray-500 mt-6">
            ⚠ Los canales se activan tras configuración WhatsApp Business + Meta.
            Mientras tanto, suscríbete arriba para alertas personalizadas.
          </p>
        )}
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          Preguntas frecuentes
        </h2>
        <div className="space-y-2">
          <details className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white">
              ¿Es gratis?
            </summary>
            <p className="text-sm text-gray-300 mt-2">
              Sí. Tanto alertas 1-on-1 como canales son 100% gratis. Premium
              añade prioridad &lt;60s (vs ~5min en free) + secret deals.
            </p>
          </details>
          <details className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white">
              ¿Cómo me doy de baja?
            </summary>
            <p className="text-sm text-gray-300 mt-2">
              Responde &ldquo;BAJA&rdquo;, &ldquo;STOP&rdquo; o &ldquo;UNSUBSCRIBE&rdquo;
              al mensaje del bot. Te quitamos inmediatamente. Para canales, abandona el grupo desde WhatsApp.
            </p>
          </details>
          <details className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white">
              ¿Vendéis mis datos?
            </summary>
            <p className="text-sm text-gray-300 mt-2">
              No. Tu número solo se usa para enviarte chollos TripCazador.
              Conforme RGPD + Meta Business Policies. Eliminado a primera petición.
            </p>
          </details>
          <details className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white">
              ¿Cuántos mensajes al mes?
            </summary>
            <p className="text-sm text-gray-300 mt-2">
              1-on-1: 2-5 alertas/mes matched a tu perfil. Canales por destino:
              3-8 al mes según popularidad. Bot solo postea deals reales (no spam).
            </p>
          </details>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
        <h2 className="text-lg font-bold text-white mb-2">¿Prefieres email o Telegram?</h2>
        <p className="text-sm text-gray-400 mb-4">
          También enviamos chollos por email (newsletter semanal) y Telegram (canal +8k miembros).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="text-sm text-amber-400 hover:underline">
            📧 Newsletter email
          </Link>
          <span className="text-gray-700">·</span>
          <a
            href="https://t.me/TripCazador"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-400 hover:underline"
          >
            💬 Canal Telegram
          </a>
        </div>
      </section>
    </div>
  );
}
