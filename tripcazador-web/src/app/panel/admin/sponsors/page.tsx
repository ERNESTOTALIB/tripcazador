/**
 * /panel/admin/sponsors — SUPER-SPONSORS (25 may 2026)
 *
 * Admin panel para revisar/aprobar/rechazar sponsors pagados.
 * Sponsors caen en "pending_review" después de Stripe webhook.
 * Aquí ernesto los aprueba (status → "active") o los borra.
 *
 * Auth: panel cookie (mismo flujo que otros admin panels).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { createKV } from "@/lib/kv_store";
import {
  type SponsorActive,
  getSponsorStats,
  SPONSOR_TIERS,
} from "@/lib/sponsors_catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Sponsors — TripCazador Admin",
  robots: "noindex,nofollow",
};

async function listAllSponsors(): Promise<SponsorActive[]> {
  const kv = createKV("sponsors");
  const keys = await kv.scan("active:", 200);
  const out: SponsorActive[] = [];
  for (const k of keys) {
    const rec = await kv.get<SponsorActive>(k);
    if (rec) out.push(rec);
  }
  return out.sort((a, b) =>
    a.activatedAt > b.activatedAt ? -1 : 1,
  );
}

export default async function AdminSponsorsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    redirect("/panel/login");
  }

  const sponsors = await listAllSponsors();
  const pending = sponsors.filter((s) => s.status === "pending_review");
  const active = sponsors.filter((s) => s.status === "active");
  const expired = sponsors.filter(
    (s) => s.status === "expired" || new Date(s.expiresAt).getTime() < Date.now(),
  );

  // Fetch stats sequentially (no rush, admin page)
  const statsBySid: Record<string, { clicks: number; impressions: number }> = {};
  for (const s of [...pending, ...active]) {
    statsBySid[s.sessionId] = await getSponsorStats(s.sessionId);
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Sponsors admin</h1>
        <Link
          href="/panel/admin/revenue"
          className="text-sm text-amber-400 hover:underline"
        >
          ← Revenue dashboard
        </Link>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-orange-300">
            Pending review
          </div>
          <div className="text-3xl font-bold text-white">{pending.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-emerald-300">
            Active
          </div>
          <div className="text-3xl font-bold text-white">{active.length}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Expired
          </div>
          <div className="text-3xl font-bold text-white">{expired.length}</div>
        </div>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">
            Pendientes de aprobar
          </h2>
          <div className="space-y-3">
            {pending.map((s) => (
              <SponsorCard key={s.sessionId} sponsor={s} stats={statsBySid[s.sessionId]} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">Activos</h2>
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">Sin sponsors activos.</p>
        ) : (
          <div className="space-y-3">
            {active.map((s) => (
              <SponsorCard key={s.sessionId} sponsor={s} stats={statsBySid[s.sessionId]} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-500">Expirados</h2>
        <p className="text-xs text-slate-600">
          {expired.length} sponsors expirados. Limpieza manual via DELETE
          /api/admin/sponsors si quieres reducir KV.
        </p>
      </section>

      <section className="mt-10 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Tiers configurados
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="pb-2">Tier</th>
              <th className="pb-2">Precio</th>
              <th className="pb-2">Duración</th>
              <th className="pb-2">env price ID</th>
            </tr>
          </thead>
          <tbody>
            {SPONSOR_TIERS.map((t) => (
              <tr key={t.slug} className="border-t border-slate-800">
                <td className="py-2 font-semibold text-white">{t.name}</td>
                <td className="py-2 text-amber-300">{t.priceEur} € / {t.period}</td>
                <td className="py-2 text-slate-300">{t.durationDays} días</td>
                <td className="py-2 font-mono text-xs text-slate-500">
                  {process.env[t.envPriceId] ? "✓ set" : "✗ missing"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">
          Crear los 3 price IDs one-off en Stripe Dashboard y set como env vars
          en Vercel. Sin ellos, /api/sponsors/checkout devuelve 503 y el front
          fallback a mailto.
        </p>
      </section>
    </div>
  );
}

function SponsorCard({
  sponsor,
  stats,
}: {
  sponsor: SponsorActive;
  stats?: { clicks: number; impressions: number };
}) {
  const ctr =
    stats && stats.impressions > 0
      ? ((stats.clicks / stats.impressions) * 100).toFixed(2)
      : "—";

  return (
    <div
      className={`rounded-xl border p-4 ${
        sponsor.status === "pending_review"
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-emerald-500/30 bg-emerald-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white">{sponsor.brand}</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {sponsor.tier}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                sponsor.status === "active"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-orange-500/20 text-orange-300"
              }`}
            >
              {sponsor.status}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            URL: <a href={sponsor.url} target="_blank" rel="noopener" className="underline">{sponsor.url}</a>
          </div>
          {sponsor.tagline && (
            <p className="mt-1 text-sm text-slate-300">{sponsor.tagline}</p>
          )}
          <div className="mt-2 text-xs text-slate-500">
            Contact: <code>{sponsor.contactEmail}</code> · session{" "}
            <code className="text-slate-600">{sponsor.sessionId.slice(0, 20)}…</code>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Activado: {sponsor.activatedAt.slice(0, 16).replace("T", " ")} ·
            Expira: {sponsor.expiresAt.slice(0, 16).replace("T", " ")}
          </div>
          {stats && (
            <div className="mt-2 flex gap-3 text-xs">
              <span className="text-slate-400">
                Impresiones: <strong className="text-white">{stats.impressions}</strong>
              </span>
              <span className="text-slate-400">
                Clicks: <strong className="text-white">{stats.clicks}</strong>
              </span>
              <span className="text-slate-400">
                CTR: <strong className="text-white">{ctr}%</strong>
              </span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {sponsor.status === "pending_review" && (
            <form
              method="POST"
              action={`/api/admin/sponsors?sid=${encodeURIComponent(sponsor.sessionId)}&action=approve`}
            >
              <button className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-emerald-400">
                ✓ Aprobar
              </button>
            </form>
          )}
          <form
            method="POST"
            action={`/api/admin/sponsors?sid=${encodeURIComponent(sponsor.sessionId)}&action=delete`}
          >
            <button className="rounded-md border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10">
              ✕ Borrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
