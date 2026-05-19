"use client";

/**
 * PremiumAlertsManagerClient — SSS302 (18 may 2026)
 *
 * Dashboard Premium-only para crear, listar y borrar alertas de precio
 * con tier="premium". Si el user no es Premium, ve el upgrade gate.
 * Si es Premium:
 *  1. fetch GET /api/premium/alerts?customer_id=cs_xxx
 *  2. form crear nueva alerta (POST)
 *  3. tabla con DELETE per row
 *
 * Diferencias vs /alertas (gratis):
 *  - Sin quota cap
 *  - Tabla con gestión, no solo formulario one-shot
 *  - Procesadas cada 5 min (vs hora gratis) — visible en hero
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getPremiumStatus, type PremiumStatus } from "@/lib/premium";
import { tcTrack } from "@/lib/track_client";
import { NLAlertWidget } from "@/components/NLAlertWidget";

interface AlertItem {
  id: string;
  email: string;
  origin: string | null;
  destination: string | null;
  max_price: number;
  cabin: string | null;
  date_min: string | null;
  date_max: string | null;
  created_at: number;
  triggered_at: number | null;
  active: boolean;
  tier: "free" | "premium";
}

export function PremiumAlertsManagerClient() {
  const [status, setStatus] = useState<PremiumStatus>({
    active: false,
    tier: "free",
    source: "manual",
  });
  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cabin, setCabin] = useState<"economy" | "business" | "first">("economy");

  useEffect(() => {
    setStatus(getPremiumStatus());
    setMounted(true);
    const onChange = (e: Event) => setStatus((e as CustomEvent).detail);
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  const customerId = status.customerId || "";
  const isPremiumWithCustomer = status.active && (customerId.startsWith("cus_") || customerId.startsWith("cs_"));

  const fetchAlerts = useCallback(async () => {
    if (!isPremiumWithCustomer) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/premium/alerts?customer_id=${encodeURIComponent(customerId)}`,
      );
      const data = (await res.json()) as { ok?: boolean; alerts?: AlertItem[]; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "fetch_failed");
        return;
      }
      setAlerts(data.alerts || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "fetch_failed");
    } finally {
      setLoading(false);
    }
  }, [isPremiumWithCustomer, customerId]);

  useEffect(() => {
    if (mounted && isPremiumWithCustomer) fetchAlerts();
  }, [mounted, isPremiumWithCustomer, fetchAlerts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isPremiumWithCustomer) return;
    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/premium/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          email,
          origin: origin || undefined,
          destination: destination || undefined,
          max_price: Number(maxPrice),
          cabin,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "create_failed");
        return;
      }
      tcTrack("premium_alert_created", {
        customerId: customerId.slice(0, 16),
        origin,
        destination,
        max_price: maxPrice,
      });
      setEmail("");
      setOrigin("");
      setDestination("");
      setMaxPrice("");
      await fetchAlerts();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "create_failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!isPremiumWithCustomer) return;
    if (!confirm("¿Borrar esta alerta?")) return;
    try {
      const res = await fetch(
        `/api/premium/alerts/${id}?customer_id=${encodeURIComponent(customerId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        tcTrack("premium_alert_deleted", { customerId: customerId.slice(0, 16), id });
        await fetchAlerts();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrorMsg(data?.error || "delete_failed");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "delete_failed");
    }
  }

  if (!mounted) {
    return <div className="text-gray-400 text-sm">Cargando…</div>;
  }

  if (!status.active) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">🚨 Mis alertas Premium</h1>
          <p className="text-gray-400 mt-2">
            Esta sección es solo para suscriptores Premium.
          </p>
        </header>
        <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-500/10">
          <h2 className="text-xl font-bold text-white">Activa Premium para alertas ilimitadas</h2>
          <p className="text-sm text-gray-300 mt-2">
            Plan gratis: máximo 3 alertas, polling cada hora.
            Premium: alertas ilimitadas, polling cada 5 min, email priority.
          </p>
          <Link
            href="/premium?utm_source=panel_alertas"
            className="inline-block mt-4 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg"
          >
            Activar Premium 2,99 €/mes →
          </Link>
        </div>
      </div>
    );
  }

  if (status.active && !(customerId.startsWith("cus_") || customerId.startsWith("cs_"))) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/40 bg-rose-500/10">
        <h2 className="text-xl font-bold text-white">Premium sin customerId Stripe</h2>
        <p className="text-sm text-gray-300 mt-2">
          Tu estado Premium ({status.source}) no tiene un customerId Stripe asociado.
          Si has pagado vía Checkout, abre tu email Stripe y haz click en el enlace de
          activación — eso hidratará el customerId. Si activaste trial manual, esta
          sección se desbloquea cuando completes el pago.
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
          <span className="text-white">Mis alertas</span>
        </nav>
        <h1 className="text-3xl font-bold">🚨 Mis alertas Premium</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Procesadas cada 5 min. Sin tope. Email priority. Customer:{" "}
          <span className="font-mono text-xs text-gray-300">{customerId.slice(0, 20)}…</span>
        </p>
      </header>

      {/* SSS319: NL alert widget — escribir alerta en español natural */}
      <NLAlertWidget
        customerId={customerId}
        defaultEmail={email}
        onCreated={() => {
          fetchAlerts();
        }}
      />

      {/* Form crear (tradicional) */}
      <section className="p-5 rounded-2xl border border-gray-800 bg-gray-900">
        <h2 className="text-lg font-bold mb-3">O usa el formulario tradicional</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="email"
            required
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            required
            min={1}
            max={50000}
            placeholder="Precio máx (€)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            maxLength={3}
            placeholder="Origen IATA (opcional, ej BCN)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            maxLength={3}
            placeholder="Destino IATA (opcional, ej JFK)"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={cabin}
            onChange={(e) => setCabin(e.target.value as "economy" | "business" | "first")}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-black font-semibold rounded-lg px-4 py-2 text-sm"
          >
            {creating ? "Creando…" : "Crear alerta"}
          </button>
        </form>
        {errorMsg && (
          <p className="text-rose-400 text-xs mt-3">Error: {errorMsg}</p>
        )}
      </section>

      {/* Lista */}
      <section>
        <h2 className="text-lg font-bold mb-3">
          Alertas activas {alerts.length > 0 && <span className="text-gray-500 text-sm">({alerts.length})</span>}
        </h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando alertas…</p>
        ) : alerts.length === 0 ? (
          <p className="text-gray-500 text-sm">Aún no tienes alertas. Crea una arriba.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`p-4 rounded-xl border ${
                  a.active
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-gray-800 bg-gray-900 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">
                        {a.origin || "Cualquier origen"} → {a.destination || "Cualquier destino"}
                      </span>
                      <span className="text-gray-500"> · </span>
                      <span className="text-emerald-300">≤ {a.max_price} €</span>
                      <span className="text-gray-500"> · </span>
                      <span className="text-gray-300 capitalize">{a.cabin || "cualquier clase"}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {a.email} · creada {new Date(a.created_at).toLocaleDateString("es-ES")}
                      {a.triggered_at && (
                        <>
                          {" "}
                          · 🔔 disparada{" "}
                          {new Date(a.triggered_at).toLocaleDateString("es-ES")}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 border border-rose-500/30 rounded"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
