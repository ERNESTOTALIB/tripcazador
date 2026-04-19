# TripCazador — Suite de Testing

Suite completa de testing automatizado para el proyecto TripCazador. Cubre:
motor de búsqueda (engines), detector de anomalías, exporter, API FastAPI y
end-to-end del pipeline.

La suite se complementa con:
- Playwright E2E en `tripcazador-web/e2e/`
- Watchdog de salud en `monitoring/watchdog.py`
- GitHub Actions en `.github/workflows/` (CI, E2E, deploy, health)

---

## Estructura

```
tests/
├── pytest.ini              # config pytest (testpaths, asyncio, markers)
├── requirements.txt        # deps de testing
├── conftest.py             # sys.path setup + fixtures globales
├── unit/
│   ├── test_detector.py        # T0–T7, IQR, Z-score, clasificación
│   ├── test_geo_data.py        # AIRPORT_GEO, enrich_geo, imágenes
│   ├── test_airline_links.py   # URL builders por aerolínea + TP marker
│   └── test_deals_exporter.py  # dedup, filter_quality, snapshot, schema
├── engines/
│   ├── test_kiwi_engine.py
│   ├── test_ryanair_engine.py
│   ├── test_vueling_engine.py
│   ├── test_serpapi_engine.py
│   ├── test_rapidapi_engine.py
│   └── test_travelpayouts_engine.py
├── api/
│   ├── test_api_endpoints.py   # /health /deals /deals/top /stats /regions
│   ├── test_api_cors.py        # CORS allowed + blocked origins, preflight
│   └── test_api_cache.py       # TTL 300s, invalidación, archivo ausente
├── integration/
│   └── test_end_to_end.py      # mock engine → detector → exporter → deals.json
└── fixtures/
    ├── kiwi_response.json
    ├── serpapi_response.json
    ├── rapidapi_sky_response.json
    ├── travelpayouts_response.json
    └── synthetic_deals.json
```

---

## Ejecutar localmente

```bash
# 1. Crear virtualenv e instalar deps
python3 -m venv .venv
. .venv/bin/activate
pip install -r tests/requirements.txt
# Opcional: deps de runtime si existen requirements propios
pip install -r api/requirements.txt
pip install -r flight_hunter_v4/requirements.txt 2>/dev/null || true

# 2. Ejecutar toda la suite
pytest tests/ -v

# 3. Con cobertura
pytest tests/ --cov=flight_hunter_v4 --cov=api --cov-report=term-missing

# 4. Solo unit tests (rapidos)
pytest tests/unit -v

# 5. Solo integration
pytest tests/integration -v
```

### Variables de entorno requeridas

Las tests usan claves fake inyectadas por `conftest.py`. Si invocas pytest en
un entorno limpio, se definen automáticamente:

| Variable              | Valor en tests     |
|-----------------------|--------------------|
| `KIWI_API_KEY`        | `test-kiwi-key`    |
| `SERPAPI_KEY`         | `test-serp-key`    |
| `RAPIDAPI_KEY`        | `test-rapid-key`   |
| `TRAVELPAYOUTS_TOKEN` | `test-tp-key`      |
| `TP_MARKER`           | `999999`           |
| `TELEGRAM_BOT_TOKEN`  | vacío              |
| `TELEGRAM_CHAT_ID`    | vacío              |

Ninguna prueba hace llamadas reales a red: todo usa `responses`, `monkeypatch`
o invocación directa de parsers internos (`_parse_response`, `_flight_to_dict`,
`_tp_to_dict`, etc.).

---

## Cobertura

Umbral mínimo exigido en CI: **60%**.

```bash
pytest tests/ --cov=flight_hunter_v4 --cov=api --cov-fail-under=60
```

Si cae por debajo, CI falla y se envía alerta a Telegram.

---

## Playwright E2E

```bash
cd tripcazador-web
npm install
npx playwright install --with-deps chromium
npm run test:e2e              # run headless
npm run test:e2e:ui           # UI mode
BASE_URL=https://tripcazador.com npm run test:e2e   # contra producción
```

---

## Watchdog

```bash
# Local
TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... python monitoring/watchdog.py

# Smoke test rápido
./monitoring/smoke_test.sh https://api.tripcazador.com
```

El watchdog deduplica alertas (no repite la misma alerta en <1h) y envía
mensaje de recuperación cuando un check vuelve a OK.

---

## GitHub Actions

Workflows configurados en `.github/workflows/`:

- **ci.yml** — en push/PR: pytest + coverage. Fail <60% → alerta Telegram.
- **e2e.yml** — Playwright contra build local en push a main.
- **deploy-api.yml** — SSH deploy al VPS en cambios a `api/` o `flight_hunter_v4/`.
- **health.yml** — cron cada 30 min ejecutando el watchdog.

### Secrets necesarios

En *Settings → Secrets and variables → Actions*:

| Secret                 | Descripción                         |
|------------------------|-------------------------------------|
| `TELEGRAM_BOT_TOKEN`   | Token del bot                       |
| `TELEGRAM_CHAT_ID`     | Chat destino de alertas             |
| `SSH_PRIVATE_KEY`      | Clave privada para deploy al VPS    |
| `VPS_HOST`             | Host/IP del VPS                     |
| `VPS_USER`             | Usuario SSH                         |
| `SENTRY_DSN`           | DSN del proyecto (opcional)         |

---

## Sentry

### Backend (FastAPI)

`api/main.py` inicializa Sentry automáticamente si `SENTRY_DSN` está
definida. Añade a systemd:

```ini
Environment="SENTRY_DSN=https://xxx@sentry.io/yyy"
Environment="SENTRY_ENV=production"
Environment="SENTRY_TRACES_RATE=0.1"
```

### Frontend (Next.js)

Configs en `sentry.client.config.ts`, `sentry.server.config.ts`,
`sentry.edge.config.ts`. Variables en `.env.production`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
NEXT_PUBLIC_SENTRY_ENV=production
NEXT_PUBLIC_SENTRY_TRACES_RATE=0.1
SENTRY_DSN=https://xxx@sentry.io/yyy
```

Si faltan las variables, Sentry simplemente no se inicializa (no rompe la app).

---

## Añadir nuevos tests

1. **Engine nuevo**: crea `tests/engines/test_<name>_engine.py` siguiendo el
   patrón: importa el parser interno (`_xxx_to_dict`), alimenta con un fixture
   JSON en `tests/fixtures/`, verifica campos resultantes.

2. **Endpoint nuevo**: añade clase `TestNewEndpoint` en
   `tests/api/test_api_endpoints.py` usando la fixture `api_client`.

3. **Técnica detector nueva**: test unitario aislado en
   `tests/unit/test_detector.py` con flights sintéticos que disparen exactamente
   esa técnica.

Regla general: **happy path + 2 edges + no side effects**. Todo <100ms por test.
