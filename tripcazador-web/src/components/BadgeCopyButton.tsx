"use client";
/**
 * BadgeCopyButton — SSS441 (23 may 2026)
 *
 * Botón pequeño que copia el texto pasado al clipboard. UX feedback:
 * label "Copiar X" → "✓ Copiado" durante 2s.
 */
import { useState } from "react";

export function BadgeCopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silent — algunos browsers/contextos no permiten clipboard sin user gesture confirmado
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
        copied
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border-slate-600 bg-slate-900 text-slate-300 hover:border-amber-500/50 hover:text-amber-300"
      }`}
    >
      {copied ? "✓ Copiado" : label}
    </button>
  );
}

export default BadgeCopyButton;
