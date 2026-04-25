import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deal no encontrado — TripCazador",
  description: "La oferta que buscas ya no está disponible o ha expirado.",
  robots: { index: false, follow: false },
};

export default function DealNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 py-20">
      <div className="text-6xl">✈️💨</div>
      <div>
        <h1 className="text-3xl font-bold text-white">Esta oferta voló</h1>
        <p className="mt-2 text-gray-400 max-w-md">
          El deal que buscas ya no está disponible o ha expirado. Los chollos
          buenos no duran mucho. Mira los activos ahora mismo:
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/deals"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-all"
        >
          Ver deals activos →
        </Link>
        <Link
          href="/telegram"
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
        >
          Suscribirme al canal Telegram
        </Link>
      </div>
    </div>
  );
}
