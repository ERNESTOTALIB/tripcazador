"use client";
import { useEffect, useState } from "react";
import { computeWrapped, type WrappedStats } from "@/lib/wrapped";

export function WrappedView({ year }: { year?: number }) {
  const [stats, setStats] = useState<WrappedStats | null>(null);

  useEffect(() => {
    setStats(computeWrapped(year));
  }, [year]);

  if (!stats) {
    return (
      <div className="panel py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (stats.total_searches === 0 && stats.total_favorites === 0) {
    return (
      <div className="panel text-center py-12">
        <div className="text-5xl mb-3">🥚</div>
        <h2 className="text-xl font-bold text-amber-400">Aún sin Wrapped</h2>
        <p className="text-sm text-gray-300 mt-2">
          Vuelve después de buscar destinos y guardar favoritos. Tu Wrapped {stats.year} se construye solo.
        </p>
      </div>
    );
  }

  const slides = [
    {
      title: `Tu año en TripCazador`,
      subtitle: stats.year.toString(),
      big: stats.vibe,
      sub: "Tu vibra de cazador",
    },
    {
      title: "Has buscado",
      big: stats.total_searches.toLocaleString("es-ES"),
      sub: "veces este año",
    },
    {
      title: "Destinos en tu radar",
      big: stats.unique_destinations.toLocaleString("es-ES"),
      sub: stats.top_destinations.length ? `Top: ${stats.top_destinations.slice(0, 3).join(", ")}` : "",
    },
    {
      title: "Chollos guardados",
      big: stats.total_favorites.toLocaleString("es-ES"),
      sub: "favoritos en el corazón",
    },
    {
      title: "Te has ahorrado (estimado)",
      big: `~${stats.estimated_savings_eur.toLocaleString("es-ES")}€`,
      sub: "vs. precio sin TripCazador",
    },
    {
      title: "Tu mejor racha",
      big: `${stats.streak_max} ${stats.streak_max === 1 ? "día" : "días"}`,
      sub: "consecutivos cazando",
    },
    {
      title: "Badges desbloqueados",
      big: stats.badges_unlocked.toString(),
      sub: "de 12 totales",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm uppercase tracking-wider text-amber-400">TripCazador Wrapped {stats.year}</p>
        <h1 className="text-3xl font-bold text-white mt-2">{stats.vibe}</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {slides.slice(1).map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 bg-gradient-to-br from-amber-400/10 via-orange-500/10 to-amber-400/5 border border-amber-400/30"
          >
            <div className="text-xs uppercase tracking-wide text-amber-400/80 mb-1">{s.title}</div>
            <div className="text-3xl font-bold text-amber-400 tabular-nums">{s.big}</div>
            {s.sub && <div className="text-xs text-gray-300 mt-2">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="panel text-center mt-6">
        <p className="text-sm text-gray-300">¿Te ha gustado? Compártelo y reta a tus amigos a su Wrapped.</p>
        <div className="mt-3 flex gap-2 justify-center flex-wrap">
          <ShareButton stats={stats} platform="twitter" />
          <ShareButton stats={stats} platform="whatsapp" />
          <ShareButton stats={stats} platform="telegram" />
        </div>
      </div>
    </div>
  );
}

function ShareButton({ stats, platform }: { stats: WrappedStats; platform: "twitter" | "whatsapp" | "telegram" }) {
  const text = `Mi TripCazador Wrapped ${stats.year}: ${stats.vibe} 🎯 ${stats.unique_destinations} destinos · ~${stats.estimated_savings_eur}€ ahorrados. ¿Cuál es tu vibra? https://tripcazador.com/wrapped`;
  let href = "#";
  let label = "";
  if (platform === "twitter") {
    href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    label = "X / Twitter";
  } else if (platform === "whatsapp") {
    href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    label = "WhatsApp";
  } else if (platform === "telegram") {
    href = `https://t.me/share/url?url=https://tripcazador.com/wrapped&text=${encodeURIComponent(text)}`;
    label = "Telegram";
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 px-4 py-2 rounded-lg text-sm text-white"
    >
      {label}
    </a>
  );
}
