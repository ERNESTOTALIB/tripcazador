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
from pathlib import Path
from datetime import datetime
from typing import Optional, List
import re
import json
import pathlib
import time

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
from fastapi.responses import JSONResponse
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

        sentry_sdk.init(
            dsn=_SENTRY_DSN,
            environment=os.getenv("SENTRY_ENV", "production"),
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_RATE", "0.1")),
            profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_RATE", "0.0")),
            send_default_pii=False,
            integrations=[StarletteIntegration(), FastApiIntegration()],
        )
    except ImportError:
        # sentry-sdk no instalado: seguir sin telemetria
        pass


# ────────────────────────────────────────────────
# App setup
# ────────────────────────────────────────────────

app = FastAPI(
    title="TripCazador API",
    description="API de deals de vuelos — error fares y chollos desde Europa",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS: permitir tripcazador.com (prod), localhost (dev), y previews Vercel
# del proyecto ernesto-talibs-projects/tripcazador (para no romper CI visual).
ALLOWED_ORIGINS = [
    "https://tripcazador.com",
    "https://www.tripcazador.com",
    "http://localhost:3000",  # Next.js dev
    "http://localhost:3001",
]

# Previews Vercel: tripcazador-*.vercel.app
# Regex explícita para evitar que cualquier *.vercel.app pida /api — solo
# deploys del repo tripcazador.
ALLOWED_ORIGIN_REGEX = r"https://tripcazador(-[a-z0-9-]+)?\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
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
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
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
_CACHE_TTL_SECONDS = 300  # 5 minutos


def load_deals() -> dict:
    """Carga deals.json con caché de 5 minutos."""
    now = datetime.now()
    if (
        _cache["data"] is not None
        and _cache["loaded_at"] is not None
        and (now - _cache["loaded_at"]).total_seconds() < _CACHE_TTL_SECONDS
    ):
        return _cache["data"]

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
    return data


# ────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    """Health check — usado por UptimeRobot."""
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

    return {
        "status": "ok",
        "deals_file": str(DEALS_JSON),
        "deals_exists": deals_exists,
        "deals_age_minutes": deals_age_min,
        "timestamp": datetime.now().isoformat(),
        "breakers": breakers_status,
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
async def get_deals(
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
        if max_price and d.get("price_eur", 9999) > max_price:
            continue
        if min_score and d.get("score", 0) < min_score:
            continue
        if verified_only and not d.get("verified"):
            continue
        filtered.append(d)

    # Paginación
    paginated = filtered[offset : offset + limit]
    return paginated


@app.get("/api/deals/top", response_model=List[Deal])
async def get_top_deals(
    limit: int = Query(10, ge=1, le=50),
    classification: Optional[str] = Query(None),
):
    """
    Top N deals ordenados por score.
    Ideal para la landing page.
    """
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
async def get_deal(deal_id: str):
    """Deal específico por ID."""
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
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN no configurado")
    supplied = request.headers.get("x-admin-token") or token or ""
    if supplied != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token invalido")

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
    """Comparte lógica de auth con admin_overview."""
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN no configurado")
    supplied = request.headers.get("x-admin-token") or token or ""
    if supplied != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token invalido")


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
# Admin · Upload deals.json (GitHub Actions worker)
# ────────────────────────────────────────────────
@app.post("/api/admin/deals")
async def admin_upload_deals(request: Request, token: Optional[str] = Query(None)):
    """
    Recibe un deals.json generado por el worker externo (GitHub Actions)
    y lo escribe en DEALS_JSON, invalidando la caché en memoria.

    Uso:
        curl -X POST https://api.tripcazador.com/api/admin/deals \
             -H "X-Admin-Token: $ADMIN_TOKEN" \
             -H "Content-Type: application/json" \
             --data @deals.json

    Valida que el payload tenga la forma mínima ({schema_version, deals:[...]})
    y que `deals` sea una lista. Escribe atómicamente (fichero .tmp + rename).
    """
    _require_admin(request, token)

    try:
        payload = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"JSON inválido: {e}")

    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Payload debe ser un objeto JSON")
    if "deals" not in payload or not isinstance(payload.get("deals"), list):
        raise HTTPException(status_code=422, detail="Falta clave 'deals' (lista)")

    # Normaliza metadata para que coincida con deals_exporter.py
    payload.setdefault("schema_version", "4.1")
    payload.setdefault("generated_at", datetime.now().isoformat())
    payload.setdefault("total_deals", len(payload["deals"]))

    DEALS_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = DEALS_JSON.with_suffix(".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        tmp_path.replace(DEALS_JSON)
    except Exception as e:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Error escribiendo deals.json: {e}")

    # Invalidar caché para que el próximo GET vea los nuevos deals
    _cache["data"] = None
    _cache["loaded_at"] = None

    return {
        "status": "ok",
        "total_deals": payload["total_deals"],
        "bytes": DEALS_JSON.stat().st_size,
        "path": str(DEALS_JSON),
    }


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
async def get_airports(
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
# Live search (en caliente) — llama a los engines en tiempo real
# ────────────────────────────────────────────────
#
# Por qué un endpoint aparte:
#   /api/search filtra deals.json (rápido pero limitado a lo que el worker
#   haya indexado). Cuando el usuario busca "Madrid → NYC 2026-07-15" no hay
#   manera de cubrir todas las combinaciones posibles por adelantado, así
#   que consultamos a RapidAPI (Sky Scrapper) y Ryanair en caliente.
#
# Cache: 15 min por tupla (origin, destination, date_out, cabin). Protege el
# tier gratis de RapidAPI (500 req/mes) y acelera búsquedas repetidas.
#
# Timeout duro 18s. Si los engines tardan más, devuelve lo que haya llegado.

import asyncio as _asyncio
from hashlib import md5 as _md5

_LIVE_CACHE: dict = {}
_LIVE_CACHE_TTL = 900  # 15 minutos
_LIVE_CACHE_MAX_ENTRIES = 500  # evita crecimiento ilimitado

_STRONG_RYANAIR_HUBS = {
    "STN", "DUB", "BGY", "CRL", "HHN", "NYO", "VRN", "AGP", "ALC", "BCN",
    "MAD", "PMI", "TFS", "LPA", "VLC", "SVQ", "BIO", "PMO", "FCO", "PSA",
    "BRI", "NAP", "VIE", "BRU", "CGN", "HAM", "NUE", "MXP", "OPO", "FKB",
    "BRE", "DTM", "BLQ", "BTS", "BUD", "PRG", "KRK", "WRO", "WAW", "GDN",
    "BSL", "BVA", "STR", "MRS",
}


def _live_cache_key(origin: str, destination: str, date_out: str, cabin: str) -> str:
    raw = f"{origin.upper()}|{destination.upper()}|{date_out}|{cabin.lower()}"
    return _md5(raw.encode()).hexdigest()


def _live_cache_get(key: str) -> Optional[List[dict]]:
    entry = _LIVE_CACHE.get(key)
    if not entry:
        return None
    if time.time() - entry["at"] > _LIVE_CACHE_TTL:
        _LIVE_CACHE.pop(key, None)
        return None
    return entry["deals"]


def _live_cache_put(key: str, deals: List[dict]) -> None:
    if len(_LIVE_CACHE) >= _LIVE_CACHE_MAX_ENTRIES:
        # Evict más viejo
        oldest = min(_LIVE_CACHE.items(), key=lambda kv: kv[1]["at"])[0]
        _LIVE_CACHE.pop(oldest, None)
    _LIVE_CACHE[key] = {"at": time.time(), "deals": deals}


def _ensure_engines_on_path() -> None:
    """
    Inserta en sys.path los directorios donde pueden vivir los engines.

    - En la imagen Docker de la API los engines se copian a /app/ directamente
      (mismo dir que main.py), por lo que basta con tener el dir actual.
    - En desarrollo local (sin Docker) los engines siguen en ../flight_hunter_v4
      o ../../flight_hunter_v4 (según dónde se arranque uvicorn).
    """
    import sys as _sys
    _here = Path(__file__).resolve().parent
    candidates = [
        _here,                                   # /app dentro del contenedor
        _here.parent / "flight_hunter_v4",       # repo local: api/ vecino a flight_hunter_v4/
        _here.parent.parent / "flight_hunter_v4",
    ]
    for c in candidates:
        if c.exists() and str(c) not in _sys.path:
            _sys.path.insert(0, str(c))


def _engine_dict_to_deal(f: dict, origin: str, destination: str) -> dict:
    """
    Convierte la salida estándar de los engines (formato V4 de flight_hunter)
    a un Deal pydantic-compatible que la web ya sabe renderizar.
    Añade campos mínimos: id estable, headline, classification, expires_at, score.
    """
    price = float(f.get("price_eur", 0) or 0)
    date_out = f.get("date_out", "") or ""
    airline = f.get("airline", "") or ""
    dest = f.get("destination", destination).upper()
    orig = f.get("origin", origin).upper()

    # id estable y determinístico: permite que el frontend haga keys + dedup
    raw_id = f"{f.get('source','live')}:{orig}-{dest}-{date_out}-{airline}-{int(price*100)}"
    deal_id = _md5(raw_id.encode()).hexdigest()[:16]

    headline = f.get("headline") or (
        f"{f.get('city_to') or dest} desde {int(round(price))}€ "
        f"({orig}→{dest}, {date_out or 'fecha libre'})"
    )

    # Clasificación rápida por precio/distancia (sin llamar al detector completo)
    dist = (f.get("distance_category") or "").lower()
    if dist in ("long", "long_haul", "ultra_long") and price < 400:
        classification = "ERROR"
    elif dist in ("long", "long_haul", "ultra_long") and price < 600:
        classification = "ANOMALÍA"
    elif price < 80:
        classification = "OFERTA"
    else:
        classification = "NORMAL"

    # expires_at: las búsquedas live no expiran — pero damos 6h como válido
    expires_at = (datetime.now() + __import__("datetime").timedelta(hours=6)).isoformat()

    return {
        "id": deal_id,
        "type": "flight",
        "headline": headline,
        "origin": orig,
        "destination": dest,
        "city_from": f.get("origin_full", "") or orig,
        "city_to": f.get("city_to", "") or dest,
        "country_to": f.get("country_to", "") or "",
        "region": "",
        "price_eur": round(price, 2),
        "savings_pct": 0,
        "savings_eur": 0,
        "nights": 0,
        "price_per_night": None,
        "date_out": date_out,
        "date_ret": f.get("date_ret", "") or "",
        "cabin": f.get("cabin", "economy") or "economy",
        "airline": airline,
        "airline_name": f.get("airline_name", "") or airline,
        "stops": int(f.get("stops", 0) or 0),
        "duration_min": int(f.get("duration_min", 0) or 0),
        "distance_category": f.get("distance_category", "") or "",
        "score": 0,
        "classification": classification,
        "tags": ["live"],
        "image_url": "",
        "booking_url": f.get("booking_url", "") or "",
        "verified": False,
        "sources": [f.get("source", "live")],
        "found_at": datetime.now().isoformat(),
        "expires_at": expires_at,
        "lat": None,
        "lon": None,
        "main_reason": None,
        "t4_ratio": None,
    }


@app.get("/api/search/live", response_model=List[Deal])
async def search_live(
    origin: str = Query(..., min_length=3, max_length=4, description="IATA origen, ej. MAD"),
    destination: str = Query(..., min_length=3, max_length=4, description="IATA destino, ej. JFK"),
    date_out: str = Query(..., description="Fecha salida YYYY-MM-DD"),
    cabin: str = Query("economy", description="economy | premium_economy | business | first"),
    limit: int = Query(20, ge=1, le=50),
):
    """
    Busca vuelos en caliente llamando a RapidAPI (Sky Scrapper) y Ryanair en
    paralelo. Cache en memoria 15 min por (origen, destino, fecha, cabina).

    Ejemplo:
        /api/search/live?origin=MAD&destination=JFK&date_out=2026-07-15
    """
    # Validación simple: fecha no en el pasado
    try:
        out_date = datetime.strptime(date_out, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="date_out inválida, usa YYYY-MM-DD")
    if out_date < datetime.now().date():
        raise HTTPException(status_code=400, detail="date_out está en el pasado")

    origin = origin.upper().strip()
    destination = destination.upper().strip()
    cabin = cabin.lower().strip() or "economy"

    # Cache hit
    cache_key = _live_cache_key(origin, destination, date_out, cabin)
    cached = _live_cache_get(cache_key)
    if cached is not None:
        return cached[:limit]

    _ensure_engines_on_path()

    # Lazy imports: cuando el endpoint no se usa, no pagamos el import
    rapid_task = None
    ryan_task = None
    try:
        from rapidapi_engine import RapidAPIEngine  # type: ignore
        rapid = RapidAPIEngine()
        if rapid.available:
            rapid_task = rapid.search_skyscrapper_cheapest(
                origin=origin,
                destination=destination,
                date_out=date_out,
                cabin=cabin,
            )
    except Exception as e:
        print(f"[live-search] rapidapi import/init error: {e}")

    try:
        from ryanair_engine import RyanairEngine  # type: ignore
        # Ryanair solo tiene sentido si el origen es un hub que opera
        if origin in _STRONG_RYANAIR_HUBS:
            ryan = RyanairEngine()
            if ryan.available:
                ryan_task = ryan.search_oneway_multi(
                    origins=[origin],
                    date_from=date_out,
                    date_to=date_out,
                )
    except Exception as e:
        print(f"[live-search] ryanair import/init error: {e}")

    # Sin engines disponibles: fallback al search de deals.json
    if not rapid_task and not ryan_task:
        return []

    tasks = [t for t in (rapid_task, ryan_task) if t is not None]
    try:
        results = await _asyncio.wait_for(
            _asyncio.gather(*tasks, return_exceptions=True),
            timeout=18.0,
        )
    except _asyncio.TimeoutError:
        results = []

    combined: List[dict] = []
    for r in results:
        if isinstance(r, list):
            combined.extend(r)
        # Silenciosamente ignora excepciones — ya están en los logs del motor

    # Filtrar por destino (Ryanair devuelve desde origen a muchos destinos)
    filtered = [f for f in combined if (f.get("destination", "").upper() == destination)]

    # Si filtrado vacío, devuelve lo que hubo (útil para rutas que no matcheen)
    if not filtered and combined:
        filtered = combined

    # Dedup por (airline, date_out, price_eur redondeado)
    seen = set()
    unique = []
    for f in filtered:
        key = (f.get("airline"), f.get("date_out"), round(float(f.get("price_eur", 0) or 0), 2))
        if key in seen:
            continue
        seen.add(key)
        unique.append(f)

    unique.sort(key=lambda x: float(x.get("price_eur", 99999) or 99999))
    unique = unique[:limit]

    # Normalizar al schema Deal
    deals = [_engine_dict_to_deal(f, origin, destination) for f in unique]

    _live_cache_put(cache_key, deals)
    return deals


# ────────────────────────────────────────────────
# Live search — busca sobre los deals indexados
# ────────────────────────────────────────────────

@app.get("/api/search", response_model=List[Deal])
async def search_deals(
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

    matches: list = []
    for deal in deals:
        # Expirados fuera
        if deal.get("expires_at") and deal["expires_at"] < now:
            continue
        if deal_type and deal.get("type") != deal_type:
            continue
        if cabin and deal.get("cabin") != cabin:
            continue
        if max_price and deal.get("price_eur", 99999) > max_price:
            continue

        # Origen: match sobre IATA o city_from
        if o:
            if o not in _norm(deal.get("origin")) and o not in _norm(deal.get("city_from")):
                continue
        # Destino: match sobre IATA, city_to o country_to
        if d:
            if (d not in _norm(deal.get("destination"))
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
# Price alerts: crear + listar + cancelar con token HMAC
# ────────────────────────────────────────────────
#
# Cómo funciona:
#   · POST /api/price-alerts          → crea alerta, devuelve id + cancel_token
#   · GET  /api/price-alerts/cancel   → cancela por ?id=...&token=...
#                                        (el link va en el email)
#
# Persistencia: JSON plano en disco (igual que subscribers) — simple,
# atómico para los volúmenes que vamos a manejar (<10k alertas). Si
# crecemos, migramos a Postgres reutilizando la conexión del worker.
#
# Matching: lo hace el cron del worker (scripts/match_price_alerts.py)
# que cruza deals.json vs alertas activas y dispara Telegram cuando
# aparece una oferta que cumple target_price.

import hmac

_ALERTS_PATH = pathlib.Path(os.getenv("PRICE_ALERTS_PATH", "/data/price_alerts.json"))
_ALERT_SECRET = os.getenv("PRICE_ALERT_SECRET", os.getenv("SECRET_KEY", "tripcazador-dev-only"))


class PriceAlertRequest(BaseModel):
    """Payload aceptado por POST /api/price-alerts.

    Al menos uno de {origin, destination, deal_id} debe estar presente.
    target_price es opcional (si None → "avísame cuando aparezca
    cualquier deal nuevo para esta ruta").
    """
    email: EmailStr
    origin: Optional[str] = Field(None, min_length=3, max_length=3)
    destination: Optional[str] = Field(None, min_length=3, max_length=3)
    target_price: Optional[float] = Field(None, gt=0, le=100000)
    deal_id: Optional[str] = Field(None, max_length=64)


def _load_price_alerts() -> list[dict]:
    try:
        if _ALERTS_PATH.exists():
            return json.loads(_ALERTS_PATH.read_text())
    except Exception:
        pass
    return []


def _save_price_alerts(items: list[dict]) -> None:
    _ALERTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = _ALERTS_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(items, indent=2, ensure_ascii=False))
    tmp.replace(_ALERTS_PATH)


def _alert_cancel_token(alert_id: str) -> str:
    """HMAC-SHA256 truncado a 32 hex chars del id de la alerta.

    No es reversible y está firmado con PRICE_ALERT_SECRET, así que solo
    quien conozca la secret puede generar tokens válidos. El link de
    cancelación va embebido en el email y no expira (es permanente).
    """
    sig = hmac.new(_ALERT_SECRET.encode(), alert_id.encode(), hashlib.sha256).hexdigest()
    return sig[:32]


@app.post("/api/price-alerts")
@limiter.limit("5/minute")
async def create_price_alert(payload: PriceAlertRequest, request: Request):
    """Crea una alerta de precio.

    Valida:
      - email (Pydantic EmailStr)
      - IATAs en mayúsculas y 3 letras
      - Al menos uno de {origin, destination, deal_id}
      - target_price > 0 y ≤ 100000

    Dedupe: si existe una alerta idéntica activa para el mismo email + ruta + precio,
    no la duplicamos (idempotente para evitar spam si el usuario hace doble click).
    """
    client_ip = request.client.host if request.client else "unknown"

    # Fallback in-memory si slowapi no está disponible
    if not _LIMITER_AVAILABLE and not _rate_limit_ok(client_ip):
        raise HTTPException(status_code=429, detail="Demasiadas peticiones, prueba en un minuto")

    origin = payload.origin.upper() if payload.origin else None
    destination = payload.destination.upper() if payload.destination else None

    if not origin and not destination and not payload.deal_id:
        raise HTTPException(
            status_code=400,
            detail="Necesitas indicar al menos origen, destino o un deal_id",
        )

    # Validación IATA extra (Pydantic ya fuerza la longitud, aquí además
    # confirmamos que son letras A-Z — evita "123" o símbolos)
    for code in (origin, destination):
        if code and not re.match(r"^[A-Z]{3}$", code):
            raise HTTPException(status_code=400, detail=f"Código IATA inválido: {code}")

    items = _load_price_alerts()
    email_norm = payload.email.lower().strip()

    # Dedupe por (email, origen, destino, precio, deal_id) activo
    for existing in items:
        if (
            existing.get("status") == "active"
            and existing.get("email") == email_norm
            and existing.get("origin") == origin
            and existing.get("destination") == destination
            and existing.get("target_price") == payload.target_price
            and existing.get("deal_id") == payload.deal_id
        ):
            # Ya existe — devolvemos el id existente (idempotencia)
            return {
                "status": "already_exists",
                "id": existing["id"],
                "cancel_token": _alert_cancel_token(existing["id"]),
            }

    # Genera id único: timestamp + hash corto de email+ruta (determinista ligeramente)
    now_ts = int(time.time())
    key = f"{email_norm}|{origin}|{destination}|{payload.target_price}|{payload.deal_id}|{now_ts}"
    alert_id = hashlib.sha256(key.encode()).hexdigest()[:12]

    items.append({
        "id": alert_id,
        "email": email_norm,
        "origin": origin,
        "destination": destination,
        "target_price": payload.target_price,
        "deal_id": payload.deal_id,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "active",
        "last_notified_at": None,
        "ip_hash": _stable_ip_hash(client_ip),
    })
    _save_price_alerts(items)

    return {
        "status": "ok",
        "id": alert_id,
        "cancel_token": _alert_cancel_token(alert_id),
    }


@app.get("/api/price-alerts/cancel")
async def cancel_price_alert(id: str = Query(..., max_length=64), token: str = Query(..., max_length=64)):
    """Cancela una alerta con un token firmado.

    Devuelve 200 siempre que el token sea válido, aunque la alerta ya
    estuviera cancelada (idempotente — evita confundir al usuario si
    hace click dos veces en el email).
    """
    expected = _alert_cancel_token(id)
    if not hmac.compare_digest(expected, token):
        raise HTTPException(status_code=403, detail="Token de cancelación inválido")

    items = _load_price_alerts()
    found = False
    for it in items:
        if it.get("id") == id:
            found = True
            if it.get("status") == "active":
                it["status"] = "cancelled"
                it["cancelled_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            break

    if not found:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    _save_price_alerts(items)
    return {"status": "cancelled", "id": id}


@app.get("/api/price-alerts/_debug")
async def debug_price_alerts(request: Request):
    """Recuento de alertas activas (solo metadato, nunca emails).

    Protegido por el token de admin si está configurado; si no, devuelve
    404 para no filtrar la existencia del endpoint.
    """
    admin_token = os.getenv("ADMIN_TOKEN", "").strip()
    if not admin_token:
        raise HTTPException(status_code=404)
    given = request.headers.get("x-admin-token", "")
    if not hmac.compare_digest(admin_token, given):
        raise HTTPException(status_code=403)
    items = _load_price_alerts()
    active = [i for i in items if i.get("status") == "active"]
    return {
        "total": len(items),
        "active": len(active),
        "cancelled": len(items) - len(active),
        "by_route": {
            f"{i.get('origin') or '*'}-{i.get('destination') or '*'}": 1
            for i in active
        },
    }


# ────────────────────────────────────────────────
# Matcher — admin trigger (llamado por el worker GH Action tras subir deals)
# ────────────────────────────────────────────────
#
# Cruza price_alerts.json × deals.json y envía email vía SMTP (si hay creds).
# Dedupe con `.sent_matches.json` para no spamear con el mismo match.
# SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM vía env (Fly.io secrets).
# SITE_URL para construir links (cancel + deal detail).

import smtplib as _smtplib
from email.message import EmailMessage as _EmailMessage

_SENT_MATCHES_PATH = pathlib.Path(os.getenv("SENT_MATCHES_PATH", "/data/.sent_matches.json"))


def _deal_matches_alert(deal: dict, alert: dict) -> bool:
    """True si `deal` cumple todos los criterios presentes en `alert` (AND)."""
    if alert.get("deal_id") and deal.get("id") != alert["deal_id"]:
        return False
    if alert.get("origin") and (deal.get("origin") or "").upper() != alert["origin"]:
        return False
    if alert.get("destination") and (deal.get("destination") or "").upper() != alert["destination"]:
        return False
    target = alert.get("target_price")
    if target is not None and float(deal.get("price_eur", 1e12)) > float(target):
        return False
    return True


def _build_alert_email(alert: dict, deal: dict, site_url: str) -> tuple[str, str]:
    origin = deal.get("origin", "?")
    dest = deal.get("destination", "?")
    price = deal.get("price_eur", "?")
    city_to = deal.get("city_to") or dest
    country_to = deal.get("country_to", "")
    airline = deal.get("airline_name") or deal.get("airline", "?")
    date_out = deal.get("date_out", "")
    deal_url = f"{site_url}/deals/{deal.get('id', '')}"
    cancel_url = f"{site_url}/api/price-alerts/cancel?id={alert['id']}&token={_alert_cancel_token(alert['id'])}"

    subject = f"✈ {origin} → {city_to} por {price} € — TripCazador"
    html = f"""
    <div style="font-family:system-ui,sans-serif;background:#0b1220;color:#e5e7eb;padding:24px;">
      <h2 style="color:#fbbf24;margin:0 0 12px">¡Hay una oferta que cumple tu alerta!</h2>
      <p>Detectamos un vuelo que cumple el criterio que pediste:</p>
      <div style="background:#111827;border:1px solid #374151;border-radius:12px;padding:16px;margin:16px 0">
        <div style="font-size:20px;font-weight:700">{origin} → {city_to} <span style="color:#fbbf24">{price} €</span></div>
        <div style="color:#9ca3af;margin-top:6px">{airline} · {date_out or 'fecha variable'} · {country_to}</div>
      </div>
      <p>
        <a href="{deal_url}" style="display:inline-block;padding:12px 20px;background:#f59e0b;color:#000;border-radius:10px;font-weight:600;text-decoration:none">
          Ver el chollo
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #374151;margin:24px 0">
      <p style="color:#9ca3af;font-size:13px">
        Si ya no te interesa esta alerta, puedes
        <a href="{cancel_url}" style="color:#fbbf24">cancelarla aquí</a> (un solo click, sin login).
      </p>
      <p style="color:#6b7280;font-size:11px">
        TripCazador · Si no reconoces esta alerta, ignora el email.
      </p>
    </div>
    """
    return subject, html


def _send_alert_email(to_addr: str, subject: str, html_body: str) -> bool:
    """Envía email vía SMTP. Devuelve True si OK, False si falta config o falla."""
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASS", "").strip()
    sender = os.getenv("SMTP_FROM", user).strip()
    if not (host and sender):
        return False

    msg = _EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_addr
    msg.set_content("Tu cliente de email no soporta HTML. Abre el email en otra app para ver el chollo.")
    msg.add_alternative(html_body, subtype="html")

    try:
        if port == 465:
            with _smtplib.SMTP_SSL(host, port, timeout=15) as s:
                if user:
                    s.login(user, password)
                s.send_message(msg)
        else:
            with _smtplib.SMTP(host, port, timeout=15) as s:
                s.ehlo()
                s.starttls()
                if user:
                    s.login(user, password)
                s.send_message(msg)
        return True
    except Exception as e:
        print(f"[price-alerts] SMTP error enviando a {to_addr}: {e}")
        return False


@app.post("/api/admin/match-price-alerts")
async def match_price_alerts_endpoint(request: Request, dry_run: bool = Query(False)):
    """Cruza price_alerts × deals y envía emails. Protegido por ADMIN_TOKEN.

    Respuesta:
      {"matches": N, "sent": M, "skipped_dedupe": K, "dry_run": bool}

    Se invoca desde el workflow del worker tras subir deals.json.
    """
    admin_token = os.getenv("ADMIN_TOKEN", "").strip()
    if not admin_token:
        raise HTTPException(status_code=404)
    given = request.headers.get("x-admin-token", "")
    if not hmac.compare_digest(admin_token, given):
        raise HTTPException(status_code=403)

    alerts = _load_price_alerts()
    active = [a for a in alerts if a.get("status") == "active"]
    if not active:
        return {"matches": 0, "sent": 0, "skipped_dedupe": 0, "dry_run": dry_run, "note": "no active alerts"}

    # Deals: priorizamos el cache en memoria si está cargado; si no, leemos de disco
    deals_data = _cache.get("data") if "_cache" in globals() else None
    if not deals_data:
        deals_file = Path(os.getenv("DEALS_DIR", "Viajes")) / "deals.json"
        if not deals_file.exists():
            return {"matches": 0, "sent": 0, "skipped_dedupe": 0, "dry_run": dry_run, "note": "no deals.json"}
        deals_data = json.loads(deals_file.read_text(encoding="utf-8"))
    deals = deals_data.get("deals", []) if isinstance(deals_data, dict) else []
    if not deals:
        return {"matches": 0, "sent": 0, "skipped_dedupe": 0, "dry_run": dry_run, "note": "empty deals"}

    # Dedupe
    try:
        sent_state = json.loads(_SENT_MATCHES_PATH.read_text()) if _SENT_MATCHES_PATH.exists() else {"hashes": []}
    except Exception:
        sent_state = {"hashes": []}
    sent_set: set[str] = set(sent_state.get("hashes", []))

    site_url = os.getenv("SITE_URL", "https://tripcazador.com").rstrip("/")

    pairs: list[tuple[dict, dict]] = []
    for alert in active:
        for deal in deals:
            if _deal_matches_alert(deal, alert):
                pairs.append((alert, deal))

    sent_count = 0
    skipped = 0
    for alert, deal in pairs:
        key = f"{alert['id']}|{deal.get('id', '')}"
        if key in sent_set:
            skipped += 1
            continue
        if dry_run:
            continue
        subject, html = _build_alert_email(alert, deal, site_url)
        ok = _send_alert_email(alert["email"], subject, html)
        if ok:
            sent_count += 1
            sent_set.add(key)
            alert["last_notified_at"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    # Persistimos estado si hubo envíos reales
    if not dry_run and sent_count > 0:
        try:
            _SENT_MATCHES_PATH.parent.mkdir(parents=True, exist_ok=True)
            tmp = _SENT_MATCHES_PATH.with_suffix(".tmp")
            tmp.write_text(json.dumps({"hashes": sorted(sent_set)[-5000:]}, indent=2), encoding="utf-8")
            tmp.replace(_SENT_MATCHES_PATH)
            _save_price_alerts(alerts)
        except Exception as e:
            print(f"[price-alerts] No se pudo persistir sent_matches/alerts: {e}")

    return {
        "matches": len(pairs),
        "sent": sent_count,
        "skipped_dedupe": skipped,
        "dry_run": dry_run,
        "active_alerts": len(active),
        "deals_scanned": len(deals),
    }


# ────────────────────────────────────────────────
# Dev server
# ────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
