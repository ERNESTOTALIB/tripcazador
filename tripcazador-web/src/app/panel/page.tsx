import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { PanelDashboard } from "@/components/PanelDashboard";
import { PanelLogoutButton } from "@/components/PanelLogoutButton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Panel — TripCazador",
  robots: "noindex,nofollow",
};

/**
 * /panel — fase tt-TT3 (refactor robusto)
 *
 * Bug previo: pantalla blanca tras login. Root cause sospechado:
 *  - Client component <form> con <button onClick={preventDefault}> causaba
 *    React hydration error → Next devolvía error boundary default vacía.
 *  - O bug en server component al hacer cookies().get() bajo dynamic render.
 *
 * Fix: try/catch defensivo en server, logout button extracted client component,
 * fallback UI si verifyToken throws.
 */
export default function PanelPage() {
  let session;
  try {
    session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  } catch (err) {
    // Si verifyToken throws (config issue), forzar a login en vez de blanca
    console.error("[/panel] verifyToken error:", err);
    redirect("/panel/login");
  }
  if (!session) {
    redirect("/panel/login");
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-lg">⚡ TripCazador Panel</span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Sesión: {session.user}
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/panel/concierge"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Concierge €19
            </Link>
            <Link
              href="/panel/share"
              className="text-xs text-gray-400 hover:text-amber-300"
            >
              Share kit
            </Link>
            <Link
              href="/panel/outreach"
              className="text-xs text-gray-400 hover:text-amber-300"
            >
              Outreach
            </Link>
            <Link
              href="/panel/vitals"
              className="text-xs text-gray-400 hover:text-amber-300"
            >
              Vitals
            </Link>
            <Link href="/" className="text-xs text-gray-400 hover:text-amber-300">
              ← Ir al sitio
            </Link>
            <PanelLogoutButton />
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PanelDashboard />
      </div>
    </main>
  );
}
