import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/cloudflare — fase yyy (Real Visitor Truth)
 *
 * Lee Cloudflare Analytics GraphQL para mostrar visitantes/page-views REALES
 * (ground truth a nivel edge), independiente del consent-gate del tracker
 * interno. Resuelve la queja "panel marca 5 pero CF dice 200".
 *
 * Requiere envs:
 *   - CF_API_TOKEN  (Cloudflare API token con Account Analytics:Read scope)
 *   - CF_ZONE_ID    (Zone ID de tripcazador.com)
 *
 * Ambos se gestionan en https://dash.cloudflare.com/profile/api-tokens
 * y deben añadirse en Vercel → Project → Settings → Environment Variables.
 *
 * Devuelve agregados 24h, 7d, 30d + top countries + top paths + bot/threat counts.
 */

interface CFTotals {
  requests: number;
  page_views: number;
  unique_visitors: number;
  bandwidth_bytes: number;
  threats_blocked: number;
  cached_requests: number;
}

interface CFTimeseriesPoint {
  date: string;          // YYYY-MM-DD
  visitors: number;
  page_views: number;
}

interface CFCountry {
  country: string;       // ISO 3166-1 alpha-2
  requests: number;
}

interface CFPath {
  path: string;
  requests: number;
}

interface CFResponse {
  configured: boolean;
  error?: string;
  zone_id?: string;
  windows: {
    h24: CFTotals;
    d7: CFTotals;
    d30: CFTotals;
  };
  timeseries_30d: CFTimeseriesPoint[];
  top_countries_7d: CFCountry[];
  top_paths_7d: CFPath[];
  fetched_at: string;
}

const CF_GQL_URL = "https://api.cloudflare.com/client/v4/graphql";

function isoDateNDaysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function isoNow(): string {
  return new Date().toISOString();
}

interface CFGqlResp {
  data?: {
    viewer?: {
      zones?: Array<{
        h24?: Array<{
          sum?: {
            requests?: number;
            pageViews?: number;
            bytes?: number;
            threats?: number;
            cachedRequests?: number;
          };
          uniq?: { uniques?: number };
        }>;
        d7?: Array<{
          sum?: {
            requests?: number;
            pageViews?: number;
            bytes?: number;
            threats?: number;
            cachedRequests?: number;
          };
          uniq?: { uniques?: number };
        }>;
        d30?: Array<{
          sum?: {
            requests?: number;
            pageViews?: number;
            bytes?: number;
            threats?: number;
            cachedRequests?: number;
          };
          uniq?: { uniques?: number };
        }>;
        timeseries30?: Array<{
          dimensions?: { date?: string };
          sum?: { pageViews?: number };
          uniq?: { uniques?: number };
        }>;
        topCountries?: Array<{
          dimensions?: { clientCountryName?: string };
          count?: number;
        }>;
        topPaths?: Array<{
          dimensions?: { clientRequestPath?: string };
          count?: number;
        }>;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

async function queryCloudflare(zoneTag: string, apiToken: string): Promise<CFGqlResp | null> {
  const since24 = new Date(Date.now() - 86_400_000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const until = isoNow();

  // GraphQL — pedimos httpRequests1dGroups (granular por día) + httpRequests1hGroups (24h).
  // Documentación: https://developers.cloudflare.com/analytics/graphql-api/
  // SSS117: httpRequestsAdaptiveGroups usa datetime_geq que requiere Time! ISO8601;
  // httpRequests1dGroups usa date_geq que requiere Date! "YYYY-MM-DD". Se separan
  // las variables para no mezclar tipos.
  const query = `
    query Stats(
      $zone: String!,
      $since24: Time!,
      $since7Date: Date!,
      $since7Time: Time!,
      $since30Date: Date!,
      $until: Time!,
      $until7d: Date!,
      $until30d: Date!
    ) {
      viewer {
        zones(filter: { zoneTag: $zone }) {
          h24: httpRequests1hGroups(
            limit: 1
            filter: { datetime_geq: $since24, datetime_lt: $until }
          ) {
            sum { requests pageViews bytes threats cachedRequests }
            uniq { uniques }
          }
          d7: httpRequests1dGroups(
            limit: 1
            filter: { date_geq: $since7Date, date_leq: $until7d }
          ) {
            sum { requests pageViews bytes threats cachedRequests }
            uniq { uniques }
          }
          d30: httpRequests1dGroups(
            limit: 1
            filter: { date_geq: $since30Date, date_leq: $until30d }
          ) {
            sum { requests pageViews bytes threats cachedRequests }
            uniq { uniques }
          }
          timeseries30: httpRequests1dGroups(
            limit: 31
            filter: { date_geq: $since30Date, date_leq: $until30d }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            sum { pageViews }
            uniq { uniques }
          }
          topCountries: httpRequestsAdaptiveGroups(
            limit: 10
            filter: { datetime_geq: $since24, datetime_lt: $until }
            orderBy: [count_DESC]
          ) {
            dimensions { clientCountryName }
            count
          }
          topPaths: httpRequestsAdaptiveGroups(
            limit: 15
            filter: { datetime_geq: $since24, datetime_lt: $until }
            orderBy: [count_DESC]
          ) {
            dimensions { clientRequestPath }
            count
          }
        }
      }
    }
  `;

  const variables = {
    zone: zoneTag,
    since24,
    since7Date: isoDateNDaysAgo(7),
    since7Time: since7, // ISO8601 datetime para httpRequestsAdaptiveGroups
    since30Date: isoDateNDaysAgo(30),
    until,
    until7d: isoDateNDaysAgo(0),
    until30d: isoDateNDaysAgo(0),
  };

  try {
    const res = await fetch(CF_GQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[/api/admin/cloudflare] CF API ${res.status}`);
      return null;
    }
    return (await res.json()) as CFGqlResp;
  } catch (err) {
    console.error("[/api/admin/cloudflare] fetch err:", err);
    return null;
  }
}

function emptyTotals(): CFTotals {
  return {
    requests: 0,
    page_views: 0,
    unique_visitors: 0,
    bandwidth_bytes: 0,
    threats_blocked: 0,
    cached_requests: 0,
  };
}

function totalsFromGroup(
  group: Array<{
    sum?: { requests?: number; pageViews?: number; bytes?: number; threats?: number; cachedRequests?: number };
    uniq?: { uniques?: number };
  }> | undefined,
): CFTotals {
  if (!group || !group.length) return emptyTotals();
  const g = group[0];
  return {
    requests: g.sum?.requests ?? 0,
    page_views: g.sum?.pageViews ?? 0,
    unique_visitors: g.uniq?.uniques ?? 0,
    bandwidth_bytes: g.sum?.bytes ?? 0,
    threats_blocked: g.sum?.threats ?? 0,
    cached_requests: g.sum?.cachedRequests ?? 0,
  };
}

export async function GET(_req: NextRequest): Promise<NextResponse<CFResponse | { error: string }>> {
  // Auth via panel session cookie (mismo gate que /api/admin/analytics)
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiToken = process.env.CF_API_TOKEN || "";
  const zoneId = process.env.CF_ZONE_ID || "";

  const empty: CFResponse = {
    configured: false,
    zone_id: zoneId ? `${zoneId.slice(0, 6)}…` : undefined,
    windows: { h24: emptyTotals(), d7: emptyTotals(), d30: emptyTotals() },
    timeseries_30d: [],
    top_countries_7d: [],
    top_paths_7d: [],
    fetched_at: isoNow(),
  };

  if (!apiToken || !zoneId) {
    return NextResponse.json({
      ...empty,
      error:
        "CF_API_TOKEN o CF_ZONE_ID no configurados en Vercel. Ver MONITORING_SETUP.md.",
    });
  }

  const json = await queryCloudflare(zoneId, apiToken);
  if (!json || json.errors?.length || !json.data?.viewer?.zones?.length) {
    return NextResponse.json({
      ...empty,
      configured: true,
      error:
        json?.errors?.map((e) => e.message).join("; ") ||
        "CF GraphQL no devolvió datos. Verifica que el token tiene scope 'Account Analytics:Read' y el ZONE_ID es correcto.",
    });
  }

  const zone = json.data.viewer.zones[0];
  const h24 = totalsFromGroup(zone.h24);
  const d7 = totalsFromGroup(zone.d7);
  const d30 = totalsFromGroup(zone.d30);

  const timeseries30: CFTimeseriesPoint[] = (zone.timeseries30 || []).map((p) => ({
    date: p.dimensions?.date || "",
    visitors: p.uniq?.uniques ?? 0,
    page_views: p.sum?.pageViews ?? 0,
  }));

  const topCountries: CFCountry[] = (zone.topCountries || [])
    .filter((c) => c.dimensions?.clientCountryName)
    .map((c) => ({
      country: c.dimensions!.clientCountryName!,
      requests: c.count ?? 0,
    }));

  const topPaths: CFPath[] = (zone.topPaths || [])
    .filter((p) => p.dimensions?.clientRequestPath)
    .map((p) => ({
      path: p.dimensions!.clientRequestPath!,
      requests: p.count ?? 0,
    }));

  return NextResponse.json({
    configured: true,
    zone_id: `${zoneId.slice(0, 6)}…`,
    windows: { h24, d7, d30 },
    timeseries_30d: timeseries30,
    top_countries_7d: topCountries,
    top_paths_7d: topPaths,
    fetched_at: isoNow(),
  });
}
