"""
Tests del fallback de semilla cuando `deals.json` no existe.

Motivación: cuando el worker cron no ha corrido todavía o sufre un
rate-limit transitorio, la ausencia de deals.json dejaba el frontend
vacío. Ahora la API devuelve un set mínimo de deals "seed" para que
la UI nunca se vea muerta. Estos tests blindan ese contrato:

  1. /api/deals NO devuelve lista vacía cuando no hay deals.json
  2. Todos los deals seed están marcados como tales (`sources==["seed"]`,
     `tags` incluye "seed")
  3. /api/health expone `serving_seed: true` cuando no hay fichero real
  4. SEED_DEALS_DISABLE=1 desactiva el fallback (volver al comportamiento
     previo para tests/staging que lo requieran)
"""
from __future__ import annotations

import importlib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.skip(
    reason="SSS147: API seed fallback / serving_seed flag removed — frontend now reads deals-latest.json from GitHub raw URL on startup"
)


@pytest.fixture
def api_client_no_deals(tmp_path: Path, monkeypatch):
    """
    Levanta el API apuntando a un directorio vacío (sin deals.json).
    Por defecto el fallback de semilla está activo.
    """
    monkeypatch.setenv("DEALS_DIR", str(tmp_path))
    monkeypatch.delenv("SEED_DEALS_DISABLE", raising=False)

    import main as api_main  # type: ignore
    importlib.reload(api_main)
    api_main._cache["data"] = None
    api_main._cache["loaded_at"] = None

    return TestClient(api_main.app)


@pytest.fixture
def api_client_seed_disabled(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("DEALS_DIR", str(tmp_path))
    monkeypatch.setenv("SEED_DEALS_DISABLE", "1")

    import main as api_main  # type: ignore
    importlib.reload(api_main)
    api_main._cache["data"] = None
    api_main._cache["loaded_at"] = None

    return TestClient(api_main.app)


class TestSeedFallbackActive:
    def test_deals_list_not_empty(self, api_client_no_deals):
        r = api_client_no_deals.get("/api/deals")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 5, f"Seed debe tener al menos 5 deals, había {len(data)}"

    def test_all_deals_are_tagged_as_seed(self, api_client_no_deals):
        r = api_client_no_deals.get("/api/deals")
        for deal in r.json():
            assert deal["sources"] == ["seed"]
            assert "seed" in deal["tags"]

    def test_deal_ids_are_deterministic_and_prefixed(self, api_client_no_deals):
        r = api_client_no_deals.get("/api/deals")
        for deal in r.json():
            assert deal["id"].startswith("seed-")

    def test_health_reports_serving_seed_true(self, api_client_no_deals):
        r = api_client_no_deals.get("/api/health")
        data = r.json()
        assert data["status"] == "ok"
        assert data["deals_exists"] is False
        assert data["serving_seed"] is True

    def test_stats_endpoint_has_data_from_seed(self, api_client_no_deals):
        r = api_client_no_deals.get("/api/stats")
        assert r.status_code == 200
        stats = r.json()
        assert stats["total"] >= 5
        assert stats["price_min"] > 0


class TestSeedFallbackDisabled:
    """SEED_DEALS_DISABLE=1 debe restaurar el comportamiento previo."""

    def test_deals_list_empty(self, api_client_seed_disabled):
        r = api_client_seed_disabled.get("/api/deals")
        assert r.status_code == 200
        assert r.json() == []

    def test_health_reports_serving_seed_false(self, api_client_seed_disabled):
        r = api_client_seed_disabled.get("/api/health")
        data = r.json()
        assert data["deals_exists"] is False
        assert data["serving_seed"] is False
