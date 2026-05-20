import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ConciergeMyOrdersClient } from "@/components/ConciergeMyOrdersClient";
import {
  issueConciergeAccessToken,
  verifyConciergeAccessToken,
  CONCIERGE_ACCESS_TTL_SEC,
} from "@/lib/concierge_access_token";

export const metadata: Metadata = {
  title: "Mis pedidos Concierge — TripCazador",
  description:
    "Revisa el estado de tus pedidos Concierge y accede a los planes entregados.",
  robots: { index: false, follow: false },
  // SSS329 M3: meta referrer no-referrer
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

const COOKIE_NAME = "tc_concierge_portal";

export default async function ConciergeMisPedidosPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const urlToken = searchParams?.token || "";

  // SSS332: si llega ?token=xxx, validar server-side y set cookie
  // httpOnly. Después redirect a /concierge/mis-pedidos (sin query) →
  // token NO queda sticky en URL (cierra M3 del audit anterior).
  if (urlToken) {
    const claims = verifyConciergeAccessToken(urlToken);
    if (claims) {
      // Reissue token con timestamp fresh (cookie cubre TTL completo)
      const reissued = issueConciergeAccessToken(claims.email);
      const ck = await cookies();
      ck.set(COOKIE_NAME, reissued, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/concierge",
        maxAge: CONCIERGE_ACCESS_TTL_SEC,
      });
    }
    // Redirect a la URL limpia siempre (token válido o inválido — el
    // cliente decidirá según cookie)
    redirect("/concierge/mis-pedidos");
  }

  // Sin token en URL: leer cookie
  const ck = await cookies();
  const cookieToken = ck.get(COOKIE_NAME)?.value;
  const hasValidSession = cookieToken
    ? verifyConciergeAccessToken(cookieToken) !== null
    : false;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <ConciergeMyOrdersClient
          initialToken={hasValidSession ? (cookieToken as string) : ""}
        />
      </div>
    </main>
  );
}
