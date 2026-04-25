# Grafana Dashboards

Versión versionada de los dashboards Grafana usados para TripCazador.

## Setup

1. **Prometheus scraper** apuntando a `http://VPS:8000/api/metrics/prometheus` cada 15-30s. Confirmar `EXPOSE_METRICS=1` en el container API o que el scraper viene de loopback (sidecar).
2. En Grafana: **Dashboards → Import → Upload JSON file** y subir `tripcazador-overview.json`.
3. Seleccionar la datasource Prometheus existente cuando lo pida la variable `DS_PROMETHEUS`.

## Paneles

- **API uptime** — segundos desde el último restart. 0 = recién desplegado.
- **Cache hit ratio** — target ≥ 0.85. Bajar = TTL muy corto.
- **Active deals** — total activo en `deals.json`. Alert si 0 (worker cron caído + seed no kickeó).
- **Deals file age** — edad del fichero de deals. Verde < 6h, ámbar < 14h, rojo más.
- **Requests/s by endpoint (5m rate)** — tráfico desglosado por `endpoint=deals/top/search`.
- **Rate-limit rejections (rps)** — alerta si sostenido > 1 rps (scraping).
- **Cache ops/s (stacked)** — hits / misses / refreshes apilados.
- **Deployed version** — tabla con `version` + `git_sha` actual (label `tripcazador_app_version_info`).

## Métricas expuestas

Todas vienen de `/api/metrics/prometheus`:

```
tripcazador_uptime_seconds
tripcazador_cache_hits_total / cache_misses_total / cache_refreshes_total
tripcazador_cache_hit_ratio
tripcazador_requests_total{endpoint="deals|top|search"}
tripcazador_rate_limit_rejections_total
tripcazador_deals_total
tripcazador_deals_age_seconds
tripcazador_app_version_info{version,sha}
```

## Convenciones

- **Refresh por defecto:** 30s.
- **Time range:** 6h (suficiente para auditar último ciclo del worker cron).
- **Dark theme** por consistencia con el frontend.
- **UID estable:** `tripcazador-overview` — los enlaces externos siguen funcionando si se re-importa.

## Alertas (sugerido, no incluido en JSON)

- `cache_hit_ratio < 0.7 durante 10min` → notification slack/telegram
- `deals_age_seconds > 50400 (14h)` → page oncall
- `rate(rate_limit_rejections_total[5m]) > 1` durante 15min → page oncall (scraping)
- `up{job="tripcazador-api"} == 0` durante 5min → page oncall
