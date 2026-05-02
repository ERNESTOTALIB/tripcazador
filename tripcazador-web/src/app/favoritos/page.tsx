"use client";

/**
 * /favoritos — fase iii III1 (May 2026)
 *
 * Lista los deals que el usuario ha guardado en localStorage. Si el deal sigue
 * activo en backend, mostramos info actualizada; si no, mostramos snapshot
 * guardado con un aviso de "puede estar caducado".
 *
 * SEO: noindex (es contenido personal). Por eso no usamos metadata estática
 * sino client-side con useEffect.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2, Share2, Plane, ExternalLink } from "lucide-react";
import {
  getFavorites,
  removeFavorite,
  clearFavorites,
  subscribeFavorites,
  type FavoriteDeal,
} from "@/lib/favorites";
import { SectionHero } from "@/components/SectionHero";
import { formatDate, getCabinLabel } from "@/lib/api";

export default function FavoritosPage() {
  const [favs, setFavs] = useState<FavoriteDeal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    document.title = "Tus favoritos — TripCazador";
    // noindex
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";

    setFavs(getFavorites());
    setHydrated(true);
    return subscribeFavorites(() => {
      setFavs(getFavorites());
    });
  }, []);

  function handleClearAll() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    clearFavorites();
    setConfirming(false);
  }

  async function handleShareList() {
    const text = favs
      .slice(0, 10)
      .map((f) => `${f.origin}→${f.destination} · ${f.price_eur.toFixed(0)}€${f.date_out ? ` · ${f.date_out}` : ""}`)
      .join("\n");
    const fullText = `Mis chollos guardados en TripCazador:\n\n${text}\n\nMás en https://tripcazador.com`;
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : null;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({
          title: "Mis chollos TripCazador",
          text: fullText,
        });
        return;
      } catch {
        /* user cancelled — fall back to clipboard */
      }
    }
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
      await nav.clipboard.writeText(fullText);
      alert("Lista copiada al portapapeles");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHero
        badge={hydrated && favs.length > 0 ? `${favs.length} chollos guardados` : "Tus favoritos"}
        title={
          <>
            Tus <em>favoritos</em>
          </>
        }
        subtitle="Los chollos que has guardado se quedan aquí. Vuelve cuando quieras a revisar precios."
      />

      {!hydrated && (
        <div className="text-center py-20 text-gray-500">Cargando…</div>
      )}

      {hydrated && favs.length === 0 && (
        <div className="text-center py-20 text-gray-400 max-w-md mx-auto">
          <Heart size={56} className="mx-auto mb-4 text-gray-700" />
          <h2 className="text-xl font-semibold text-white mb-2">No tienes favoritos todavía</h2>
          <p className="mb-6">
            Pulsa el corazón en cualquier chollo para guardarlo aquí.
          </p>
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
          >
            Explorar chollos
            <Plane size={16} />
          </Link>
        </div>
      )}

      {hydrated && favs.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-400">
              Guardado en este dispositivo · No requiere cuenta
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShareList}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                <Share2 size={14} />
                Compartir lista
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                  confirming
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}
              >
                <Trash2 size={14} />
                {confirming ? "Confirmar eliminar" : "Borrar todos"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {favs.map((f) => (
              <FavoriteRow key={f.id} fav={f} />
            ))}
          </div>

          <div className="text-center pt-8 text-sm text-gray-500">
            <p>
              ¿Buscas más?{" "}
              <Link href="/deals" className="text-amber-400 hover:underline">
                Ver todos los chollos →
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function FavoriteRow({ fav }: { fav: FavoriteDeal }) {
  const savedAge = relativeAge(fav.saved_at);
  const dealUrl = `/deals?origin=${encodeURIComponent(fav.origin)}&destination=${encodeURIComponent(fav.destination)}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl glass border border-gray-800">
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="font-mono text-amber-400 font-bold text-sm">{fav.origin}</span>
        <Plane size={12} className="text-gray-500 rotate-90" />
        <span className="font-mono text-white font-bold text-sm">{fav.destination}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">
          {fav.city_to || fav.destination}
          {fav.country_to && (
            <span className="text-gray-400 font-normal ml-1">· {fav.country_to}</span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {getCabinLabel(fav.cabin || "economy")}
          {fav.date_out && ` · ${formatDate(fav.date_out)}`}
          {fav.airline_name && ` · ${fav.airline_name}`}
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">Guardado {savedAge}</div>
      </div>

      <div className="text-xl font-bold text-white text-right min-w-[80px]">
        {fav.price_eur.toFixed(0)}€
      </div>

      <div className="flex gap-2">
        <Link
          href={dealUrl}
          className="inline-flex items-center gap-1 px-3 py-2 min-h-[40px] rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
        >
          Ver chollos
          <ExternalLink size={12} />
        </Link>
        <button
          type="button"
          onClick={() => removeFavorite(fav.id)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-red-700 text-gray-300 hover:text-white transition-colors"
          aria-label="Quitar de favoritos"
          title="Quitar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function relativeAge(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!isFinite(t)) return "";
  const diff = Date.now() - t;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const d = Math.round(hr / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}
