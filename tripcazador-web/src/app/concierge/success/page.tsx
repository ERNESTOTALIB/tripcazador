import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Pago confirmado · Concierge €19 — TripCazador",
  description: "Tu pedido de búsqueda concierge ha sido recibido. Recibirás 3 opciones de vuelo + hotel en 24-48 horas por email.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SearchParams {
  order_id?: string;
  session_id?: string;
}

export default function ConciergeSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const orderId = searchParams?.order_id || "";

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 inline-flex items-center justify-center">
          <Check size={32} className="text-emerald-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          ¡Pago confirmado!
        </h1>
        <p className="text-lg text-gray-300">
          Hemos recibido tu solicitud. Empezamos a buscar tu vuelo + hotel ahora mismo.
        </p>
        {orderId && (
          <p className="text-xs text-gray-500 font-mono">
            Pedido: {orderId}
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Qué pasa ahora</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Clock size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">En las próximas 24-48 horas</h3>
              <p className="text-sm text-gray-400">
                Aplicamos error fares, codeshare arbitrage y secret deals para tu ruta y fechas.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Mail size={20} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Recibes 3 opciones por email</h3>
              <p className="text-sm text-gray-400">
                Con precios reales, links directos a la aerolínea y al hotel. Reservas tú con tu propia tarjeta.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Check size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Garantía &quot;opción mejor&quot;</h3>
              <p className="text-sm text-gray-400">
                Si encuentras una opción mejor en otra plataforma (Skyscanner / Kayak / Expedia / Google Flights) en las 72h tras la entrega, te devolvemos los €19. Manda captura a soporte.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-gray-300">
        <p>
          <strong className="text-amber-300">¿Algo urgente o quieres añadir info?</strong> Escríbenos a{" "}
          <a href="mailto:contacto@tripcazador.com" className="text-amber-400 hover:underline">
            contacto@tripcazador.com
          </a>{" "}
          mencionando tu pedido {orderId && <span className="font-mono">{orderId}</span>}.
        </p>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
