import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { PanelDashboard } from "@/components/PanelDashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function PanelPage() {
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
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
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-amber-300">
              ← Ir al sitio
            </Link>
            <form action="/api/panel/logout" method="POST" className="inline">
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  fetch("/api/panel/logout", { method: "POST" }).then(() => {
                    window.location.href = "/panel/login";
                  });
                }}
                className="text-xs text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PanelDashboard />
      </div>
    </main>
  );
}
