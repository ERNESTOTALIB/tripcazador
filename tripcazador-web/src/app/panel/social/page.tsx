import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { PanelLogoutButton } from "@/components/PanelLogoutButton";
import { SocialDashboard } from "@/components/SocialDashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Panel · Social — TripCazador",
  robots: "noindex,nofollow",
};

/**
 * /panel/social — fase ww3
 * Dashboard de auto-publishing redes sociales:
 *  - Queue de posts generados (DRY_RUN | PUBLISHED)
 *  - Stats por template y plataforma
 *  - Live toggle (informativo · real toggle es env var SOCIAL_LIVE)
 *  - Approve / Skip por record (overrides aplicados en próximo run live)
 */
export default function PanelSocialPage() {
  let session;
  try {
    session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  } catch {
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
            <Link href="/panel" className="text-amber-400 font-bold text-lg hover:text-amber-300">
              ⚡ TripCazador Panel
            </Link>
            <span className="text-xs text-gray-500">/ Social</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/panel" className="text-xs text-gray-400 hover:text-amber-300">← Dashboard</Link>
            <Link href="/panel/share" className="text-xs text-gray-400 hover:text-amber-300">Share kit</Link>
            <Link href="/panel/outreach" className="text-xs text-gray-400 hover:text-amber-300">Outreach</Link>
            <Link href="/" className="text-xs text-gray-400 hover:text-amber-300">← Sitio</Link>
            <PanelLogoutButton />
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Auto-publishing redes sociales</h1>
        <p className="text-sm text-gray-400 mb-6">
          Cron cada 4h tira chollos vivos de <code className="text-amber-300">/api/deals</code>,
          genera posts en Canva (mock o live), y publica a IG · FB · TikTok · Pinterest · Telegram.
        </p>
        <SocialDashboard />
      </div>
    </main>
  );
}
