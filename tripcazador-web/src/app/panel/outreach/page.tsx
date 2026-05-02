import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { OUTREACH_TEMPLATES } from "@/lib/outreach_templates";
import { OutreachClient } from "@/components/OutreachClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Outreach — TripCazador Panel",
  robots: "noindex,nofollow",
};

export default function OutreachPage() {
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
              Outreach templates
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Outreach a partners</h1>
        <p className="text-gray-400 mb-6">
          Templates de email para conseguir partnerships afiliados. Copia, edita
          y manda desde contacto@tripcazador.com (Cloudflare Email Routing →
          Hotmail). Personaliza{" "}
          <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">
            {"{{brand_name}}"}
          </code>{" "}
          al nombre de la marca antes de enviar.
        </p>

        <OutreachClient templates={OUTREACH_TEMPLATES} />
      </div>
    </main>
  );
}
