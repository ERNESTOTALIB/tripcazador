/**
 * Premium tipos compartidos con web. Sync con `tripcazador-web/src/lib/premium.ts`.
 */

export type PremiumCycle = 'monthly' | 'annual' | 'gift';

export interface PremiumState {
  active: boolean;
  email?: string;
  customer_id?: string;
  expires_at?: number; // epoch ms
  cancel_at?: number;
  cycle?: PremiumCycle;
}

export interface PremiumStats {
  total_savings_eur: number;
  alerts_triggered: number;
  watchlist_count: number;
  joined_at: number;
  days_active: number;
}

export interface Alert {
  id: string;
  origin?: string;
  destination?: string;
  max_price_eur?: number;
  nights_min?: number;
  nights_max?: number;
  /** Customer-friendly nombre */
  name?: string;
  created_at: number;
  active: boolean;
}

export interface WatchEntry {
  id: string;
  deal_id: string;
  target_drop_pct: number;
  initial_price: number;
  current_price?: number;
  created_at: number;
}

export interface SavedSearch {
  id: string;
  query: string;
  origin?: string;
  region?: string;
  created_at: number;
}
