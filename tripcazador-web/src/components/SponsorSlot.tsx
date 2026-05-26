/**
 * SponsorSlot.tsx — SUPER-SPONSORS (25 may 2026)
 *
 * Componente RSC server-side que lee getActiveSponsors() de KV y muestra
 * el sponsor rotatorio asignado al slotId. Si no hay sponsors activos
 * muestra placeholder con CTA a /patrocinadores (self-serve apply).
 *
 * Uso:
 *   <SponsorSlot slotId="home_below_fold" />
 *   <SponsorSlot slotId="deals_listing" />
 *   <SponsorSlot slotId="blog_post_bottom" />
 */
import Link from "next/link";
import {
  getActiveSponsors,
  pickSponsorForSlot,
} from "@/lib/sponsors_catalog";

interface Props {
  slotId: string;
  /** Si true, oculta el placeholder cuando no hay sponsors. Default false. */
  hideIfEmpty?: boolean;
}

export default async function SponsorSlot({ slotId, hideIfEmpty }: Props) {
  let sponsors: Awaited<ReturnType<typeof getActiveSponsors>> = [];
  try {
    sponsors = await getActiveSponsors();
  } catch {
    sponsors = [];
  }

  const sponsor = pickSponsorForSlot(sponsors, slotId);

  if (!sponsor) {
    if (hideIfEmpty) return null;
    // Placeholder con CTA self-serve
    return (
      <aside className="my-6 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-wider text-slate-500">
            Espacio patrocinado
          </span>
          <Link
            href="/patrocinadores"
            className="rounded-md border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10"
          >
            ¿Tu marca aquí? →
          </Link>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          25.000+ viajeros hispanohablantes / mes. Self-serve desde 199 € sin
          contacto previo. Activación 24h post-pago.
        </p>
      </aside>
    );
  }

  const trackUrl = `/api/sponsors/click?sid=${encodeURIComponent(sponsor.sessionId)}`;

  return (
    <aside
      className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
      data-sponsor-slot={slotId}
      data-sponsor-id={sponsor.sessionId}
    >
      <div className="flex items-start gap-3">
        {sponsor.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sponsor.logoUrl}
            alt={`Logo ${sponsor.brand}`}
            className="h-10 w-10 rounded object-contain"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Patrocinado
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="truncate text-sm font-bold text-white">
              {sponsor.brand}
            </span>
          </div>
          {sponsor.tagline && (
            <p className="mt-1 text-sm text-slate-300 line-clamp-2">
              {sponsor.tagline}
            </p>
          )}
        </div>
        <a
          href={trackUrl}
          target="_blank"
          rel="nofollow noopener sponsored"
          className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
        >
          Visitar →
        </a>
      </div>
    </aside>
  );
}
