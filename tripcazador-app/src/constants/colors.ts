/**
 * Brand palette TripCazador — sincronizado con tripcazador-color-palette.pdf
 * y con la web (tailwind config). Cualquier cambio aquí debe replicarse en
 * la web (gray-950 / amber-500 / etc).
 */

export const Colors = {
  // Brand
  amber: '#f59e0b',
  amberLight: '#fbbf24',
  amberPale: '#fde68a',
  amberSubtle: 'rgba(245, 158, 11, 0.15)',
  amberBorder: 'rgba(245, 158, 11, 0.3)',

  // Dark mode (canónico)
  bg: '#030712', // gray-950
  surface: '#111827', // gray-900
  surfaceAlt: '#1f2937', // gray-800
  border: '#1f2937',
  borderSubtle: 'rgba(31, 41, 55, 0.6)',

  // Text
  textPrimary: '#f9fafb', // gray-50
  textSecondary: '#e5e7eb', // gray-200
  textMuted: '#9ca3af', // gray-400
  textSubtle: '#6b7280', // gray-500

  // States
  success: '#10b981', // emerald-500
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4', // cyan-500

  // Tier accents (used in PremiumPricingToggle, ConciergeTiers)
  premium: '#f59e0b',
  concierge: '#06b6d4',
  hotel: '#ec4899', // pink-500 for hotel watchlist

  // Overlays
  overlay: 'rgba(3, 7, 18, 0.6)',
  scrim: 'rgba(0, 0, 0, 0.4)',
} as const;

export type ColorKey = keyof typeof Colors;
