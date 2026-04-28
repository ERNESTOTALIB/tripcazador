"use client";

import { useState, FormEvent } from "react";

export const dynamic = "force-dynamic";

export default function PanelLoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/panel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      if (res.ok) {
        window.location.href = "/panel";
        return;
      }
      if (res.status === 429) {
        setError("Demasiados intentos. Espera 5 minutos.");
      } else {
        setError("Credenciales inválidas.");
      }
    } catch {
      setError("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-amber-400 mb-1">Panel TripCazador</h1>
        <p className="text-sm text-gray-400 mb-6">Acceso solo para owner</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="user" className="block text-xs uppercase text-gray-500 mb-1">Usuario</label>
            <input
              id="user"
              name="user"
              type="text"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pass" className="block text-xs uppercase text-gray-500 mb-1">Contraseña</label>
            <input
              id="pass"
              name="pass"
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-2.5 rounded-md text-sm min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {busy ? "Verificando..." : "Acceder"}
          </button>
        </form>
      </div>
    </main>
  );
}
