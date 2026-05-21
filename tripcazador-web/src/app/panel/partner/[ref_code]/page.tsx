/**
 * /panel/partner/[ref_code] — SSS376 (21 may 2026)
 *
 * Dashboard partner para que las agencias aprobadas vean:
 *  - sus stats (referrals, revenue generado, payout pendiente)
 *  - URL de referido con utm
 *  - materiales (banners, copy)
 *  - link a /api/agency-partner/stats (futuro: descarga CSV)
 *
 * AUTH model:
 *   El ref_code es público (URL) — para impedir leak de stats, el dashboard
 *   muestra sólo info no-sensible. Stats agregadas, no individual customer.
 *   En iteración posterior añadir auth via magic-link al contact_email.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPartnerByCode } from "@/lib/agency_partner";
import Link from "next/link";

interface PageProps {
  params: { ref_code: string };
}

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: PageProps): Metadata {
  return {
    title: `Panel Partner ${params.ref_code} | TripCazador`,
    robots: { index: false, follow: false },
  };
}

function formatEur(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function PartnerDashboardPage({ params }: PageProps) {
  const partner = getPartnerByCode(params.ref_code);
  if (!partner) notFound();

  const referralUrlPremium = `https://tripcazador.com/premium?ref=${partner.ref_code}&utm_source=partner&utm_medium=referral&utm_campaign=${partner.slug}`;
  const referralUrlConcierge = `https://tripcazador.com/concierge?ref=${partner.ref_code}&utm_source=partner&utm_medium=referral&utm_campaign=${partner.slug}`;

  const isActive = partner.status === "active";
  const isPending = partner.status === "pending";
  const isRejected = partner.status === "rejected";

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Panel Partner — {partner.company_name}
          </h1>
          <p className="text-sm text-gray-400">
            Código:{" "}
            <code className="px-2 py-0.5 rounded bg-gray-800 text-amber-300">
              {partner.ref_code}
            </code>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            isActive
              ? "bg-emerald-500/20 text-emerald-300"
              : isPending
                ? "bg-amber-500/20 text-amber-300"
                : "bg-gray-500/20 text-gray-300"
          }`}
        >
          {partner.status}
        </span>
      </div>

      {isPending && (
        <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <p className="text-amber-200">
            Aplicación en revisión. Te notificaremos por email cuando esté activa
            (~24-48h). Mientras tanto puedes ver materiales y preparar contenido.
          </p>
        </div>
      )}

      {isRejected && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-red-200">
            Tu aplicación no fue aprobada esta vez. Escribe a{" "}
            <a href="mailto:partners@tripcazador.com" className="underline">
              partners@tripcazador.com
            </a>{" "}
            si quieres reconsideración.
          </p>
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-5">
          <p className="text-xs text-gray-400 uppercase font-bold">Referrals total</p>
          <p className="text-3xl font-bold text-white mt-1">{partner.total_referrals}</p>
        </div>
        <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-5">
          <p className="text-xs text-gray-400 uppercase font-bold">Revenue generado</p>
          <p className="text-3xl font-bold text-white mt-1">
            {formatEur(partner.total_revenue_eur)}
          </p>
        </div>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-5">
          <p className="text-xs text-amber-300 uppercase font-bold">Tu payout</p>
          <p className="text-3xl font-bold text-amber-300 mt-1">
            {formatEur(partner.total_payout_eur)}
          </p>
          <p className="text-[10px] text-amber-400 mt-1">
            Mínimo €25 para próximo payout
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-5 mb-8">
        <h2 className="text-lg font-bold text-white mb-3">📎 URLs de referido</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Premium €9.99/mes — 20% recurring</p>
            <input
              readOnly
              value={referralUrlPremium}
className="w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-xs text-gray-200 font-mono"
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Concierge — 15% one-off</p>
            <input
              readOnly
              value={referralUrlConcierge}
className="w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-xs text-gray-200 font-mono"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-5 mb-8">
        <h2 className="text-lg font-bold text-white mb-3">📊 Comisiones</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          <li>
            <strong className="text-amber-300">20% recurring</strong> sobre Premium mensual
            (€2/mes por suscriptor activo)
          </li>
          <li>
            <strong className="text-amber-300">25% one-off</strong> sobre Premium anual (€24.75)
          </li>
          <li>
            <strong className="text-amber-300">20% one-off</strong> sobre Premium gift (€2)
          </li>
          <li>
            <strong className="text-amber-300">15% one-off</strong> sobre Concierge (€2.85 - €14.85)
          </li>
        </ul>
        <p className="text-[10px] text-gray-500 mt-3">
          Cookie de atribución 30 días · payouts mensuales SEPA/Wise · mínimo €25
        </p>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-5 mb-8">
        <h2 className="text-lg font-bold text-white mb-3">📁 Materiales</h2>
        <p className="text-sm text-gray-300 mb-3">
          Banners, copy y guías están en desarrollo. Mientras tanto puedes usar:
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/prensa"
              className="text-amber-400 hover:underline"
            >
              → Press kit con logos
            </Link>
          </li>
          <li>
            <Link
              href="/api/og?title=TripCazador"
              className="text-amber-400 hover:underline"
            >
              → OG image dinámica
            </Link>
          </li>
          <li>
            <a
              href="mailto:partners@tripcazador.com?subject=Materiales partner"
              className="text-amber-400 hover:underline"
            >
              → Solicitar pack personalizado por email
            </a>
          </li>
        </ul>
      </section>

      <p className="text-xs text-gray-500 text-center">
        Datos actualizados en tiempo real. Para soporte:{" "}
        <a href="mailto:partners@tripcazador.com" className="text-amber-400 hover:underline">
          partners@tripcazador.com
        </a>
      </p>
    </main>
  );
}
