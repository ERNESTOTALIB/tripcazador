"use client";

/**
 * PremiumSavedSearchesClient — SSS303 (18 may 2026)
 *
 * Gestión de búsquedas guardadas Premium-only.
 * Free → upgrade gate.
 * Premium sin customerId → warning.
 * Premium con customerId → form crear + tabla con "Abrir" (link a /deals?...)
 * y "Borrar" per row.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getPremiumStatus, type PremiumStatus } from "@/lib/premium";
import { tcTrack } from "@/lib/track_client";

interface SavedSearchItem {
  id: string;
  name: string;
  airlines: string[];
  cabin: string;
  stops: string;
  timeBand: string;
  origin?: string | null;
  destination?: string | null;
  max_price?: number;
  created_at: number;
}

function buildUrl(s: SavedSearchItem): string {
  const params = new URLSearchParams();
  if (s.airlines?.length) params.set("airlines", s.airlines.join(","));
  if (s.cabin && s.cabin !== "any") params.set("cabin_exact", s.cabin);
  if (s.stops && s.stops !== "any") params.set("stops_exact", s.stops);
  if (s.timeBand && s.timeBand !== "any") params.set("time", s.timeBand);
  if (s.origin) params.set("origin", s.origin);
  if (s.destination) params.set("destination", s.destination);
  if (typeof s.max_price === "number") params.set("price_max", String(s.max_price));
  params.set("saved", s.id);
  return `/deals?${params.toString()}`;
}

export function PremiumSavedSearchesClient() {
  const [status, setStatus] = useState<PremiumStatus>({
    active: false,
    tier: "free",
    source: "manual",
  });
  const [mounted, setMounted] = useState(false);
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [airlines, setAirlines] = useState("");
  const [cabin, setCabin] = useState("any");
  const [stops, setStops] = useState("any");
  const [time, setTime] = useState("any");
  const [maxPrice, setMaxPrice] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setStatus(getPremiumStatus());
    setMounted(true);
    const onChange = (e: Event) => setStatus((e as CustomEvent).detail);
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  const customerId = status.customerId || "";
  const ready = status.active && (customerId.startsWith("cus_") || customerId.startsWith("cs_"));

  const refresh = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/premium/saved-searches?customer_id=${encodeURIComponent(customerId)}`,
      );
      const data = (await res.json()) as { ok?: boolean; searches?: SavedSearchItem[]; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "fetch_failed");
        return;
      }
      setSearches(data.searches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "fetch_failed");
    } finally {
      setLoading(false);
    }
  }, [ready, customerId]);

  useEffect(() => {
    if (mounted && ready) refresh();
  }, [mounted, ready, refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setCreating(true);
    setError(null);
    try {
      const airlineList = airlines
        .split(/[,\s]+/)
        .map((a) => a.trim().toUpperCase())
        .filter(Boolean);
      const res = await fetch("/api/premium/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          name: name.trim(),
          airlines: airlineList,
          cabin,
          stops,
          timeBand: time,
          origin: origin || undefined,
          destination: destination || undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "create_failed");
        return;
      }
      tcTrack("premium_search_saved", {
        customerId: customerId.slice(0, 16),
        cabin,
        airlinesCount: String(airlineList.length),
      });
      setName("");
      setAirlines("");
      setCabin("any");
      setStops("any");
      setTime("any");
      setOrigin("");
      setDestination("");
      setMaxPrice("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create_failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!ready || !confirm("¿Borrar esta búsqueda?")) return;
    try {
      const res = await fetch(
        `/api/premium/saved-searches/${id}?customer_id=${encodeURIComponent(customerId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        tcTrack("premium_search_deleted", { customerId: customerId.slice(0, 16), id });
        await refresh();
      }
    } catch {
      /* no-op */
    }
  }

  if (!mounted) return <div className="text-gray-400 text-sm">Cargando…</div>;

  if (!status.active) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">🔖 Búsquedas guardadas Premium</h1>
          <p className="text-gray-400 mt-2">Solo disponible para suscriptores Premium.</p>
        </header>
        <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-500/10">
          <h2 className="text-xl font-bold">Guarda combinaciones de filtros</h2>
          <p className="text-sm text-gray-300 mt-2">
            Ej: "Madrid → Tokio business class &lt; 1500€" en 1 click. Hasta 25 búsquedas.
          </p>
          <Link
            href="/premium?utm_source=panel_busquedas"
            className="inline-block mt-4 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg"
          >
            Activar Premium 2,99 €/mes →
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/40 bg-rose-500/10">
        <h2 className="text-xl font-bold">Premium sin customerId</h2>
        <p className="text-sm text-gray-300 mt-2">
          Necesitamos tu customerId Stripe (cs_...) para asociar las búsquedas.
          Si pagaste via Checkout, revisa tu email y haz click en activación.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/panel/premium" className="hover:text-white">
            Panel Premium
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Búsquedas guardadas</span>
        </nav>
        <h1 className="text-3xl font-bold">🔖 Búsquedas guardadas</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Guarda combinaciones de filtros pro y reabre con 1 click. Máx 25.
        </p>
      </header>

      <section className="p-5 rounded-2xl border border-gray-800 bg-gray-900">
        <h2 className="text-lg font-bold mb-3">Nueva búsqueda guardada</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="Nombre (ej: Tokio business)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="text"
            placeholder="Aerolíneas IATA separadas por coma (FR,IB,VY)"
            value={airlines}
            onChange={(e) => setAirlines(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="text"
            maxLength={3}
            placeholder="Origen IATA (opcional)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            maxLength={3}
            placeholder="Destino IATA (opcional)"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={cabin}
            onChange={(e) => setCabin(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="any">Cualquier cabina</option>
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
          <select
            value={stops}
            onChange={(e) => setStops(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="any">Cualquier escala</option>
            <option value="0">Directo</option>
            <option value="1">1 escala</option>
            <option value="2plus">2+ escalas</option>
          </select>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="any">Cualquier hora</option>
            <option value="early">Madrugada (00-06)</option>
            <option value="morning">Mañana (06-12)</option>
            <option value="afternoon">Tarde (12-18)</option>
            <option value="evening">Noche (18-24)</option>
          </select>
          <input
            type="number"
            min={1}
            max={50000}
            placeholder="Precio máx (€) opcional"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-black font-semibold rounded-lg px-4 py-2 text-sm md:col-span-2"
          >
            {creating ? "Guardando…" : "Guardar búsqueda"}
          </button>
        </form>
        {error && <p className="text-rose-400 text-xs mt-3">Error: {error}</p>}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">
          Tus búsquedas {searches.length > 0 && <span className="text-gray-500 text-sm">({searches.length}/25)</span>}
        </h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando…</p>
        ) : searches.length === 0 ? (
          <p className="text-gray-500 text-sm">Aún no tienes búsquedas guardadas.</p>
        ) : (
          <ul className="space-y-2">
            {searches.map((s) => (
              <li
                key={s.id}
                className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {s.airlines?.length ? `Aerolíneas: ${s.airlines.join(", ")} · ` : ""}
                      {s.cabin !== "any" ? `${s.cabin} · ` : ""}
                      {s.stops !== "any"
                        ? `${s.stops === "2plus" ? "2+ escalas" : s.stops + " escala(s)"} · `
                        : ""}
                      {s.timeBand !== "any" ? `${s.timeBand} · ` : ""}
                      {s.origin ? `${s.origin} → ` : ""}
                      {s.destination ? `${s.destination}` : ""}
                      {typeof s.max_price === "number" ? ` · ≤ ${s.max_price} €` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={buildUrl(s)}
                      className="text-xs text-amber-300 hover:text-amber-200 px-2 py-1 border border-amber-500/40 rounded"
                    >
                      Abrir →
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 border border-rose-500/30 rounded"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
