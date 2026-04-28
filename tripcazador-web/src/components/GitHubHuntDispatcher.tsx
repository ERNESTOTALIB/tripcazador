"use client";

import { useState, useEffect } from "react";

/**
 * GitHubHuntDispatcher — botón en /admin que dispara el workflow `hunter-cron.yml`
 * vía la API REST de GitHub. Complementa ManualHuntButton:
 *
 *   - ManualHuntButton  → dispara el seed en VPS (rápido, ~5s, mock data)
 *   - GitHubHuntDispatcher → dispara el hunter REAL en GitHub Actions (~5-15min,
 *     consulta RapidAPI/SerpAPI con keys reales, sube deals.json al VPS).
 *
 * Bug del worker (#229/#245): el container hunter nunca se levantó en VPS.
 * Workaround durable: GitHub Actions cron cada 6h + este botón para trigger
 * manual sin SSH. El usuario pega un GitHub PAT con scope `actions:write` y
 * el componente hace POST a:
 *
 *   POST /repos/{owner}/{repo}/actions/workflows/hunter-cron.yml/dispatches
 *
 * El PAT se guarda en localStorage `tc_gh_pat_v1` (solo /admin tiene noindex).
 * Política de seguridad:
 *   - El PAT nunca se envía a tripcazador.com — va directo de browser → GitHub.
 *   - Permisos mínimos: `repo` o `actions:write` sobre el repo TripCazador.
 *
 * Polling de la última run via `actions/runs?per_page=1` para mostrar estado.
 */

const REPO_OWNER = "ernestalib"; // ajustar si cambia
const REPO_NAME = "tripcazador";
const WORKFLOW_FILE = "hunter-cron.yml";
const PAT_STORAGE_KEY = "tc_gh_pat_v1";

const PRESETS = [
  { id: "all", label: "All (default)", desc: "Todos los presets en serie" },
  { id: "mar-rojo", label: "Mar Rojo (Egipto/Jordania)" },
  { id: "caribe", label: "Caribe", desc: "MEX/PUJ/HAV" },
  { id: "europa-este", label: "Europa Este" },
  { id: "sudeste-asiatico", label: "Sudeste Asiático" },
  { id: "norte-africa", label: "Norte África" },
  { id: "business", label: "Business class anomalías" },
  { id: "hotels", label: "Hoteles only" },
  { id: "asia-luxury", label: "Asia Luxury" },
  { id: "africa-adventure", label: "Africa Adventure" },
  { id: "weekend", label: "Weekend Europe" },
  { id: "family-beach", label: "Family Beach" },
];

interface RunSnapshot {
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
  display_title: string;
}

export function GitHubHuntDispatcher() {
  const [pat, setPat] = useState<string>("");
  const [preset, setPreset] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<RunSnapshot | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(PAT_STORAGE_KEY);
    if (saved) setPat(saved);
  }, []);

  // Polling última run del workflow
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pat) return;
    let cancelled = false;

    async function tick() {
      try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${pat}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const run = data?.workflow_runs?.[0];
        if (!run || cancelled) return;
        setLastRun({
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at,
          html_url: run.html_url,
          display_title: run.display_title || "hunter run",
        });
      } catch {
        /* silencio */
      }
    }
    tick();
    const i = window.setInterval(tick, busy ? 10000 : 60000);
    return () => {
      cancelled = true;
      window.clearInterval(i);
    };
  }, [pat, busy]);

  async function dispatch() {
    setError(null);
    setInfo(null);
    if (!pat || pat.length < 20) {
      setError("Pega un GitHub PAT con scope actions:write");
      return;
    }
    setBusy(true);
    try {
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: { preset },
        }),
      });
      if (res.status === 204) {
        // Persist PAT solo si funcionó
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PAT_STORAGE_KEY, pat);
        }
        setInfo(`✓ Workflow disparado preset=${preset}. Resultado en ~5-10 min.`);
      } else {
        const text = await res.text();
        setError(`GitHub respondió ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (e) {
      setError(`Error red: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function clearPat() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PAT_STORAGE_KEY);
    }
    setPat("");
    setInfo("PAT borrado del navegador.");
  }

  const statusColor =
    lastRun?.status === "in_progress" || lastRun?.status === "queued"
      ? "text-amber-400"
      : lastRun?.conclusion === "success"
      ? "text-green-400"
      : lastRun?.conclusion === "failure"
      ? "text-red-400"
      : "text-gray-400";

  return (
    <section
      aria-labelledby="gh-hunt-title"
      className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6"
    >
      <h3 id="gh-hunt-title" className="text-lg font-semibold text-amber-400 mb-2">
        Hunter cron real (GitHub Actions)
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Dispara el hunter completo (RapidAPI + SerpAPI) en GitHub Actions. Sube
        deals.json al VPS al terminar. Tarda 5-15 min según preset. Para uso
        rápido y mock, usa el botón VPS de arriba.
      </p>

      <label className="block text-xs uppercase text-gray-500 mb-1" htmlFor="gh-pat">
        GitHub PAT (scope: actions:write)
      </label>
      <input
        id="gh-pat"
        type="password"
        value={pat}
        onChange={(e) => setPat(e.target.value)}
        placeholder="github_pat_..."
        className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm font-mono mb-3"
        autoComplete="off"
      />

      <label className="block text-xs uppercase text-gray-500 mb-1" htmlFor="gh-preset">
        Preset
      </label>
      <select
        id="gh-preset"
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm mb-3"
      >
        {PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
            {p.desc ? ` — ${p.desc}` : ""}
          </option>
        ))}
      </select>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={dispatch}
          disabled={busy}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-md px-4 py-2 text-sm min-h-[44px]"
        >
          {busy ? "Disparando…" : "Disparar hunter"}
        </button>
        {pat && (
          <button
            type="button"
            onClick={clearPat}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md px-4 py-2 text-sm min-h-[44px]"
          >
            Borrar PAT
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {info && (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-amber-300">
          {info}
        </p>
      )}

      {lastRun && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-sm">
          <p className="text-xs uppercase text-gray-500">Última run</p>
          <p className="mt-1">
            <span className={`font-semibold ${statusColor}`}>
              {lastRun.status === "in_progress" || lastRun.status === "queued"
                ? "● en curso"
                : lastRun.conclusion === "success"
                ? "✓ success"
                : lastRun.conclusion === "failure"
                ? "✗ failure"
                : lastRun.status}
            </span>
            {" · "}
            <a
              href={lastRun.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-gray-300"
            >
              Ver en GitHub
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(lastRun.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}

export default GitHubHuntDispatcher;
