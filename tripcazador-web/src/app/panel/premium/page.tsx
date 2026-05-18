/**
 * /panel/premium — SSS301 (18 may 2026)
 *
 * Dashboard del cliente suscriptor Premium.
 * - Estado suscripción visible (active/inactive/trial expira)
 * - Tutorial de las 4 features (con links directos)
 * - Email soporte prioritario directo (mailto)
 * - CTA si no es Premium → /premium upgrade
 *
 * Esta página es client-side (lee localStorage). Render universal.
 */
import type { Metadata } from "next";
import { PremiumPanelClient } from "@/components/PremiumPanelClient";

export const metadata: Metadata = {
  title: "Tu Premium — TripCazador",
  description: "Panel de suscripción Premium: estado, soporte prioritario y guía de las 4 features.",
  alternates: { canonical: "/panel/premium" },
  robots: { index: false, follow: false }, // Auth-gated panel, no SEO
};

export default function PremiumPanelPage() {
  return <PremiumPanelClient />;
}
