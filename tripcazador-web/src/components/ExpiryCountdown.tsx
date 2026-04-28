"use client";

import { useEffect, useState } from "react";

interface Props {
  /** ISO date string (UTC). If null/undefined, the component renders nothing. */
  expiresAt?: string | null;
  /** Timestamp ISO when the deal was found. Used only as fallback for "fresh" label. */
  foundAt?: string | null;
  /** If true, uses the high-urgency amber/red palette (error fares, CRÍTICO). */
  critical?: boolean;
}

/**
 * Contador de expiración para un deal.
 * Muestra tiempo restante hasta expires_at, y cambia de tono según urgencia:
 *   > 48h  → gris discreto
 *   24-48h → amarillo suave
 *   < 24h  → ámbar fuerte
 *   < 6h   → rojo (parpadeando levemente)
 *
 * Si no hay expires_at, muestra un chip sobrio con "Encontrado hace X".
 */
export function ExpiryCountdown({ expiresAt, foundAt, critical }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    // Actualizamos cada 30s (no necesitamos precisión de segundo; evitamos churn).
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Caso 1 — sin expires_at: chip de frescura con código de color por antigüedad
  if (!expiresAt) {
    if (!foundAt) return null;
    const diffMin = Math.max(0, (now - new Date(foundAt).getTime()) / 60_000);
    const label =
      diffMin < 60
        ? `Hace ${Math.round(diffMin)} min`
        : diffMin < 60 * 24
          ? `Hace ${Math.round(diffMin / 60)}h`
          : `Hace ${Math.round(diffMin / (60 * 24))}d`;
    // F1 fase ii: stale warning visual si oferta >24h
    let chipCls = "bg-gray-800 text-gray-400";
    let dotCls = "bg-gray-500";
    let prefix = "Encontrado";
    if (diffMin < 60) {
      // <1h: fresh — verde
      chipCls = "bg-green-500/10 border border-green-500/30 text-green-300";
      dotCls = "bg-green-400 animate-pulse";
    } else if (diffMin < 60 * 24) {
      // <24h: ok — gris claro
      chipCls = "bg-gray-800 text-gray-300";
      dotCls = "bg-gray-400";
    } else if (diffMin < 60 * 24 * 3) {
      // 1-3 días: stale warning — amber suave
      chipCls = "bg-amber-500/10 border border-amber-500/30 text-amber-200";
      dotCls = "bg-amber-400";
      prefix = "Visto";
    } else {
      // >3 días: probablemente caducado — rojo suave
      chipCls = "bg-red-500/10 border border-red-500/30 text-red-300";
      dotCls = "bg-red-400";
      prefix = "Posiblemente caducado · visto";
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${chipCls}`}
        title={`Último escaneo: ${new Date(foundAt).toLocaleString("es-ES")}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
        {prefix} {label}
      </span>
    );
  }

  const remainingMs = new Date(expiresAt).getTime() - now;
  const remainingH = remainingMs / (1000 * 60 * 60);

  // Caso 2 — ya expirado
  if (remainingMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 text-gray-500 text-xs line-through">
        Expirado
      </span>
    );
  }

  // Formateo legible
  const totalMin = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  let label: string;
  if (days >= 1) {
    label = `${days}d ${hours}h`;
  } else if (hours >= 1) {
    label = `${hours}h ${mins}m`;
  } else {
    label = `${mins} min`;
  }

  // Tono según urgencia
  let cls: string;
  let icon: string;
  if (remainingH < 6 || (critical && remainingH < 12)) {
    cls = "bg-red-500/15 border border-red-500/40 text-red-300 animate-pulse";
    icon = "🔥";
  } else if (remainingH < 24) {
    cls = "bg-amber-500/15 border border-amber-500/40 text-amber-300";
    icon = "⚡";
  } else if (remainingH < 48) {
    cls = "bg-yellow-500/10 border border-yellow-500/30 text-yellow-200";
    icon = "⏳";
  } else {
    cls = "bg-gray-800 border border-gray-700 text-gray-300";
    icon = "⏱️";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
      title={`Vigencia prevista hasta ${new Date(expiresAt).toLocaleString("es-ES")}`}
    >
      <span>{icon}</span>
      Expira en {label}
    </span>
  );
}
