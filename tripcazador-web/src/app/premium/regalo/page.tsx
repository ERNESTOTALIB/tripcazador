import type { Metadata } from "next";
import { PremiumGiftClient } from "@/components/PremiumGiftClient";

export const metadata: Metadata = {
  title: "Regala Premium · TripCazador",
  description:
    "Regala 1 mes de TripCazador Premium por 9,99€. Alertas instantáneas, secret deals, watch deals + más para tu amigo viajero.",
  alternates: { canonical: "/premium/regalo" },
};

export default function PremiumGiftPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <header className="text-center space-y-3">
        <div className="inline-block text-5xl">🎁</div>
        <h1 className="text-4xl font-bold text-white">
          Regala TripCazador <em className="text-amber-400 not-italic">Premium</em>
        </h1>
        <p className="text-lg text-gray-300 max-w-lg mx-auto">
          1 mes de alertas instantáneas, secret deals, watch deals y todas las
          features Premium para esa persona viajera de tu vida. Por sólo 9,99€.
        </p>
      </header>

      <PremiumGiftClient />

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4 text-sm text-gray-300">
        <h2 className="text-base font-bold text-white">¿Cómo funciona?</h2>
        <ol className="space-y-2 list-decimal pl-5">
          <li>Introduces el email del destinatario + tu mensaje opcional.</li>
          <li>Pagas 9,99€ con Stripe (un solo pago, no recurrente).</li>
          <li>
            La persona recibe un email con un link para activar su mes Premium.
            No necesita registrarse ni dar tarjeta.
          </li>
          <li>Cuando expira el mes, no se cobra nada — Premium gratis y se acabó.</li>
        </ol>
      </div>

      <div className="text-center text-xs text-gray-500">
        ¿Quieres Premium para ti?{" "}
        <a href="/premium" className="text-amber-400 hover:underline">
          Suscríbete desde 8,25€/mes
        </a>
      </div>
    </div>
  );
}
