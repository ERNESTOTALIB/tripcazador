/**
 * /changelog — SSS447 (23 may 2026)
 *
 * Página pública con últimos releases. Trust signal + community
 * feature. Manual update en cada deploy a main.
 *
 * SEO: "tripcazador novedades", "tripcazador actualizaciones",
 * "tripcazador roadmap".
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  CHANGELOG_BY_DATE,
  CHANGELOG_DATES,
  type ChangelogType,
} from "@/lib/changelog_entries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Novedades y mejoras",
  description:
    "Las últimas funcionalidades, mejoras y correcciones publicadas en TripCazador. Build in public.",
  alternates: { canonical: `${SITE_URL}/changelog` },
  openGraph: {
    title: "TripCazador — Novedades",
    description: "Build in public — lo que cambiamos cada semana.",
    url: `${SITE_URL}/changelog`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 3600;

const TYPE_BADGE: Record<ChangelogType, { label: string; color: string }> = {
  feature: { label: "Nuevo", color: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  improvement: { label: "Mejora", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  fix: { label: "Fix", color: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
  security: { label: "Seguridad", color: "bg-red-500/15 text-red-300 border-red-500/40" },
};

function formatDateEs(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

export default function ChangelogPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <div className="text-5xl">📜</div>
        <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
          Novedades
        </h1>
        <p className="mt-3 text-slate-300">
          Build in public — lo que cambiamos en TripCazador cada semana. Las
          features más grandes, mejoras, fixes y notas de seguridad.
        </p>
      </header>

      <div className="space-y-10">
        {CHANGELOG_DATES.map((date) => {
          const entries = CHANGELOG_BY_DATE[date];
          return (
            <section key={date}>
              <h2 className="mb-3 border-b border-slate-700 pb-2 text-base font-bold uppercase tracking-wider text-amber-400">
                {formatDateEs(date)}
              </h2>
              <ul className="space-y-4">
                {entries.map((e, i) => {
                  const badge = TYPE_BADGE[e.type];
                  return (
                    <li
                      key={`${date}-${i}`}
                      className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-white">{e.title}</h3>
                        <span
                          className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{e.description}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center text-sm text-slate-300">
        <p>
          ¿Quieres recibir un email mensual con resumen de novedades?{" "}
          <Link href="/" className="text-amber-400 hover:underline">
            Suscríbete a la newsletter
          </Link>{" "}
          en la home. Se manda solo lo importante.
        </p>
      </section>
    </main>
  );
}
