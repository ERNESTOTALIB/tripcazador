/**
 * Format helpers — currency, fechas, distancia, etc.
 *
 * Locale-aware: usamos `Intl.NumberFormat` con `es-ES` por default y
 * fallback al `expo-localization.locale` cuando esté disponible.
 */

import { getLocales } from 'expo-localization';

const DEFAULT_LOCALE = 'es-ES';

function getLocale(): string {
  try {
    const locales = getLocales();
    return locales[0]?.languageTag ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function formatEur(value: number, opts: { decimals?: 0 | 2 } = {}): string {
  const decimals = opts.decimals ?? 0;
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${value}€`;
  }
}

export function formatDate(iso: string | undefined, opts: { withYear?: boolean } = {}): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const fmt: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
    };
    if (opts.withYear) fmt.year = 'numeric';
    return new Intl.DateTimeFormat(getLocale(), fmt).format(d);
  } catch {
    return iso;
  }
}

export function formatDateRange(out?: string, ret?: string): string {
  if (!out && !ret) return '';
  if (out && !ret) return formatDate(out);
  if (out && ret) {
    const o = new Date(out);
    const r = new Date(ret);
    if (
      Number.isNaN(o.getTime()) ||
      Number.isNaN(r.getTime()) ||
      o.getMonth() !== r.getMonth() ||
      o.getFullYear() !== r.getFullYear()
    ) {
      return `${formatDate(out)} → ${formatDate(ret)}`;
    }
    // Mismo mes: "15-19 may"
    return `${o.getDate()}–${formatDate(ret)}`;
  }
  return '';
}

/**
 * Tiempo relativo "hace 5min" / "hace 2h". Util para badges hot_until.
 */
export function relativeTimeAgo(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    return formatDate(iso, { withYear: true });
  } catch {
    return '';
  }
}

export function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

/**
 * Truncate texto con ellipsis (visual). Para card titles, descriptions.
 */
export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}
