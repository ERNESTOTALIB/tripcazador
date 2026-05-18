import type { Metadata } from "next";
import { AgenciaLandingClient } from "@/components/AgenciaLandingClient";

export const metadata: Metadata = {
  title: "Agencia TripCazador — Vuelo desde 9,99€ con mejor precio garantizado",
  description:
    "Te buscamos el mejor vuelo o vuelo+hotel por solo 9,99€/19,99€. Si encuentras la misma combinación más barata en 7 días, te devolvemos el dinero + 1 mes Premium gratis.",
  alternates: { canonical: "/agencia" },
  openGraph: {
    title: "Agencia TripCazador · Mejor precio garantizado",
    description:
      "Vuelo 9,99€ · Vuelo+Hotel 19,99€. Si encuentras más barato te devolvemos el dinero + 1 mes Premium gratis.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default function AgenciaPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <AgenciaLandingClient />
    </main>
  );
}
