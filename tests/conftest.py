"""
TripCazador — pytest global conftest
====================================
Fixtures compartidas entre unit/engines/api/integration.

Arregla sys.path para que podamos importar modulos del motor
(flight_hunter_v4/) y del API (api/) sin instalar como paquete.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

import pytest

# ---------------------------------------------------------------------------
# sys.path setup: make flight_hunter_v4/ and api/ importable as top-level
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
ENGINE_DIR = ROOT / "flight_hunter_v4"
API_DIR = ROOT / "api"
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

for p in (str(ENGINE_DIR), str(API_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

# Environment defaults: never leak real keys into tests
os.environ.setdefault("KIWI_API_KEY", "test-kiwi-key")
os.environ.setdefault("SERPAPI_KEY", "test-serpapi-key")
os.environ.setdefault("RAPIDAPI_KEY", "test-rapid-key")
os.environ.setdefault("TRAVELPAYOUTS_TOKEN", "test-tp-token")
os.environ.setdefault("TP_MARKER", "999999")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "")
os.environ.setdefault("TELEGRAM_CHAT_ID", "")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _iso_in_days(days: int) -> str:
    return (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")


def _iso_dt_in_hours(hours: int) -> str:
    return (datetime.now() + timedelta(hours=hours)).isoformat()


# ---------------------------------------------------------------------------
# Fixtures: flights
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_flight() -> Dict:
    """Un vuelo economy normal, NO error fare."""
    return {
        "source": "kiwi",
        "origin": "MAD",
        "destination": "FCO",
        "city_to": "Roma",
        "country_to": "Italia",
        "price_eur": 120.0,
        "cabin_code": 1,
        "cabin": "economy",
        "airline": "IB",
        "airline_name": "Iberia",
        "date_out": _iso_in_days(30),
        "date_ret": _iso_in_days(37),
        "stops": 0,
        "duration_min": 150,
        "distance_category": "corto",
        "booking_url": "https://www.kayak.es/flights/MAD-FCO",
    }


@pytest.fixture
def sample_error_fare_business() -> Dict:
    """Business class transatlantico a precio ridiculo: error fare claro."""
    return {
        "source": "kiwi",
        "origin": "MAD",
        "destination": "JFK",
        "city_to": "Nueva York",
        "country_to": "Estados Unidos",
        "price_eur": 250.0,  # Business transatlantico < 400€ = ERROR
        "cabin_code": 3,
        "cabin": "business",
        "airline": "IB",
        "airline_name": "Iberia",
        "date_out": _iso_in_days(60),
        "date_ret": _iso_in_days(68),
        "stops": 0,
        "duration_min": 480,
        "distance_category": "largo",
    }


@pytest.fixture
def flights_population() -> List[Dict]:
    """Coleccion de vuelos para probar IQR/Z-score (misma ruta+cabina)."""
    base = {
        "source": "kiwi",
        "origin": "MAD",
        "destination": "JFK",
        "airline": "IB",
        "cabin_code": 1,
        "cabin": "economy",
        "date_ret": _iso_in_days(20),
        "stops": 0,
        "distance_category": "largo",
    }
    prices = [450, 480, 490, 500, 520, 530, 550, 570, 600, 650, 80]  # 80€ = outlier
    return [
        {**base, "price_eur": p, "date_out": _iso_in_days(10 + i)}
        for i, p in enumerate(prices)
    ]


@pytest.fixture
def flights_multi_source() -> List[Dict]:
    """3 fuentes reportando la misma ruta con precios similares (verificable)."""
    common = {
        "origin": "MAD",
        "destination": "BKK",
        "date_out": _iso_in_days(45),
        "date_ret": _iso_in_days(60),
        "cabin_code": 1,
        "cabin": "economy",
        "airline": "TG",
        "airline_name": "Thai Airways",
        "stops": 1,
        "distance_category": "ultra_largo",
        "final_score": 40,
        "classification": "ANOMALIA",
    }
    return [
        {**common, "source": "kiwi", "price_eur": 395.0},
        {**common, "source": "serpapi", "price_eur": 410.0},
        {**common, "source": "rapidapi", "price_eur": 400.0},
    ]


@pytest.fixture
def analyzed_deal_critico() -> Dict:
    """Deal ya analizado con clasificacion CRITICO, listo para exporter."""
    return {
        "source": "kiwi",
        "origin": "MAD",
        "destination": "NRT",
        "city_to": "Tokio",
        "country_to": "Japon",
        "region": "Asia",
        "price_eur": 198.0,
        "cabin_code": 3,
        "cabin": "business",
        "airline": "JL",
        "airline_name": "Japan Airlines",
        "date_out": _iso_in_days(90),
        "date_ret": _iso_in_days(105),
        "stops": 0,
        "duration_min": 720,
        "distance_category": "ultra_largo",
        "final_score": 92.5,
        "classification": "CRÍTICO",
        "techniques_triggered": ["t0", "t1b", "t4"],
        "reasons": ["Precio extremadamente bajo para ruta Tokio"],
        "main_reason": "Error fare Business Tokio",
        "savings_eur": 2500,
        "savings_pct": 85.0,
        "booking_url": "https://www.kiwi.com/...",
        "scraped_at": datetime.now().isoformat(),
    }


# ---------------------------------------------------------------------------
# Fixtures: API responses (JSON mocks)
# ---------------------------------------------------------------------------
def _load_fixture(name: str) -> Dict:
    path = FIXTURES_DIR / name
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def kiwi_response_json() -> Dict:
    return _load_fixture("kiwi_response.json")


@pytest.fixture
def serpapi_response_json() -> Dict:
    return _load_fixture("serpapi_response.json")


@pytest.fixture
def rapidapi_sky_response_json() -> Dict:
    return _load_fixture("rapidapi_sky_response.json")


@pytest.fixture
def travelpayouts_response_json() -> Dict:
    return _load_fixture("travelpayouts_response.json")


@pytest.fixture
def vueling_response_json() -> Dict:
    return _load_fixture("vueling_response.json")


# ---------------------------------------------------------------------------
# Fixtures: FastAPI TestClient with synthetic deals.json
# ---------------------------------------------------------------------------
@pytest.fixture
def synthetic_deals_json(tmp_path: Path) -> Path:
    """Genera un deals.json valido en tmp_path. Returns path del archivo."""
    future = (datetime.now() + timedelta(days=10)).isoformat()
    deals = [
        {
            "id": "kiwi_mad_jfk_20260715_business",
            "type": "flight",
            "headline": "Business Madrid-Nueva York por 250 euros",
            "origin": "MAD", "destination": "JFK",
            "city_from": "Madrid", "city_to": "Nueva York",
            "country_to": "Estados Unidos", "region": "América Norte",
            "price_eur": 250.0, "savings_pct": 82.0, "savings_eur": 1200,
            "nights": 8, "date_out": "2026-07-15", "date_ret": "2026-07-23",
            "cabin": "business", "airline": "IB", "airline_name": "Iberia",
            "stops": 0, "duration_min": 480, "distance_category": "largo",
            "score": 92.5, "classification": "CRÍTICO",
            "tags": ["america-norte", "business", "error-fare"],
            "image_url": "https://example.com/img.jpg",
            "booking_url": "https://example.com/book",
            "verified": True, "sources": ["kiwi", "serpapi"],
            "found_at": datetime.now().isoformat(), "expires_at": future,
            "lat": 40.6, "lon": -73.77,
        },
        {
            "id": "ryanair_mad_bcn_20260820_economy",
            "type": "flight",
            "headline": "Madrid a Barcelona por 15 euros",
            "origin": "MAD", "destination": "BCN",
            "city_from": "Madrid", "city_to": "Barcelona",
            "country_to": "España", "region": "Europa",
            "price_eur": 15.0, "savings_pct": 50.0, "savings_eur": 15,
            "nights": 3, "date_out": "2026-08-20", "date_ret": "2026-08-23",
            "cabin": "economy", "airline": "FR", "airline_name": "Ryanair",
            "stops": 0, "duration_min": 75, "distance_category": "corto",
            "score": 20.0, "classification": "OFERTA",
            "tags": ["europa", "economy"],
            "image_url": "", "booking_url": "https://www.ryanair.com/",
            "verified": False, "sources": ["ryanair"],
            "found_at": datetime.now().isoformat(), "expires_at": future,
            "lat": None, "lon": None,
        },
        {
            "id": "expired_deal",
            "type": "flight",
            "headline": "Deal expirado",
            "origin": "MAD", "destination": "FCO",
            "city_from": "Madrid", "city_to": "Roma", "country_to": "Italia",
            "region": "Europa",
            "price_eur": 50.0, "savings_pct": 30.0, "savings_eur": 20,
            "nights": 4, "date_out": "2025-01-15", "date_ret": "2025-01-19",
            "cabin": "economy", "airline": "VY", "airline_name": "Vueling",
            "stops": 0, "duration_min": 120, "distance_category": "corto",
            "score": 18.0, "classification": "OFERTA",
            "tags": [], "image_url": "", "booking_url": "",
            "verified": False, "sources": ["vueling"],
            "found_at": "2025-01-01T00:00:00",
            "expires_at": "2025-02-01T00:00:00",  # expirado
        },
    ]

    obj = {
        "schema_version": "4.1",
        "generated_at": datetime.now().isoformat(),
        "total_deals": len(deals),
        "stats": {
            "total": len(deals),
            "flights": len(deals),
            "hotels": 0,
            "by_classification": {"CRÍTICO": 1, "OFERTA": 2},
            "by_region": {"Europa": 2, "América Norte": 1},
            "by_cabin": {"business": 1, "economy": 2},
            "price_min": 15.0, "price_max": 250.0, "price_avg": 105.0,
            "verified_count": 1,
        },
        "deals": deals,
    }

    path = tmp_path / "deals.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    return path


@pytest.fixture
def api_client(synthetic_deals_json, monkeypatch):
    """
    Levanta un TestClient de FastAPI apuntando al deals.json de prueba.
    Invalida el cache antes de cada test para evitar contaminacion.

    SSS147: defensive guard — some unit tests insert flight_hunter_v4/ at
    sys.path[0], which causes `import main` to resolve to the hunter's
    main.py instead of api/main.py. We force-resolve to api/main.py by:
      1. Putting api/ first on sys.path again
      2. Evicting any stale `main` module from sys.modules
    """
    monkeypatch.setenv("DEALS_DIR", str(synthetic_deals_json.parent))

    # Force api/ to the front of sys.path (defensive — counters
    # contamination from unit tests that prepend flight_hunter_v4/).
    api_dir_str = str(API_DIR)
    if sys.path[0] != api_dir_str:
        if api_dir_str in sys.path:
            sys.path.remove(api_dir_str)
        sys.path.insert(0, api_dir_str)

    # Re-import main para que relea DEALS_JSON desde el env nuevo.
    # Si una iteración previa cargó flight_hunter_v4/main.py bajo el
    # nombre `main`, lo desalojamos.
    import importlib
    if "main" in sys.modules:
        cached = sys.modules["main"]
        cached_file = getattr(cached, "__file__", "") or ""
        if not cached_file.endswith("/api/main.py"):
            del sys.modules["main"]
    import main as api_main  # type: ignore
    importlib.reload(api_main)

    # Reset cache
    api_main._cache["data"] = None
    api_main._cache["loaded_at"] = None

    from fastapi.testclient import TestClient
    return TestClient(api_main.app)
