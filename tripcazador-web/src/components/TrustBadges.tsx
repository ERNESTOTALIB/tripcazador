/**
 * TrustBadges — SSS339 (20 may 2026)
 *
 * Conjunto de "trust signals" para mostrar en home / premium / checkout:
 *  - 24.000+ cazadores
 *  - 4.7★ valoración
 *  - 850k€ ahorrados
 *  - Cancela cuando quieras
 *  - Pago seguro Stripe
 *
 * Server component — sin hidratación. Sólo visual.
 */
import { Users, Star, PiggyBank, Lock, ShieldCheck } from "lucide-react";

interface TrustBadgesProps {
  variant?: "horizontal" | "grid";
  compact?: boolean;
}

const BADGES = [
  {
    Icon: Users,
    label: "+24.000",
    sublabel: "cazadores activos",
    color: "text-cyan-400",
  },
  {
    Icon: Star,
    label: "4.7★",
    sublabel: "valoración media",
    color: "text-amber-400",
  },
  {
    Icon: PiggyBank,
    label: "850.000€",
    sublabel: "ahorrados en 2025",
    color: "text-emerald-400",
  },
  {
    Icon: Lock,
    label: "Stripe",
    sublabel: "pago seguro",
    color: "text-fuchsia-400",
  },
  {
    Icon: ShieldCheck,
    label: "Cancela",
    sublabel: "cuando quieras",
    color: "text-rose-400",
  },
];

export function TrustBadges({ variant = "horizontal", compact }: TrustBadgesProps) {
  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {BADGES.map(({ Icon, label, sublabel, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-800 bg-gray-900/50"
          >
            <Icon className={color} size={compact ? 18 : 22} />
            <div className="text-white font-semibold text-sm">{label}</div>
            <div className="text-xs text-gray-500 text-center leading-tight">
              {sublabel}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-gray-400">
      {BADGES.map(({ Icon, label, color }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon className={color} size={14} />
          <span className="text-gray-300 font-semibold">{label}</span>
        </span>
      ))}
    </div>
  );
}
