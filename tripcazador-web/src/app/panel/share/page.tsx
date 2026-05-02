import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { TOP_CONTENT, SHARE_TEMPLATES } from "@/lib/share_templates";
import { ShareKit } from "@/components/ShareKit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Share kit — TripCazador Panel",
  robots: "noindex,nofollow",
};

export default function ShareKitPage() {
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  if (!session) {
    redirect("/panel/login");
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="text-amber-400 font-bold text-lg">
              ← Panel
            </Link>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Distribución de contenido
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Distribución de contenido</h1>
        <p className="text-gray-400 mb-2">
          Templates pre-redactados para Reddit, Twitter/X, Facebook, Threads,
          WhatsApp. Selecciona qué contenido quieres compartir, elige plataforma,
          copia y pega.
        </p>
        <p className="text-amber-400/80 text-sm mb-6">
          🎯 Objetivo: bootstrapping inicial. Sin tráfico, los afiliados no
          generan. Distribución manual los primeros 30-60 días = la palanca real.
        </p>

        <ShareKit content={TOP_CONTENT} templates={SHARE_TEMPLATES} />
      </div>
    </main>
  );
}
