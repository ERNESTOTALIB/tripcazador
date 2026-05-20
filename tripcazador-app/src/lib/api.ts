/**
 * API client — TripCazador backend.
 *
 * Reglas:
 *  - Todas las llamadas pasan por `apiFetch()` para inyectar X-App-Version,
 *    User-Agent, y manejar errores uniformemente.
 *  - Endpoints públicos (deals, sitemap) no requieren auth.
 *  - Endpoints Premium requieren cookie session + token TOPS — gestionados
 *    por `lib/auth.ts`.
 *  - Sin throw silencioso: cada llamada devuelve `{data, error}` shape para
 *    que la UI pueda decidir cómo mostrar el error.
 */

import { Config } from '@/constants/config';
import type { Deal, DealsResponse } from '@/types/deal';
import type { PremiumStats, Alert, WatchEntry } from '@/types/premium';
import { getAuthHeaders } from './auth';

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

interface FetchOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Requires auth headers */
  authed?: boolean;
  /** Timeout ms — default 15s */
  timeout?: number;
  /** Skip cache on GET */
  noCache?: boolean;
}

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, authed = false, timeout = 15_000, noCache } = opts;
  const url = path.startsWith('http') ? path : `${Config.API_BASE}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    'X-App-Version': Config.APP_VERSION,
    'X-Build-Version': Config.BUILD_VERSION,
    'User-Agent': `TripCazador-Mobile/${Config.APP_VERSION} (Expo)`,
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authed) {
    Object.assign(headers, await getAuthHeaders());
  }
  if (noCache) {
    headers['Cache-Control'] = 'no-cache';
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const status = res.status;
    let data: T | null = null;
    let error: string | null = null;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (res.ok) {
        data = json as T;
      } else {
        error = typeof json?.error === 'string' ? json.error : `http_${status}`;
      }
    } else if (!res.ok) {
      error = `http_${status}`;
    }
    return { data, error, status };
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === 'AbortError') {
      return { data: null, error: 'timeout', status: 0 };
    }
    const msg = e instanceof Error ? e.message : 'network_error';
    return { data: null, error: msg, status: 0 };
  }
}

// ---------- Deals ----------

export interface GetDealsParams {
  limit?: number;
  origin?: string;
  destination?: string;
  region?: string;
  type?: 'flight' | 'hotel';
}

export async function getDeals(params: GetDealsParams = {}): Promise<ApiResult<DealsResponse>> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.origin) query.set('origin', params.origin);
  if (params.destination) query.set('destination', params.destination);
  if (params.region) query.set('region', params.region);
  if (params.type) query.set('type', params.type);
  const qs = query.toString();
  return apiFetch<DealsResponse>(`/api/deals${qs ? `?${qs}` : ''}`);
}

export async function getDealById(id: string): Promise<ApiResult<Deal>> {
  return apiFetch<Deal>(`/api/deals/${encodeURIComponent(id)}`);
}

// ---------- Newsletter ----------

export async function subscribeNewsletter(opts: {
  email: string;
  source?: string;
  locale?: string;
}): Promise<ApiResult<{ ok: boolean; created: boolean }>> {
  return apiFetch('/api/subscribe', {
    method: 'POST',
    body: {
      email: opts.email,
      source: opts.source || 'mobile_app',
      locale: opts.locale || 'es',
      consent: true,
    },
  });
}

// ---------- Premium ----------

export async function getPremiumStats(): Promise<ApiResult<PremiumStats>> {
  return apiFetch<PremiumStats>('/api/premium/stats', { authed: true });
}

export async function listAlerts(): Promise<ApiResult<{ alerts: Alert[] }>> {
  return apiFetch<{ alerts: Alert[] }>('/api/premium/alerts', { authed: true });
}

export async function createAlert(payload: Partial<Alert>): Promise<ApiResult<Alert>> {
  return apiFetch<Alert>('/api/premium/alerts', {
    method: 'POST',
    authed: true,
    body: payload,
  });
}

export async function deleteAlert(id: string): Promise<ApiResult<{ ok: boolean }>> {
  return apiFetch(`/api/premium/alerts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    authed: true,
  });
}

export async function listWatchlist(): Promise<ApiResult<{ watches: WatchEntry[] }>> {
  return apiFetch('/api/premium/watchlist', { authed: true });
}

export async function startCheckout(opts: {
  email: string;
  cycle: 'monthly' | 'annual' | 'gift';
  gift_recipient?: string;
}): Promise<ApiResult<{ url: string; id: string }>> {
  return apiFetch('/api/premium/checkout', {
    method: 'POST',
    body: opts,
  });
}

export async function activatePremium(opts: {
  session_id: string;
}): Promise<ApiResult<{ activated: boolean; expires_at: number }>> {
  return apiFetch('/api/premium/activate', {
    method: 'POST',
    body: opts,
  });
}

// ---------- Concierge ----------

export async function requestConciergeAccess(opts: {
  email: string;
}): Promise<ApiResult<{ ok: boolean; sent: boolean }>> {
  return apiFetch('/api/concierge/request-access', {
    method: 'POST',
    body: opts,
  });
}

// ---------- Push token registration ----------

export async function registerPushToken(opts: {
  token: string;
  platform: 'ios' | 'android';
  app_version: string;
}): Promise<ApiResult<{ ok: boolean }>> {
  return apiFetch('/api/push/register', {
    method: 'POST',
    body: opts,
  });
}
