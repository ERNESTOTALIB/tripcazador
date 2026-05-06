"use client";
import { useEffect, useState } from "react";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitter/X", "Blog", "Newsletter", "Otra"];

export function CreatorsSignupForm() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ token: string; link: string; stats: { code: string } } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/creators/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email, handle, platform }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error");
        setLoading(false);
        return;
      }
      setResult(data);
      try {
        localStorage.setItem("tc_creator_token", data.token);
        localStorage.setItem("tc_creator_code", data.code);
      } catch {
        // ignore
      }
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="panel space-y-4">
        <h2 className="text-xl font-bold text-amber-400">¡Bienvenido al programa!</h2>
        <p className="text-sm text-gray-300">Tu link único:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={result.link}
            readOnly
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(result.link);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-4 py-2 rounded-lg"
          >
            Copiar
          </button>
        </div>
        <a
          href={`/creators/dashboard?token=${result.token}`}
          className="block text-center w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-lg"
        >
          Ir a mi dashboard →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <h2 className="text-xl font-bold text-amber-400">Únete al programa creators</h2>
      <p className="text-sm text-gray-300">
        Genera comisiones del 4-8% por cada vuelo, hotel o tour reservado a través de tu link único.
      </p>
      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Tu handle / código</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32))}
          placeholder="ej: pedro_viajero, traveltime, etc"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
          required
          maxLength={32}
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">@handle</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.slice(0, 50))}
            placeholder="@tripcazador"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
            maxLength={50}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Plataforma</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? "Creando…" : "Crear mi link único"}
      </button>
    </form>
  );
}

export function CreatorsDashboardClient({ initialToken }: { initialToken?: string }) {
  const [token, setToken] = useState(initialToken || "");
  const [stats, setStats] = useState<{
    code: string;
    link: string;
    stats: { clicks: number; bookings: number; revenue_pending: number; revenue_paid: number };
    payout_threshold_eur: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      const stored = localStorage.getItem("tc_creator_token");
      if (stored) setToken(stored);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoading(true);
    fetch(`/api/creators/stats?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!mounted) return;
        if (!r.ok) {
          setError(data.error || "Token inválido");
          return;
        }
        setStats(data);
        setError(null);
      })
      .catch(() => {
        if (mounted) setError("Error de red");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="panel">
        <p className="text-gray-300 text-center py-6">
          Pega tu token o vuelve a la <a className="text-amber-400 underline" href="/creators">página de signup</a>.
        </p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="panel text-center py-10">
        <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel text-center py-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const ratio = stats.stats.clicks > 0 ? (stats.stats.bookings / stats.stats.clicks) * 100 : 0;
  const eligible = stats.stats.revenue_pending >= stats.payout_threshold_eur;

  return (
    <div className="space-y-4">
      <div className="panel">
        <h2 className="text-lg font-bold text-amber-400">{stats.code}</h2>
        <p className="text-sm text-gray-300 mt-1">Tu link:</p>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={stats.link}
            readOnly
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(stats.link);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-4 py-2 rounded-lg"
          >
            Copiar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Clicks" value={stats.stats.clicks.toLocaleString("es-ES")} />
        <Stat label="Reservas" value={stats.stats.bookings.toLocaleString("es-ES")} />
        <Stat label="Conversión" value={`${ratio.toFixed(1)}%`} />
        <Stat
          label="Pendiente"
          value={`${stats.stats.revenue_pending.toFixed(2)}€`}
          highlight={eligible}
        />
      </div>
      <div className="panel">
        <h3 className="text-sm uppercase tracking-wide text-amber-400 font-bold">Pago</h3>
        <p className="text-sm text-gray-300 mt-1">
          {eligible ? (
            <>
              ✅ Has alcanzado el umbral de pago. El próximo payout llegará a tu email registrado el día 1 del mes.
            </>
          ) : (
            <>
              Acumula <strong>{stats.payout_threshold_eur}€</strong> para activar el payout. Te quedan{" "}
              <strong>{(stats.payout_threshold_eur - stats.stats.revenue_pending).toFixed(2)}€</strong>.
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Total pagado hasta hoy: {stats.stats.revenue_paid.toFixed(2)}€
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`panel py-4 text-center ${
        highlight ? "border-emerald-400 bg-emerald-900/20" : ""
      }`}
    >
      <div className={`text-2xl font-bold tabular-nums ${highlight ? "text-emerald-300" : "text-amber-400"}`}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide text-gray-400 mt-1">{label}</div>
    </div>
  );
}
