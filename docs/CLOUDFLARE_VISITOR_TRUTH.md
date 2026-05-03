# Cloudflare Ground-Truth Visitor Tracking

**Fase SSS45** (May 2026) · doc bloqueador para activar visitor counts reales en `/panel`.

## Por qué

El tracker propio (`/api/track` + `event_store`) cuenta sólo visitas con JS habilitado y consent dado, lo que infraestima ~30-50% del tráfico real (bots de buena fe, no-consent, JS bloqueado). **Cloudflare Analytics GraphQL API** da el ground-truth: cada request HTTP que pasa por su edge.

## Variables de entorno requeridas en Vercel

```
CF_API_TOKEN          # Token con permiso "Analytics:Read" (account-level)
CF_ZONE_ID            # 0324bdbe74cdf0b60248b0dbf74864eb (tripcazador.com)
```

## Estado actual (3 may 2026 SSS47)

**Yo dejé Chrome abierto en el formulario "Create Custom Token"** —
los inputs de texto (token name, permissions dropdown) no son alcanzables
por la AX tree desde ghost-os, así que tienes que terminar TÚ los 3 clicks
restantes (te toma ~90 segundos). Pasos abajo.

## Cómo crear el CF_API_TOKEN (paso a paso)

1. Ir a https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Plantilla "Read analytics and reports" → Use template
4. Permissions:
   - Account · Analytics · Read
   - Zone · Analytics · Read
5. Account Resources: tu cuenta principal
6. Zone Resources: include → specific zone → tripcazador.com
7. TTL: sin caducidad (o 1 año, rotar manual)
8. Continue to summary → Create Token
9. **Copiar el token al portapapeles** (sólo se muestra una vez)
10. Settings Vercel → Environment Variables → Add:
    - `CF_API_TOKEN` = `<token>` (Production + Preview + Development)
    - `CF_ZONE_ID` = `0324bdbe74cdf0b60248b0dbf74864eb`
11. Redeploy Vercel para que el endpoint `/panel` lo lea

## Endpoint que lo consume

`/api/admin/cf-stats` (existe en código YYY) hace fetch a:

```
POST https://api.cloudflare.com/client/v4/graphql
Authorization: Bearer ${CF_API_TOKEN}
Content-Type: application/json
```

Con query GraphQL agregando:
- `viewer.zones[zoneTag=$zone].httpRequests1dGroups`
- groupBy: { dimensions: [date] }
- order: SUM_REQUESTS_DESC
- filter: { datetime_geq: <30d ago>, datetime_leq: <hoy> }

Devuelve:
- `unique_visitors_24h` (CF dedup por client IP + browser fingerprint hash)
- `total_requests_30d`
- `bandwidth_bytes_30d`
- `top_countries`
- `cache_hit_ratio`

## Comparativa esperada

Tras activar (en `/panel`):

| Métrica            | Tracker propio | CF ground-truth | Δ esperada |
|--------------------|----------------|------------------|------------|
| Unique 24h         | ~412           | ~600-700         | +50-70%    |
| Page views 24h     | ~1.200         | ~2.500-3.500     | +100-200%  |
| Top countries      | "ES" mostrado  | ES + AR + MX + CO + cl + co + pe | +5-7 países |

El gap se debe a: bots no-AdBlock, sesiones sin consent, prefetch de Google, scrapers RSS.

## Banner discrepancia en /panel

El componente `CfDiscrepancyBanner` en `/panel/page.tsx` muestra automáticamente la diferencia % entre tracker propio y CF. Con CF activo, sirve de QA: si tracker está <60% del CF, hay bug en consent/JS.

## Privacidad / RGPD

CF Analytics no usa cookies — usa fingerprint IP+UA hash con TTL 24h. **No requiere consent banner** según UE-EDPS. Es complementario, no reemplaza nuestro tracker (que sí mide eventos custom como "deal_click" no medibles por CF).

## Coste

CF Analytics API es gratuita en plan Free hasta 6 meses de retención.
GraphQL queries: 1.000.000/mes free → con 1 query/30min en `/panel` = 1.440/mes (0.14% del límite).
