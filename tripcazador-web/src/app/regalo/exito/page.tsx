import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regalo confirmado — TripCazador",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function GiftSuccessPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-amber-400">¡Regalo confirmado!</h1>
      <p className="mt-4 text-gray-300">
        En unos minutos recibirás un email con el código y las instrucciones para entregárselo al receptor.
        Si lo añadiste con email del receptor, ya está en su bandeja.
      </p>
      <div className="mt-8 flex gap-3 justify-center flex-wrap">
        <Link href="/" className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-6 py-3 rounded-lg">
          Volver al inicio
        </Link>
        <Link href="/regalo" className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg">
          Regalar otra
        </Link>
      </div>
    </main>
  );
}
