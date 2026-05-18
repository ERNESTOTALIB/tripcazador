import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gracias — Agencia TripCazador",
  description: "Hemos recibido tu petición. En menos de 24h te enviaremos las 3 mejores opciones.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AgenciaGraciasPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id || "";
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">¡Petición recibida!</h1>
        <p className="text-gray-300">
          Te hemos enviado un email con los detalles de tu ticket. Procesaremos tu petición en
          menos de 24h laborables.
        </p>
        {sessionId && (
          <p className="text-xs text-gray-500 font-mono">
            Session ID: {sessionId.slice(0, 24)}…
          </p>
        )}
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 text-left">
          <h2 className="font-bold mb-2">🏆 Tu garantía</h2>
          <p className="text-sm text-gray-300">
            Tienes 7 días desde la recepción de la propuesta para encontrar el mismo viaje más barato.
            Si lo encuentras, te devolvemos el pago + 1 mes Premium gratis desde{" "}
            <Link href="/panel/agencia" className="text-amber-400 underline">
              tu panel
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-3 justify-center text-sm">
          <Link href="/panel/agencia" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg">
            Ver mis tickets
          </Link>
          <Link href="/" className="px-4 py-2 border border-gray-700 hover:border-gray-500 rounded-lg">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
