"use client";

import { useEffect, useState } from "react";

type SocialRecord = {
  id: string;
  status: string;
  template_code: string;
  template_canva_id: string;
  target_platforms: string[];
  csv_row: Record<string, string>;
  caption_es: string;
  hashtags: string[];
  scheduled_at: string;
  created_at: string;
  canva_design_id: string | null;
  media_url: string | null;
  per_platform_results: Record<string, {
    ok: boolean;
    post_id: string | null;
    url: string | null;
    mock: boolean;
    error: string | null;
  }>;
  override?: { status: string; ts: string };
};

type StatusResponse = {
  live_mode: boolean;
  queue_total: number;
  by_template: Record<string, number>;
  by_status: Record<string, number>;
  by_platform: Record<string, { mocked: number; published: number; failed: number }>;
  published_24h_count: number;
  status_md: string;
  last_record_at: string | null;
};

export function SocialDashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [records, setRecords] = useState<SocialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, q] = await Promise.all([
        fetch("/api/admin/social/status", { credentials: "include" }).then(r => r.json()),
        fetch("/api/admin/social/queue?limit=100", { credentials: "include" }).then(r => r.json()),
      ]);
      setStatus(s);
      setRecords(q.records || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function override(id: string, action: "approve" | "skip") {
    await fetch(`/api/admin/social/${action}/${id}`, {
      method: "POST", credentials: "include",
    });
    await load();
  }

  if (loading && !status) {
    return <p className="text-gray-400">Cargando datos del social publisher…</p>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
        Error: {error}
        <p className="mt-2 text-xs text-red-400/70">
          Si el endpoint devuelve 401, comprueba el ADMIN_TOKEN en /panel/login.
          Si devuelve 404 o error de path, comprueba que el backend tiene
          SOCIAL_QUEUE_PATH apuntando al directorio correcto del social_publisher.
        </p>
      </div>
    );
  }
  if (!status) return null;

  const filtered = filter === "all"
    ? records
    : records.filter(r => r.status === filter || (filter === "OVERRIDE" && r.override));

  return (
    <>
      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Modo"
          value={status.live_mode ? "🔴 LIVE" : "🟡 DRY-RUN"}
          tint={status.live_mode ? "red" : "amber"}
        />
        <StatCard label="Posts en queue" value={status.queue_total.toString()} tint="amber" />
        <StatCard label="Publicados <24h" value={status.published_24h_count.toString()} tint="amber" />
        <StatCard
          label="Último post"
          value={status.last_record_at ? formatRel(status.last_record_at) : "—"}
          tint="amber"
        />
      </div>

      {/* Distribución templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Panel title="Por template (queue total)">
          <ul className="text-sm space-y-1">
            {Object.entries(status.by_template).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
              <li key={k} className="flex justify-between">
                <code className="text-amber-300">{k}</code>
                <span className="text-gray-400">{n}</span>
              </li>
            ))}
            {Object.keys(status.by_template).length === 0 && (
              <li className="text-gray-500 text-xs italic">Sin posts todavía</li>
            )}
          </ul>
        </Panel>
        <Panel title="Por plataforma">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr><th className="text-left">Plataforma</th><th>Mock</th><th>Live</th><th>Fail</th></tr>
            </thead>
            <tbody>
              {Object.entries(status.by_platform).map(([k, v]) => (
                <tr key={k} className="border-t border-gray-800/50">
                  <td className="py-1"><code className="text-amber-300">{k}</code></td>
                  <td className="text-center text-gray-400">{v.mocked}</td>
                  <td className="text-center text-emerald-400">{v.published}</td>
                  <td className="text-center text-red-400">{v.failed}</td>
                </tr>
              ))}
              {Object.keys(status.by_platform).length === 0 && (
                <tr><td colSpan={4} className="py-2 text-gray-500 text-xs italic">Sin métricas</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Queue */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Queue ({records.length})</h2>
        <div className="ml-auto flex gap-2 text-xs">
          {["all", "DRY_RUN", "PUBLISHED", "FAILED", "OVERRIDE"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={
                "px-2 py-1 rounded border transition-colors " +
                (filter === s
                  ? "bg-amber-500 text-gray-900 border-amber-500"
                  : "border-gray-700 text-gray-400 hover:border-amber-500")
              }
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => void load()}
            className="px-2 py-1 rounded border border-gray-700 text-gray-400 hover:border-amber-500"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Sin posts con este filtro. Espera al próximo cron (cada 4h) o ejecuta a mano:{" "}
            <code className="text-amber-300">python -m social_publisher</code>
          </p>
        )}
        {filtered.map(r => (
          <RecordCard key={r.id} record={r} onAction={override} />
        ))}
      </div>
    </>
  );
}

function StatCard({ label, value, tint }: { label: string; value: string; tint: "amber" | "red" }) {
  const cls = tint === "red" ? "text-red-400" : "text-amber-400";
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function RecordCard({
  record,
  onAction,
}: {
  record: SocialRecord;
  onAction: (id: string, a: "approve" | "skip") => void;
}) {
  const ov = record.override?.status;
  const cardCls =
    "rounded-lg border bg-gray-900/40 p-3 flex flex-col sm:flex-row gap-3 " +
    (ov === "APPROVED" ? "border-emerald-700"
      : ov === "SKIPPED" ? "border-red-900 opacity-60"
      : "border-gray-800");
  return (
    <div className={cardCls}>
      <div className="sm:w-40 flex-shrink-0">
        {record.media_url ? (
          <div className="aspect-square bg-gray-950 rounded border border-gray-800 flex items-center justify-center text-[10px] text-gray-600 break-all p-2 text-center">
            {record.media_url.includes("mock") ? "MOCK PREVIEW" : "Canva render"}
            <br />
            {record.canva_design_id?.slice(0, 14)}
          </div>
        ) : (
          <div className="aspect-square bg-gray-950 rounded border border-gray-800" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <code className="text-xs text-amber-400">{record.template_code}</code>
          <Badge>{record.status}</Badge>
          {ov && <Badge tint={ov === "APPROVED" ? "green" : "red"}>{ov}</Badge>}
          <span className="text-xs text-gray-500 ml-auto">{record.scheduled_at}</span>
        </div>
        <p className="text-sm font-semibold truncate">
          {record.csv_row.ORIGIN_CITY} → {record.csv_row.DESTINATION_CITY} · {record.csv_row.PRICE}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {record.csv_row.AIRLINE} · {record.csv_row.CABIN} · {record.csv_row.DATE_RANGE}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {record.target_platforms.map(p => {
            const r = record.per_platform_results[p];
            const cls = r?.mock ? "text-gray-400 border-gray-700"
              : r?.ok ? "text-emerald-400 border-emerald-900"
              : "text-red-400 border-red-900";
            return (
              <span key={p} className={`text-[10px] border rounded px-1.5 py-0.5 ${cls}`}>
                {p}{r?.mock ? " (mock)" : r?.ok ? " ✓" : " ✗"}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex sm:flex-col gap-2 sm:w-24 flex-shrink-0">
        <button
          onClick={() => onAction(record.id, "approve")}
          disabled={ov === "APPROVED"}
          className="text-xs px-2 py-1 rounded border border-emerald-700 text-emerald-300 hover:bg-emerald-900/30 disabled:opacity-40 flex-1"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onAction(record.id, "skip")}
          disabled={ov === "SKIPPED"}
          className="text-xs px-2 py-1 rounded border border-red-900 text-red-300 hover:bg-red-900/30 disabled:opacity-40 flex-1"
        >
          ✗ Skip
        </button>
      </div>
    </div>
  );
}

function Badge({ children, tint = "amber" }: { children: React.ReactNode; tint?: "amber" | "green" | "red" }) {
  const cls = tint === "green" ? "border-emerald-700 text-emerald-400"
    : tint === "red" ? "border-red-900 text-red-400"
    : "border-amber-900 text-amber-400";
  return (
    <span className={`text-[10px] border rounded px-1.5 py-0.5 ${cls}`}>{children}</span>
  );
}

function formatRel(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const m = Math.round(diff / 60000);
    if (m < 1) return "ahora";
    if (m < 60) return `hace ${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h}h`;
    return `hace ${Math.round(h / 24)}d`;
  } catch {
    return iso;
  }
}
