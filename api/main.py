"""
TripCazador — FastAPI Backend
==============================
API REST para servir deals a la web Next.js.

Endpoints:
  GET /api/deals          → Lista de deals con filtros
  GET /api/deals/top      → Top N deals por score
  GET /api/deals/{id}     → Deal específico por ID
  GET /api/stats          → Estadísticas globales
  GET /api/health         → Health check

Uso en desarrollo:
  cd api/
  uvicorn main:app --reload --port 8000

En producción:
  uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
"""

import json
import os
import hashlib
import hmac
import threading
from pathlib import Path
from datetime import datetime
from typing import Optional, List
import re
import json
import pathlib
import time

# Environment flag (production vs dev). Se usa para gating de superficies
# informativas como /api/docs y /api/openapi.json.
_ENV = os.getenv("ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()
_IS_PRODUCTION = _ENV in {"production", "prod"}

# Cargar .env antes de leer variables de entorno (silencioso si no existe)
try:
    from dotenv import load_dotenv
    _here = Path(__file__).resolve().parent
    for candidate in [_here.parent / ".env", _here / ".env"]:
        if candidate.exists():
            load_dotenv(candidate, override=False)
            break
except ImportError:
    pass

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, EmailStr, Field

# Rate limiting (slowapi) — opcional, se activa si está instalado
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    _LIMITER_AVAILABLE = True
except ImportError:
    _LIMITER_AVAILABLE = False


# ────────────────────────────────────────────────
# Sentry (opcional, activado si SENTRY_DSN definido)
# ────────────────────────────────────────────────
_SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
if _SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        # abr-2026m: release tracking — Sentry agrupa issues por release y
        # permite detectar regresiones tras un deploy. El SHA se lee abajo
        # con `_read_git_sha()` (init order: SDK necesita la string ya
        # calculada antes de Sentry init).
        _gh_sha_for_sentry = os.getenv("GIT_SHA", "").strip()
        if not _gh_sha_for_sentry:
            try:
                _here_for_sentry = Path(__file__).resolve().parent
                _sha_file = _here_for_sentry / "GIT_SHA"
                if _sha_file.exists():
                    _gh_sha_for_sentry = _sha_file.read_text(encoding="utf-8").strip()
            except Exception:
                _gh_sha_for_sentry = ""
        _release = (
            f"tripcazador-api@{os.getenv('APP_VERSION', '1.0.0')}"
            + (f"+{_gh_sha_for_sentry[:12]}" if _gh_sha_for_sentry else "")
        )

        sentry_sdk.init(
            dsn=_SENTRY_DSN,
            environment=os.getenv("SENTRY_ENV", "production"),
            release=_release,
            # `dist` permite distinguir múltiples builds del mismo release
            # (p.ej. arm64 vs amd64). Usamos hostname para tracking de hosts.
            dist=os.getenv("HOSTNAME", "")[:32] or None,
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_RATE", "0.1")),
            profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_RATE", "0.0")),
            send_default_pii=False,
            integrations=[StarletteIntegration(), FastApiIntegration()],
        )
        # Tag global con SHA — facilita filtrar issues por commit en Sentry UI.
        if _gh_sha_for_sentry:
            sentry_sdk.set_tag("git_sha", _gh_sha_for_sentry[:12])
    except ImportError:
        # sentry-sdk no instalado: seguir sin telemetria
        pass


# ────────────────────────────────────────────────
# App identity — timestamp y SHA leídos una vez al arranque.
# Se exponen en /api/health y /api/status para diagnosticar rápidamente
# qué versión está corriendo en qué host (útil post-deploy).
# ────────────────────────────────────────────────
_APP_STARTED_AT = time.time()
_APP_VERSION = os.getenv("APP_VERSION", "1.0.0")


def _read_git_sha() -> str:
    """Devuelve el SHA corto del HEAD si está disponible, o cadena vacía.

    1) Variable de entorno GIT_SHA (inyectada por la imagen Docker de CI).
    2) Fichero api/GIT_SHA si se bakeó en build-time.
    3) Lectura directa del .git/HEAD (último resort en dev).
    """
    env_sha = os.getenv("GIT_SHA", "").strip()
    if env_sha:
        return env_sha[:12]
    try:
        here = Path(__file__).resolve().parent
        sha_file = here / "GIT_SHA"
        if sha_file.exists():
            return sha_file.read_text(encoding="utf-8").strip()[:12]
        # Leer .git/HEAD → refs/heads/main → SHA
        git_dir = here.parent / ".git"
        head = git_dir / "HEAD"
        if head.exists():
            ref_line = head.read_text(encoding="utf-8").strip()
            if ref_line.startswith("ref: "):
                ref_path = git_dir / ref_line[5:]
                if ref_path.exists():
                    return ref_path.read_text(encoding="utf-8").strip()[:12]
            else:
                return ref_line[:12]
    except Exception:
        pass
    return ""


_APP_GIT_SHA = _read_git_sha()


# ────────────────────────────────────────────────
# App setup
# ────────────────────────────────────────────────

app = FastAPI(
    title="TripCazador API",
    description="API de deals de vuelos — error fares y chollos desde Europa",
    version="1.0.0",
    # En producción desactivamos docs/openapi públicos: el schema expone
    # endpoints admin y rutas internas innecesariamente a escaners automáticos.
    # Se puede forzar su reactivación con EXPOSE_DOCS=1 (p.ej. debugging puntual).
    docs_url=None if _IS_PRODUCTION and os.getenv("EXPOSE_DOCS", "") != "1" else "/api/docs",
    redoc_url=None if _IS_PRODUCTION and os.getenv("EXPOSE_DOCS", "") != "1" else "/api/redoc",
    openapi_url=None if _IS_PRODUCTION and os.getenv("EXPOSE_DOCS", "") != "1" else "/api/openapi.json",
)

# CORS: permitir solo tripcazador.com y localhost en dev
ALLOWED_ORIGINS = [
    "https://tripcazador.com",
    "https://www.tripcazador.com",
    "http://localhost:3000",  # Next.js dev
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────
# Rate limiting: 60 req/min por IP en endpoints GET,
# 5 req/min en /api/subscribe (anti-spam newsletter)
# ────────────────────────────────────────────────
if _LIMITER_AVAILABLE:
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["60/minute"],
        storage_uri="memory://",  # in-memory (suficiente para 1 instancia)
    )
    app.state.limiter = limiter

    async def _rate_limit_counted_handler(request, exc):
        # Envolver el handler oficial para contar rechazos en /api/metrics.
        # `_bump` referenciado a nivel de módulo (definido más abajo en el
        # flujo de carga, Python resuelve el nombre en runtime del handler).
        try:
            _bump("rate_limit_rejections")
        except Exception:
            pass
        return _rate_limit_exceeded_handler(request, exc)

    app.add_exception_handler(RateLimitExceeded, _rate_limit_counted_handler)
else:
    # Stub: decorator no-op si slowapi no está instalado
    class _NoopLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    limiter = _NoopLimiter()

# Ruta al deals.json (generado por deals_exporter.py)
DEALS_DIR = Path(os.environ.get("DEALS_DIR", str(Path(__file__).parent.parent / "Viajes")))
DEALS_JSON = DEALS_DIR / "deals.json"

# Ruta al histórico de precios (SQLite — tabla `flights` del motor v4)
_FH_DIR = Path(__file__).resolve().parent.parent / "flight_hunter_v4"
PRICE_HISTORY_DB = Path(os.environ.get("PRICE_HISTORY_DB", str(_FH_DIR / "price_history_v4.db")))

# Ruta al histórico de hoteles (SQLite — tabla `price_history` del hotel_hunter)
_HH_DIR = Path(__file__).resolve().parent.parent / "hotel_hunter"
HOTEL_DB = Path(os.environ.get("HOTEL_DB", str(_HH_DIR / "price_history.db")))


# ────────────────────────────────────────────────
# Modelos Pydantic
# ────────────────────────────────────────────────

class Deal(BaseModel):
    id: str
    type: str = "flight"
    headline: str = ""
    origin: str
    destination: str
    city_from: str = ""
    city_to: str = ""
    country_to: str = ""
    region: str = ""
    price_eur: float
    savings_pct: float = 0
    savings_eur: float = 0
    nights: int = 0
    price_per_night: Optional[float] = None
    date_out: str = ""
    date_ret: str = ""
    cabin: str = "economy"
    airline: str = ""
    airline_name: str = ""
    stops: int = 0
    duration_min: int = 0
    distance_category: str = ""
    score: float = 0
    classification: str = ""
    tags: List[str] = []
    image_url: str = ""
    booking_url: str = ""
    verified: bool = False
    sources: List[str] = []
    found_at: str = ""
    expires_at: str = ""
    lat: Optional[float] = None
    lon: Optional[float] = None
    main_reason: Optional[str] = None
    t4_ratio: Optional[float] = None


class StatsResponse(BaseModel):
    total: int
    flights: int
    hotels: int
    by_classification: dict
    by_region: dict
    by_cabin: dict
    price_min: float
    price_max: float
    price_avg: float
    verified_count: int
    generated_at: str


# ────────────────────────────────────────────────
# Cache en memoria (simple, sin Redis)
# ────────────────────────────────────────────────

_cache: dict = {"data": None, "loaded_at": None}
_cache_lock = threading.Lock()  # Protege lecturas/escrituras concurrentes de _cache
_CACHE_TTL_SECONDS = 300  # 5 minutos

# ────────────────────────────────────────────────
# Contadores ligeros de monitoreo (in-memory).
# No requieren dependencias externas ni Redis. Se exponen en /api/metrics.
# Si el proceso se reinicia, los contadores vuelven a cero — esto es
# intencional: buscamos observabilidad operacional, no métricas de negocio.
# ────────────────────────────────────────────────
_metrics_lock = threading.Lock()
_metrics: dict = {
    "cache_hits": 0,
    "cache_misses": 0,
    "cache_refreshes": 0,
    "requests_deals": 0,
    "requests_search": 0,
    "requests_top": 0,
    "rate_limit_rejections": 0,
    "started_at": time.time(),
}


def _bump(metric: str, n: int = 1) -> None:
    """Incremento atómico bajo lock. El coste es despreciable vs. un disk I/O."""
    with _metrics_lock:
        _metrics[metric] = _metrics.get(metric, 0) + n


def load_deals() -> dict:
    """Carga deals.json con caché de 5 minutos.

    Thread-safe: en workers multi-thread (uvicorn --workers N + starlette
    multi-thread) evita que un lector vea una asignación parcial del dict
    durante la recarga. Double-check pattern: el fast-path sigue sin lock
    si ya hay datos válidos; sólo entramos a la sección crítica al refrescar.
    """
    now = datetime.now()
    # Fast-path sin lock — lectura atómica de referencias Python
    cached_data = _cache.get("data")
    cached_at = _cache.get("loaded_at")
    if (
        cached_data is not None
        and cached_at is not None
        and (now - cached_at).total_seconds() < _CACHE_TTL_SECONDS
    ):
        _bump("cache_hits")
        return cached_data

    # Slow-path: adquirir lock para refrescar/inicializar
    with _cache_lock:
        # Re-check dentro del lock por si otro thread ya refrescó
        now = datetime.now()
        cached_data = _cache.get("data")
        cached_at = _cache.get("loaded_at")
        if (
            cached_data is not None
            and cached_at is not None
            and (now - cached_at).total_seconds() < _CACHE_TTL_SECONDS
        ):
            # Otro thread refrescó mientras esperábamos el lock.
            _bump("cache_hits")
            return cached_data

        _bump("cache_misses")

        if not DEALS_JSON.exists():
            empty = {
                "schema_version": "4.1",
                "generated_at": now.isoformat(),
                "total_deals": 0,
                "stats": {
                    "total": 0, "flights": 0, "hotels": 0,
                    "by_classification": {}, "by_region": {}, "by_cabin": {},
                    "price_min": 0, "price_max": 0, "price_avg": 0, "verified_count": 0,
                },
                "deals": [],
            }
            return empty

        with open(DEALS_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)

        _cache["data"] = data
        _cache["loaded_at"] = now
        _bump("cache_refreshes")
        return data


# ────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────

@app.get("/api/metrics")
async def metrics(request: Request):
    """
    Métricas operacionales ligeras para monitoring.

    Formato intencionalmente JSON (no Prometheus) para simplicidad — una
    próxima iteración puede exponer `/api/metrics?format=prometheus`.

    Gating: en producción solo se expone si el request viene del loopback
    (127.0.0.1/::1), de forma que UptimeRobot u otros scanners externos
    reciben 404. Exponer estos contadores públicamente no es un riesgo
    de seguridad directo, pero sí revela heurísticas de tráfico que
    preferimos no dar gratis a scrapers.

    Para bypassear en prod (debugging): EXPOSE_METRICS=1
    """
    client_host = request.client.host if request.client else ""
    _is_local = client_host in ("127.0.0.1", "::1", "localhost")
    if (
        _IS_PRODUCTION
        and not _is_local
        and os.getenv("EXPOSE_METRICS", "") != "1"
    ):
        raise HTTPException(status_code=404, detail="Not found")

    with _metrics_lock:
        snapshot = dict(_metrics)

    total_ops = snapshot["cache_hits"] + snapshot["cache_misses"]
    hit_ratio = (
        round(snapshot["cache_hits"] / total_ops, 4) if total_ops > 0 else None
    )
    uptime = round(time.time() - snapshot["started_at"], 1)

    return {
        "uptime_seconds": uptime,
        "cache": {
            "hits": snapshot["cache_hits"],
            "misses": snapshot["cache_misses"],
            "refreshes": snapshot["cache_refreshes"],
            "hit_ratio": hit_ratio,
            "ttl_seconds": _CACHE_TTL_SECONDS,
        },
        "requests": {
            "deals": snapshot["requests_deals"],
            "top": snapshot["requests_top"],
            "search": snapshot["requests_search"],
        },
        "rate_limit_rejections": snapshot["rate_limit_rejections"],
    }


@app.get("/api/metrics/prometheus")
@limiter.limit("60/minute")
async def metrics_prometheus(request: Request):
    """
    Métricas en formato Prometheus exposition (text/plain).

    abr-2026l: complementa /api/metrics (JSON) para que un scraper
    Prometheus/Grafana pueda ingerir directamente sin parser custom.
    Formato: https://prometheus.io/docs/instrumenting/exposition_formats/

    Gating: mismo que /api/metrics — solo accesible desde loopback en prod
    salvo EXPOSE_METRICS=1 (uso típico: scraper Prometheus en sidecar).
    """
    client_host = request.client.host if request.client else ""
    _is_local = client_host in ("127.0.0.1", "::1", "localhost")
    if (
        _IS_PRODUCTION
        and not _is_local
        and os.getenv("EXPOSE_METRICS", "") != "1"
    ):
        raise HTTPException(status_code=404, detail="Not found")

    with _metrics_lock:
        snapshot = dict(_metrics)
    total_ops = snapshot["cache_hits"] + snapshot["cache_misses"]
    hit_ratio = snapshot["cache_hits"] / total_ops if total_ops > 0 else 0.0
    uptime = time.time() - snapshot["started_at"]

    # Lectura ligera del fichero deals.json para obtener total de deals
    # actuales — no triggerea cache, sólo stat.
    deals_total = 0
    deals_age_seconds = -1.0
    if DEALS_JSON.exists():
        try:
            mt = DEALS_JSON.stat().st_mtime
            deals_age_seconds = time.time() - mt
            with open(DEALS_JSON, "r", encoding="utf-8") as fh:
                _data = json.load(fh)
                deals_total = int((_data.get("stats") or {}).get("total", 0))
        except Exception:
            pass

    # Helper para escapar labels (Prometheus es estricto con el formato).
    def fmt(name: str, value: float, help_text: str = "", type_: str = "counter") -> List[str]:
        out = []
        if help_text:
            out.append(f"# HELP {name} {help_text}")
        out.append(f"# TYPE {name} {type_}")
        out.append(f"{name} {value}")
        return out

    lines: List[str] = []
    lines += fmt(
        "tripcazador_uptime_seconds", round(uptime, 1),
        "Seconds since API process start", "gauge",
    )
    lines += fmt(
        "tripcazador_cache_hits_total", snapshot["cache_hits"],
        "Total cache hits served from in-process cache",
    )
    lines += fmt(
        "tripcazador_cache_misses_total", snapshot["cache_misses"],
        "Total cache misses (loaded from disk)",
    )
    lines += fmt(
        "tripcazador_cache_refreshes_total", snapshot["cache_refreshes"],
        "Total cache refreshes (TTL expired)",
    )
    lines += fmt(
        "tripcazador_cache_hit_ratio", round(hit_ratio, 4),
        "Cache hit ratio (0..1)", "gauge",
    )
    lines += fmt(
        "tripcazador_requests_total{endpoint=\"deals\"}", snapshot["requests_deals"],
        "Total requests to /api/deals",
    )
    lines += fmt(
        "tripcazador_requests_total{endpoint=\"top\"}", snapshot["requests_top"],
        "",
    )
    lines += fmt(
        "tripcazador_requests_total{endpoint=\"search\"}", snapshot["requests_search"],
        "",
    )
    lines += fmt(
        "tripcazador_rate_limit_rejections_total", snapshot["rate_limit_rejections"],
        "Requests rejected by rate-limiter",
    )
    lines += fmt(
        "tripcazador_deals_total", deals_total,
        "Total active deals in the export file", "gauge",
    )
    lines += fmt(
        "tripcazador_deals_age_seconds", round(deals_age_seconds, 1),
        "Age of deals.json file (seconds since last modification)", "gauge",
    )
    lines += fmt(
        "tripcazador_app_version_info{version=\"" + _APP_VERSION + "\",sha=\"" + (_APP_GIT_SHA or "unknown") + "\"}",
        1,
        "App version metadata (always 1)", "gauge",
    )

    body = "\n".join(lines) + "\n"
    return Response(content=body, media_type="text/plain; version=0.0.4; charset=utf-8")


@app.get("/api/health")
@limiter.limit("30/minute")
async def health(request: Request):
    """Health check — usado por UptimeRobot.

    Rate-limit: 30/min/IP. Múltiples uptime robots (UptimeRobot + BetterStack
    + Pingdom) pueden golpear cada 1-2 min; 30/min deja margen de sobra sin
    permitir enumeración abusiva del status interno (breakers + deals age).
    """
    deals_exists = DEALS_JSON.exists()
    # Intentar exponer estado de circuit breakers si están cargados en este proceso
    breakers_status = {}
    try:
        import sys as _sys
        _here = Path(__file__).resolve().parent
        for c in [_here.parent / "flight_hunter_v4", _here.parent.parent / "flight_hunter_v4"]:
            if c.exists() and str(c) not in _sys.path:
                _sys.path.insert(0, str(c))
        from circuit_breaker import all_status  # type: ignore
        breakers_status = all_status()
    except Exception:
        breakers_status = {}

    # Staleness del fichero de deals (minutos desde la última generación)
    deals_age_min: Optional[float] = None
    if deals_exists:
        try:
            mt = DEALS_JSON.stat().st_mtime
            deals_age_min = round((time.time() - mt) / 60, 1)
        except Exception:
            deals_age_min = None

    uptime_s = round(time.time() - _APP_STARTED_AT, 1)
    return {
        "status": "ok",
        "version": _APP_VERSION,
        "git_sha": _APP_GIT_SHA,
        "uptime_seconds": uptime_s,
        "deals_file": str(DEALS_JSON),
        "deals_exists": deals_exists,
        "deals_age_minutes": deals_age_min,
        "timestamp": datetime.now().isoformat(),
        "breakers": breakers_status,
    }


@app.get("/api/status")
@limiter.limit("300/minute")
async def public_status(request: Request):
    """
    Endpoint público agregado — diseñado para uptime robots, badges shields.io
    y landing pages externas que quieren mostrar "motor activo" sin exponer
    detalles internos.

    A diferencia de /api/health (que devuelve estado operacional interno),
    este endpoint devuelve sólo información agregada no sensible: nº de
    deals, last-hunt, versión. No revela rutas, aerolíneas ni IPs.
    """
    data = load_deals()
    stats = data.get("stats", {}) or {}
    deals = data.get("deals", []) or []
    generated_at = data.get("generated_at", "")
    # Edad del último hunt en minutos
    hunt_age_min: Optional[float] = None
    if generated_at:
        try:
            gen_dt = datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
            hunt_age_min = round((datetime.now(gen_dt.tzinfo).timestamp() - gen_dt.timestamp()) / 60, 1)
        except Exception:
            hunt_age_min = None

    # Un motor sano tiene deals en los últimos 24h. Devolvemos una etiqueta
    # cualitativa que consumer-facing widgets pueden usar sin saber cantidades.
    if hunt_age_min is None:
        health_label = "unknown"
    elif hunt_age_min < 60:
        health_label = "fresh"
    elif hunt_age_min < 24 * 60:
        health_label = "healthy"
    elif hunt_age_min < 72 * 60:
        health_label = "stale"
    else:
        health_label = "degraded"

    return {
        "service": "TripCazador",
        "version": _APP_VERSION,
        "git_sha": _APP_GIT_SHA,
        "health": health_label,
        "deals_total": int(stats.get("total", len(deals))),
        "deals_verified": int(stats.get("verified_count", 0)),
        "price_min": float(stats.get("price_min", 0) or 0),
        "last_hunt_minutes_ago": hunt_age_min,
        "uptime_seconds": round(time.time() - _APP_STARTED_AT, 1),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Estadísticas globales del motor."""
    data = load_deals()
    stats = data.get("stats", {})
    return {
        **stats,
        "generated_at": data.get("generated_at", ""),
    }


@app.get("/api/deals", response_model=List[Deal])
@limiter.limit("120/minute")
async def get_deals(
    request: Request,
    classification: Optional[str] = Query(None, description="Filtrar por clasificación: CRÍTICO, ERROR, ANOMALÍA, OFERTA"),
    region: Optional[str] = Query(None, description="Filtrar por región: Europa, Asia, América Norte, etc."),
    cabin: Optional[str] = Query(None, description="Filtrar por cabina: economy, business, premium_economy, first"),
    max_price: Optional[float] = Query(None, description="Precio máximo en EUR"),
    min_score: Optional[float] = Query(None, description="Score mínimo (0-100)"),
    verified_only: Optional[bool] = Query(False, description="Solo deals verificados por 2+ fuentes"),
    limit: int = Query(50, ge=1, le=500, description="Número máximo de resultados"),
    offset: int = Query(0, ge=0, description="Offset para paginación"),
):
    """
    Lista de deals con filtros.
    Los deals están ordenados por score descendente.
    """
    _bump("requests_deals")
    data = load_deals()
    deals = data.get("deals", [])

    # Filtros
    now = datetime.now().isoformat()
    filtered = []
    for d in deals:
        # Expiración
        if d.get("expires_at") and d["expires_at"] < now:
            continue
        if classification and d.get("classification") != classification:
            continue
        if region and d.get("region") != region:
            continue
        if cabin and d.get("cabin") != cabin:
            continue
        if max_price is not None and d.get("price_eur", 9999) > max_price:
            continue
        if min_score is not None and d.get("score", 0) < min_score:
            continue
        if verified_only and not d.get("verified"):
            continue
        filtered.append(d)

    # Paginación
    paginated = filtered[offset : offset + limit]
    return paginated


@app.get("/api/deals/top", response_model=List[Deal])
@limiter.limit("120/minute")
async def get_top_deals(
    request: Request,
    limit: int = Query(10, ge=1, le=50),
    classification: Optional[str] = Query(None),
):
    """
    Top N deals ordenados por score.
    Ideal para la landing page.
    """
    _bump("requests_top")
    data = load_deals()
    deals = data.get("deals", [])
    now = datetime.now().isoformat()

    filtered = [
        d for d in deals
        if (not d.get("expires_at") or d["expires_at"] >= now)
        and (not classification or d.get("classification") == classification)
    ]

    return filtered[:limit]


@app.get("/api/deals/{deal_id}", response_model=Deal)
@limiter.limit("240/minute")
async def get_deal(request: Request, deal_id: str):
    """
    Deal específico por ID.

    Rate-limit más alto que /api/deals (240 vs 120) porque /deals/[id] en
    el frontend dispara una request por cada navegación a la página detalle,
    incluyendo prefetch del Link de Next.js — un usuario scrolleando /deals
    puede disparar 20+ prefetches en segundos sin ser un abuso real.

    Validación defensiva: el deal_id es parte del path, FastAPI lo pasa ya
    decodificado, pero un id muy largo o con caracteres raros debe 404 sin
    tocar el JSON (evita que un atacante scanee ids generados).
    """
    # Límite defensivo — los ids reales tienen la forma "FL-{hash10}" o "HT-{hash10}".
    # Rechazamos cualquier id que supere 64 chars o contenga whitespace.
    if not deal_id or len(deal_id) > 64 or any(c.isspace() for c in deal_id):
        raise HTTPException(status_code=404, detail="Deal no encontrado")

    data = load_deals()
    deals = data.get("deals", [])
    for d in deals:
        if d.get("id") == deal_id:
            return d
    raise HTTPException(status_code=404, detail=f"Deal '{deal_id}' no encontrado")


@app.get("/api/regions")
async def get_regions():
    """Lista de regiones disponibles con conteo de deals."""
    data = load_deals()
    return data.get("stats", {}).get("by_region", {})


# ────────────────────────────────────────────────
# Histórico de precios por ruta (sparkline)
# ────────────────────────────────────────────────
@app.get("/api/price_history")
async def get_price_history(
    origin: str = Query(..., min_length=3, max_length=3, description="IATA origen"),
    destination: str = Query(..., min_length=3, max_length=3, description="IATA destino"),
    cabin: str = Query("economy", description="economy|premium_economy|business|first"),
    days: int = Query(90, ge=7, le=365, description="Ventana en días hacia atrás"),
    max_points: int = Query(120, ge=10, le=500, description="Máximo de puntos devueltos"),
):
    """
    Devuelve una serie temporal de precios mínimos observados para la ruta.

    Estructura:
      {
        "origin": "MAD", "destination": "JFK", "cabin": "economy",
        "currency": "EUR", "points": [{"ts": ISO, "price": float, "min": float}, ...],
        "stats": {"min": ..., "max": ..., "avg": ..., "current": ..., "trend": "down|up|flat"}
      }

    Si el DB no existe o no hay datos, devuelve `points: []` (la web lo oculta).
    """
    import sqlite3

    result = {
        "origin": origin.upper(),
        "destination": destination.upper(),
        "cabin": cabin.lower(),
        "currency": "EUR",
        "points": [],
        "stats": {},
    }

    if not PRICE_HISTORY_DB.exists():
        return result

    cabin_map = {"economy": 1, "premium_economy": 2, "business": 3, "first": 4}
    cabin_code = cabin_map.get(cabin.lower(), 1)

    try:
        conn = sqlite3.connect(f"file:{PRICE_HISTORY_DB}?mode=ro", uri=True, timeout=2)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Si la tabla flights aún no existe, salimos en silencio.
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='flights'"
        )
        if not cur.fetchone():
            conn.close()
            return result

        # Precio mínimo por día para la ruta/cabina en la ventana solicitada.
        cur.execute(
            """
            SELECT substr(scraped_at, 1, 10) AS day,
                   MIN(price_eur)           AS min_price,
                   AVG(price_eur)           AS avg_price,
                   COUNT(*)                 AS n
            FROM flights
            WHERE origin = ? AND destination = ?
              AND cabin_code = ?
              AND date(scraped_at) >= date('now', ?)
            GROUP BY day
            ORDER BY day ASC
            """,
            (origin.upper(), destination.upper(), cabin_code, f"-{days} days"),
        )
        rows = cur.fetchall()
        conn.close()
    except sqlite3.Error:
        return result

    if not rows:
        return result

    # Submuestreo si hay demasiados puntos (preserva primero y último).
    if len(rows) > max_points:
        step = len(rows) / max_points
        indices = sorted({int(i * step) for i in range(max_points)} | {len(rows) - 1})
        rows = [rows[i] for i in indices]

    points = [
        {
            "ts": r["day"],
            "price": round(float(r["min_price"]), 2),
            "avg": round(float(r["avg_price"]), 2),
            "samples": int(r["n"]),
        }
        for r in rows
    ]

    prices = [p["price"] for p in points]
    current = prices[-1]
    first = prices[0]
    diff_pct = ((current - first) / first * 100) if first > 0 else 0.0
    if diff_pct <= -5:
        trend = "down"
    elif diff_pct >= 5:
        trend = "up"
    else:
        trend = "flat"

    result["points"] = points
    result["stats"] = {
        "min": round(min(prices), 2),
        "max": round(max(prices), 2),
        "avg": round(sum(prices) / len(prices), 2),
        "current": round(current, 2),
        "change_pct": round(diff_pct, 1),
        "trend": trend,
        "days_covered": len(points),
    }
    return result


# ────────────────────────────────────────────────
# Admin overview (protegido por token)
# ────────────────────────────────────────────────
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()


@app.get("/api/admin/overview")
async def admin_overview(request: Request, token: Optional[str] = Query(None)):
    """
    Resumen agregado para el panel admin:
      - health (deals_age, breakers)
      - stats (deals por clasificacion/region/cabina/precio)
      - engine_flights (filas y ultima ejecucion en price_history_v4.db)
      - engine_hotels (filas en hotel_hunter price_history.db)

    Autenticacion: cabecera `X-Admin-Token` o query `?token=` coincidiendo
    con la variable de entorno ADMIN_TOKEN. Si ADMIN_TOKEN esta vacio, el
    endpoint devuelve 503 (no configurado) para evitar exposicion accidental.
    """
    supplied = request.headers.get("x-admin-token") or token or ""
    # Comparación constant-time + sin info-leak sobre si el token está configurado.
    # Si ADMIN_TOKEN está vacío, forzar mismatch para que cualquier intento devuelva 401.
    expected = ADMIN_TOKEN or "__admin_token_not_configured__"
    if not ADMIN_TOKEN or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="No autorizado")

    import sqlite3

    result: dict = {
        "timestamp": datetime.now().isoformat(),
        "deals": {},
        "engine_flights": {"exists": False},
        "engine_hotels": {"exists": False},
    }

    # Deals actuales
    try:
        data = load_deals()
        result["deals"] = {
            "total": data.get("total_deals", 0),
            "generated_at": data.get("generated_at"),
            "stats": data.get("stats", {}),
        }
    except Exception as e:
        result["deals"] = {"error": str(e)}

    # Motor de vuelos
    if PRICE_HISTORY_DB.exists():
        try:
            conn = sqlite3.connect(f"file:{PRICE_HISTORY_DB}?mode=ro", uri=True, timeout=2)
            cur = conn.cursor()
            cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='flights'"
            )
            if cur.fetchone():
                cur.execute("SELECT COUNT(*), MAX(scraped_at) FROM flights")
                n, last = cur.fetchone()
                cur.execute(
                    "SELECT origin||'-'||destination AS route, COUNT(*) c"
                    " FROM flights GROUP BY route ORDER BY c DESC LIMIT 10"
                )
                top = [{"route": r[0], "count": r[1]} for r in cur.fetchall()]
                result["engine_flights"] = {
                    "exists": True,
                    "rows": n,
                    "last_scrape": last,
                    "top_routes": top,
                }
            conn.close()
        except sqlite3.Error as e:
            result["engine_flights"] = {"exists": True, "error": str(e)}

    # Motor de hoteles
    if HOTEL_DB.exists():
        try:
            conn = sqlite3.connect(f"file:{HOTEL_DB}?mode=ro", uri=True, timeout=2)
            cur = conn.cursor()
            cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'"
            )
            if cur.fetchone():
                cur.execute("SELECT COUNT(*), MAX(scraped_at) FROM price_history")
                n, last = cur.fetchone()
                cur.execute(
                    "SELECT destination, COUNT(*) c FROM price_history"
                    " GROUP BY destination ORDER BY c DESC LIMIT 10"
                )
                top = [{"destination": r[0], "count": r[1]} for r in cur.fetchall()]
                result["engine_hotels"] = {
                    "exists": True,
                    "rows": n,
                    "last_scrape": last,
                    "top_destinations": top,
                }
            conn.close()
        except sqlite3.Error as e:
            result["engine_hotels"] = {"exists": True, "error": str(e)}

    # Breakers (si el engine comparte proceso)
    try:
        from flight_hunter_v4 import circuit_breaker  # type: ignore

        result["breakers"] = circuit_breaker.all_status()
    except Exception:
        result["breakers"] = {}

    return result


# ────────────────────────────────────────────────
# Admin digest (preview del email semanal)
# ────────────────────────────────────────────────
def _require_admin(request: Request, token: Optional[str]) -> None:
    """Comparte lógica de auth con admin_overview. Constant-time + sin info-leak."""
    supplied = request.headers.get("x-admin-token") or token or ""
    expected = ADMIN_TOKEN or "__admin_token_not_configured__"
    if not ADMIN_TOKEN or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="No autorizado")


@app.get("/api/admin/digest")
async def admin_digest(
    request: Request,
    token: Optional[str] = Query(None),
    limit: int = Query(6, ge=1, le=20),
    format: str = Query("html", pattern="^(html|json)$"),
):
    """
    Preview del digest semanal. Ideal para conectar a MailerSend/ConvertKit
    (via cron: curl -H 'X-Admin-Token: ...' /api/admin/digest > digest.html
     y después subir a la plataforma como template).

    format=html  → devuelve HTML listo para enviar por email (inline styles).
    format=json  → devuelve JSON con los deals seleccionados y metadata.
    """
    _require_admin(request, token)

    # Import perezoso del generador para no acoplar FastAPI al script CLI.
    import sys as _sys

    tools_dir = str(Path(__file__).resolve().parents[1] / "tools")
    if tools_dir not in _sys.path:
        _sys.path.insert(0, tools_dir)
    try:
        import generate_digest as digest_gen  # type: ignore
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"generate_digest no disponible: {e}")

    deals = digest_gen.load_deals(digest_gen.DEFAULT_DEALS)
    if format == "json":
        sorted_deals = sorted(
            deals,
            key=lambda d: (-(d.get("score") or 0), d.get("price_eur", 99999)),
        )[:limit]
        return {
            "count": len(sorted_deals),
            "generated_at": datetime.now().isoformat(),
            "deals": sorted_deals,
        }

    html_out = digest_gen.render_digest(deals, limit=limit)
    from fastapi.responses import HTMLResponse

    return HTMLResponse(content=html_out, status_code=200)


# ────────────────────────────────────────────────
# Hotel deals (adaptador a hotel_hunter SQLite)
# ────────────────────────────────────────────────
@app.get("/api/hotels/top")
async def get_hotel_top(
    limit: int = Query(20, ge=1, le=100),
    min_stars: int = Query(3, ge=1, le=5),
    max_price_per_night: Optional[float] = Query(None, ge=0),
):
    """
    Top hoteles más baratos en histórico (por noche), filtrando por estrellas.
    Lee `price_history.db` de hotel_hunter, agrupa por (hotel, destino, checkin)
    tomando el precio mínimo observado, y devuelve registros compatibles con
    el esquema Deal (type='hotel').

    Si el DB no existe o no tiene datos, devuelve [].
    """
    import sqlite3

    if not HOTEL_DB.exists():
        return []

    try:
        conn = sqlite3.connect(f"file:{HOTEL_DB}?mode=ro", uri=True, timeout=2)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'"
        )
        if not cur.fetchone():
            conn.close()
            return []

        where = ["stars >= ?"]
        params: List = [min_stars]
        if max_price_per_night is not None:
            where.append("price_per_night <= ?")
            params.append(max_price_per_night)

        sql = f"""
            SELECT
              hotel_name, destination, checkin, checkout, nights,
              MIN(price_total)     AS price_min,
              MIN(price_per_night) AS ppn_min,
              MAX(stars)           AS stars,
              MAX(score)           AS score,
              MAX(link)            AS link,
              MAX(scraped_at)      AS last_seen
            FROM price_history
            WHERE {' AND '.join(where)}
            GROUP BY hotel_name, destination, checkin
            ORDER BY ppn_min ASC
            LIMIT ?
        """
        params.append(limit)
        cur.execute(sql, params)
        rows = cur.fetchall()
        conn.close()
    except sqlite3.Error:
        return []

    # Conversion a esquema Deal-compatible (type='hotel')
    deals = []
    for r in rows:
        dest = r["destination"] or ""
        deal_id = f"hotel_{(r['hotel_name'] or '').lower().replace(' ', '_')}_{r['checkin']}"[:120]
        ppn = float(r["ppn_min"] or 0)
        stars_val = r["stars"] or 0
        # hotel_hunter a veces guarda el score de Booking (0-10) en el campo stars.
        # Convencion: <=5 = estrellas, >5 = score. Etiquetamos consecuentemente.
        if 1 <= stars_val <= 5:
            star_tag = "⭐" * int(stars_val)
        elif stars_val > 5:
            star_tag = f"Booking {stars_val}/10"
        else:
            star_tag = "hotel"

        deals.append({
            "id": deal_id,
            "type": "hotel",
            "headline": f"{r['hotel_name']} — {dest}",
            "origin": "",
            "destination": dest,
            "city_from": "",
            "city_to": dest,
            "country_to": "",
            "region": "",
            "price_eur": float(r["price_min"] or 0),
            "price_per_night": round(ppn, 2),
            "savings_pct": 0.0,
            "savings_eur": 0.0,
            "nights": int(r["nights"] or 0),
            "date_out": r["checkin"] or "",
            "date_ret": r["checkout"] or "",
            "cabin": "economy",  # placeholder para satisfacer el esquema
            "airline": "",
            "airline_name": "",
            "stops": 0,
            "duration_min": 0,
            "distance_category": "",
            "score": float(r["score"] or 0),
            "classification": "OFERTA",
            "tags": [star_tag, "hotel"],
            "image_url": "",
            "booking_url": r["link"] or "",
            "verified": False,
            "sources": ["booking"],
            "found_at": r["last_seen"] or "",
            "expires_at": "",
        })
    return deals


# ────────────────────────────────────────────────
# Catálogo de aeropuertos (para autocompletado)
# ────────────────────────────────────────────────

_AIRPORT_CATALOG_CACHE: List[dict] = []
_AIRPORT_CATALOG_LOADED = False


def _load_airport_catalog() -> List[dict]:
    """
    Carga el catálogo de aeropuertos desde flight_hunter_v4.geo_data.AIRPORT_GEO.
    Se cachea en memoria tras la primera llamada; el proceso debe reiniciarse
    para recargar (el catálogo cambia raramente y con cada deploy).
    """
    global _AIRPORT_CATALOG_CACHE, _AIRPORT_CATALOG_LOADED
    if _AIRPORT_CATALOG_LOADED:
        return _AIRPORT_CATALOG_CACHE

    catalog: List[dict] = []
    try:
        import sys as _sys
        _here = Path(__file__).resolve().parent
        _candidates = [_here.parent / "flight_hunter_v4", _here.parent.parent / "flight_hunter_v4"]
        for c in _candidates:
            if c.exists() and str(c) not in _sys.path:
                _sys.path.insert(0, str(c))
        from geo_data import AIRPORT_GEO, AIRPORT_COORDS  # type: ignore
        for iata, (city, country, region) in AIRPORT_GEO.items():
            entry = {
                "iata": iata,
                "city": city,
                "country": country,
                "region": region,
            }
            coords = AIRPORT_COORDS.get(iata)
            if coords:
                entry["lat"] = coords[0]
                entry["lon"] = coords[1]
            catalog.append(entry)
    except Exception:
        # Fallback estático mínimo si geo_data no está disponible (ej. tests aislados)
        catalog = [
            {"iata": "MAD", "city": "Madrid", "country": "España", "region": "Europa"},
            {"iata": "BCN", "city": "Barcelona", "country": "España", "region": "Europa"},
            {"iata": "BSL", "city": "Basilea", "country": "Suiza/Francia", "region": "Europa"},
            {"iata": "ZRH", "city": "Zúrich", "country": "Suiza", "region": "Europa"},
            {"iata": "FRA", "city": "Frankfurt", "country": "Alemania", "region": "Europa"},
            {"iata": "MUC", "city": "Múnich", "country": "Alemania", "region": "Europa"},
            {"iata": "VIE", "city": "Viena", "country": "Austria", "region": "Europa"},
        ]

    _AIRPORT_CATALOG_CACHE = sorted(catalog, key=lambda a: (a["region"], a["country"], a["city"]))
    _AIRPORT_CATALOG_LOADED = True
    return _AIRPORT_CATALOG_CACHE


@app.get("/api/airports")
@limiter.limit("240/minute")
async def get_airports(
    request: Request,
    q: Optional[str] = Query(None, description="Filtro por IATA/ciudad/país (acento-insensitive)"),
    region: Optional[str] = Query(None, description="Filtrar por región exacta"),
    limit: int = Query(500, ge=1, le=2000),
):
    """
    Catálogo de aeropuertos con IATA, ciudad, país, región y coordenadas.
    Pensado para poblar autocompletados del frontend (SearchBar).
    El catálogo cambia raramente; cliente puede cachear agresivamente.
    """
    catalog = _load_airport_catalog()

    if region:
        region_norm = region.strip().lower()
        catalog = [a for a in catalog if a["region"].lower() == region_norm]

    if q:
        import unicodedata as _ud
        def _nrm(s: str) -> str:
            if not s:
                return ""
            dec = _ud.normalize("NFD", str(s).strip().lower())
            return "".join(c for c in dec if _ud.category(c) != "Mn")
        qn = _nrm(q)
        if qn:
            catalog = [
                a for a in catalog
                if qn in _nrm(a["iata"])
                or qn in _nrm(a["city"])
                or qn in _nrm(a["country"])
            ]

    return {
        "total": len(catalog),
        "airports": catalog[:limit],
    }


# ────────────────────────────────────────────────
# Live search — busca sobre los deals indexados
# ────────────────────────────────────────────────

@app.get("/api/search", response_model=List[Deal])
@limiter.limit("30/minute")
async def search_deals(
    request: Request,
    origin: Optional[str] = Query(None, description="Código IATA origen (ej. BSL, MAD, FRA) o nombre de ciudad"),
    destination: Optional[str] = Query(None, description="Código IATA destino o nombre de ciudad"),
    date_from: Optional[str] = Query(None, description="Fecha mínima de salida YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Fecha máxima de salida YYYY-MM-DD"),
    max_price: Optional[float] = Query(None, description="Precio máximo EUR"),
    cabin: Optional[str] = Query(None, description="economy | premium_economy | business | first"),
    deal_type: Optional[str] = Query(None, description="flight | hotel"),
    q: Optional[str] = Query(None, description="Texto libre: busca en headline, país, ciudad, aerolínea"),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Búsqueda en vivo sobre los deals indexados.

    Todos los parámetros son opcionales y se combinan con AND. Los matches
    de `origin`/`destination` hacen substring match case-insensitive tanto
    contra el código IATA como contra el nombre de ciudad.

    Ejemplos:
        /api/search?origin=BSL&destination=MAD
        /api/search?origin=zurich&date_from=2026-08-01&date_to=2026-08-31
        /api/search?q=zanzibar&max_price=500
        /api/search?cabin=business&deal_type=flight
    """
    _bump("requests_search")
    data = load_deals()
    deals = data.get("deals", [])
    now = datetime.now().isoformat()

    import unicodedata

    def _norm(s: Optional[str]) -> str:
        """Lowercase + strip accents — así 'zanzibar' matchea 'Zanzíbar'."""
        if not s:
            return ""
        s = str(s).strip().lower()
        # NFD descompone caracteres acentuados → cuerpo + combining mark
        decomposed = unicodedata.normalize("NFD", s)
        # Mn = marks nonspacing (tildes, diéresis, etc.)
        return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")

    o = _norm(origin)
    d = _norm(destination)
    qtext = _norm(q)

    # abr-2026n BUG FIX (#213):
    # - Si el query es formato IATA (3 letras A-Z), match EXACTO sobre el
    #   código `origin/destination` del deal. Antes hacíamos `"mad" in city`
    #   y se colaban resultados aleatorios donde la subcadena coincidía
    #   accidentalmente (city_from="Ahmadabad" tenía match para query "MAD").
    # - Si el query es texto libre (Madrid, "Nueva York", "EE.UU."), seguimos
    #   con substring sobre IATA + city + country — necesario para que el
    #   usuario que escribe "madrid" o "new york" reciba matches.
    def _is_iata(q: str) -> bool:
        return len(q) == 3 and q.isalpha()

    matches: list = []
    for deal in deals:
        # Expirados fuera
        if deal.get("expires_at") and deal["expires_at"] < now:
            continue
        if deal_type and deal.get("type") != deal_type:
            continue
        if cabin and deal.get("cabin") != cabin:
            continue
        if max_price is not None and deal.get("price_eur", 99999) > max_price:
            continue

        # Origen: match exacto si IATA, substring si texto libre.
        if o:
            if _is_iata(o):
                if _norm(deal.get("origin")) != o:
                    continue
            else:
                if (
                    o not in _norm(deal.get("origin"))
                    and o not in _norm(deal.get("city_from"))
                    and o not in _norm(deal.get("country_from"))
                ):
                    continue
        # Destino: match exacto si IATA, substring si texto libre.
        if d:
            if _is_iata(d):
                if _norm(deal.get("destination")) != d:
                    continue
            elif (d not in _norm(deal.get("destination"))
                    and d not in _norm(deal.get("city_to"))
                    and d not in _norm(deal.get("country_to"))):
                continue
        # Fechas
        if date_from and deal.get("date_out") and deal["date_out"] < date_from:
            continue
        if date_to and deal.get("date_out") and deal["date_out"] > date_to:
            continue
        # Texto libre (accent-insensitive)
        if qtext:
            haystack = _norm(" ".join([
                str(deal.get("headline", "")),
                str(deal.get("country_to", "")),
                str(deal.get("city_to", "")),
                str(deal.get("airline_name", "")),
                str(deal.get("region", "")),
                " ".join(deal.get("tags", []) or []),
            ]))
            if qtext not in haystack:
                continue

        matches.append(deal)
        if len(matches) >= limit:
            break

    return matches


# ────────────────────────────────────────────────
# Newsletter subscribe (almacenamiento JSON simple + rate-limit por IP)
# ────────────────────────────────────────────────

_SUBSCRIBERS_PATH = pathlib.Path(os.getenv("SUBSCRIBERS_PATH", "/data/subscribers.json"))
_RATE_LIMIT_WINDOW = 60  # segundos
_RATE_LIMIT_MAX = 3      # intentos por ventana
_rate_limit_state: dict[str, list[float]] = {}


class SubscribeRequest(BaseModel):
    email: EmailStr
    consent: bool = Field(..., description="El usuario acepta la política de privacidad")
    source: Optional[str] = Field(None, max_length=40)


def _load_subscribers() -> list[dict]:
    try:
        if _SUBSCRIBERS_PATH.exists():
            return json.loads(_SUBSCRIBERS_PATH.read_text())
    except Exception:
        pass
    return []


def _save_subscribers(items: list[dict]) -> None:
    _SUBSCRIBERS_PATH.parent.mkdir(parents=True, exist_ok=True)
    _SUBSCRIBERS_PATH.write_text(json.dumps(items, indent=2, ensure_ascii=False))


def _rate_limit_ok(ip: str) -> bool:
    now = time.time()
    hits = _rate_limit_state.get(ip, [])
    hits = [t for t in hits if now - t < _RATE_LIMIT_WINDOW]
    if len(hits) >= _RATE_LIMIT_MAX:
        _rate_limit_state[ip] = hits
        return False
    hits.append(now)
    _rate_limit_state[ip] = hits
    return True


def _stable_ip_hash(client_ip: str) -> str:
    """
    Hash SHA256 estable (salteado con IP_HASH_SALT si está definido).
    `hash()` de Python varía entre procesos por PYTHONHASHSEED → no vale para persistir.

    Devuelve los primeros 16 caracteres hex del SHA256(salt + ip). Con 16 hex chars
    tenemos 2^64 valores posibles, colisión despreciable en el rango de IPs reales.
    La salt por defecto es "tripcazador" (no secreto — se puede sobreescribir con
    IP_HASH_SALT en .env para rotación periódica sin romper dedupe histórico).
    """
    _salt = os.getenv("IP_HASH_SALT", "tripcazador").encode()
    return hashlib.sha256(_salt + client_ip.encode()).hexdigest()[:16]


@app.post("/api/subscribe")
@limiter.limit("5/minute")  # slowapi: 5 suscripciones/min/IP máximo
async def subscribe(payload: SubscribeRequest, request: Request):
    """Registro a la newsletter. Requiere consent=true (RGPD)."""
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Debes aceptar la política de privacidad")

    client_ip = request.client.host if request.client else "unknown"
    # Fallback in-memory (si slowapi no está instalado)
    if not _LIMITER_AVAILABLE and not _rate_limit_ok(client_ip):
        raise HTTPException(status_code=429, detail="Demasiadas peticiones, prueba en un minuto")

    email_norm = payload.email.lower().strip()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email_norm):
        raise HTTPException(status_code=400, detail="Email inválido")

    items = _load_subscribers()
    if any(s.get("email") == email_norm for s in items):
        return {"status": "already_subscribed", "email": email_norm}

    items.append({
        "email": email_norm,
        "source": payload.source or "web",
        "subscribed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "ip_hash": _stable_ip_hash(client_ip),  # hash estable, no reversible a IP
    })
    _save_subscribers(items)
    return {"status": "subscribed", "email": email_norm}


# ────────────────────────────────────────────────
# Dev server
# ────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
